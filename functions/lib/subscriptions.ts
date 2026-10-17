/**
 * Subscription report: how many subscriptions are running and what they bring
 * in each month, what started, stopped and paused in the period, failed
 * renewals, and what renews or ends its trial in the next 7 days.
 *
 * Fields relied on (checked against test subscriptions):
 * - `status`: trial, active, pastdue, unpaid, paused, canceled or complete.
 * - `date_created`, `date_canceled`, `date_paused`, `date_trial_end`,
 *   `date_period_end` (the next billing date).
 * - `recurring_total` (each period's charge), `interval` (daily, weekly,
 *   monthly or yearly) and `interval_count`.
 * - `canceled` and `paused`: set at once when a subscription is canceled or
 *   paused for the end of its period, while `status` stays `active` until then.
 * Counts of the current state (active, on trial, paused, past due) describe the
 * store when the report runs; new, canceled and paused describe the period.
 */

import { accountName, fetchAccounts } from './customers';
import { plainText } from './text';
import { formatPeriodLabel, isoDate, percentChange, round, storeCurrency, type ReportWindow } from './report';
import { scan } from './scan';

/** Rows stored per table; the dashboard shows 5 with "Show more", the email 5. */
const LIST_LIMIT = 10;

const DAY = 24 * 3600 * 1000;

const FIELDS =
  'id,status,canceled,paused,account_id,product_name,plan_name,recurring_total,grand_total,interval,' +
  'interval_count,date_created,date_canceled,date_paused,date_trial_end,date_period_end,currency';

/** One period's charge, expressed per month, so plans of any length add up. */
export function monthlyValue(sub: any): number {
  const amount = Number(sub?.recurring_total ?? sub?.grand_total) || 0;
  const count = Math.max(1, Number(sub?.interval_count) || 1);
  const perMonth: Record<string, number> = { daily: 365 / 12, weekly: 52 / 12, monthly: 1, yearly: 1 / 12 };
  const factor = perMonth[String(sub?.interval ?? 'monthly')] ?? 1;
  return (amount * factor) / count;
}

/** How many subscriptions match, without reading them. */
async function count(swell: SwellAPI, where: Record<string, unknown>): Promise<number> {
  const response = await swell.get('/subscriptions', { where, limit: 1, fields: 'id' });
  const total = Number(response?.count);
  return Number.isFinite(total) ? total : (response?.results ?? []).length;
}

/** Every subscription matching `where`, up to the shared page ceiling. */
async function read(swell: SwellAPI, where: Record<string, unknown>) {
  const rows: any[] = [];
  const result = await scan(swell, '/subscriptions', { where, fields: FIELDS }, (sub) => rows.push(sub));
  return { rows, truncated: result.truncated };
}

const planLabel = (sub: any) =>
  plainText([sub?.product_name, sub?.plan_name].filter(Boolean).join(' — ')) || 'Unknown plan';

export async function buildSubscriptionReport(swell: SwellAPI, reportWindow: ReportWindow) {
  const { start, end, prevStart } = reportWindow;
  const inWindow = (from: Date, to: Date) => ({ $gte: from.toISOString(), $lt: to.toISOString() });
  const weekAhead = new Date(end.getTime() + 7 * DAY);

  const [running, pastDue, canceled, newCount, prevNewCount, prevCanceledCount, pausedNow, pausedInPeriod] =
    await Promise.all([
      // Paying and on trial: the subscriptions that are running now.
      read(swell, { status: { $in: ['active', 'trial'] } }),
      read(swell, { status: { $in: ['pastdue', 'unpaid'] } }),
      read(swell, { date_canceled: inWindow(start, end) }),
      count(swell, { date_created: inWindow(start, end) }),
      count(swell, { date_created: inWindow(prevStart, start) }),
      count(swell, { date_canceled: inWindow(prevStart, start) }),
      count(swell, { status: 'paused' }),
      count(swell, { date_paused: inWindow(start, end) }),
    ]);

  const paying = running.rows.filter((sub) => sub.status === 'active');
  const trials = running.rows.filter((sub) => sub.status === 'trial');
  // Still active, but set to cancel or pause when the paid period ends, so they
  // won't bill again: left out of recurring revenue and upcoming renewals.
  const stopping = (sub: any) => sub.canceled === true || sub.paused === true;
  const continuing = paying.filter((sub) => !stopping(sub));
  const mrr = round(continuing.reduce((sum, sub) => sum + monthlyValue(sub), 0));

  const due = (date: unknown) => {
    const time = date ? new Date(String(date)).getTime() : NaN;
    return time >= end.getTime() && time < weekAhead.getTime();
  };
  const renewing = continuing.filter((sub) => due(sub.date_period_end));
  const trialsEnding = trials.filter((sub) => due(sub.date_trial_end));

  // Running subscriptions by plan.
  const byPlan = new Map<string, { plan: string; paying: number; trial: number; monthly: number }>();
  for (const sub of running.rows) {
    const key = planLabel(sub);
    const entry = byPlan.get(key) ?? { plan: key, paying: 0, trial: 0, monthly: 0 };
    if (sub.status === 'active') {
      entry.paying += 1;
      if (!stopping(sub)) entry.monthly += monthlyValue(sub);
    } else {
      entry.trial += 1;
    }
    byPlan.set(key, entry);
  }
  const plans = [...byPlan.values()]
    .sort((a, b) => b.monthly - a.monthly || b.paying + b.trial - (a.paying + a.trial))
    .slice(0, LIST_LIMIT);

  const canceledRanked = [...canceled.rows].sort((a, b) => monthlyValue(b) - monthlyValue(a));
  const pastDueRanked = [...pastDue.rows].sort(
    (a, b) => (Number(b.grand_total) || 0) - (Number(a.grand_total) || 0),
  );
  const listedCanceled = canceledRanked.slice(0, LIST_LIMIT);
  const listedPastDue = pastDueRanked.slice(0, LIST_LIMIT);
  const accounts = await fetchAccounts(swell, [
    ...new Set(
      [...listedCanceled, ...listedPastDue]
        .map((sub) => sub.account_id)
        .filter((id): id is string => typeof id === 'string'),
    ),
  ]);
  const customer = (sub: any) =>
    sub.account_id ? accountName(accounts.get(sub.account_id), 'Unknown customer') : 'Unknown customer';
  const day = (date: unknown) => (date ? isoDate(new Date(String(date)), reportWindow.timeZone) : null);

  const canceledCount = canceled.rows.length;
  const currency =
    running.rows.find((sub) => sub.currency)?.currency ||
    canceled.rows.find((sub) => sub.currency)?.currency ||
    (await storeCurrency(swell));

  return {
    period_label: formatPeriodLabel(start, end, reportWindow.timeZone),
    period_start: start.toISOString(),
    period_end: end.toISOString(),
    currency,
    active_count: paying.length,
    trial_count: trials.length,
    monthly_recurring_revenue: mrr,
    new_count: newCount,
    prev_new_count: prevNewCount,
    new_change_pct: percentChange(newCount, prevNewCount),
    canceled_count: canceledCount,
    prev_canceled_count: prevCanceledCount,
    canceled_change_pct: percentChange(canceledCount, prevCanceledCount),
    net_change: newCount - canceledCount,
    canceled_monthly_value: round(canceled.rows.reduce((sum, sub) => sum + monthlyValue(sub), 0)),
    paused_count: pausedNow,
    paused_in_period: pausedInPeriod,
    past_due_count: pastDue.rows.length,
    renewals_next_7_days: renewing.length,
    renewals_next_7_days_value: round(renewing.reduce((sum, sub) => sum + (Number(sub.recurring_total) || 0), 0)),
    trials_ending_next_7_days: trialsEnding.length,
    plans: plans.map((entry) => ({
      plan: entry.plan,
      paying: entry.paying,
      trial: entry.trial,
      monthly_revenue: round(entry.monthly),
    })),
    canceled_subscriptions: listedCanceled.map((sub) => ({
      subscription_id: sub.id,
      account_id: sub.account_id ?? null,
      customer: customer(sub),
      plan: planLabel(sub),
      canceled_date: day(sub.date_canceled),
      monthly_value: round(monthlyValue(sub)),
    })),
    canceled_hidden: Math.max(0, canceledRanked.length - LIST_LIMIT),
    past_due_subscriptions: listedPastDue.map((sub) => ({
      subscription_id: sub.id,
      account_id: sub.account_id ?? null,
      customer: customer(sub),
      plan: planLabel(sub),
      amount: round(sub.grand_total),
      status: sub.status,
    })),
    past_due_hidden: Math.max(0, pastDueRanked.length - LIST_LIMIT),
    truncated: running.truncated || pastDue.truncated || canceled.truncated,
  };
}

export function subscriptionsIsEmpty(report: {
  active_count: number;
  trial_count: number;
  new_count: number;
  canceled_count: number;
  paused_count: number;
  past_due_count: number;
}) {
  return (
    report.active_count +
      report.trial_count +
      report.new_count +
      report.canceled_count +
      report.paused_count +
      report.past_due_count ===
    0
  );
}

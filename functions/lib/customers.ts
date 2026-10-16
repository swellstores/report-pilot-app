/**
 * Customer report: who bought in the period, how many came back, and who the
 * biggest customers were.
 */

import {
  fetchCurrency,
  fetchCustomerSplit,
  formatPeriodLabel,
  percentChange,
  revenueWhere,
  round,
  type ReportWindow,
} from './report';
import type { CustomerSettings } from './report-settings';
import { chunk, RECORD_ID } from './scan';

/** Grouped rows per page, and pages read, mirroring the sales report's customer split. */
const GROUP_PAGE_LIMIT = 1000;
const GROUP_MAX_PAGES = 20;

interface CustomerTotals {
  orders: number;
  spend: number;
}

/**
 * Orders and spend per purchasing account in a window, grouped server-side.
 *
 * Same paging rules as `fetchAccountIds`: a short page is the last, and a page
 * that adds no new account means the endpoint ignored `page` and we already
 * hold the whole set.
 */
async function fetchCustomerTotals(swell: SwellAPI, start: Date, end: Date) {
  const totals = new Map<string, CustomerTotals>();
  let truncated = false;

  for (let page = 1; page <= GROUP_MAX_PAGES; page++) {
    const response = await swell.get('/orders', {
      where: { ...revenueWhere(start, end), account_id: { $ne: null } },
      group: {
        account_id: true,
        orders: { $sum: 1 },
        spend: { $sum: 'grand_total' },
      },
      limit: GROUP_PAGE_LIMIT,
      page,
    });

    const rows: any[] = response?.results ?? [];
    const before = totals.size;

    for (const row of rows) {
      if (row?.account_id) {
        totals.set(row.account_id, {
          orders: Number(row.orders) || 0,
          spend: round(row.spend),
        });
      }
    }

    if (rows.length < GROUP_PAGE_LIMIT || totals.size === before) {
      break;
    }
    if (page === GROUP_MAX_PAGES) {
      truncated = true;
      console.warn('Customer totals truncated; customer report figures are a lower bound.');
    }
  }

  return { totals, truncated };
}

/**
 * Lifetime paid orders and spend per account, on the same basis as the rest of
 * the report: paid, not cancelled, summed from `grand_total`. The account's own
 * `order_value` is not used, because it can disagree with that basis (it read
 * $0 for accounts whose orders were marked paid rather than charged).
 */
async function fetchLifetimeTotals(swell: SwellAPI, ids: string[]) {
  const totals = new Map<string, CustomerTotals>();
  const valid = ids.filter((id) => RECORD_ID.test(id));
  if (!valid.length) {
    return totals;
  }

  const response = await swell.get('/orders', {
    where: { paid: true, status: { $ne: 'canceled' }, account_id: { $in: valid } },
    group: {
      account_id: true,
      orders: { $sum: 1 },
      spend: { $sum: 'grand_total' },
    },
    limit: valid.length,
  });

  for (const row of response?.results ?? []) {
    if (row?.account_id) {
      totals.set(row.account_id, { orders: Number(row.orders) || 0, spend: round(row.spend) });
    }
  }
  return totals;
}

/** Accounts by id, for names and emails. Also used by the cart and subscription reports. */
export async function fetchAccounts(swell: SwellAPI, ids: string[]) {
  const byId = new Map<string, any>();

  for (const batch of chunk(ids.filter((id) => RECORD_ID.test(id)), 100)) {
    const response = await swell.get('/accounts', {
      where: { id: { $in: batch } },
      fields: 'id,name,first_name,last_name,email,order_count,order_value,date_first_order',
      limit: batch.length,
    });
    for (const account of response?.results ?? []) {
      byId.set(account.id, account);
    }
  }

  return byId;
}

/** A customer's display name: their name, else their email, else `fallback`. */
export function accountName(account: any, fallback: string): string {
  return (
    account?.name ||
    [account?.first_name, account?.last_name].filter(Boolean).join(' ') ||
    account?.email ||
    fallback
  );
}

export async function buildCustomerReport(
  swell: SwellAPI,
  reportWindow: ReportWindow,
  settings: CustomerSettings,
) {
  const { start, end, prevStart } = reportWindow;

  const [current, previous, split, currency] =
    await Promise.all([
      fetchCustomerTotals(swell, start, end),
      fetchCustomerTotals(swell, prevStart, start),
      fetchCustomerSplit(swell, start, end),
      fetchCurrency(swell, start, end),
    ]);

  const entries = [...current.totals.entries()];
  const customerCount = entries.length;
  const repeatBuyers = entries.filter(([, totals]) => totals.orders >= 2).length;
  const totalSpend = round(entries.reduce((sum, [, totals]) => sum + totals.spend, 0));
  const prevCustomerCount = previous.totals.size;

  const ranked = entries
    .sort(([, a], [, b]) => b.spend - a.spend || b.orders - a.orders)
    .slice(0, settings.top_customers_limit);

  const rankedIds = ranked.map(([id]) => id);
  const [accounts, lifetime] = ranked.length
    ? await Promise.all([fetchAccounts(swell, rankedIds), fetchLifetimeTotals(swell, rankedIds)])
    : [new Map<string, any>(), new Map<string, CustomerTotals>()];

  const topCustomers = ranked.map(([id, totals]) => {
    const account = accounts.get(id) ?? {};
    const name = accountName(account, 'Unknown customer');
    const firstOrder = account.date_first_order ? new Date(account.date_first_order) : null;

    return {
      account_id: id,
      name,
      email: account.email ?? null,
      orders: totals.orders,
      spend: totals.spend,
      lifetime_value: lifetime.get(id)?.spend ?? round(account.order_value),
      lifetime_orders: lifetime.get(id)?.orders ?? (Number(account.order_count) || 0),
      // First order inside the window means this period won them.
      is_new: firstOrder ? firstOrder >= start : null,
    };
  });

  return {
    period_label: formatPeriodLabel(start, end),
    period_start: start.toISOString(),
    period_end: end.toISOString(),
    currency,
    customer_count: customerCount,
    prev_customer_count: prevCustomerCount,
    customer_change_pct: percentChange(customerCount, prevCustomerCount),
    new_customer_count: split.new_customer_count,
    returning_customer_count: split.returning_customer_count,
    repeat_buyer_count: repeatBuyers,
    repeat_rate_pct: customerCount ? round((repeatBuyers / customerCount) * 100) : 0,
    returning_rate_pct: customerCount
      ? round((split.returning_customer_count / customerCount) * 100)
      : 0,
    average_spend: customerCount ? round(totalSpend / customerCount) : 0,
    top_customers: topCustomers,
    truncated: current.truncated || previous.truncated,
  };
}

export function customersIsEmpty(report: { customer_count: number }) {
  return report.customer_count === 0;
}

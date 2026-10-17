/**
 * Sales report aggregation.
 *
 * All scalar metrics are computed server-side with the Backend API's `group`
 * parameter, so the function transfers a handful of rows rather than paging
 * through every order. Only the top-products breakdown needs the raw items,
 * and that read is bounded to paid orders inside the reporting window.
 */

import { maskAddress, plainText } from './text';
import {
  addDays,
  addMonths,
  dayAsUtcDate,
  dayKey,
  daysBetween,
  DEFAULT_TIME_ZONE,
  localDay,
  startOfLocalDay,
  validTimeZone,
  weekday,
} from './time';

/** The reporting periods a merchant can choose. */
export const PERIODS = ['daily', 'weekly', 'biweekly', 'monthly'];

/**
 * Window length for the rolling periods. `monthly` is deliberately absent: it
 * covers a calendar month, whose length varies, so it has no fixed day count.
 */
const ROLLING_DAYS: Record<string, number> = {
  daily: 1,
  weekly: 7,
  biweekly: 14,
};

/** Longest window that still gets a day-by-day table. */
const MAX_DAILY_ROWS = 31;

export interface ReportWindow {
  /** Inclusive start of the reporting window. */
  start: Date;
  /** Exclusive end — always the store's midnight, so no partial day is included. */
  end: Date;
  /** Start of the equal-length window before it, for the comparison. */
  prevStart: Date;
  /** The store's time zone (app setting), which dates on the report use. */
  timeZone: string;
}

/**
 * A window of `days` whole days ending at the store's midnight today, preceded
 * by one the same length. Counted in calendar days, so a day that gains or
 * loses an hour to daylight saving is still one day.
 */
export function rollingWindow(
  days: number,
  now: Date = new Date(),
  timeZone: string = DEFAULT_TIME_ZONE,
): ReportWindow {
  const today = localDay(now, timeZone);
  return {
    start: startOfLocalDay(addDays(today, -days), timeZone),
    end: startOfLocalDay(today, timeZone),
    prevStart: startOfLocalDay(addDays(today, -2 * days), timeZone),
    timeZone,
  };
}

/**
 * The last whole calendar month, compared against the month before it.
 *
 * Anchoring on month boundaries rather than counting back 30 days is what keeps
 * the series gapless. A rolling 30-day window fired on the 1st misses a day in
 * every 31-day month — the Feb 1 report would cover Jan 2–31, and Jan 1 would
 * never appear in any monthly report — and after a 28-day February it reaches
 * back into January and counts those days twice.
 */
export function calendarMonthWindow(
  now: Date = new Date(),
  timeZone: string = DEFAULT_TIME_ZONE,
): ReportWindow {
  const today = localDay(now, timeZone);
  return {
    start: startOfLocalDay(addMonths(today, -1), timeZone),
    end: startOfLocalDay(addMonths(today, 0), timeZone),
    prevStart: startOfLocalDay(addMonths(today, -2), timeZone),
    timeZone,
  };
}

/** The window a configured period asks for, in the store's time zone. */
export function resolveWindow(
  period: string,
  now: Date = new Date(),
  timeZone: string = DEFAULT_TIME_ZONE,
): ReportWindow {
  if (period === 'monthly') {
    return calendarMonthWindow(now, timeZone);
  }

  return rollingWindow(ROLLING_DAYS[period] ?? ROLLING_DAYS.weekly, now, timeZone);
}

export interface ReportSettings {
  /** Master switch AND the sales report's own toggle — true only when both are on. */
  enabled: boolean;
  period: string;
  recipients: string[];
  top_products_limit: number;
  include_daily_breakdown: boolean;
  send_when_empty: boolean;
  /** The store's time zone, from the app's "Time zone" setting. */
  timeZone: string;
}

const DEFAULTS: ReportSettings = {
  enabled: true,
  period: 'weekly',
  recipients: [],
  top_products_limit: 10,
  include_daily_breakdown: true,
  send_when_empty: false,
  timeZone: DEFAULT_TIME_ZONE,
};

/** Top products stored on a sales report when the switch is on. */
const TOP_PRODUCTS = 10;

/** Loose sanity check — real validation is the mail server's job. */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * This app's sales report notification, as `<collection>.<file name>`. It is
 * expanded to Swell's full app notification id before sending; see
 * `resolveTemplate`.
 */
export const NOTIFICATION_TEMPLATE = 'reports.sales-report';

/**
 * Name of this app's settings file, which is also the key its fields arrive
 * nested under in the record `swell.settings()` returns.
 */
const SETTINGS_KEY = 'report-config';

/**
 * This app's own fields out of the record `swell.settings()` returns.
 *
 * Shared by every report type's resolver, so they all read the same object.
 */
export function settingsRecord(
  raw: SwellSettings | undefined | null,
): Record<string, unknown> {
  const record = (raw ?? {}) as Record<string, unknown>;

  // `swell.settings()` hands back the whole settings record — this app's fields
  // nested under the settings file's name, with `id` and `date_*` alongside
  // them — not the fields themselves. Reading the record flat silently yields
  // `undefined` for every field, which coerces to DEFAULTS and looks like it
  // works. Unwrap the nested object, and fall back to the flat record so a
  // differently shaped response still resolves.
  const nested = record[SETTINGS_KEY];
  return (nested && typeof nested === 'object' ? nested : record) as Record<
    string,
    unknown
  >;
}

/**
 * Addresses from a recipients setting (free text, so anything that cannot be an
 * address is dropped rather than failing later as a send error).
 */
function recipientList(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .filter((entry): entry is string => typeof entry === 'string')
        .map((entry) => entry.trim())
        .filter((entry) => EMAIL_SHAPE.test(entry))
    : [];
}

/**
 * Who gets one report type: the main "Recipients" list (every report) plus that
 * report's own list (`<prefix>_recipients`, this report only). An address on
 * both gets the report once; the first spelling seen is kept.
 */
export function recipientsFor(settings: Record<string, unknown>, prefix: string): string[] {
  const seen = new Set<string>();
  return [...recipientList(settings.recipients), ...recipientList(settings[`${prefix}_recipients`])].filter(
    (address) => {
      const key = address.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    },
  );
}

/** A boolean setting, or its default when unset or the wrong type. */
export function boolSetting(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/** Settings come back untyped and partially populated; coerce to a known shape. */
export function resolveSettings(raw: SwellSettings | undefined | null): ReportSettings {
  const settings = settingsRecord(raw);
  const bool = boolSetting;

  const limit = Number(settings.top_products_limit);

  return {
    // `enabled` is the master switch for every scheduled report; `sales_enabled`
    // is the sales report's own toggle, added when other report types arrived.
    // Stores saved before then have no `sales_enabled`, which defaults on, so
    // their sales report keeps running exactly as before.
    enabled:
      bool(settings.enabled, DEFAULTS.enabled) && bool(settings.sales_enabled, true),
    period:
      typeof settings.period === 'string' && PERIODS.includes(settings.period)
        ? settings.period
        : DEFAULTS.period,
    // The main list plus the sales report's own list.
    recipients: recipientsFor(settings, 'sales'),
    // "Include top products" switch: on stores the top 10 (the dashboard shows
    // 5 with "Show more", the email lists 5); off stores none. Before the
    // switch there was a 0–20 slider, where 0 meant "leave them out".
    top_products_limit:
      settings.top_products_enabled !== undefined && settings.top_products_enabled !== null
        ? bool(settings.top_products_enabled, true)
          ? TOP_PRODUCTS
          : 0
        : Number.isFinite(limit) && Math.trunc(limit) === 0
          ? 0
          : TOP_PRODUCTS,
    include_daily_breakdown: bool(
      settings.include_daily_breakdown,
      DEFAULTS.include_daily_breakdown,
    ),
    send_when_empty: bool(settings.send_when_empty, DEFAULTS.send_when_empty),
    timeZone: validTimeZone(settings.timezone),
  };
}

/** A Monday from which every-two-weeks reports count: Jan 5, 1970. */
const BIWEEKLY_ANCHOR = { year: 1970, month: 1, day: 5 };

/**
 * Whether `now` falls in a week that gets an every-two-weeks report. A daily
 * check cannot remember when the last report ran, so the fortnights are fixed
 * from one Monday: weeks 0, 2, 4… after it. Every store runs on the same
 * Mondays, and the result never depends on when the app was installed.
 */
export function isBiweeklyMonday(now: Date, timeZone: string = DEFAULT_TIME_ZONE): boolean {
  const weeks = Math.floor(daysBetween(BIWEEKLY_ANCHOR, localDay(now, timeZone)) / 7);
  return weeks % 2 === 0;
}

/**
 * The cron fires every morning; this decides whether the configured period
 * actually wants a report today. Weekly lands on Monday, every two weeks on
 * alternate Mondays (see `isBiweeklyMonday`), monthly on the 1st.
 */
export function isDueToday(
  period: string,
  now: Date,
  timeZone: string = DEFAULT_TIME_ZONE,
): boolean {
  const today = localDay(now, timeZone);
  switch (period) {
    case 'daily':
      return true;
    case 'monthly':
      return today.day === 1;
    case 'biweekly':
      return weekday(today) === 1 && isBiweeklyMonday(now, timeZone);
    case 'weekly':
    default:
      return weekday(today) === 1;
  }
}

export function round(value: number): number {
  return Math.round((Number(value) || 0) * 100) / 100;
}

/** Percent change, or null when there is no prior value to compare against. */
export function percentChange(current: number, previous: number): number | null {
  if (!previous) {
    return null;
  }
  return round(((current - previous) / previous) * 100);
}

/** `YYYY-MM-DD` for the day `date` falls on in the store's time zone. */
export function isoDate(date: Date, timeZone: string = DEFAULT_TIME_ZONE): string {
  return dayKey(localDay(date, timeZone));
}

/**
 * Orders that count toward revenue: paid, and not cancelled. Uses the
 * `canceled` flag rather than `status`, which is a label a store can redefine.
 * `paid` stays true after a refund, so revenue figures subtract `refund_total`
 * separately.
 */
export function revenueWhere(start: Date, end: Date) {
  return {
    paid: true,
    canceled: { $ne: true },
    date_created: { $gte: start.toISOString(), $lt: end.toISOString() },
  };
}

export interface Totals {
  order_count: number;
  item_quantity: number;
  sub_total: number;
  discount_total: number;
  shipping_total: number;
  tax_total: number;
  /** What the orders were charged, before refunds. */
  grand_total: number;
  /** Refunded so far on those orders. */
  refund_total: number;
}

const EMPTY_TOTALS: Totals = {
  order_count: 0,
  item_quantity: 0,
  sub_total: 0,
  discount_total: 0,
  shipping_total: 0,
  tax_total: 0,
  grand_total: 0,
  refund_total: 0,
};

/**
 * Single-row aggregate of every monetary total for a window.
 * With no accumulator keys beyond sums, the API returns one result object.
 */
export async function fetchTotals(swell: SwellAPI, start: Date, end: Date): Promise<Totals> {
  const response = await swell.get('/orders', {
    where: revenueWhere(start, end),
    group: {
      order_count: { $sum: 1 },
      item_quantity: { $sum: 'item_quantity' },
      sub_total: { $sum: 'sub_total' },
      discount_total: { $sum: 'discount_total' },
      // Swell's field is `shipment_total` (shipping after any shipping
      // discount); the report stores it as `shipping_total`.
      shipping_total: { $sum: 'shipment_total' },
      tax_total: { $sum: 'tax_total' },
      grand_total: { $sum: 'grand_total' },
      refund_total: { $sum: 'refund_total' },
    },
  });

  const row = response?.results?.[0];
  if (!row) {
    return { ...EMPTY_TOTALS };
  }

  return {
    order_count: Number(row.order_count) || 0,
    item_quantity: Number(row.item_quantity) || 0,
    sub_total: round(row.sub_total),
    discount_total: round(row.discount_total),
    shipping_total: round(row.shipping_total),
    tax_total: round(row.tax_total),
    grand_total: round(row.grand_total),
    refund_total: round(row.refund_total),
  };
}

/** Cancelled and unpaid orders created in the window, for context alongside revenue. */
async function fetchExcludedCounts(
  swell: SwellAPI,
  start: Date,
  end: Date,
): Promise<{ cancelled_count: number; unpaid_count: number }> {
  const dateRange = {
    date_created: { $gte: start.toISOString(), $lt: end.toISOString() },
  };

  const [cancelled, unpaid] = await Promise.all([
    swell.get('/orders/:count', { where: { ...dateRange, canceled: true } }),
    // Drafts are always unpaid but nobody owes anything on them yet.
    swell.get('/orders/:count', {
      where: { ...dateRange, paid: false, canceled: { $ne: true }, draft: { $ne: true } },
    }),
  ]);

  return {
    cancelled_count: Number(cancelled) || 0,
    unpaid_count: Number(unpaid) || 0,
  };
}

/**
 * Per-day orders and revenue, with days that had no orders as zero rows.
 *
 * In UTC, one server-side read grouped by calendar date. In any other time
 * zone the server's date grouping (UTC) would put evening orders on the wrong
 * day, so each local day is totalled with its own small grouped read instead
 * (a month is at most 31 reads, a few at a time).
 */
async function fetchDailyTotals(swell: SwellAPI, start: Date, end: Date, timeZone: string) {
  const days: { key: string; from: Date; to: Date }[] = [];
  for (let day = localDay(start, timeZone); ; day = addDays(day, 1)) {
    const from = startOfLocalDay(day, timeZone);
    if (from >= end) break;
    days.push({ key: dayKey(day), from, to: startOfLocalDay(addDays(day, 1), timeZone) });
  }

  const byDate = new Map(days.map((d) => [d.key, { date: d.key, orders: 0, revenue: 0 }]));

  if (timeZone === DEFAULT_TIME_ZONE) {
    const response = await swell.get('/orders', {
      where: revenueWhere(start, end),
      group: {
        orders: { $sum: 1 },
        revenue: { $sum: 'grand_total' },
        refunds: { $sum: 'refund_total' },
        year: { $year: 'date_created' },
        month: { $month: 'date_created' },
        day: { $dayOfMonth: 'date_created' },
      },
    });

    for (const row of response?.results ?? []) {
      const key = dayKey({ year: Number(row.year), month: Number(row.month), day: Number(row.day) });
      if (byDate.has(key)) {
        byDate.set(key, { date: key, orders: Number(row.orders) || 0, revenue: netRevenue(row) });
      }
    }
    return [...byDate.values()];
  }

  const BATCH = 8;
  for (let i = 0; i < days.length; i += BATCH) {
    await Promise.all(
      days.slice(i, i + BATCH).map(async (d) => {
        const response = await swell.get('/orders', {
          where: revenueWhere(d.from, d.to),
          group: { orders: { $sum: 1 }, revenue: { $sum: 'grand_total' }, refunds: { $sum: 'refund_total' } },
        });
        const row = response?.results?.[0];
        if (row) {
          byDate.set(d.key, { date: d.key, orders: Number(row.orders) || 0, revenue: netRevenue(row) });
        }
      }),
    );
  }
  return [...byDate.values()];
}

/** A grouped row's `revenue` less its `refunds`. */
function netRevenue(row: { revenue?: unknown; refunds?: unknown }) {
  return round((Number(row.revenue) || 0) - (Number(row.refunds) || 0));
}

interface TopProduct {
  product_id: string;
  name: string;
  quantity: number;
  revenue: number;
}

/**
 * Best sellers by revenue. Line items live inside each order, so this reads the
 * window's paid orders and rolls the items up locally. Only item fields are
 * requested, and paging stops at a fixed ceiling to bound worst-case runtime.
 */
async function fetchTopProducts(
  swell: SwellAPI,
  start: Date,
  end: Date,
  limit: number,
): Promise<{ products: TopProduct[]; truncated: boolean }> {
  if (limit <= 0) {
    return { products: [], truncated: false };
  }

  const byProduct = new Map<
    string,
    { product_id: string; name: string; quantity: number; revenue: number }
  >();

  const pageLimit = 100;
  const maxPages = 25;
  let truncated = false;
  let read = 0;

  for (let page = 1; page <= maxPages; page++) {
    const response = await swell.get('/orders', {
      where: revenueWhere(start, end),
      fields: 'items.product_id,items.product_name,items.quantity,items.price_total',
      limit: pageLimit,
      page,
    });

    const orders = response?.results ?? [];
    read += orders.length;

    for (const order of orders) {
      for (const item of order.items ?? []) {
        const productId = item.product_id;
        if (!productId) {
          continue;
        }

        const entry = byProduct.get(productId) ?? {
          product_id: productId,
          name: plainText(item.product_name) || 'Unknown product',
          quantity: 0,
          revenue: 0,
        };

        entry.quantity += Number(item.quantity) || 0;
        entry.revenue += Number(item.price_total) || 0;
        byProduct.set(productId, entry);
      }
    }

    if (orders.length < pageLimit) {
      break;
    }

    // A full last page is only a cut-off if there were more orders than that.
    const total = Number(response?.count);
    if (page === maxPages && !(Number.isFinite(total) && total <= read)) {
      truncated = true;
      console.warn(
        `Top products truncated: more than ${maxPages * pageLimit} orders in period.`,
      );
    }
  }

  const products = [...byProduct.values()]
    .map((entry) => ({ ...entry, revenue: round(entry.revenue) }))
    .sort((a, b) => b.revenue - a.revenue || b.quantity - a.quantity)
    .slice(0, limit);

  return { products, truncated };
}

/** Page size for the grouped account reads. */
const ACCOUNT_PAGE_LIMIT = 1000;
/** Ceiling on grouped account pages, mirroring the top-products bound. */
const ACCOUNT_MAX_PAGES = 20;
/** Batch size for `$in` lookups, so the query string stays a sane length. */
const ACCOUNT_CHUNK = 100;

/**
 * Every distinct `account_id` matching a query.
 *
 * Grouping by `account_id` returns one row per customer rather than a fixed
 * handful, so this pages instead of trusting a single unbounded response.
 * Ids are deduplicated into a set, which keeps the count correct even if the
 * endpoint ignores `page` for a grouped read and replays the same rows — the
 * loop then stops as soon as a page contributes nothing new, rather than
 * spinning to the ceiling.
 */
export async function fetchAccountIds(
  swell: SwellAPI,
  where: Record<string, unknown>,
): Promise<{ ids: string[]; truncated: boolean }> {
  const ids = new Set<string>();
  let truncated = false;

  for (let page = 1; page <= ACCOUNT_MAX_PAGES; page++) {
    const response = await swell.get('/orders', {
      where,
      group: { account_id: true },
      limit: ACCOUNT_PAGE_LIMIT,
      page,
    });

    const rows = response?.results ?? [];
    const before = ids.size;

    for (const row of rows) {
      if (row?.account_id) {
        ids.add(row.account_id);
      }
    }

    // A short page is the last one; a page that adds nothing new means the
    // endpoint is not honouring `page` and we already hold the whole set.
    if (rows.length < ACCOUNT_PAGE_LIMIT || ids.size === before) {
      break;
    }

    // The last page was full: it's only a cut-off if one more page has
    // accounts not seen yet.
    if (page === ACCOUNT_MAX_PAGES) {
      const next = await swell.get('/orders', {
        where,
        group: { account_id: true },
        limit: ACCOUNT_PAGE_LIMIT,
        page: page + 1,
      });
      truncated = (next?.results ?? []).some((row: any) => row?.account_id && !ids.has(row.account_id));
    }
  }

  return { ids: [...ids], truncated };
}

/**
 * Split the period's customers into new and returning, by asking which of them
 * had already placed a paid order before the window opened.
 *
 * Guest checkouts have no `account_id` and so appear on neither side; the two
 * counts therefore need not add up to the period's order count.
 */
export async function fetchCustomerSplit(swell: SwellAPI, start: Date, end: Date) {
  const { ids: accountIds, truncated } = await fetchAccountIds(swell, {
    ...revenueWhere(start, end),
    account_id: { $ne: null },
  });

  if (truncated) {
    console.warn(
      `Customer split truncated: more than ${ACCOUNT_MAX_PAGES * ACCOUNT_PAGE_LIMIT} ` +
        'distinct customers in period; new/returning counts are a lower bound.',
    );
  }

  if (accountIds.length === 0) {
    return { new_customer_count: 0, returning_customer_count: 0, truncated };
  }

  // Look the prior history up in batches, so a busy period does not build one
  // enormous `$in` list. Each batch is a subset of `accountIds`, so the union
  // of the results is exactly the returning set.
  const returning = new Set<string>();

  for (let i = 0; i < accountIds.length; i += ACCOUNT_CHUNK) {
    const { ids: prior } = await fetchAccountIds(swell, {
      paid: true,
      canceled: { $ne: true },
      account_id: { $in: accountIds.slice(i, i + ACCOUNT_CHUNK) },
      date_created: { $lt: start.toISOString() },
    });

    for (const id of prior) {
      returning.add(id);
    }
  }

  return {
    new_customer_count: accountIds.filter((id) => !returning.has(id)).length,
    returning_customer_count: returning.size,
    // More customers than the split reads: both counts are a lower bound.
    truncated,
  };
}

/** Currency of the most recent paid order in the window, else the store's (see `storeCurrency`). */
export async function fetchCurrency(swell: SwellAPI, start: Date, end: Date): Promise<string> {
  const last = await swell.get('/orders/:last', {
    where: revenueWhere(start, end),
    fields: 'currency',
  });

  return last?.currency || (await storeCurrency(swell));
}

/**
 * The store's currency when a period has no paid orders to take it from: the
 * currency of its most recent order of any date, else USD. (The store's own
 * setting is at `/:currencies`, which would need another permission.)
 */
export async function storeCurrency(swell: SwellAPI): Promise<string> {
  const last = await swell.get('/orders/:last', { fields: 'currency' });
  return last?.currency || 'USD';
}

/** True when the window is exactly one calendar month in the store's time zone. */
function isCalendarMonth(start: Date, end: Date, timeZone: string): boolean {
  const first = localDay(start, timeZone);
  const after = localDay(end, timeZone);
  const months = (after.year - first.year) * 12 + (after.month - first.month);

  return first.day === 1 && after.day === 1 && months === 1;
}

/** "Oct 9 – Oct 15, 2026", "Oct 16, 2026" or "September 2026", in the store's days. */
export function formatPeriodLabel(
  start: Date,
  end: Date,
  timeZone: string = DEFAULT_TIME_ZONE,
): string {
  // A whole month reads better by name than as a date range.
  if (isCalendarMonth(start, end, timeZone)) {
    return dayAsUtcDate(localDay(start, timeZone)).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }

  const opts: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  };

  // `end` is exclusive, so the last day actually covered is the day before.
  const firstDay = localDay(start, timeZone);
  const lastLocal = localDay(new Date(end.getTime() - 1), timeZone);
  const first = dayAsUtcDate(firstDay);
  const lastDay = dayAsUtcDate(lastLocal);
  const startYear = firstDay.year;
  const endYear = lastLocal.year;

  if (daysBetween(firstDay, lastLocal) <= 0) {
    return `${lastDay.toLocaleDateString('en-US', opts)}, ${endYear}`;
  }

  // Only repeat the year on the start date when the window crosses into a new
  // one, so "Dec 29, 2025 – Jan 4, 2026" stays unambiguous.
  const from =
    startYear === endYear
      ? first.toLocaleDateString('en-US', opts)
      : `${first.toLocaleDateString('en-US', opts)}, ${startYear}`;

  return `${from} – ${lastDay.toLocaleDateString('en-US', opts)}, ${endYear}`;
}

/**
 * Create the notification record that emails one stored report to one
 * address. These are the only emails sent: the notifications' conditions never
 * match (`id` must not exist), so storing a report emails nobody by itself.
 * (`"conditions": false` was tried first, but Swell stores it as `{}`, which
 * matches every record.)
 * Never throws: a failure comes back as `error`, so one bad address
 * can't stop the others.
 */
export async function createRecipientNotification(
  swell: Pick<SwellAPI, 'post'>,
  fullTemplate: string,
  recordId: string,
  to: string,
): Promise<{ id?: string; error?: string }> {
  try {
    const notification = await swell.post('/notifications', {
      template: fullTemplate,
      record_id: recordId,
      to,
    });
    if (notification?.id) {
      return { id: notification.id as string };
    }
    return { error: notification?.errors ? JSON.stringify(notification.errors) : 'not created' };
  } catch (error) {
    // Kept and returned as well as logged: a swallowed failure with no
    // visible reason is how this feature stayed broken unnoticed before.
    console.error(`Report copy to ${maskAddress(to)} failed:`, error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Read back notification records a moment after creating them, and return a
 * `"<address>: <error>"` line for each one Swell couldn't send.
 */
export async function checkRecipientDelivery(
  swell: Pick<SwellAPI, 'get'>,
  fullTemplate: string,
  created: { to: string; id: string }[],
): Promise<string[]> {
  const errors: string[] = [];
  for (const { to, id } of created) {
    try {
      const record = await swell.get(`/notifications/${id}`);
      if (record?.error) {
        errors.push(`${maskAddress(to)}: ${record.error}`);
        console.error(`Report copy to ${maskAddress(to)} failed: ${record.error} (template ${fullTemplate})`);
      }
    } catch (error) {
      // Could not read it back; leave it counted as sent.
      console.warn(`Could not check delivery to ${maskAddress(to)}:`, error);
    }
  }
  return errors;
}


/**
 * Turn `<collection>.<notification name>` into the id Swell uses for an app's
 * notification: `app_<app id>.apps_<app id>_<collection>.<name>`, where the app
 * id is the installed app's record id (24 hex characters), not its slug. The
 * short form is answered with "Notification template not found".
 *
 * The record id is read from `app_id` on the collection's definition in
 * `GET /:models`, which is where Swell documents it. If more than one installed
 * app has a collection of that name, the most recently installed one wins.
 *
 * Looked up on every send, not cached: it's one read per report, and a cached
 * answer could outlive a failed lookup or belong to another store.
 */
export async function resolveTemplate(swell: Pick<SwellAPI, 'get'>, template: string): Promise<string> {
  const dot = template.indexOf('.');
  const collection = template.slice(0, dot);
  const name = template.slice(dot + 1);
  let resolved = template;

  try {
    const response = await swell.get('/:models', {
      where: { name: collection, app_id: { $exists: true } },
      fields: 'app_id,name,date_created',
      sort: 'date_created desc',
      limit: 20,
    });
    const match = (response?.results ?? []).find((model: any) => /^[0-9a-f]{24}$/i.test(model?.app_id ?? ''));
    if (match) {
      resolved = `app_${match.app_id}.apps_${match.app_id}_${collection}.${name}`;
    } else {
      console.warn(`No app model found for ${collection}; sending ${template} with the short name.`);
    }
  } catch (error) {
    // Reading /:models needs the `read_:models` permission in swell.json.
    console.warn(`Could not look up the app id for ${template} (needs read_:models):`, error);
  }
  console.log(`Notification template for ${template}: ${resolved}`);
  return resolved;
}

export async function buildReport(
  swell: SwellAPI,
  reportWindow: ReportWindow,
  settings: ReportSettings,
) {
  const { start: periodStart, end: periodEnd, prevStart, timeZone } = reportWindow;

  // Whole days in the window. A calendar month is 28–31, so the day-by-day
  // table still fits inside MAX_DAILY_ROWS.
  const days = Math.round((periodEnd.getTime() - periodStart.getTime()) / 86400000);

  const [totals, prevTotals, excluded, currency, customers, topProducts, dailyTotals] =
    await Promise.all([
      fetchTotals(swell, periodStart, periodEnd),
      fetchTotals(swell, prevStart, periodStart),
      fetchExcludedCounts(swell, periodStart, periodEnd),
      fetchCurrency(swell, periodStart, periodEnd),
      fetchCustomerSplit(swell, periodStart, periodEnd),
      fetchTopProducts(swell, periodStart, periodEnd, settings.top_products_limit),
      // A day-by-day table stops being readable past about a month, and would
      // bloat both the stored record and the email.
      settings.include_daily_breakdown && days <= MAX_DAILY_ROWS
        ? fetchDailyTotals(swell, periodStart, periodEnd, timeZone)
        : Promise.resolve([]),
    ]);

  const revenue = round(totals.grand_total - totals.refund_total);
  const prevRevenue = round(prevTotals.grand_total - prevTotals.refund_total);

  return {
    period_label: formatPeriodLabel(periodStart, periodEnd, timeZone),
    period_start: periodStart.toISOString(),
    period_end: periodEnd.toISOString(),
    currency,
    ...totals,
    // Revenue is what was charged less what has been refunded on those orders,
    // so Subtotal − Discounts + Shipping + Tax − Refunds = Revenue.
    grand_total: revenue,
    ...excluded,
    new_customer_count: customers.new_customer_count,
    returning_customer_count: customers.returning_customer_count,
    customers_truncated: customers.truncated,
    average_order_value: totals.order_count ? round(revenue / totals.order_count) : 0,
    prev_order_count: prevTotals.order_count,
    prev_grand_total: prevRevenue,
    revenue_change_pct: percentChange(revenue, prevRevenue),
    order_change_pct: percentChange(totals.order_count, prevTotals.order_count),
    top_products: topProducts.products,
    // Set when the period had more paid orders than the ranking reads, so the
    // email can say the list is partial instead of only warning in the logs.
    top_products_truncated: topProducts.truncated,
    daily_totals: dailyTotals,
  };
}

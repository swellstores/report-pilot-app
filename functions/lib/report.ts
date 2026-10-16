/**
 * Sales report aggregation.
 *
 * All scalar metrics are computed server-side with the Backend API's `group`
 * parameter, so the function transfers a handful of rows rather than paging
 * through every order. Only the top-products breakdown needs the raw items,
 * and that read is bounded to paid orders inside the reporting window.
 */

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
  /** Exclusive end — always midnight UTC, so no partial day is included. */
  end: Date;
  /** Start of the equal-length window before it, for the comparison. */
  prevStart: Date;
}

/** Midnight UTC on the day `now` falls in. */
function startOfUTCDay(now: Date): Date {
  const day = new Date(now);
  day.setUTCHours(0, 0, 0, 0);
  return day;
}

/** A window of `days` ending at midnight today, preceded by one the same length. */
export function rollingWindow(days: number, now: Date = new Date()): ReportWindow {
  const end = startOfUTCDay(now);
  const start = new Date(end.getTime() - days * 86400000);
  const prevStart = new Date(start.getTime() - days * 86400000);

  return { start, end, prevStart };
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
export function calendarMonthWindow(now: Date = new Date()): ReportWindow {
  const today = startOfUTCDay(now);
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 1, 1));
  const prevStart = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - 1, 1),
  );

  return { start, end, prevStart };
}

/** The window a configured period asks for. */
export function resolveWindow(period: string, now: Date = new Date()): ReportWindow {
  if (period === 'monthly') {
    return calendarMonthWindow(now);
  }

  return rollingWindow(ROLLING_DAYS[period] ?? ROLLING_DAYS.weekly, now);
}

export interface ReportSettings {
  /** Master switch AND the sales report's own toggle — true only when both are on. */
  enabled: boolean;
  period: string;
  recipients: string[];
  top_products_limit: number;
  include_daily_breakdown: boolean;
  send_when_empty: boolean;
}

const DEFAULTS: ReportSettings = {
  enabled: true,
  period: 'weekly',
  recipients: [],
  top_products_limit: 10,
  include_daily_breakdown: true,
  send_when_empty: false,
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
  };
}

/** A Monday from which every-two-weeks reports count: Jan 5, 1970 (UTC). */
const BIWEEKLY_ANCHOR = Date.UTC(1970, 0, 5);

/**
 * Whether `now` falls in a week that gets an every-two-weeks report. A daily
 * check cannot remember when the last report ran, so the fortnights are fixed
 * from one Monday: weeks 0, 2, 4… after it. Every store runs on the same
 * Mondays, and the result never depends on when the app was installed.
 */
export function isBiweeklyMonday(now: Date): boolean {
  const day = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const weeks = Math.floor((day - BIWEEKLY_ANCHOR) / (7 * 86400000));
  return weeks % 2 === 0;
}

/**
 * The cron fires every morning; this decides whether the configured period
 * actually wants a report today. Weekly lands on Monday, every two weeks on
 * alternate Mondays (see `isBiweeklyMonday`), monthly on the 1st.
 */
export function isDueToday(period: string, now: Date): boolean {
  switch (period) {
    case 'daily':
      return true;
    case 'monthly':
      return now.getUTCDate() === 1;
    case 'biweekly':
      return now.getUTCDay() === 1 && isBiweeklyMonday(now);
    case 'weekly':
    default:
      return now.getUTCDay() === 1;
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

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Orders that count toward revenue: paid, and not cancelled. */
export function revenueWhere(start: Date, end: Date) {
  return {
    paid: true,
    status: { $ne: 'canceled' },
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
  grand_total: number;
}

const EMPTY_TOTALS: Totals = {
  order_count: 0,
  item_quantity: 0,
  sub_total: 0,
  discount_total: 0,
  shipping_total: 0,
  tax_total: 0,
  grand_total: 0,
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
      shipping_total: { $sum: 'shipping_total' },
      tax_total: { $sum: 'tax_total' },
      grand_total: { $sum: 'grand_total' },
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
    swell.get('/orders/:count', { where: { ...dateRange, status: 'canceled' } }),
    swell.get('/orders/:count', {
      where: { ...dateRange, paid: false, status: { $ne: 'canceled' } },
    }),
  ]);

  return {
    cancelled_count: Number(cancelled) || 0,
    unpaid_count: Number(unpaid) || 0,
  };
}

/**
 * Per-day orders and revenue, grouped server-side by calendar date, then
 * padded so days with no orders still appear as zero rows.
 */
async function fetchDailyTotals(swell: SwellAPI, start: Date, end: Date) {
  const response = await swell.get('/orders', {
    where: revenueWhere(start, end),
    group: {
      orders: { $sum: 1 },
      revenue: { $sum: 'grand_total' },
      year: { $year: 'date_created' },
      month: { $month: 'date_created' },
      day: { $dayOfMonth: 'date_created' },
    },
  });

  const byDate = new Map<string, { date: string; orders: number; revenue: number }>();

  for (
    let cursor = new Date(start);
    cursor < end;
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    const key = isoDate(cursor);
    byDate.set(key, { date: key, orders: 0, revenue: 0 });
  }

  for (const row of response?.results ?? []) {
    const month = String(row.month).padStart(2, '0');
    const day = String(row.day).padStart(2, '0');
    const key = `${row.year}-${month}-${day}`;

    if (byDate.has(key)) {
      byDate.set(key, {
        date: key,
        orders: Number(row.orders) || 0,
        revenue: round(row.revenue),
      });
    }
  }

  return [...byDate.values()];
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

  for (let page = 1; page <= maxPages; page++) {
    const response = await swell.get('/orders', {
      where: revenueWhere(start, end),
      fields: 'items.product_id,items.product_name,items.quantity,items.price_total',
      limit: pageLimit,
      page,
    });

    const orders = response?.results ?? [];

    for (const order of orders) {
      for (const item of order.items ?? []) {
        const productId = item.product_id;
        if (!productId) {
          continue;
        }

        const entry = byProduct.get(productId) ?? {
          product_id: productId,
          name: item.product_name || 'Unknown product',
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

    if (page === maxPages) {
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
const ACCOUNT_CHUNK = 500;

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

    if (page === ACCOUNT_MAX_PAGES) {
      truncated = true;
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
    return { new_customer_count: 0, returning_customer_count: 0 };
  }

  // Look the prior history up in batches, so a busy period does not build one
  // enormous `$in` list. Each batch is a subset of `accountIds`, so the union
  // of the results is exactly the returning set.
  const returning = new Set<string>();

  for (let i = 0; i < accountIds.length; i += ACCOUNT_CHUNK) {
    const { ids: prior } = await fetchAccountIds(swell, {
      paid: true,
      status: { $ne: 'canceled' },
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
  };
}

/** Currency of the most recent order in the window; falls back to store default. */
export async function fetchCurrency(swell: SwellAPI, start: Date, end: Date): Promise<string> {
  const last = await swell.get('/orders/:last', {
    where: revenueWhere(start, end),
    fields: 'currency',
  });

  return last?.currency || 'USD';
}

/** True when the window is exactly one calendar month. */
function isCalendarMonth(start: Date, end: Date): boolean {
  const months =
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (end.getUTCMonth() - start.getUTCMonth());

  return start.getUTCDate() === 1 && end.getUTCDate() === 1 && months === 1;
}

export function formatPeriodLabel(start: Date, end: Date): string {
  // A whole month reads better by name than as a date range.
  if (isCalendarMonth(start, end)) {
    return start.toLocaleDateString('en-US', {
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
  const lastDay = new Date(end.getTime() - 1);
  const startYear = start.getUTCFullYear();
  const endYear = lastDay.getUTCFullYear();

  if (end.getTime() - start.getTime() <= 86400000) {
    return `${lastDay.toLocaleDateString('en-US', opts)}, ${endYear}`;
  }

  // Only repeat the year on the start date when the window crosses into a new
  // one, so "Dec 29, 2025 – Jan 4, 2026" stays unambiguous.
  const from =
    startYear === endYear
      ? start.toLocaleDateString('en-US', opts)
      : `${start.toLocaleDateString('en-US', opts)}, ${startYear}`;

  return `${from} – ${lastDay.toLocaleDateString('en-US', opts)}, ${endYear}`;
}

/**
 * Mail a stored report to the recipients listed in the app settings.
 *
 * These are the only people emailed. The notifications' conditions can never
 * match (`id` must not exist), so storing a record no longer mails every store
 * admin automatically. (`"conditions": false` was tried first, but Swell stores
 * it as `{}`, which matches every record.)
 * each recipient gets an explicit notification record instead, where `to`
 * overrides the notification's default (admin) routing.
 *
 * Failures are logged and swallowed on purpose: the report is already stored,
 * so one bad address must not take the whole run down with it.
 */
export async function sendToExtraRecipients(
  swell: SwellAPI,
  recordId: string,
  recipients: string[],
  template: string = NOTIFICATION_TEMPLATE,
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const fullTemplate = await resolveTemplate(swell, template);
  const created: { to: string; id: string }[] = [];
  const errors: string[] = [];

  for (const to of recipients) {
    try {
      const notification = await swell.post('/notifications', {
        template: fullTemplate,
        record_id: recordId,
        to,
      });
      if (notification?.id) {
        created.push({ to, id: notification.id });
      } else {
        errors.push(`${to}: ${notification?.errors ? JSON.stringify(notification.errors) : 'not created'}`);
      }
    } catch (error) {
      // Kept and returned as well as logged: a swallowed failure with no
      // visible reason is how this feature stayed broken unnoticed before.
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${to}: ${message}`);
      console.error(`Report copy to ${to} failed:`, error);
    }
  }

  // A created notification record is not a delivered email: Swell renders it a
  // moment later and records a problem (such as "Notification template not
  // found") on the record's `error` field. Check once so the result is honest.
  let sent = created.length;
  if (created.length) {
    await new Promise((resolve) => setTimeout(resolve, DELIVERY_CHECK_MS));
    for (const { to, id } of created) {
      try {
        const record = await swell.get(`/notifications/${id}`);
        if (record?.error) {
          sent--;
          errors.push(`${to}: ${record.error}`);
          console.error(`Report copy to ${to} failed: ${record.error} (template ${fullTemplate})`);
        }
      } catch (error) {
        // Could not read it back; leave it counted as sent.
        console.warn(`Could not check delivery to ${to}:`, error);
      }
    }
  }

  return { sent, failed: errors.length, errors };
}

/** How long to wait before checking whether Swell accepted the notifications. */
const DELIVERY_CHECK_MS = 2500;

const resolvedTemplates = new Map<string, string>();

/**
 * Turn `<collection>.<notification name>` into the id Swell uses for an app's
 * notification: `app_<app id>.apps_<app id>_<collection>.<name>`, where the app
 * id is the installed app's record id (24 hex characters), not its slug. The
 * short form is answered with "Notification template not found".
 *
 * The record id is read from `app_id` on the collection's definition in
 * `GET /:models`, which is where Swell documents it. If more than one installed
 * app has a collection of that name, the most recently installed one wins.
 */
async function resolveTemplate(swell: SwellAPI, template: string): Promise<string> {
  const cached = resolvedTemplates.get(template);
  if (cached) {
    return cached;
  }

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

  resolvedTemplates.set(template, resolved);
  return resolved;
}

export async function buildReport(
  swell: SwellAPI,
  reportWindow: ReportWindow,
  settings: ReportSettings,
) {
  const { start: periodStart, end: periodEnd, prevStart } = reportWindow;

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
        ? fetchDailyTotals(swell, periodStart, periodEnd)
        : Promise.resolve([]),
    ]);

  return {
    period_label: formatPeriodLabel(periodStart, periodEnd),
    period_start: periodStart.toISOString(),
    period_end: periodEnd.toISOString(),
    currency,
    ...totals,
    ...excluded,
    ...customers,
    average_order_value: totals.order_count
      ? round(totals.grand_total / totals.order_count)
      : 0,
    prev_order_count: prevTotals.order_count,
    prev_grand_total: prevTotals.grand_total,
    revenue_change_pct: percentChange(totals.grand_total, prevTotals.grand_total),
    order_change_pct: percentChange(totals.order_count, prevTotals.order_count),
    top_products: topProducts.products,
    // Set when the period had more paid orders than the ranking reads, so the
    // email can say the list is partial instead of only warning in the logs.
    top_products_truncated: topProducts.truncated,
    daily_totals: dailyTotals,
  };
}

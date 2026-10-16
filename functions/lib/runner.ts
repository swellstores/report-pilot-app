/**
 * One registry for every report type, so the scheduled functions, the
 * on-demand route and the "Send a report now" action all generate, store and
 * mail a report the same way.
 *
 * The crons and the action don't build reports themselves: they start the
 * `send-report` workflow and return at once. Building a report on a busy store
 * can take longer than the 10 seconds a function gets, and each workflow step
 * gets its own time limit and retries.
 *
 * Each type has its own model and notification. Storing the record does not
 * email anyone by itself (the notifications' conditions never match); each
 * recipient in the app settings gets an explicit notification record.
 */

import { buildCartReport, cartsIsEmpty } from './carts';
import { buildCustomerReport, customersIsEmpty } from './customers';
import { buildDiscountReport, discountsIsEmpty } from './discounts';
import { buildInventoryReport, inventoryIsEmpty } from './inventory';
import { buildProductReport, productsIsEmpty } from './products';
import { buildSubscriptionReport, subscriptionsIsEmpty } from './subscriptions';
import {
  buildReport,
  isDueToday,
  NOTIFICATION_TEMPLATE,
  resolveSettings,
  resolveTemplate,
  resolveWindow,
  sendToExtraRecipients,
} from './report';
export { checkRecipientDelivery, createRecipientNotification, resolveTemplate } from './report';
import {
  resolveCartSettings,
  resolveCustomerSettings,
  resolveDiscountSettings,
  resolveInventorySettings,
  resolveProductSettings,
  resolveSubscriptionSettings,
} from './report-settings';
import { isSendHour } from './time';

export const REPORT_TYPES = [
  'sales',
  'inventory',
  'customers',
  'discounts',
  'products',
  'carts',
  'subscriptions',
] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export function isReportType(value: unknown): value is ReportType {
  return typeof value === 'string' && (REPORT_TYPES as readonly string[]).includes(value);
}

interface Resolved {
  enabled: boolean;
  period: string;
  recipients: string[];
  send_when_empty: boolean;
  timeZone: string;
}

interface Definition {
  label: string;
  /** Model collection, as addressed from inside this app's functions. */
  collection: string;
  /** `<collection>.<notification file name>`, for extra-recipient copies. */
  template: string;
  settings: (raw: SwellSettings) => Resolved;
  build: (swell: SwellAPI, settings: any, now: Date, period: string) => Promise<Record<string, any>>;
  isEmpty: (report: any) => boolean;
  summary: (report: any) => string;
}

const DEFINITIONS: Record<ReportType, Definition> = {
  sales: {
    label: 'Sales report',
    collection: 'reports',
    template: NOTIFICATION_TEMPLATE,
    settings: resolveSettings,
    build: (swell, settings, now, period) => buildReport(swell, resolveWindow(period, now, settings.timeZone), settings),
    isEmpty: (report) => report.order_count === 0,
    summary: (report) => `${report.order_count} orders, ${report.grand_total} ${report.currency}`,
  },
  inventory: {
    label: 'Inventory report',
    collection: 'inventoryreports',
    template: 'inventoryreports.inventory-report',
    settings: resolveInventorySettings,
    build: (swell, settings, now) => buildInventoryReport(swell, settings, now),
    isEmpty: inventoryIsEmpty,
    summary: (report) =>
      `${report.out_of_stock_count} out of stock, ${report.low_stock_count} low`,
  },
  customers: {
    label: 'Customer report',
    collection: 'customerreports',
    template: 'customerreports.customer-report',
    settings: resolveCustomerSettings,
    build: (swell, settings, now, period) =>
      buildCustomerReport(swell, resolveWindow(period, now, settings.timeZone), settings),
    isEmpty: customersIsEmpty,
    summary: (report) =>
      `${report.customer_count} customers, ${report.new_customer_count} new`,
  },
  discounts: {
    label: 'Discount report',
    collection: 'discountreports',
    template: 'discountreports.discount-report',
    settings: resolveDiscountSettings,
    build: (swell, settings, now, period) =>
      buildDiscountReport(swell, resolveWindow(period, now, settings.timeZone), settings),
    isEmpty: discountsIsEmpty,
    summary: (report) =>
      `${report.discounted_order_count} discounted orders, ${report.discount_total} ${report.currency} off`,
  },
  products: {
    label: 'Product report',
    collection: 'productreports',
    template: 'productreports.product-report',
    settings: resolveProductSettings,
    build: (swell, settings, now, period) =>
      buildProductReport(swell, resolveWindow(period, now, settings.timeZone), settings),
    isEmpty: productsIsEmpty,
    summary: (report) => `${report.products_sold_count} products sold, ${report.unsold_count} unsold`,
  },
  carts: {
    label: 'Abandoned cart report',
    collection: 'cartreports',
    template: 'cartreports.cart-report',
    settings: resolveCartSettings,
    build: (swell, settings, now, period) => buildCartReport(swell, resolveWindow(period, now, settings.timeZone)),
    isEmpty: cartsIsEmpty,
    summary: (report) =>
      `${report.abandoned_count} abandoned carts, ${report.recovered_count} recovered`,
  },
  subscriptions: {
    label: 'Subscription report',
    collection: 'subscriptionreports',
    template: 'subscriptionreports.subscription-report',
    settings: resolveSubscriptionSettings,
    build: (swell, settings, now, period) => buildSubscriptionReport(swell, resolveWindow(period, now, settings.timeZone)),
    isEmpty: subscriptionsIsEmpty,
    summary: (report) =>
      `${report.active_count} active, ${report.new_count} new, ${report.canceled_count} canceled`,
  },
};

export function reportLabel(type: ReportType): string {
  return DEFINITIONS[type].label;
}

export interface GenerateOptions {
  /** Store the record and email the recipients in the app settings. */
  save: boolean;
  /** Override the configured period for this run. */
  period?: string;
  /** Store and send even when the report has nothing in it. */
  force?: boolean;
  now?: Date;
}

/** Build one report and, when asked, store and send it. */
export async function generate(swell: SwellAPI, type: ReportType, options: GenerateOptions) {
  const definition = DEFINITIONS[type];
  const now = options.now ?? new Date();
  const settings = definition.settings(await swell.settings());
  const period = options.period ?? settings.period;

  const report = await definition.build(swell, settings, now, period);
  const empty = definition.isEmpty(report);

  if (!options.save) {
    return { type, preview: true, period, empty, report };
  }

  if (empty && !options.force && !settings.send_when_empty) {
    return { type, preview: false, period, empty, skipped: 'empty' as const, report };
  }

  const created = await swell.post(`/${definition.collection}`, report);

  const copies =
    created?.id && settings.recipients.length > 0
      ? await sendToExtraRecipients(swell, created.id, settings.recipients, definition.template)
      : { sent: 0, failed: 0, errors: [] as string[] };

  console.log(
    `${definition.label} created for ${report.period_label}: ${definition.summary(report)}.` +
      (copies.sent || copies.failed
        ? ` Copied to ${copies.sent} extra recipient(s), ${copies.failed} failed.`
        : ''),
  );

  return {
    type,
    preview: false,
    period,
    empty,
    report_id: created?.id as string | undefined,
    extra_recipients_sent: copies.sent,
    extra_recipients_failed: copies.failed,
    extra_recipient_errors: copies.errors,
    report,
  };
}

/** The workflow that builds, saves and emails one report (`functions/send-report.ts`). */
export const SEND_WORKFLOW = 'send-report';

/** What the crons and the action pass to the `send-report` workflow. JSON only. */
export interface SendParams {
  type: ReportType;
  /** ISO time the run was asked for; the report covers the period before it. */
  now: string;
  /** Override the configured period. */
  period?: string;
  /** Save and send even when the report has nothing in it. */
  force?: boolean;
  /** What started it, for the logs. */
  source: 'schedule' | 'action';
  /**
   * The notification's full name. Looked up before the run starts, because a
   * workflow isn't allowed to read `/:models` ("Workflow runtime API path is
   * not allowed").
   */
  template?: string;
}

/** Start the `send-report` workflow. Returns as soon as the run is created. */
export async function startSend(swell: SwellAPI, params: Omit<SendParams, 'template'>) {
  const template = await resolveTemplate(swell, DEFINITIONS[params.type].template);
  const run = await swell.workflows.create(SEND_WORKFLOW, { ...params, template });
  console.log(`${DEFINITIONS[params.type].label}: started ${SEND_WORKFLOW} run ${run?.id} (${params.source}).`);
  return run;
}

/**
 * Workflow step 1: read the settings and build the report. Read-only, so safe
 * to retry. Returns everything the later steps need, so they don't re-read
 * settings that may have changed in between.
 */
export async function buildForSend(swell: SwellAPI, params: SendParams) {
  const definition = DEFINITIONS[params.type];
  const settings = definition.settings(await swell.settings());
  const period = params.period ?? settings.period;
  const report = await definition.build(swell, settings, new Date(params.now), period);

  return {
    report,
    period,
    empty: definition.isEmpty(report),
    recipients: settings.recipients,
    send_when_empty: settings.send_when_empty,
  };
}

/** Workflow step 2: store the report record. Throws if Swell doesn't return an id. */
export async function saveForSend(swell: SwellAPI, type: ReportType, report: Record<string, any>) {
  const created = await swell.post(`/${DEFINITIONS[type].collection}`, report);
  if (!created?.id) {
    throw new Error(
      `${DEFINITIONS[type].label} was not saved: ${created?.errors ? JSON.stringify(created.errors) : 'no id returned'}`,
    );
  }
  return created.id as string;
}

/** `<collection>.<notification>` for a type, to resolve before emailing. */
export function notificationTemplate(type: ReportType) {
  return DEFINITIONS[type].template;
}

/** The one-line summary used in log lines. */
export function reportSummary(type: ReportType, report: any) {
  return DEFINITIONS[type].summary(report);
}

/**
 * Entry point for a type's cron, which runs every hour: honour the toggles,
 * then start the `send-report` workflow only in the store's send hour (08:00
 * local) on a day the period is due.
 */
export async function runScheduled(swell: SwellAPI, type: ReportType, now: Date = new Date()) {
  const definition = DEFINITIONS[type];
  const settings = definition.settings(await swell.settings());

  if (!settings.enabled) {
    console.log(`${definition.label} skipped: turned off in app settings.`);
    return { type, skipped: 'disabled' };
  }

  // Every other hour of the day returns here without a log line, to keep the
  // hourly runs quiet.
  if (!isSendHour(now, settings.timeZone)) {
    return { type, skipped: 'not_send_hour', timezone: settings.timeZone };
  }

  if (!isDueToday(settings.period, now, settings.timeZone)) {
    console.log(`${definition.label} skipped: ${settings.period} report is not due today.`);
    return { type, skipped: 'not_due', period: settings.period };
  }

  const run = await startSend(swell, { type, now: now.toISOString(), source: 'schedule' });
  return { type, started: run?.id };
}

/** Recipients a type's report goes to, for the action's reply. */
export async function recipientsFor(swell: SwellAPI, type: ReportType) {
  return DEFINITIONS[type].settings(await swell.settings()).recipients;
}

/** Whether a type's own toggle (and the master switch) is on. */
export async function isEnabled(swell: SwellAPI, type: ReportType) {
  return DEFINITIONS[type].settings(await swell.settings()).enabled;
}

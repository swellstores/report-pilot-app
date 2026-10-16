/**
 * One registry for every report type, so the scheduled functions, the
 * on-demand route and the "Send a report now" action all generate, store and
 * mail a report the same way.
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
  resolveWindow,
  sendToExtraRecipients,
} from './report';
import {
  resolveCartSettings,
  resolveCustomerSettings,
  resolveDiscountSettings,
  resolveInventorySettings,
  resolveProductSettings,
  resolveSubscriptionSettings,
} from './report-settings';

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
    build: (swell, settings, now, period) => buildReport(swell, resolveWindow(period, now), settings),
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
      buildCustomerReport(swell, resolveWindow(period, now), settings),
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
      buildDiscountReport(swell, resolveWindow(period, now), settings),
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
      buildProductReport(swell, resolveWindow(period, now), settings),
    isEmpty: productsIsEmpty,
    summary: (report) => `${report.products_sold_count} products sold, ${report.unsold_count} unsold`,
  },
  carts: {
    label: 'Abandoned cart report',
    collection: 'cartreports',
    template: 'cartreports.cart-report',
    settings: resolveCartSettings,
    build: (swell, _settings, now, period) => buildCartReport(swell, resolveWindow(period, now)),
    isEmpty: cartsIsEmpty,
    summary: (report) =>
      `${report.abandoned_count} abandoned carts, ${report.recovered_count} recovered`,
  },
  subscriptions: {
    label: 'Subscription report',
    collection: 'subscriptionreports',
    template: 'subscriptionreports.subscription-report',
    settings: resolveSubscriptionSettings,
    build: (swell, _settings, now, period) => buildSubscriptionReport(swell, resolveWindow(period, now)),
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

/** Entry point for a type's daily cron: honour the toggles and the schedule. */
export async function runScheduled(swell: SwellAPI, type: ReportType, now: Date = new Date()) {
  const definition = DEFINITIONS[type];
  const settings = definition.settings(await swell.settings());

  if (!settings.enabled) {
    console.log(`${definition.label} skipped: turned off in app settings.`);
    return { type, skipped: 'disabled' };
  }

  if (!isDueToday(settings.period, now)) {
    return { type, skipped: 'not_due', period: settings.period };
  }

  const result = await generate(swell, type, { save: true, now });

  if (result.skipped) {
    console.log(`${definition.label} skipped: nothing to report for ${result.report.period_label}.`);
    return { type, skipped: result.skipped, period: result.report.period_label };
  }

  return {
    type,
    report_id: result.report_id,
    period: result.report.period_label,
    extra_recipients_sent: result.extra_recipients_sent,
    extra_recipients_failed: result.extra_recipients_failed,
  };
}

/** Whether a type's own toggle (and the master switch) is on. */
export async function isEnabled(swell: SwellAPI, type: ReportType) {
  return DEFINITIONS[type].settings(await swell.settings()).enabled;
}

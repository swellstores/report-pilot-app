/**
 * Settings for the report types added alongside the sales report.
 *
 * They live in the same settings file as the sales report's fields
 * (`settings/report-config.json`), prefixed by report type, so one settings
 * page configures everything. Every new type defaults to off: an existing store
 * that upgrades keeps receiving only the sales report until a merchant turns
 * another one on.
 */

import { boolSetting, PERIODS, recipientsFor, resolveSettings, settingsRecord } from './report';

export interface TypeSettings {
  /** Master switch AND this type's own toggle. */
  enabled: boolean;
  period: string;
  recipients: string[];
  send_when_empty: boolean;
  /** The store's time zone, from the app's "Time zone" setting. */
  timeZone: string;
}

export interface InventorySettings extends TypeSettings {
  low_stock_threshold: number;
  limit: number;
}

export interface CustomerSettings extends TypeSettings {
  top_customers_limit: number;
}

export interface DiscountSettings extends TypeSettings {
  limit: number;
}

export interface ProductSettings extends TypeSettings {
  limit: number;
  include_unsold: boolean;
}

function intSetting(value: unknown, fallback: number, min: number, max: number): number {
  const number = Number(value);
  if (value === null || value === undefined || value === '' || !Number.isFinite(number)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.trunc(number)));
}

function common(raw: SwellSettings | undefined | null, prefix: string): TypeSettings {
  const settings = settingsRecord(raw);
  // Reuse the sales resolver for `send_when_empty`, so it defaults in exactly
  // one place. (Its recipients include the sales report's own list, so they are
  // not reused here.)
  const shared = resolveSettings(raw);
  const period = settings[`${prefix}_period`];

  return {
    enabled:
      boolSetting(settings.enabled, true) &&
      boolSetting(settings[`${prefix}_enabled`], false),
    period: typeof period === 'string' && PERIODS.includes(period) ? period : 'weekly',
    // The main list plus this report's own list (e.g. `inventory_recipients`).
    recipients: recipientsFor(settings, prefix),
    send_when_empty: shared.send_when_empty,
    timeZone: shared.timeZone,
  };
}

const INVENTORY_ITEMS = 50;

export function resolveInventorySettings(raw: SwellSettings | undefined | null): InventorySettings {
  const settings = settingsRecord(raw);
  return {
    ...common(raw, 'inventory'),
    low_stock_threshold: intSetting(settings.low_stock_threshold, 5, 0, 1000),
    // Every out-of-stock and low item is listed, up to this cap, so one report
    // stays small and inside the function time limit. The dashboard shows the
    // first 10 with "Show more"; the email lists 10. Past the cap, the count of
    // items not listed is stored as `items_hidden`.
    limit: INVENTORY_ITEMS,
  };
}

const TOP_CUSTOMERS = 10;

function topCustomersOn(settings: Record<string, any>): boolean {
  if (settings.top_customers_enabled !== undefined && settings.top_customers_enabled !== null) {
    return boolSetting(settings.top_customers_enabled, true);
  }
  // Before the switch there was a 0–5 slider, where 0 meant "leave customers out".
  return !(settings.top_customers_limit !== undefined && Number(settings.top_customers_limit) === 0);
}

export function resolveCustomerSettings(raw: SwellSettings | undefined | null): CustomerSettings {
  const settings = settingsRecord(raw);
  return {
    ...common(raw, 'customers'),
    // The top 10 are stored when "Include top customers" is on (the default).
    // The dashboard shows the first 5 with "Show more"; the email lists 5.
    // Off stores none, so no customer names or emails reach the report or email.
    top_customers_limit: topCustomersOn(settings) ? TOP_CUSTOMERS : 0,
  };
}

const DISCOUNT_LINES = 10;

export function resolveDiscountSettings(raw: SwellSettings | undefined | null): DiscountSettings {
  return {
    ...common(raw, 'discounts'),
    // The 10 largest coupons and promotions are stored, like the other top
    // lists. The dashboard shows the first 5 with "Show more"; the email lists
    // 5. Past 10, the count not listed is stored as `discounts_hidden`. (The old
    // "Coupons and promotions to list" slider is ignored.)
    limit: DISCOUNT_LINES,
  };
}

const PRODUCT_LINES = 10;

export function resolveProductSettings(raw: SwellSettings | undefined | null): ProductSettings {
  const settings = settingsRecord(raw);
  return {
    ...common(raw, 'products'),
    // Best sellers, slowest sellers and no-sales each store 10, like the other
    // top lists. The dashboard shows 5 of each with "Show more"; the email
    // lists 5. (The old "Products per list" slider is ignored.)
    limit: PRODUCT_LINES,
    include_unsold: boolSetting(settings.include_unsold_products, true),
  };
}

export type CartSettings = TypeSettings;

export function resolveCartSettings(raw: SwellSettings | undefined | null): CartSettings {
  return common(raw, 'carts');
}

export type SubscriptionSettings = TypeSettings;

export function resolveSubscriptionSettings(raw: SwellSettings | undefined | null): SubscriptionSettings {
  return common(raw, 'subscriptions');
}

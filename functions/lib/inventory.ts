/**
 * Inventory report: what is out of stock or running low, and how long the
 * remaining stock is likely to last at the recent rate of sale.
 *
 * Unlike the other reports this is a snapshot, not a window — stock has no
 * history to aggregate. The schedule decides how often the snapshot is taken;
 * the rate of sale always looks back over the last 30 days so "days of cover"
 * means the same thing whichever schedule is picked.
 */

import { formatPeriodLabel, revenueWhere, rollingWindow, round } from './report';
import { addDays, localDay, startOfLocalDay } from './time';
import type { InventorySettings } from './report-settings';
import { chunk, RECORD_ID, scan } from './scan';
import { plainText } from './text';

/** Days of sales used for the rate of sale. */
const VELOCITY_DAYS = 30;

/** Products read when listing stock-tracked products; 20 pages of 100. */
const PRODUCT_MAX_PAGES = 20;

/** Parent ids per variant lookup. */
const VARIANT_CHUNK = 100;

export interface StockItem {
  product_id: string;
  variant_id: string | null;
  name: string;
  sku: string | null;
  stock_level: number;
  status: 'out_of_stock' | 'low_stock';
  sold_30d: number;
  /** Whole days the stock lasts at the 30-day rate; null when nothing sold. */
  days_of_cover: number | null;
}

function key(productId: string, variantId?: string | null) {
  return `${productId}|${variantId ?? ''}`;
}

/** Units sold per product (and per variant) over the last 30 days. */
async function fetchUnitsSold(swell: SwellAPI, now: Date, timeZone: string) {
  // The last 30 whole days in the store's time zone, like every other window.
  const { start, end } = rollingWindow(VELOCITY_DAYS, now, timeZone);
  const sold = new Map<string, number>();

  const { truncated } = await scan(
    swell,
    '/orders',
    {
      where: revenueWhere(start, end),
      fields: 'items.product_id,items.variant_id,items.quantity',
    },
    (order) => {
      for (const item of order.items ?? []) {
        if (!item.product_id) {
          continue;
        }
        const quantity = Number(item.quantity) || 0;
        // Count against the variant and against the product, so a simple
        // product and a variant can both be looked up directly.
        for (const k of new Set([key(item.product_id, item.variant_id), key(item.product_id)])) {
          sold.set(k, (sold.get(k) ?? 0) + quantity);
        }
      }
    },
  );

  return { sold, truncated };
}

function classify(
  base: Omit<StockItem, 'status' | 'sold_30d' | 'days_of_cover'>,
  threshold: number,
  sold30d: number,
): StockItem | null {
  if (base.stock_level > threshold) {
    return null;
  }

  const perDay = sold30d / VELOCITY_DAYS;

  return {
    ...base,
    status: base.stock_level <= 0 ? 'out_of_stock' : 'low_stock',
    sold_30d: sold30d,
    days_of_cover:
      perDay > 0 ? Math.max(0, Math.floor(base.stock_level / perDay)) : null,
  };
}

export async function buildInventoryReport(
  swell: SwellAPI,
  settings: InventorySettings,
  now: Date = new Date(),
) {
  const threshold = settings.low_stock_threshold;

  // Every active, stock-tracked product. Simple products carry their own stock
  // level; products with variants are judged per variant below.
  const products: any[] = [];
  const productRead = scan(
    swell,
    '/products',
    {
      where: { active: true, stock_tracking: true },
      fields: 'id,name,sku,stock_level,variable',
      sort: 'name asc',
    },
    (product) => products.push(product),
    PRODUCT_MAX_PAGES,
  );

  const [{ truncated: productsTruncated }, { sold, truncated: salesTruncated }] =
    await Promise.all([productRead, fetchUnitsSold(swell, now, settings.timeZone)]);

  const items: StockItem[] = [];
  let trackedCount = 0;

  // Look variants up for every tracked product, rather than only those flagged
  // `variable`: products created through the API can have variants without the
  // flag set, and their stock lives on the variants, not the product.
  const byId = new Map<string, any>();
  for (const product of products) {
    if (product?.id && RECORD_ID.test(product.id)) {
      byId.set(product.id, product);
    }
  }

  const variantsByParent = new Map<string, any[]>();
  let variantsTruncated = false;

  for (const ids of chunk([...byId.keys()], VARIANT_CHUNK)) {
    const { truncated } = await scan(
      swell,
      '/products:variants',
      {
        // Archived variants are old option combinations Swell keeps (with
        // stock set to 0) for orders that used them; they aren't for sale.
        where: { parent_id: { $in: ids }, active: { $ne: false }, archived: { $ne: true } },
        fields: 'id,parent_id,name,sku,stock_level',
      },
      (variant) => {
        if (variant?.id && byId.has(variant.parent_id)) {
          const list = variantsByParent.get(variant.parent_id) ?? [];
          list.push(variant);
          variantsByParent.set(variant.parent_id, list);
        }
      },
      // Each chunk is bounded separately; keep the total well inside the timeout.
      5,
    );
    variantsTruncated ||= truncated;
  }

  for (const product of byId.values()) {
    const variants = variantsByParent.get(product.id);

    if (variants?.length) {
      for (const variant of variants) {
        trackedCount++;
        const item = classify(
          {
            product_id: product.id,
            variant_id: variant.id,
            name: plainText(
              variant.name
                ? `${product.name || 'Unnamed product'} — ${variant.name}`
                : product.name || 'Unnamed product',
            ),
            sku: plainText(variant.sku ?? product.sku) || null,
            stock_level: Number(variant.stock_level) || 0,
          },
          threshold,
          sold.get(key(product.id, variant.id)) ?? 0,
        );
        if (item) {
          items.push(item);
        }
      }
      continue;
    }

    trackedCount++;
    const item = classify(
      {
        product_id: product.id,
        variant_id: null,
        name: plainText(product.name) || 'Unnamed product',
        sku: plainText(product.sku) || null,
        stock_level: Number(product.stock_level) || 0,
      },
      threshold,
      sold.get(key(product.id)) ?? 0,
    );
    if (item) {
      items.push(item);
    }
  }

  // Out of stock first; then whatever will run out soonest; items with no
  // recent sales last, since they are not about to run out.
  items.sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'out_of_stock' ? -1 : 1;
    }
    const coverA = a.days_of_cover ?? Number.POSITIVE_INFINITY;
    const coverB = b.days_of_cover ?? Number.POSITIVE_INFINITY;
    return coverA - coverB || b.sold_30d - a.sold_30d || a.stock_level - b.stock_level;
  });

  const outOfStock = items.filter((item) => item.status === 'out_of_stock').length;
  // The snapshot is labelled with the store's own date.
  const day = localDay(now, settings.timeZone);
  const today = startOfLocalDay(day, settings.timeZone);
  const tomorrow = startOfLocalDay(addDays(day, 1), settings.timeZone);

  return {
    period_label: formatPeriodLabel(today, tomorrow, settings.timeZone),
    snapshot_at: now.toISOString(),
    low_stock_threshold: threshold,
    tracked_count: trackedCount,
    out_of_stock_count: outOfStock,
    low_stock_count: items.length - outOfStock,
    // Share of tracked SKUs that need attention, for a one-number headline.
    attention_pct: trackedCount ? round(((items.length) / trackedCount) * 100) : 0,
    items: items.slice(0, settings.limit),
    items_hidden: Math.max(0, items.length - settings.limit),
    truncated: productsTruncated || variantsTruncated || salesTruncated,
  };
}

/** Nothing to tell the merchant: no SKU is low or out. */
export function inventoryIsEmpty(report: { out_of_stock_count: number; low_stock_count: number }) {
  return report.out_of_stock_count + report.low_stock_count === 0;
}

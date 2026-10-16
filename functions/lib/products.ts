/**
 * Product report: best and slowest sellers, the biggest movers
 * against the previous period, and products that did not sell at all.
 */

import {
  fetchCurrency,
  formatPeriodLabel,
  percentChange,
  revenueWhere,
  round,
  type ReportWindow,
} from './report';
import type { ProductSettings } from './report-settings';
import { scan } from './scan';

interface ProductSales {
  product_id: string;
  name: string;
  quantity: number;
  revenue: number;
}

/** Products stored in the biggest-movers table (the dashboard and email show 5). */
const MOVERS_LIMIT = 10;

/** Line-item sales per product in a window; same basis as the sales report's top products. */
async function fetchProductSales(swell: SwellAPI, start: Date, end: Date) {
  const byProduct = new Map<string, ProductSales>();

  const { truncated } = await scan(
    swell,
    '/orders',
    {
      where: revenueWhere(start, end),
      fields: 'items.product_id,items.product_name,items.quantity,items.price_total',
    },
    (order) => {
      for (const item of order.items ?? []) {
        if (!item.product_id) {
          continue;
        }
        const entry = byProduct.get(item.product_id) ?? {
          product_id: item.product_id,
          name: item.product_name || 'Unknown product',
          quantity: 0,
          revenue: 0,
        };
        entry.quantity += Number(item.quantity) || 0;
        entry.revenue += Number(item.price_total) || 0;
        byProduct.set(item.product_id, entry);
      }
    },
  );

  for (const entry of byProduct.values()) {
    entry.revenue = round(entry.revenue);
  }

  return { byProduct, truncated };
}

/** Active products that existed before the window opened, so a launch is not "unsold". */
async function fetchEstablishedProducts(swell: SwellAPI, start: Date) {
  const products: { id: string; name: string }[] = [];

  const { truncated } = await scan(
    swell,
    '/products',
    {
      where: { active: true, date_created: { $lt: start.toISOString() } },
      fields: 'id,name',
      sort: 'date_created asc',
    },
    (product) => {
      if (product?.id) {
        products.push({ id: product.id, name: product.name || 'Unnamed product' });
      }
    },
    20,
  );

  return { products, truncated };
}

export async function buildProductReport(
  swell: SwellAPI,
  reportWindow: ReportWindow,
  settings: ProductSettings,
) {
  const { start, end, prevStart } = reportWindow;

  const [current, previous, established, currency] = await Promise.all([
    fetchProductSales(swell, start, end),
    fetchProductSales(swell, prevStart, start),
    settings.include_unsold
      ? fetchEstablishedProducts(swell, start)
      : Promise.resolve({ products: [] as { id: string; name: string }[], truncated: false }),
    fetchCurrency(swell, start, end),
  ]);

  const withChange = (entry: ProductSales) => {
    const prev = previous.byProduct.get(entry.product_id);
    return {
      ...entry,
      prev_quantity: prev?.quantity ?? 0,
      prev_revenue: prev?.revenue ?? 0,
      revenue_change_pct: percentChange(entry.revenue, prev?.revenue ?? 0),
    };
  };

  const sold = [...current.byProduct.values()].sort(
    (a, b) => b.revenue - a.revenue || b.quantity - a.quantity,
  );

  const top = sold.slice(0, settings.limit).map(withChange);

  // Slowest sellers: the bottom of the sold list, never repeating a top seller.
  const slow = sold
    .slice(settings.limit)
    .slice(-settings.limit)
    .reverse()
    .map(withChange);

  // Biggest movers by revenue change in either direction, including products
  // that sold last period and not at all this one.
  const ids = new Set([...current.byProduct.keys(), ...previous.byProduct.keys()]);
  const movers = [...ids]
    .map((id) => {
      const now = current.byProduct.get(id);
      const prev = previous.byProduct.get(id);
      return {
        product_id: id,
        name: now?.name ?? prev?.name ?? 'Unknown product',
        revenue: now?.revenue ?? 0,
        prev_revenue: prev?.revenue ?? 0,
        change: round((now?.revenue ?? 0) - (prev?.revenue ?? 0)),
        revenue_change_pct: percentChange(now?.revenue ?? 0, prev?.revenue ?? 0),
      };
    })
    .filter((entry) => entry.change !== 0)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, MOVERS_LIMIT);

  const unsold = established.products.filter((product) => !current.byProduct.has(product.id));

  const totalRevenue = round(sold.reduce((sum, entry) => sum + entry.revenue, 0));
  const topRevenue = round(top.reduce((sum, entry) => sum + entry.revenue, 0));

  return {
    period_label: formatPeriodLabel(start, end),
    period_start: start.toISOString(),
    period_end: end.toISOString(),
    currency,
    products_sold_count: sold.length,
    prev_products_sold_count: previous.byProduct.size,
    units_sold: sold.reduce((sum, entry) => sum + entry.quantity, 0),
    item_revenue: totalRevenue,
    // How concentrated sales are in the top of the range.
    top_share_pct: totalRevenue ? round((topRevenue / totalRevenue) * 100) : 0,
    top_products: top,
    slow_products: slow,
    movers,
    include_unsold: settings.include_unsold,
    unsold_count: unsold.length,
    unsold_products: unsold.slice(0, settings.limit).map((product) => ({
      product_id: product.id,
      name: product.name,
    })),
    // Products with no sales beyond the 10 listed, for the note under the table.
    unsold_hidden: Math.max(0, unsold.length - settings.limit),
    truncated: current.truncated || previous.truncated || established.truncated,
  };
}

export function productsIsEmpty(report: { products_sold_count: number }) {
  return report.products_sold_count === 0;
}

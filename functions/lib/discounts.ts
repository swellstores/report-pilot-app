/**
 * Discount report: how much was given away, through which coupons and
 * promotions, and how much revenue the discounted orders brought in.
 */

import {
  fetchCurrency,
  fetchTotals,
  formatPeriodLabel,
  percentChange,
  revenueWhere,
  round,
  type ReportWindow,
} from './report';
import type { DiscountSettings } from './report-settings';
import { chunk, RECORD_ID, scan } from './scan';
import { plainText } from './text';

interface DiscountLine {
  key: string;
  type: string;
  label: string;
  promotion_id: string | null;
  orders: number;
  discount: number;
  revenue: number;
}

/**
 * Orders in the window that carry any discount. `discount_total` covers line
 * items only; a shipping discount is recorded in `shipment_discount`.
 */
function discountedWhere(start: Date, end: Date) {
  return {
    ...revenueWhere(start, end),
    $or: [{ discount_total: { $gt: 0 } }, { shipment_discount: { $gt: 0 } }],
  };
}

async function fetchDiscountedTotals(swell: SwellAPI, start: Date, end: Date) {
  const response = await swell.get('/orders', {
    where: discountedWhere(start, end),
    group: {
      orders: { $sum: 1 },
      revenue: { $sum: 'grand_total' },
      discount: { $sum: 'discount_total' },
      shipping_discount: { $sum: 'shipment_discount' },
    },
  });
  const row = response?.results?.[0] ?? {};
  return {
    orders: Number(row.orders) || 0,
    revenue: round(row.revenue),
    // The total given away is line-item discounts plus shipping discounts.
    discount: round((Number(row.discount) || 0) + (Number(row.shipping_discount) || 0)),
  };
}

/**
 * Promotion names (needs `read_promotions`). Best effort: if the read fails,
 * the lines keep a generic label rather than failing the report.
 */
async function fetchPromotionNames(swell: SwellAPI, ids: string[]) {
  const names = new Map<string, string>();
  try {
    for (const batch of chunk(ids.filter((id) => RECORD_ID.test(id)), 100)) {
      const response = await swell.get('/promotions', {
        where: { id: { $in: batch } },
        fields: 'id,name',
        limit: batch.length,
      });
      for (const promotion of response?.results ?? []) {
        if (promotion?.id && promotion.name) {
          names.set(promotion.id, plainText(promotion.name));
        }
      }
    }
  } catch (error) {
    console.warn('Promotion names unavailable:', error instanceof Error ? error.message : error);
  }
  return names;
}

/**
 * Promotion discounts are recorded on the order as `promo-<promotion id>`.
 * Anything else that is not a coupon keeps its own id.
 */
function promotionIdOf(discount: any): string | null {
  const id = String(discount?.id ?? '');
  if (id.startsWith('promo-')) {
    return id.slice('promo-'.length);
  }
  return discount?.type === 'promo' && RECORD_ID.test(id) ? id : null;
}

export async function buildDiscountReport(
  swell: SwellAPI,
  reportWindow: ReportWindow,
  settings: DiscountSettings,
) {
  const { start, end, prevStart } = reportWindow;
  const lines = new Map<string, DiscountLine>();

  // Lines the current order has already been counted on: one coupon or
  // promotion can appear as several `discounts` entries on the same order, and
  // the order should count once (and its revenue once) on that line.
  let counted = new Set<string>();
  const add = (line: Omit<DiscountLine, 'orders' | 'discount' | 'revenue'>, amount: number, revenue: number) => {
    const entry = lines.get(line.key) ?? { ...line, orders: 0, discount: 0, revenue: 0 };
    if (!counted.has(line.key)) {
      counted.add(line.key);
      entry.orders += 1;
      entry.revenue += revenue;
    }
    entry.discount += amount;
    lines.set(line.key, entry);
  };

  const scanRead = scan(
    swell,
    '/orders',
    {
      where: discountedWhere(start, end),
      fields: 'coupon_code,discounts,discount_total,shipment_discount,grand_total',
    },
    (order) => {
      counted = new Set<string>();
      const revenue = Number(order.grand_total) || 0;
      const shippingDiscount = Number(order.shipment_discount) || 0;
      const total = (Number(order.discount_total) || 0) + shippingDiscount;
      let attributed = 0;

      for (const discount of order.discounts ?? []) {
        const amount = Number(discount?.amount) || 0;
        if (amount <= 0) {
          continue;
        }
        attributed += amount;

        const promotionId = promotionIdOf(discount);
        if (discount?.type === 'coupon' || (!promotionId && order.coupon_code && discount?.id === 'coupon')) {
          const code = plainText(order.coupon_code || discount?.id || 'coupon').toUpperCase();
          add({ key: `coupon:${code}`, type: 'coupon', label: code, promotion_id: null }, amount, revenue);
        } else if (promotionId) {
          add(
            { key: `promo:${promotionId}`, type: 'promotion', label: 'Promotion', promotion_id: promotionId },
            amount,
            revenue,
          );
        } else {
          const id = String(discount?.id || discount?.type || 'other');
          add({ key: `other:${id}`, type: 'other', label: plainText(discount?.name || id), promotion_id: null }, amount, revenue);
        }
      }

      // Whatever `discounts` doesn't account for is shown on its own lines so
      // the lines reconcile: a shipping discount not tied to a coupon or
      // promotion first, then discounts set on line items or by hand.
      let remainder = round(total - attributed);
      const shippingPart = round(Math.min(Math.max(remainder, 0), shippingDiscount));
      if (shippingPart > 0.01) {
        add(
          { key: 'other:shipping', type: 'other', label: 'Shipping discounts', promotion_id: null },
          shippingPart,
          revenue,
        );
        remainder = round(remainder - shippingPart);
      }
      if (remainder > 0.01) {
        add(
          { key: 'other:manual', type: 'other', label: 'Item-level or manual discounts', promotion_id: null },
          remainder,
          revenue,
        );
      }
    },
  );

  const [scanResult, discounted, prevDiscounted, totals, currency] = await Promise.all([
    scanRead,
    fetchDiscountedTotals(swell, start, end),
    fetchDiscountedTotals(swell, prevStart, start),
    fetchTotals(swell, start, end),
    fetchCurrency(swell, start, end),
  ]);

  const promotionIds = [...lines.values()]
    .map((line) => line.promotion_id)
    .filter((id): id is string => Boolean(id));
  const promotionNames = promotionIds.length
    ? await fetchPromotionNames(swell, promotionIds)
    : new Map<string, string>();

  const ranked = [...lines.values()]
    .map((line) => ({
      type: line.type,
      label:
        line.promotion_id && promotionNames.get(line.promotion_id)
          ? (promotionNames.get(line.promotion_id) as string)
          : line.label,
      orders: line.orders,
      discount: round(line.discount),
      revenue: round(line.revenue),
      average_discount: line.orders ? round(line.discount / line.orders) : 0,
    }))
    .sort((a, b) => b.discount - a.discount || b.orders - a.orders);

  const undiscountedOrders = totals.order_count - discounted.orders;
  const undiscountedRevenue = totals.grand_total - discounted.revenue;

  return {
    period_label: formatPeriodLabel(start, end, reportWindow.timeZone),
    period_start: start.toISOString(),
    period_end: end.toISOString(),
    currency,
    order_count: totals.order_count,
    grand_total: totals.grand_total,
    sub_total: totals.sub_total,
    discount_total: discounted.discount,
    discounted_order_count: discounted.orders,
    discounted_revenue: discounted.revenue,
    discounted_order_pct: totals.order_count
      ? round((discounted.orders / totals.order_count) * 100)
      : 0,
    // Discount as a share of what those orders would have cost undiscounted.
    discount_rate_pct: discounted.revenue + discounted.discount
      ? round((discounted.discount / (discounted.revenue + discounted.discount)) * 100)
      : 0,
    discounted_aov: discounted.orders ? round(discounted.revenue / discounted.orders) : 0,
    full_price_aov: undiscountedOrders > 0 ? round(undiscountedRevenue / undiscountedOrders) : 0,
    prev_discount_total: prevDiscounted.discount,
    discount_change_pct: percentChange(discounted.discount, prevDiscounted.discount),
    discounts: ranked.slice(0, settings.limit),
    discounts_hidden: Math.max(0, ranked.length - settings.limit),
    truncated: scanResult.truncated,
  };
}

export function discountsIsEmpty(report: { discounted_order_count: number }) {
  return report.discounted_order_count === 0;
}

/**
 * Abandoned cart report: carts abandoned in the period, how many of them came
 * back as orders, the value left behind, and the products most often left in
 * carts.
 *
 * How Swell records abandonment (checked against test carts):
 * - A new cart gets `date_abandoned` set 3 hours ahead. When that time passes
 *   without activity, Swell sets `abandoned: true` and `status: "abandoned"`.
 * - When a cart becomes an order, `status` becomes `"converted"`, `abandoned`
 *   goes back to `false`, `order_id` is set, and `date_abandoned` is kept.
 * So a converted cart counts as abandoned (and recovered) only when its order
 * came after its abandon time; a cart checked out before then never was.
 */

import { accountName, fetchAccounts } from './customers';
import { plainText } from './text';
import { fetchCurrency, formatPeriodLabel, isoDate, percentChange, round, type ReportWindow } from './report';
import { chunk, RECORD_ID, scan } from './scan';

/** Rows stored per table; the dashboard shows 5 with "Show more", the email 5. */
const LIST_LIMIT = 10;

interface CartRow {
  id: string;
  number: string;
  account_id: string | null;
  value: number;
  quantity: number;
  abandoned_at: string;
  order_id: string | null;
  items: { product_id: string; quantity: number; value: number }[];
}

interface OrderInfo {
  date_created: string;
  /** What the order was charged, less anything refunded on it so far. */
  grand_total: number;
  paid: boolean;
  canceled: boolean;
}

/** Orders by id, for whether and when a cart was turned into one. */
async function fetchOrders(swell: SwellAPI, ids: string[]) {
  const byId = new Map<string, OrderInfo>();
  for (const batch of chunk(ids.filter((id) => RECORD_ID.test(id)), 100)) {
    const response = await swell.get('/orders', {
      where: { id: { $in: batch } },
      fields: 'id,date_created,grand_total,refund_total,paid,canceled,status',
      limit: batch.length,
    });
    for (const order of response?.results ?? []) {
      byId.set(order.id, {
        date_created: order.date_created,
        grand_total: round((Number(order.grand_total) || 0) - (Number(order.refund_total) || 0)),
        paid: order.paid === true,
        canceled: order.canceled === true || order.status === 'canceled',
      });
    }
  }
  return byId;
}

/** Product names by id, for the products-left table. */
async function fetchProductNames(swell: SwellAPI, ids: string[]) {
  const byId = new Map<string, string>();
  for (const batch of chunk(ids.filter((id) => RECORD_ID.test(id)), 100)) {
    const response = await swell.get('/products', {
      where: { id: { $in: batch } },
      fields: 'id,name',
      limit: batch.length,
    });
    for (const product of response?.results ?? []) {
      byId.set(product.id, plainText(product.name) || 'Unnamed product');
    }
  }
  return byId;
}

/**
 * Carts whose abandon time falls in the window and that were really abandoned
 * (see the note at the top), with the order each one became, if any.
 */
async function fetchAbandoned(swell: SwellAPI, start: Date, end: Date) {
  const raw: any[] = [];
  const read = await scan(
    swell,
    '/carts',
    {
      where: {
        date_abandoned: { $gte: start.toISOString(), $lt: end.toISOString() },
        draft: { $ne: true },
      },
      fields: 'id,number,account_id,grand_total,item_quantity,status,abandoned,order_id,date_abandoned,items',
    },
    (cart) => raw.push(cart),
  );

  const orders = await fetchOrders(
    swell,
    raw.map((cart) => cart.order_id).filter((id): id is string => typeof id === 'string'),
  );

  const carts: (CartRow & { order: OrderInfo | null })[] = [];
  for (const cart of raw) {
    if (!(Number(cart.item_quantity) > 0)) {
      continue;
    }
    const order = cart.order_id ? orders.get(cart.order_id) ?? null : null;
    const markedAbandoned = cart.abandoned === true || cart.status === 'abandoned';
    const convertedAfter =
      order !== null && new Date(order.date_created).getTime() > new Date(cart.date_abandoned).getTime();
    if (!markedAbandoned && !convertedAfter) {
      continue;
    }

    carts.push({
      id: cart.id,
      number: String(cart.number ?? ''),
      account_id: typeof cart.account_id === 'string' ? cart.account_id : null,
      value: round(cart.grand_total),
      quantity: Number(cart.item_quantity) || 0,
      abandoned_at: cart.date_abandoned,
      order_id: convertedAfter ? cart.order_id : null,
      order: convertedAfter ? order : null,
      items: (Array.isArray(cart.items) ? cart.items : [])
        .filter((item: any) => typeof item?.product_id === 'string')
        .map((item: any) => ({
          product_id: item.product_id,
          quantity: Number(item.quantity) || 0,
          value: round(
            Number.isFinite(Number(item.price_total))
              ? Number(item.price_total)
              : (Number(item.price) || 0) * (Number(item.quantity) || 0),
          ),
        })),
    });
  }

  return { carts, truncated: read.truncated };
}

export async function buildCartReport(swell: SwellAPI, reportWindow: ReportWindow) {
  const { start, end, prevStart } = reportWindow;

  const [current, previous, currency] = await Promise.all([
    fetchAbandoned(swell, start, end),
    fetchAbandoned(swell, prevStart, start),
    fetchCurrency(swell, start, end),
  ]);
  const carts = current.carts;

  const abandonedCount = carts.length;
  const abandonedValue = round(carts.reduce((sum, cart) => sum + cart.value, 0));
  const recovered = carts.filter((cart) => cart.order && !cart.order.canceled);
  const recoveredRevenue = round(
    recovered.filter((cart) => cart.order?.paid).reduce((sum, cart) => sum + (cart.order?.grand_total ?? 0), 0),
  );
  const prevCount = previous.carts.length;

  // Largest carts first, with the customer's name.
  const ranked = [...carts].sort((a, b) => b.value - a.value || b.quantity - a.quantity);
  const listed = ranked.slice(0, LIST_LIMIT);
  const accounts = await fetchAccounts(
    swell,
    [...new Set(listed.map((cart) => cart.account_id).filter((id): id is string => Boolean(id)))],
  );

  // Products left behind, across every abandoned cart in the period.
  const byProduct = new Map<string, { carts: number; quantity: number; value: number }>();
  for (const cart of carts) {
    // A cart with two variants of one product counts once for that product.
    const counted = new Set<string>();
    for (const item of cart.items) {
      const entry = byProduct.get(item.product_id) ?? { carts: 0, quantity: 0, value: 0 };
      if (!counted.has(item.product_id)) {
        counted.add(item.product_id);
        entry.carts += 1;
      }
      entry.quantity += item.quantity;
      entry.value += item.value;
      byProduct.set(item.product_id, entry);
    }
  }
  const topProducts = [...byProduct.entries()]
    .sort(([, a], [, b]) => b.value - a.value || b.carts - a.carts)
    .slice(0, LIST_LIMIT);
  const names = await fetchProductNames(swell, topProducts.map(([id]) => id));

  return {
    period_label: formatPeriodLabel(start, end, reportWindow.timeZone),
    period_start: start.toISOString(),
    period_end: end.toISOString(),
    currency,
    abandoned_count: abandonedCount,
    prev_abandoned_count: prevCount,
    abandoned_change_pct: percentChange(abandonedCount, prevCount),
    abandoned_value: abandonedValue,
    average_cart_value: abandonedCount ? round(abandonedValue / abandonedCount) : 0,
    recovered_count: recovered.length,
    recovery_rate_pct: abandonedCount ? round((recovered.length / abandonedCount) * 100) : 0,
    recovered_revenue: recoveredRevenue,
    // Not recovered: never became an order, or its order was cancelled. Matches
    // the table's Open status, so Recovered + Still open = Abandoned.
    open_count: abandonedCount - recovered.length,
    abandoned_carts: listed.map((cart) => ({
      cart_id: cart.id,
      number: cart.number,
      account_id: cart.account_id,
      customer: cart.account_id ? accountName(accounts.get(cart.account_id), 'Unknown customer') : 'Guest',
      items: cart.quantity,
      value: cart.value,
      abandoned_date: isoDate(new Date(cart.abandoned_at), reportWindow.timeZone),
      status: cart.order && !cart.order.canceled ? 'recovered' : 'open',
    })),
    carts_hidden: Math.max(0, ranked.length - LIST_LIMIT),
    products_left: topProducts.map(([id, entry]) => ({
      product_id: id,
      name: names.get(id) ?? 'Unknown product',
      carts: entry.carts,
      quantity: entry.quantity,
      value: round(entry.value),
    })),
    truncated: current.truncated || previous.truncated,
  };
}

export function cartsIsEmpty(report: { abandoned_count: number }) {
  return report.abandoned_count === 0;
}

import { useEffect, useState } from 'preact/hooks';
import type { ComponentProps } from '@swell/apps-sdk/components';

export const config = {
  description: 'Read-only table of a report list, with every column shown',
};

/**
 * One column of the table, from the content field's `params.columns`.
 *
 * - `key`: the row field to show.
 * - `type`: `text` (default), `number`, `currency` (in the report's
 *   `currency`), `percent` (stored as 12.5 for 12.5%), `change` (a percent
 *   shown with ▲/▼), `date` (a `YYYY-MM-DD` day, shown like "Oct 2, 2026"),
 *   `link`, or `product_link`.
 * - `values`: for text columns, stored values to show differently, e.g.
 *   `{ "coupon": "Coupon" }`.
 * - `link`: shows the row's `key` (or `link_label`) as a link to the dashboard
 *   page in `href`, where `{field}` is filled from the row, e.g.
 *   `customers/{account_id}`. Until the dashboard address is known, or when a
 *   field in `href` is not a record id, the text shows without a link.
 * - `product_link`: "View product" pointing at the row's `product_id`.
 * - `empty`: shown when the value is missing (default "—").
 *
 * Table params: `columns`, `empty` (text when there are no rows),
 * `collapsed_rows` (show that many first, with "Show N more" for the rest),
 * `unlisted_key` + `unlisted_note` (a note when a record field counts rows not listed),
 * `currency`.
 */
interface Column {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'currency' | 'percent' | 'change' | 'date' | 'link' | 'product_link';
  values?: Record<string, string>;
  empty?: string;
  link_label?: string;
  href?: string;
}

type Row = Record<string, unknown>;

const APP_ID = 'report_pilot';

const STYLE = `
  .rt { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #171717; }
  .rt .box { background: #ffffff; border: 1px solid #e5e5e5; border-radius: 6px; overflow-x: auto; }
  .rt table { width: 100%; border-collapse: separate; border-spacing: 0; }
  .rt th { font-size: 12px; font-weight: 500; line-height: 19.2px; color: #171717; text-align: center; padding: 12px 16px; white-space: nowrap; }
  .rt td { line-height: 22.4px; text-align: center; padding: 16px; border-top: 1px solid #e5e5e5; }
  .rt th.left, .rt td.left { text-align: left; }
  .rt a { color: #171717; text-decoration: none; }
  .rt a:hover { text-decoration: underline; }
  .rt a.action { text-decoration: underline; white-space: nowrap; }
  .rt .muted { color: #a3a3a3; }
  .rt .up { color: #059669; }
  .rt .down { color: #dc2626; }
  .rt .empty { padding: 16px; color: #737373; }
  .rt .more { display: block; width: 100%; padding: 12px 16px; border: 0; border-top: 1px solid #e5e5e5; background: none; font: inherit; font-size: 14px; color: #171717; text-align: center; text-decoration: underline; cursor: pointer; }
  .rt .more:hover { background: #fafafa; }
  .rt .more:focus-visible { outline: 2px solid #d4d4d4; outline-offset: -2px; }
  .rt .note { padding: 12px 16px; border-top: 1px solid #e5e5e5; font-size: 13px; color: #737373; }
`;

export default function ReportTable({ value, params, context, locale, fetch }: ComponentProps<Row[] | null, { record?: Row }>) {
  const columns = readColumns(params.columns);
  const allRows = Array.isArray(value) ? value : [];
  // `params.collapsed_rows`: show that many first, with a link to show the rest.
  const collapsedRows = Number(params.collapsed_rows);
  const canCollapse = Number.isInteger(collapsedRows) && collapsedRows > 0 && allRows.length > collapsedRows;
  const [expanded, setExpanded] = useState(false);
  const rows = canCollapse && !expanded ? allRows.slice(0, collapsedRows) : allRows;
  const hiddenCount = allRows.length - collapsedRows;
  // `params.unlisted_key` names a record field counting rows the report could
  // not list; when above 0, `params.unlisted_note` is shown with {n} filled in.
  const unlistedKey = typeof params.unlisted_key === 'string' ? params.unlisted_key : null;
  const unlisted = unlistedKey ? Number(context?.record?.[unlistedKey]) : 0;
  const unlistedNote =
    Number.isFinite(unlisted) && unlisted > 0 && typeof params.unlisted_note === 'string'
      ? params.unlisted_note.replace('{n}', new Intl.NumberFormat(locale).format(unlisted))
      : null;
  const recordCurrency = context?.record?.currency;
  const currency =
    typeof params.currency === 'string'
      ? params.currency
      : typeof recordCurrency === 'string' && recordCurrency
        ? recordCurrency
        : 'USD';
  const needsLinks = columns.some((column) => column.type === 'product_link' || column.type === 'link');
  const admin = useDashboardPath(needsLinks, fetch);

  return (
    <div className="rt">
      <style>{STYLE}</style>
      {allRows.length === 0 ? (
        <div className="box">
          <div className="empty">{typeof params.empty === 'string' ? params.empty : 'Nothing to list.'}</div>
        </div>
      ) : (
        <div className="box">
        <table>
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={column.key} className={index === 0 ? 'left' : undefined} scope="col">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column, index) => (
                  <td key={column.key} className={index === 0 ? 'left' : undefined}>
                    {renderCell(row, column, { locale, currency, admin })}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {canCollapse && (
          <button type="button" className="more" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
            {expanded ? 'Show less' : `Show ${hiddenCount} more`}
          </button>
        )}
        {unlistedNote && <div className="note">{unlistedNote}</div>}
        </div>
      )}
    </div>
  );
}

function renderCell(row: Row, column: Column, env: { locale: string; currency: string; admin: string | null }) {
  const empty = <span className="muted">{column.empty ?? '—'}</span>;

  if (column.type === 'product_link') {
    const id = row.product_id;
    if (typeof id !== 'string' || !/^[0-9a-f]{24}$/i.test(id) || !env.admin) {
      return empty;
    }
    return (
      <a className="action" href={`${env.admin}/products/${id}`} target="_blank" rel="noopener noreferrer">
        {column.link_label ?? 'View product'}
      </a>
    );
  }

  const raw = row[column.key];

  if (column.type === 'link') {
    const text = column.link_label ?? (raw === null || raw === undefined || raw === '' ? null : String(raw));
    if (!text) {
      return empty;
    }
    const path = fillPath(column.href, row);
    if (!path || !env.admin) {
      return text;
    }
    return (
      <a href={`${env.admin}/${path}`} target="_blank" rel="noopener noreferrer">
        {text}
      </a>
    );
  }

  if (raw === null || raw === undefined || raw === '') {
    return empty;
  }

  if (column.type === 'date' && typeof raw === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
    if (match) {
      // A calendar day, not a moment: format it in UTC so no time zone shifts it.
      const day = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
      try {
        return new Intl.DateTimeFormat(env.locale, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(day);
      } catch {
        return raw;
      }
    }
    return raw;
  }

  if (column.type === 'percent' || column.type === 'change') {
    const number = Number(raw);
    if (!Number.isFinite(number)) {
      return empty;
    }
    let text: string;
    try {
      text = `${new Intl.NumberFormat(env.locale, { maximumFractionDigits: 2 }).format(Math.abs(number))}%`;
    } catch {
      text = `${Math.abs(number)}%`;
    }
    if (column.type === 'percent') {
      return number < 0 ? `-${text}` : text;
    }
    if (number === 0) {
      return <span className="muted">0%</span>;
    }
    return number > 0 ? <span className="up">▲ {text}</span> : <span className="down">▼ {text}</span>;
  }

  if (column.type === 'number' || column.type === 'currency') {
    const number = Number(raw);
    if (!Number.isFinite(number)) {
      return empty;
    }
    try {
      return column.type === 'currency'
        ? new Intl.NumberFormat(env.locale, { style: 'currency', currency: env.currency }).format(number)
        : new Intl.NumberFormat(env.locale).format(number);
    } catch {
      return String(number);
    }
  }

  const text = String(raw);
  return column.values?.[text] ?? text;
}

/** Fills `{field}` in a dashboard path from the row; only record ids are accepted. */
function fillPath(template: string | undefined, row: Row): string | null {
  if (!template) {
    return null;
  }
  let ok = true;
  const path = template.replace(/\{(\w+)\}/g, (_, field: string) => {
    const value = row[field];
    if (typeof value !== 'string' || !/^[0-9a-f]{24}$/i.test(value)) {
      ok = false;
      return '';
    }
    return value;
  });
  return ok ? path : null;
}

function readColumns(input: unknown): Column[] {
  if (!Array.isArray(input)) {
    return [];
  }
  return input.filter(
    (column): column is Column =>
      !!column && typeof column === 'object' && typeof column.key === 'string' && typeof column.label === 'string',
  );
}

/** Where links point: the test or live dashboard, from the app's backend. */
function useDashboardPath(enabled: boolean, fetch: typeof window.fetch): string | null {
  const [admin, setAdmin] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let cancelled = false;
    fetch(`/functions/${APP_ID}/dashboard-path`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && typeof data?.admin === 'string') {
          setAdmin(data.admin);
        }
      })
      .catch(() => {
        // Links stay hidden; the rest of the table still shows.
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, fetch]);

  return admin;
}

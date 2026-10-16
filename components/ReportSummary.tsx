import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import type { ComponentProps } from '@swell/apps-sdk/components';

export const config = {
  description: 'Read-only panel of a report’s headline figures',
};

/**
 * One figure, from the content field's `params.rows` (an array of rows, each an
 * array of figures). Values are read from the report record, not the field.
 *
 * - `key`: the record field to show.
 * - `type`: `number` (default), `percent` (stored as 37.5 for 37.5%),
 *   `change` (a percent shown with ▲/▼), `currency` (in the record's
 *   `currency`), `text` (shown as stored), or `yesno` (a true/false field
 *   shown as Yes or No).
 * - `hint`: shown when hovering, focusing or clicking the info icon next to the label.
 * - `tone`: `neutral` shows a `change` in grey instead of green or red, for a
 *   figure where a rise is not necessarily good news (e.g. discounts given).
 */
interface Figure {
  key: string;
  label: string;
  type?: 'number' | 'percent' | 'change' | 'currency' | 'text' | 'yesno';
  hint?: string;
  tone?: 'neutral';
}

type ReportRecord = Record<string, unknown>;

const STYLE = `
  .rs { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #171717; display: grid; gap: 12px; }
  .rs .row { display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); gap: 12px; }
  .rs .card { background: #ffffff; border: 1px solid #e5e5e5; border-radius: 6px; padding: 12px 14px; min-width: 0; }
  .rs .label { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; color: #737373; }
  .rs .card { position: relative; }
  .rs .hint { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border: 0; padding: 0; margin: 0; background: none; cursor: pointer; }
  .rs .hint:focus-visible { outline: 2px solid #d4d4d4; outline-offset: 1px; border-radius: 50%; }
  /* Like the dashboard's field help: hidden until the card is hovered, kept while open or focused. */
  .rs .hint { opacity: 0; }
  .rs .card:hover .hint, .rs .hint:focus-visible, .rs .hint[aria-expanded='true'] { opacity: 1; }
  .rs .hint svg { display: block; width: 18px; height: 18px; }
  html, body { margin: 0; overflow: hidden; }
  .rs .tip { position: fixed; z-index: 10; left: 0; top: 0; box-sizing: border-box; width: max-content; max-width: min(320px, calc(100vw - 8px)); padding: 12px; border: 1px solid #e5e5e5; border-radius: 8px; background: #ffffff; color: #171717; font-size: 14px; font-weight: 400; line-height: 20px; white-space: normal; text-align: start; pointer-events: none; box-shadow: 0 12px 16px -4px rgba(23, 23, 23, 0.08), 0 4px 6px -2px rgba(23, 23, 23, 0.03); }
  .rs .tip.measuring { visibility: hidden; }
  .rs .value { margin-top: 6px; font-size: 22px; font-weight: 600; font-variant-numeric: tabular-nums; }
  .rs .up { color: #059669; }
  .rs .down { color: #dc2626; }
  .rs .flat { color: #525252; }
  .rs .muted { color: #9ca3af; font-weight: 400; }
`;

export default function ReportSummary({ context, params, locale }: ComponentProps<unknown, { record?: ReportRecord }>) {
  const record = context?.record ?? {};
  const rows = readRows(params.rows);
  const currency = typeof record.currency === 'string' && record.currency ? record.currency : 'USD';

  return (
    <div className="rs">
      <style>{STYLE}</style>
      {rows.map((row, rowIndex) => (
        <div className="row" key={rowIndex} style={{ '--cols': String(Math.max(row.length, 1)) }}>
          {row.map((figure, colIndex) => (
            <div className="card" key={figure.key}>
              <div className="label">
                <span>{figure.label}</span>
                {figure.hint && <Hint text={figure.hint} />}
              </div>
              <div className="value">{renderValue(record[figure.key], figure, locale, currency)}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** The dashboard's own info icon (an outlined circle with an "i"). */
const INFO_ICON = (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
      stroke="#9DA4AE"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

/** Gap between the icon and the tooltip, and the closest it may come to the frame's edge. */
const GAP = 6;
const EDGE = 4;

/**
 * Where the tooltip goes, in the frame's own coordinates. The frame is only as
 * tall as the panel and clips anything outside it, so the tooltip opens below
 * the icon when it fits, above it when that fits, and otherwise beside it,
 * always kept inside the frame. It is `position: fixed`, so it never makes the
 * panel taller and no scrollbar appears.
 */
function placeTip(icon: DOMRect, tip: { width: number; height: number }) {
  const width = document.documentElement.clientWidth;
  const height = document.documentElement.clientHeight;
  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, Math.max(min, max)));
  const centeredLeft = clamp(icon.left + icon.width / 2 - tip.width / 2, EDGE, width - tip.width - EDGE);

  if (icon.bottom + GAP + tip.height <= height - EDGE) {
    return { left: centeredLeft, top: icon.bottom + GAP };
  }
  if (icon.top - GAP - tip.height >= EDGE) {
    return { left: centeredLeft, top: icon.top - GAP - tip.height };
  }
  const top = clamp(icon.top + icon.height / 2 - tip.height / 2, EDGE, height - tip.height - EDGE);
  const right = icon.right + GAP;
  if (right + tip.width <= width - EDGE) {
    return { left: right, top };
  }
  return { left: clamp(icon.left - GAP - tip.width, EDGE, width - tip.width - EDGE), top };
}

/** Styled like the dashboard's field help popover: white card, light border, soft shadow. */
function Hint({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const iconRef = useRef<HTMLButtonElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);

  // Measure the tooltip while hidden, then place it before the browser paints.
  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    if (iconRef.current && tipRef.current) {
      const tip = tipRef.current.getBoundingClientRect();
      setPosition(placeTip(iconRef.current.getBoundingClientRect(), { width: tip.width, height: tip.height }));
    }
  }, [open]);

  return (
    <button
      ref={iconRef}
      type="button"
      className="hint"
      aria-label={text}
      aria-expanded={open}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onClick={() => setOpen((value) => !value)}
    >
      {INFO_ICON}
      {open && (
        <span
          ref={tipRef}
          role="tooltip"
          className={position ? 'tip' : 'tip measuring'}
          style={position ? { left: `${position.left}px`, top: `${position.top}px` } : undefined}
        >
          {text}
        </span>
      )}
    </button>
  );
}

function renderValue(raw: unknown, figure: Figure, locale: string, currency: string) {
  const empty = <span className="muted">—</span>;
  if (raw === null || raw === undefined || raw === '') {
    return empty;
  }
  if (figure.type === 'text') {
    return String(raw);
  }
  if (figure.type === 'yesno') {
    return raw === true || raw === 'true' ? 'Yes' : 'No';
  }
  const number = Number(raw);
  if (!Number.isFinite(number)) {
    return empty;
  }

  const format = (value: number, options: Intl.NumberFormatOptions = {}) => {
    try {
      return new Intl.NumberFormat(locale, options).format(value);
    } catch {
      return String(value);
    }
  };

  switch (figure.type) {
    case 'currency':
      return format(number, { style: 'currency', currency });
    case 'percent':
      return `${format(number, { maximumFractionDigits: 2 })}%`;
    case 'change': {
      if (number === 0) {
        return <span className="muted">0%</span>;
      }
      const text = `${format(Math.abs(number), { maximumFractionDigits: 2 })}%`;
      if (figure.tone === 'neutral') {
        return <span className="flat">{number > 0 ? '▲' : '▼'} {text}</span>;
      }
      return number > 0 ? <span className="up">▲ {text}</span> : <span className="down">▼ {text}</span>;
    }
    default:
      return format(number);
  }
}

function readRows(input: unknown): Figure[][] {
  if (!Array.isArray(input)) {
    return [];
  }
  return input
    .map((row) =>
      Array.isArray(row)
        ? row.filter(
            (figure): figure is Figure =>
              !!figure && typeof figure === 'object' && typeof figure.key === 'string' && typeof figure.label === 'string',
          )
        : [],
    )
    .filter((row) => row.length > 0);
}

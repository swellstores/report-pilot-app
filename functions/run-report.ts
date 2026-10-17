import { buildReport, PERIODS, resolveSettings, resolveWindow, rollingWindow } from './lib/report';
import { generate, isEnabled, isReportType, REPORT_TYPES, startSend } from './lib/runner';

export const config: SwellConfig = {
  description: 'Preview or generate any report on demand',
  route: {
    methods: ['get', 'post'],
    public: false,
  },
  timeout: 10000,
};

/**
 * GET  — build the report and return it without sending anything.
 * POST — start the `send-report` workflow, which builds, saves and emails it
 *        (the same path as the schedule), and return straight away. Building
 *        inline could run past the 10-second limit on a busy store.
 *
 * Both accept `?period=daily|weekly|biweekly|monthly`. GET also accepts
 * `?days=N` for an arbitrary window, so a report can be sanity-checked before
 * trusting the schedule.
 *
 * `?type=inventory|customers|discounts|products|carts|subscriptions` runs one
 * of the other report types instead; without it the route runs the sales
 * report. `?days=N` applies to the sales report only.
 */

/** GET: build a report and return it, without saving or sending anything. */
async function preview(req: SwellRequest) {
  const { swell } = req;

  const type = req.query?.type ?? req.data?.type;
  if (type !== undefined && type !== 'sales') {
    return previewType(req, type);
  }

  const settings = resolveSettings(await swell.settings());
  const requested = (req.query?.period ?? req.data?.period) as string | undefined;
  const period = requested && PERIODS.includes(requested) ? requested : settings.period;

  // An explicit `days` always means a rolling window, even when the period is
  // `monthly` — an arbitrary day count has no calendar month to anchor to.
  const requestedDays = Math.trunc(Number(req.query?.days ?? req.data?.days));
  const reportWindow =
    Number.isFinite(requestedDays) && requestedDays >= 1
      ? rollingWindow(Math.min(730, requestedDays), new Date(), settings.timeZone)
      : resolveWindow(period, new Date(), settings.timeZone);

  const report = await buildReport(swell, reportWindow, settings);
  return { preview: true, period, ...report };
}

/** POST: honour the merchant's switch, then hand the report to the workflow. */
async function startFromRoute(req: SwellRequest, type: unknown) {
  const { swell } = req;

  if (!isReportType(type)) {
    return {
      error: 'unknown_type',
      message: `Unknown report type. Use one of: ${REPORT_TYPES.join(', ')}.`,
    };
  }

  // Previews always work; sending honours the merchant's switch for that
  // report, so the route can't do what the schedule has been told not to.
  if (!(await isEnabled(swell, type))) {
    return {
      skipped: 'disabled',
      message: `The ${type} report is switched off in app settings. Use GET to preview without sending.`,
    };
  }

  if (req.query?.days ?? req.data?.days) {
    return { error: 'days_preview_only', message: '`days` works with GET (preview) only. Use `period` to send.' };
  }

  const requested = (req.query?.period ?? req.data?.period) as string | undefined;
  if (requested !== undefined && !PERIODS.includes(requested)) {
    return { error: 'unknown_period', message: `Unknown period. Use one of: ${PERIODS.join(', ')}.` };
  }
  const period = requested;

  let run;
  try {
    run = await startSend(swell, { type, now: new Date().toISOString(), period, source: 'route' });
  } catch (error) {
    console.error(`run-report: could not start send-report for ${type}:`, error);
    return { error: 'not_started', message: error instanceof Error ? error.message : String(error) };
  }
  return {
    started: run?.id,
    type,
    period: period ?? 'from settings',
    message: 'Building, saving and emailing the report in the send-report workflow. See the app\'s Workflows tab.',
  };
}

async function previewType(req: SwellRequest, type: unknown) {
  if (!isReportType(type)) {
    return {
      error: 'unknown_type',
      message: `Unknown report type. Use one of: ${REPORT_TYPES.join(', ')}.`,
    };
  }

  const requested = (req.query?.period ?? req.data?.period) as string | undefined;
  const period = requested && PERIODS.includes(requested) ? requested : undefined;

  const result = await generate(req.swell, type, { period });
  const { report, ...meta } = result;
  return { ...meta, ...report };
}

export async function get(req: SwellRequest) {
  return preview(req);
}

export async function post(req: SwellRequest) {
  return startFromRoute(req, req.query?.type ?? req.data?.type ?? 'sales');
}

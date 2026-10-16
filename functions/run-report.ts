import {
  buildReport,
  PERIODS,
  resolveSettings,
  resolveWindow,
  rollingWindow,
  sendToExtraRecipients,
} from './lib/report';
import { generate, isEnabled, isReportType, REPORT_TYPES } from './lib/runner';

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
 * POST — build the report and save it, which sends the email.
 *
 * Both accept `?period=daily|weekly|biweekly|monthly`, or `?days=N` for an arbitrary
 * window, so a report can be sanity-checked before trusting the schedule.
 *
 * `?type=inventory|customers|discounts|products` runs one of the other report
 * types instead; without it the route behaves exactly as it always has and
 * runs the sales report. `?days=N` applies to the sales report only.
 */
async function handle(req: SwellRequest, save: boolean) {
  const { swell } = req;

  const type = req.query?.type ?? req.data?.type;
  if (type !== undefined && type !== 'sales') {
    return handleType(req, type, save);
  }

  const settings = resolveSettings(await swell.settings());

  // Previewing only reads, so it stays available whatever the settings say.
  // Saving is what sends the email, and `enabled` is the merchant's switch for
  // exactly that — honouring it here keeps the manual route from doing what the
  // schedule has been told not to.
  if (save && !settings.enabled) {
    return {
      skipped: 'disabled',
      message:
        'Sales reports are switched off in app settings. Use GET to preview without sending.',
    };
  }

  const requested = (req.query?.period ?? req.data?.period) as string | undefined;
  const period = requested && PERIODS.includes(requested) ? requested : settings.period;

  // An explicit `days` always means a rolling window, even when the period is
  // `monthly` — an arbitrary day count has no calendar month to anchor to.
  const requestedDays = Number(req.query?.days ?? req.data?.days);
  const reportWindow =
    Number.isFinite(requestedDays) && requestedDays > 0
      ? rollingWindow(Math.min(730, Math.trunc(requestedDays)), new Date(), settings.timeZone)
      : resolveWindow(period, new Date(), settings.timeZone);

  const report = await buildReport(swell, reportWindow, settings);

  if (!save) {
    return { preview: true, period, ...report };
  }

  const created = await swell.post('/reports', report);

  const copies =
    created?.id && settings.recipients.length > 0
      ? await sendToExtraRecipients(swell, created.id, settings.recipients)
      : { sent: 0, failed: 0, errors: [] as string[] };

  return {
    preview: false,
    period,
    report_id: created?.id,
    extra_recipients_sent: copies.sent,
    extra_recipients_failed: copies.failed,
    extra_recipient_errors: copies.errors,
    ...report,
  };
}

async function handleType(req: SwellRequest, type: unknown, save: boolean) {
  const { swell } = req;

  if (!isReportType(type)) {
    return {
      error: 'unknown_type',
      message: `Unknown report type. Use one of: ${REPORT_TYPES.join(', ')}.`,
    };
  }

  // Same rule as the sales report: previews always work, sending honours the
  // merchant's switch for that report.
  if (save && !(await isEnabled(swell, type))) {
    return {
      skipped: 'disabled',
      message: `The ${type} report is switched off in app settings. Use GET to preview without sending.`,
    };
  }

  const requested = (req.query?.period ?? req.data?.period) as string | undefined;
  const period = requested && PERIODS.includes(requested) ? requested : undefined;

  const result = await generate(swell, type, { save, period });
  const { report, ...meta } = result;
  return { ...meta, ...report };
}

export async function get(req: SwellRequest) {
  return handle(req, false);
}

export async function post(req: SwellRequest) {
  return handle(req, true);
}

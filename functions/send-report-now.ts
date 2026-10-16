import { generate, isReportType, reportLabel } from './lib/runner';

export const config: SwellConfig = {
  description: 'Generate a report and email it right away, from the app settings page',
  // Run by the "Send a report now" action declared in settings/report-config.json.
  action: true,
  timeout: 10000,
};

/**
 * The admin picked a report type in the action's modal. This sends it now, to
 * the recipients in the app settings, whether or not that report is switched on
 * or scheduled — the admin asked for
 * it explicitly — and even if the period had nothing in it.
 */
export default async function (req: SwellRequest) {
  const { swell } = req;
  const type = req.data?.report_type;

  if (!isReportType(type)) {
    return { message: 'Choose a report type to send.' };
  }

  const result = await generate(swell, type, { save: true, force: true });
  const label = reportLabel(type);

  if (!result.report_id) {
    return { message: `${label} could not be saved, so no email was sent.` };
  }

  const sent = result.extra_recipients_sent ?? 0;
  const failed = result.extra_recipients_failed ?? 0;
  const plural = (n: number) => `${n} recipient${n === 1 ? '' : 's'}`;

  if (!sent && !failed) {
    return {
      message: `${label} for ${result.report.period_label} saved. No recipients are set in the app settings, so no email was sent.`,
    };
  }

  return {
    message:
      `${label} for ${result.report.period_label} sent to ${plural(sent)}.` +
      (failed ? ` ${plural(failed)} could not be sent to.` : ''),
  };
}

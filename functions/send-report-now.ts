import { dashboardAdmin } from './lib/dashboard';
import { isReportType, recipientsFor, reportLabel, startSend } from './lib/runner';

export const config: SwellConfig = {
  description: 'Generate a report and email it right away, from the app settings page',
  // Run by the "Send a report now" action declared in settings/report-config.json.
  action: true,
  timeout: 10000,
};

/**
 * The admin picked a report type in the action's modal. This sends it now, to
 * the recipients in the app settings, whether or not that report is switched on
 * or scheduled — the admin asked for it explicitly — and even if the period had
 * nothing in it.
 *
 * The work happens in the `send-report` workflow, so this replies straight
 * away instead of making the admin wait (and possibly time out) while a large
 * store's report is built.
 */
export default async function (req: SwellRequest) {
  const { swell } = req;
  const type = req.data?.report_type;

  // A thrown SwellError keeps the dialog open with its message, so the admin
  // can try again; a returned message would close it as if it had worked.
  if (!isReportType(type)) {
    throw new SwellError('Choose a report type to send.', { status: 400 });
  }

  const label = reportLabel(type);
  let recipients: string[];

  try {
    recipients = await recipientsFor(swell, type);
    await startSend(swell, {
      type,
      now: new Date().toISOString(),
      force: true,
      source: 'action',
      dashboard: dashboardAdmin(req).admin ?? undefined,
    });
  } catch (error) {
    console.error(`${label}: could not start send-report:`, error);
    throw new SwellError(`${label} could not be started, so nothing was sent. Try again in a minute.`, {
      status: 503,
    });
  }

  const where = `It will be listed under Reporting → ${label}s.`;

  if (!recipients.length) {
    return {
      message: `Creating the ${label.toLowerCase()} now. No recipients are set in the app settings, so no email will be sent. ${where}`,
    };
  }

  const count = `${recipients.length} recipient${recipients.length === 1 ? '' : 's'}`;
  return {
    message: `Sending the ${label.toLowerCase()} to ${count}. It should arrive within a few minutes. ${where}`,
  };
}

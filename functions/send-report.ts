import {
  buildForSend,
  checkRecipientDelivery,
  createRecipientNotification,
  isReportType,
  isTemplateFor,
  notificationTemplate,
  reportLabel,
  reportSummary,
  saveForSend,
  type SendParams,
} from './lib/runner';
import { isEmailAddress, PERIODS } from './lib/report';
import { maskAddress } from './lib/text';
import { failOnRefusal } from './lib/refusals';

export const config: SwellConfig = {
  kind: 'workflow',
  description: 'Build, save and email one report, started by its schedule or by "Send a report now"',
};

/** How long Swell gets to render a notification before it's read back. */
const DELIVERY_CHECK = '5 seconds';

/**
 * Started by the seven report crons and the "Send a report now" action, which
 * return as soon as the run is created. Each step has its own time limit, and
 * a step that finished isn't run again if a later one fails, so nobody is
 * emailed twice. Saving and emailing are never retried themselves, because a
 * request that timed out may still have gone through.
 */
export default class SendReport {
  async run(req: SwellWorkflowRequest, step: SwellWorkflowStep) {
    const params = req.data as SendParams;
    const validPeriod = params?.period === undefined || PERIODS.includes(params.period);
    const validOnlyTo = params?.only_to === undefined || isEmailAddress(params.only_to);
    if (
      !isReportType(params?.type) ||
      typeof params.now !== 'string' ||
      !Number.isFinite(Date.parse(params.now)) ||
      !validPeriod ||
      !validOnlyTo
    ) {
      // Logged without the params themselves, which can hold an address.
      console.error(`send-report started without a valid report type, time, period or address (type ${String(params?.type)}).`);
      return { error: 'invalid_params' };
    }

    // The lib functions only use get, post and settings, which the workflow
    // API has too. A refused call throws, as it would in a function, instead
    // of quietly coming back as `{ errors }` and reading as an empty store.
    const swell = failOnRefusal(req.swell) as unknown as SwellAPI;
    const { type } = params;
    const label = reportLabel(type);

    // Read-only, so it's safe to retry.
    const built = await step.do(
      'build report',
      { retries: { limit: 2, delay: '15 seconds', backoff: 'exponential' }, timeout: '5 minutes' },
      () => buildForSend(swell, params),
    );
    const periodLabel = built.report.period_label;

    if (built.empty && !params.force && !built.send_when_empty) {
      console.log(`${label} skipped: nothing to report for ${periodLabel}.`);
      return { type, skipped: 'empty', period: periodLabel };
    }

    // Not retried: if a save timed out after Swell stored the record, a retry
    // would store the report twice.
    const reportId = await step.do(
      'save report',
      { retries: { limit: 0, delay: '1 second' }, timeout: '2 minutes' },
      () => saveForSend(swell, type, built.report),
    );

    if (!built.recipients.length) {
      console.log(`${label} saved for ${periodLabel} (${reportSummary(type, built.report)}). No recipients are set.`);
      return { type, report_id: reportId, period: periodLabel, sent: 0, failed: 0 };
    }

    // Looked up by the function that started this run: a workflow can't read
    // `/:models`. The short name is only a fallback for runs started without it.
    // Only this report's own notification is accepted.
    const template = isTemplateFor(type, params.template) ? params.template : notificationTemplate(type);

    // A step per address, never retried, so nobody is emailed twice. A failed
    // or timed-out address is recorded and the rest still go out.
    const created: { to: string; id: string }[] = [];
    const errors: string[] = [];
    for (const [index, to] of built.recipients.entries()) {
      let result: { id?: string; error?: string };
      try {
        result = await step.do(
          `email recipient ${index + 1}`,
          { retries: { limit: 0, delay: '1 second' }, timeout: '1 minute' },
          () => createRecipientNotification(swell, template, reportId, to),
        );
      } catch (error) {
        result = { error: error instanceof Error ? error.message : String(error) };
      }
      if (result.id) {
        created.push({ to, id: result.id });
      } else {
        errors.push(`${maskAddress(to)}: ${result.error}`);
      }
    }

    if (created.length) {
      await step.sleep('wait for delivery', DELIVERY_CHECK);
      errors.push(...(await step.do('check delivery', () => checkRecipientDelivery(swell, template, created))));
    }

    const sent = built.recipients.length - errors.length;
    console.log(
      `${label} created for ${periodLabel}: ${reportSummary(type, built.report)}. ` +
        `Sent to ${sent} recipient(s)` +
        (errors.length ? `, ${errors.length} failed: ${errors.join('; ')}` : '') +
        ` (${params.source}${params.only_to ? ', test to one address' : ''}).`,
    );

    return { type, report_id: reportId, period: periodLabel, sent, failed: errors.length, errors };
  }
}

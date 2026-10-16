import {
  buildReport,
  isDueToday,
  resolveSettings,
  resolveWindow,
  sendToExtraRecipients,
} from './lib/report';

export const config: SwellConfig = {
  description: 'Compute sales and revenue analytics and trigger the email report',
  // Runs daily; the configured period decides which days actually produce a
  // report, so changing the setting takes effect without redeploying.
  cron: {
    schedule: '0 8 * * *',
  },
  timeout: 10000,
};

export default async function (req: SwellRequest) {
  const { swell } = req;

  const settings = resolveSettings(await swell.settings());

  if (!settings.enabled) {
    console.log('Sales report skipped: disabled in app settings.');
    return { skipped: 'disabled' };
  }

  const now = new Date();

  if (!isDueToday(settings.period, now)) {
    console.log(`Sales report skipped: ${settings.period} report is not due today.`);
    return { skipped: 'not_due', period: settings.period };
  }

  const report = await buildReport(swell, resolveWindow(settings.period, now), settings);

  if (report.order_count === 0 && !settings.send_when_empty) {
    console.log(`Sales report skipped: no paid orders in ${report.period_label}.`);
    return { skipped: 'no_orders', period: report.period_label };
  }

  // Storing the record does not email anyone by itself; the recipients in the
  // app settings are mailed explicitly below.
  const created = await swell.post('/reports', report);

  const copies =
    created?.id && settings.recipients.length > 0
      ? await sendToExtraRecipients(swell, created.id, settings.recipients)
      : { sent: 0, failed: 0, errors: [] as string[] };

  console.log(
    `Sales report created for ${report.period_label}: ` +
      `${report.order_count} orders, ${report.grand_total} ${report.currency}.` +
      (copies.sent || copies.failed
        ? ` Copied to ${copies.sent} extra recipient(s), ${copies.failed} failed.`
        : ''),
  );

  return {
    report_id: created?.id,
    period: report.period_label,
    order_count: report.order_count,
    grand_total: report.grand_total,
    extra_recipients_sent: copies.sent,
    extra_recipients_failed: copies.failed,
  };
}

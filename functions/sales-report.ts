import { dashboardAdmin } from './lib/dashboard';
import { runScheduled } from './lib/runner';

export const config: SwellConfig = {
  description: 'Email the sales report on its schedule',
  // Runs hourly; only the store's 08:00 hour (app "Time zone" setting) can
  // send, and the configured period decides which days actually produce a
  // report, so changing the setting takes effect without redeploying.
  cron: {
    schedule: '0 * * * *',
  },
  timeout: 10000,
};

export default async function (req: SwellRequest) {
  return runScheduled(req.swell, 'sales', dashboardAdmin(req).admin ?? undefined);
}

import { dashboardAdmin } from './lib/dashboard';
import { runScheduled } from './lib/runner';

export const config: SwellConfig = {
  description: 'Email the customer report on its schedule',
  // Runs hourly; only the store's 08:00 hour (app "Time zone" setting) can
  // send, and the report's own period setting decides which days send.
  // Staggered a few minutes after the sales report so the runs do not overlap.
  cron: {
    schedule: '10 * * * *',
  },
  timeout: 10000,
};

export default async function (req: SwellRequest) {
  return runScheduled(req.swell, 'customers', dashboardAdmin(req).admin ?? undefined);
}

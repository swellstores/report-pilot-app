import { dashboardAdmin } from './lib/dashboard';
import { runScheduled } from './lib/runner';

export const config: SwellConfig = {
  description: 'Email the abandoned cart report on its schedule',
  // Runs hourly; only the store's 08:00 hour (app "Time zone" setting) can
  // send, and the report's own period setting decides which days send.
  // Staggered after the other reports so the runs do not overlap.
  cron: {
    schedule: '25 * * * *',
  },
  timeout: 10000,
};

export default async function (req: SwellRequest) {
  return runScheduled(req.swell, 'carts', dashboardAdmin(req).admin ?? undefined);
}

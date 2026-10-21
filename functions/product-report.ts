import { dashboardAdmin } from './lib/dashboard';
import { runScheduled } from './lib/runner';

export const config: SwellConfig = {
  description: 'Email the product report on its schedule',
  // Runs hourly; only the hour set in "Send at" (app "Time zone") can
  // send, and the report's own period setting decides which days send.
  // Staggered a few minutes after the sales report so the runs do not overlap.
  cron: {
    schedule: '20 * * * *',
  },
  timeout: 10000,
};

export default async function (req: SwellRequest) {
  return runScheduled(req.swell, 'products', dashboardAdmin(req).admin ?? undefined);
}

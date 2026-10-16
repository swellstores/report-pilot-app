import { runScheduled } from './lib/runner';

export const config: SwellConfig = {
  description: 'Email the out-of-stock and low-stock inventory report on its schedule',
  // Runs daily; the report's own period setting decides which days send.
  // Staggered a few minutes after the sales report so the runs do not overlap.
  cron: {
    schedule: '5 8 * * *',
  },
  timeout: 10000,
};

export default async function (req: SwellRequest) {
  return runScheduled(req.swell, 'inventory');
}

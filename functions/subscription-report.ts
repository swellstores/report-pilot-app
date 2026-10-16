import { runScheduled } from './lib/runner';

export const config: SwellConfig = {
  description: 'Email the subscription report on its schedule',
  // Runs daily; the report's own period setting decides which days send.
  // Staggered after the other reports so the runs do not overlap.
  cron: {
    schedule: '30 8 * * *',
  },
  timeout: 10000,
};

export default async function (req: SwellRequest) {
  return runScheduled(req.swell, 'subscriptions');
}

/**
 * Tells the report table component where the dashboard lives, so its
 * "View product" links open the right environment.
 *
 * The component runs in a frame on the app's own origin and cannot see the
 * dashboard's address (the admin sends no referrer to other origins), and the
 * test and live dashboards differ only by an `/admin/test` path. The function
 * knows from the app's public key, which contains `_test_` in the test
 * environment.
 */

import { dashboardAdmin } from './lib/dashboard';

export const config: SwellConfig = {
  description: 'Dashboard address for links in report tables',
  // No `public`: only this app's own admin components may call it.
  route: { methods: ['get'] },
};

export async function get(req: SwellRequest) {
  const caller = req.swellContext;
  if (!(caller?.surface === 'admin' && caller.storeUser)) {
    throw new SwellError('Admin component calls only', { status: 403 });
  }

  const dashboard = dashboardAdmin(req);
  console.log(`Dashboard links use the ${dashboard.environment} dashboard.`);
  return dashboard;
}

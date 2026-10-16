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

  const origin = dashboardOrigin(req);
  // The installed app's public key carries `_test_` in the test environment.
  const environment: 'test' | 'live' = /_test_/.test(req.publicKey ?? '') ? 'test' : 'live';
  console.log(`Dashboard links use the ${environment} dashboard.`);

  return {
    environment,
    admin: `${origin}/admin${environment === 'test' ? '/test' : ''}`,
  };
}

function dashboardOrigin(req: SwellRequest): string {
  for (const candidate of [req.store?.admin_url, req.store?.url]) {
    try {
      if (candidate) {
        return new URL(candidate).origin;
      }
    } catch {
      // Not a full URL; try the next one.
    }
  }
  return `https://${req.swellContext?.storeId ?? req.storeId}.swell.store`;
}

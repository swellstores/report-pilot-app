/**
 * The store's dashboard address, for links that open the right environment.
 * Links only ever go to the dashboard, never to the storefront.
 *
 * The test and live dashboards differ only by an `/admin/test` path, which the
 * app learns from its public key: it contains `_test_` in the test environment.
 * Workflows don't get the key, so the functions that start a send work this out
 * and pass it on. `admin` is null when the store's dashboard address is unknown;
 * links are then left out.
 */
export function dashboardAdmin(req: SwellRequest): { environment: 'test' | 'live'; admin: string | null } {
  const environment: 'test' | 'live' = /_test_/.test(req.publicKey ?? '') ? 'test' : 'live';
  const origin = dashboardOrigin(req);
  return { environment, admin: origin ? `${origin}/admin${environment === 'test' ? '/test' : ''}` : null };
}

function dashboardOrigin(req: SwellRequest): string | null {
  // Not the storefront address: on a custom domain it isn't the dashboard.
  const storeId = req.swellContext?.storeId ?? req.storeId;
  const candidates = [req.store?.admin_url, storeId ? `https://${storeId}.swell.store` : undefined];
  for (const candidate of candidates) {
    try {
      if (candidate) {
        return new URL(candidate).origin;
      }
    } catch {
      // Not a full URL; try the next one.
    }
  }
  return null;
}

/** Whether `value` is a dashboard address `dashboardAdmin` could have made. */
export function isDashboardAdmin(value: unknown): value is string {
  return typeof value === 'string' && /^https:\/\/[^/\s]+\/admin(\/test)?$/.test(value);
}

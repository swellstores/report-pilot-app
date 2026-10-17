/**
 * Text from the store (names, SKUs, codes) as plain text for reports: `<` and
 * `>` removed, so it can't carry a link or other HTML into an email whether or
 * not the template escapes it.
 */
export function plainText(value: unknown): string {
  return String(value ?? '').replace(/[<>]/g, '').trim();
}

/**
 * An email address with most of its local part hidden (`s***@swell.is`), for
 * logs and run results, which outlive the report and can be read by anyone
 * with access to the store's logs.
 */
export function maskAddress(address: string): string {
  const at = address.indexOf('@');
  if (at < 1) {
    return '***';
  }
  return `${address.slice(0, 1)}***${address.slice(at)}`;
}

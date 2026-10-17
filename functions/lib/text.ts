/**
 * Text from the store (names, SKUs, codes) as plain text for reports: `<` and
 * `>` removed, so it can't carry a link or other HTML into an email whether or
 * not the template escapes it.
 */
export function plainText(value: unknown): string {
  return String(value ?? '').replace(/[<>]/g, '').trim();
}

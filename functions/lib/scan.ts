/**
 * Bounded paging helpers shared by the report builders.
 *
 * Every read that has to walk records one page at a time goes through here, so
 * all of them stop at the same ceiling and report truncation the same way. A
 * report that hit the ceiling says so in the stored record and the email,
 * rather than only in logs a merchant never sees.
 */

/** Records per page for every paged read. */
export const PAGE_LIMIT = 100;

/** Pages read before stopping, so a single run stays inside the 10s timeout. */
export const MAX_PAGES = 25;

/**
 * Visit every record matching `query` on `url`, one page at a time.
 * Returns whether the ceiling was hit before the last page.
 */
export async function scan(
  swell: SwellAPI,
  url: string,
  query: Record<string, unknown>,
  visit: (record: any) => void,
  maxPages: number = MAX_PAGES,
): Promise<{ truncated: boolean; seen: number }> {
  let seen = 0;

  for (let page = 1; page <= maxPages; page++) {
    const response = await swell.get(url, { ...query, limit: PAGE_LIMIT, page });
    const results: any[] = response?.results ?? [];

    for (const record of results) {
      visit(record);
    }
    seen += results.length;

    if (results.length < PAGE_LIMIT) {
      return { truncated: false, seen };
    }
  }

  console.warn(`Read of ${url} truncated at ${maxPages * PAGE_LIMIT} records.`);
  return { truncated: true, seen };
}

/** Split a list into chunks, so `$in` lookups keep the query string a sane length. */
export function chunk<T>(values: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < values.length; i += size) {
    out.push(values.slice(i, i + size));
  }
  return out;
}

/** Ids that are safe to put in a `$in` list or a URL path. */
export const RECORD_ID = /^[0-9a-f]{24}$/i;

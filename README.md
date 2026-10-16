# Report Pilot

A Swell **admin app** that generates store reports on a schedule and emails
them to the recipients set in the app settings.

Alongside the original sales report it can send four more reports, each with its
own on/off switch and schedule — see [Report types](#report-types).

## How it works

```
cron (daily 08:00 UTC)
  └─ functions/sales-report.ts
       ├─ reads app settings                    → is it enabled? is a report due today?
       ├─ functions/lib/report.ts               → aggregates metrics via the Backend API
       └─ POST /reports                         → creates a record in the app's model
                                                     ↓
                                          reports.created event
                                                     ↓
                                    notifications/sales-report.tpl
                                                     ↓
                                          email to store admins
```

Creating the record is what sends the email — the notification is bound to the
`reports.created` event rather than being sent directly from the function. That
keeps every report auditable as a stored record, and lets merchants edit the
email copy in the dashboard without a redeploy.

## Metrics

Every window ends at midnight UTC — the top of today for daily and weekly, the
first of the current month for monthly — so a report never includes a partial day. Revenue counts orders that are **paid and not cancelled**
(`paid: true`, `status: { $ne: 'canceled' }` — note the API's American spelling).

| Metric | Notes |
| --- | --- |
| Revenue, subtotal, discounts, shipping, tax | Summed server-side |
| Orders, items sold, average order value | |
| New vs returning customers | "Returning" = had a paid order before the window opened. Counted per account, so guest orders (no `account_id`) fall out of both sides |
| Top products | Ranked by *line-item* revenue (sum of `price_total`), which excludes shipping and tax and is not reduced by order-level discounts — so this column is on a different basis from Revenue above and will not sum to it. Count configurable (0–20) |
| Daily breakdown | One row per day, zero-filled; skipped for windows over 31 days |
| Cancelled / unpaid orders | Reported separately, excluded from revenue |
| Change vs previous period | Compares against the equal-length window immediately before; `null` when that window had nothing to compare against |
| Currency | Taken from the most recent paid order in the window, defaulting to `USD` |

Most metrics are computed server-side, so the function transfers a few rows
instead of paging through every order — but by three different mechanisms, and
one of them is not bounded:

| Read | Mechanism | Rows returned |
| --- | --- | --- |
| Window + previous-window totals | `group` with `$sum` only | 1 |
| Cancelled / unpaid counts | `/orders/:count` | scalar |
| Currency | `/orders/:last` | 1 |
| Daily breakdown | `group` by Y/M/D | ≤ 31 |
| New vs returning split | `group` by `account_id`, paged | one per distinct customer |
Top products need line items, so that read pages through the window's paid
orders requesting only item fields, stopping at 25 pages of 100. Past 2,500
orders in a period the ranking is truncated and a warning is logged.

> **Multi-currency stores:** the totals sum `grand_total` without normalising
> currency, while the reported currency comes from a single order. On a store
> selling in more than one currency, treat the headline figures as approximate.

## Settings

Configured by the merchant in the dashboard under the app's settings page:

- **Send scheduled reports** — master on/off switch. Stops the scheduled run and
  stops `run-report` from sending; read-only previews still work
- **Reporting period** — `daily` (sends every morning, covers 24 hours), `weekly`
  (sends Mondays, covers 7 days), `monthly` (sends on the 1st, covers the whole
  preceding **calendar month**)
- **Additional recipients** — extra addresses copied on every report; store admins
  always receive it. Entries that are not shaped like an address are dropped
- **Top products to list** — 0–20
- **Include daily breakdown** — day-by-day table
- **Send even when there were no orders** — off by default, so quiet periods stay quiet

The cron runs every day and the period setting decides which days actually
produce a report, so changing the period takes effect without a redeploy.

## Report types

| Type | Cron function | Model (`/collection`) | Notification | Settings prefix |
| --- | --- | --- | --- | --- |
| Sales | `sales-report.ts` (08:00) | `reports` | `reports.sales-report` | *(original fields)* + `sales_enabled` |
| Inventory | `inventory-report.ts` (08:05) | `inventoryreports` | `inventoryreports.inventory-report` | `inventory_*`, `low_stock_threshold` |
| Customers | `customer-report.ts` (08:10) | `customerreports` | `customerreports.customer-report` | `customers_*`, `top_customers_limit` |
| Discounts | `discount-report.ts` (08:15) | `discountreports` | `discountreports.discount-report` | `discounts_*` |
| Product | `product-report.ts` (08:20) | `productreports` | `productreports.product-report` | `products_*`, `include_unsold_products` |

Every type follows the sales report's pattern: a daily cron decides from the
type's own period whether a report is due, the report is stored as a record in
the type's model, the model's `created` event mails the admins, and extra
recipients get explicit notification records. The shared machinery is
`functions/lib/runner.ts`; each type's aggregation lives in its own file under
`functions/lib/`. Each type has its own cron function rather than sharing one,
so each run gets its own 10-second budget.

**Model names have no separators.** The model schema derives a namespace from a
model file name by splitting on its first underscore (`my_custom_models.json` →
namespace `my`), so `inventory_reports` would not be a plain collection.
`inventoryreports` avoids that.

**Settings.** One settings file still configures everything. `enabled` is now a
master switch for all scheduled reports; each type also has its own
`<type>_enabled` toggle. The new types default to **off**, and `sales_enabled`
defaults to **on**, so a store that upgrades keeps receiving exactly what it did
before. Additional recipients and "send even when there is nothing to report"
apply to every type.

**Send a report now.** The settings page has a *Send a report now* action
(`functions/send-report-now.ts`, `action: true`). It asks which report to send,
then generates, stores and emails it immediately — regardless of that report's
toggle or schedule, and even if the period was empty, because the admin asked
for it explicitly.

What each new report contains:

- **Inventory** — a snapshot, not a window. Active, stock-tracked simple products
  and variants at or below the low-stock threshold, out of stock first, then by
  *days of cover* (current stock ÷ average daily units sold over the last 30
  days). The schedule decides only how often the snapshot is taken.
- **Customers** — distinct purchasing accounts, new versus returning (same rule
  as the sales report), repeat buyers (2+ paid orders in the period), average
  spend, and the top 5 customers by spend with their lifetime value. (Guest-
  checkout orders were also counted at first, then dropped: Swell flags any
  order placed while logged out as `guest`, so the figure was misleading.) (An earlier version also counted accounts created; it was
  dropped because it overlapped "new customers" and Swell's built-in reports.) Turning off *Include top customers* keeps
  customer names out of the email entirely.
- **Discounts** — total discounted, share of orders discounted, discount rate,
  average order with and without a discount, and a breakdown by coupon code and
  promotion. Promotion discounts are read from `discounts[].id` = `promo-<id>`;
  names come from `/promotions` best effort and fall back to "Promotion" if that
  read is refused. Any part of `discount_total` not itemised in `discounts` is
  shown as *Item-level or manual discounts*, so the lines reconcile.
- **Product** — best sellers with change vs the previous period,
  biggest movers either way, slowest sellers, and active products older than the
  period that sold nothing. Same line-item basis as the sales report's top
  products.

Every paged read in the new reports stops at 25 pages of 100 (`lib/scan.ts`).
When one hits that ceiling the record's `truncated` flag is set and the email
says the figures are partial.

## In the dashboard

The app adds a **Sales reports** link under **Reporting** in the left navigation
(`views[].nav.parent` accepts only `orders`, `products`, `subscriptions`,
`discounts`, `reporting`, `customers`, `content` — `reporting` is the Reports
section).

Each new report type adds its own link under **Reporting** too — *Inventory
reports*, *Customer reports*, *Discount reports*, *Product reports* — with the same
list-then-record layout.

- **List view** (sales) — one row per period, newest first: period, orders, revenue,
  average order value, change vs the previous period, new customers, items, and
  when it was generated. Tabs filter to periods *With sales* or *No sales*.
- **Record view** — the full summary for one period: headline revenue and order
  figures, a revenue breakdown, the previous-period comparison, orders excluded
  from revenue, top products, the daily table, and a trailing **Reporting window**
  group holding `period_start` and `period_end`.

Every field is `readonly`. These records are generated, and editing them by hand
would only desynchronise them from the orders they summarise. Note that
`readonly` is a dashboard-level gate — it does not block direct API writes.

`content/reports.json` declares the *UI* representation of each field (`text`,
`currency`, `number`, `percent`, `datetime`, `collection`, plus the `field_group`
and `field_row` wrappers that lay the record view out), while
`models/reports.json` declares its *storage* type (`string`, `currency`, `int`,
`float`, `date`, `array`).
Every one of the model's 23 fields appears in the content file, and the views
reference them by id alone. The content file additionally carries ids with no
storage counterpart: the two view ids (`list`, `edit`), the two tab ids
(`with_sales`, `no_sales`), the built-in `date_created`, and the sub-fields of
the `top_products` and `daily_totals` collections.

## App Store listing

The listing lives in `swell.json` rather than a separate file, so the copy
versions and ships with the app:

| Field | Purpose |
| --- | --- |
| `name`, `description` | Card title and one-line summary in the store grid |
| `full_description` | Long-form listing body; plain text, blank-line separated |
| `highlights[]` | Feature callouts, each `{ id, title, description }` |
| `use_cases[]` | Taxonomy tags — `direct_to_consumer`, `wholesale`, `digital_goods` |
| `price`, `price_external` | `0` and `false`: free, billed through Swell |

Assets are picked up from `assets/` by convention — nothing in the manifest
points at them:

| File | Shown as | Size |
| --- | --- | --- |
| `assets/icon.png` | The logo beside the app name on its card | 512×512 |
| `assets/image.png` | The card thumbnail, and the featured banner | 1600×1200 |

`swell app push` with no arguments uploads `swell.json` and both asset paths
alongside every app directory.

### Regenerating the assets

Both images are drawn by zero-dependency Node scripts rather than committed as
opaque binaries:

```bash
npm run assets          # or npm run icon / npm run cover individually
```

They share `scripts/lib/draw.js` — supersampled rendering and a minimal PNG
writer — and `scripts/lib/brand.js`, which holds the palette so the two assets
cannot drift apart. Drawing happens at 4× and box downsamples, averaging colour
over covered samples only so edges keep full-strength colour instead of
darkening toward black. Output is deterministic: regenerating reproduces the
committed files byte for byte, so a rebuild never surfaces as a spurious diff.

**Why the cover is composed the way it is.** The marketplace uses it twice, both
with `object-cover`. The grid card lays it out at a 4:3 aspect, uncropped. The
featured banner takes the full width at 385px tall, which crops to the vertical
middle of the image, then lays a bottom-up black gradient and the app name over
it. The card is the surface every app gets, so the chart is sized to fill that;
the banner then shows the middle of the same chart, with the bars bleeding off
the bottom behind the overlay. Both sit on near-black chrome, which is why the
background is a saturated indigo rather than anything pale. There is no text in
the image, because both surfaces render the app name themselves.

`scripts/` is not one of the *configuration* directories `swell app push`
recognises — `assets/`, `content/`, `frontend/`, `components/`, `functions/`,
`models/`, `notifications/`, `settings/`, `theme/`, `webhooks/` — so nothing in
it is interpreted as app config or deployed as a function.

It is still uploaded, though. `swell app push` sweeps every other file up as a
generic "App file", the same way it carries `package.json` and this README, so
the generators are stored alongside the app rather than shipped as part of it.
Do not read the directory list above as an upload filter; it only decides how a
file is interpreted.

## Files

```
swell.json                        app manifest, permissions, App Store listing
models/reports.json               the report record schema (storage types)
content/reports.json              dashboard nav, list view, record view (UI types)
assets/icon.png                   app icon, 512x512
models/{inventory,customer,discount,product}reports.json   new report schemas
content/{inventory,customer,discount,product}reports.json  their dashboard views
functions/sales-report.ts         cron entry point
functions/{inventory,customer,discount,product}-report.ts  cron entry points for the new types
functions/run-report.ts           on-demand HTTP route (get = preview, post = send; ?type=)
functions/send-report-now.ts      "Send a report now" settings action
functions/lib/report.ts           sales aggregation + shared helpers (bundled, not a function)
functions/lib/runner.ts           registry: generate/store/mail any report type
functions/lib/report-settings.ts  settings for the new types
functions/lib/{inventory,customers,discounts,products}.ts  per-type aggregation
functions/lib/scan.ts             bounded paging shared by the new reports
notifications/sales-report.json   notification config + sample data
notifications/sales-report.tpl    Liquid email template
notifications/{inventory,customer,discount,product}-report.{json,tpl}  emails for the new types
settings/report-config.json       merchant-facing settings UI
scripts/make-icon.js              regenerates assets/icon.png (dev tool, not app config)
scripts/make-cover.js             regenerates assets/image.png (dev tool, not app config)
scripts/lib/draw.js               shared supersampled renderer and PNG writer
scripts/lib/brand.js              the palette both assets share
```

## Known gaps

Found by auditing the docs against the code. Fixed items are recorded below the
open ones, since the reasoning still explains why the code looks the way it does.



**Top products still truncates past 2,500 orders.** The ranking reads at most 25
pages of 100. It is now *visible* — see Fixed — but the ranking itself is still
of a prefix of the window.

**Untested against a store with discounts or variants.** The new reports were
checked against a mock of the API and have not yet run against a store with many
discounted orders or variable products, so run each type with `?type=` previews (see
[Development](#development)) and sanity-check the figures before turning them on
for a merchant.

### Fixed

**Dashboard display fixes (v1.1.1).** Three issues found once v1.1.0 was live:

- *Page titles read "Inventoryreports".* The dashboard titles a list page with the
  model's `plural`, which the platform infers from the collection name when the
  model does not set one. Each model now sets `plural` ("Inventory reports", and
  "Sales reports" for the original, which had been showing as "Reports").
- *Date fields showed "—".* Every `date` field on these records reached the record
  view with no value, although the record holds it (checked against the API
  response). The title of each record already shows its period, so the
  *Reporting window* and *Snapshot* groups were removed from the record views
  rather than left showing a dash. The fields are still stored.
- *Item tables led with IDs.* The record view's collection tables show the first
  few sub-fields as columns, so the name now comes first and IDs last.

**Only the listed recipients are emailed.** Reports used to go to every store
admin automatically (the notifications had `"admin": true` and fired on each
report's `created` event), with the settings' addresses copied in addition. Each
notification now has a condition that never matches (`{"id": {"$exists": false}}`),
which stops the automatic send, and the app emails each address in the
**Recipients** setting explicitly. `"conditions": false` was tried first, but
Swell stored it as `{}`, which matches every record, so admins kept getting
every report. With no
recipients set, reports are still stored under Reporting but nobody is emailed.

**Grouped sections on record pages showed blanks (v1.1.2).** Once reports had
real orders in them, it turned out that *every* field inside a `field_group` on a
record view reaches the form with no value — not just dates. The "All orders"
figures on a discount report read "—" and "$0.00" while the stored record held
26 orders and $2,991.30. The original sales report's *Revenue breakdown*,
*Compared with the previous period* and *Excluded from revenue* groups had the
same problem; on live it went unnoticed because every figure there was zero.
Record views now use plain `field_row`s with no groups, and the period dates are
back as an ordinary row.

**Variant stock is judged even when a product is not flagged `variable`.**
Products created through the API can have variants without the flag, so the
inventory report now looks variants up for every tracked product and judges a
product per variant whenever it has any. The item status shows as "Out of stock"
or "Low stock" instead of the raw value.

**The top-products ranking says when it is partial.** It used to warn only in the
logs. The sales record now carries `top_products_truncated`, and the email adds
a line under the table when it is set.

**Guest checkouts are in the customer split.** This was listed as a gap, on the
assumption that guest orders have no `account_id`. On Swell they do — a guest
checkout carries `guest: true` *and* an `account_id` — so they were always
counted. The gap was a documentation error.

**A flat period no longer shows as a fall.** Liquid treats `0` as truthy, so a
0% change rendered as a red "▼ 0%". The templates now test for `nil`
explicitly, show "No change" for 0, and print falls as "▼ 12%" rather than
"▼ -12%". Array checks use the standard `.size` instead of `.length`.

**`npm run typecheck` works on Windows.** The script used POSIX shell syntax
(`[ ... ]`, `find`, `head`), which `cmd.exe` cannot run. It is now plain
`tsc --noEmit`, which covers `functions/` — the only TypeScript in the app.

**`run-report` no longer sends while reports are switched off.** The route used
to skip the `enabled` check that `functions/sales-report.ts` performs, so a POST
would generate *and email* from a store that had reports turned off. The send
path now honours the setting; GET previews still work regardless, since they read
without sending.

**The new/returning split is bounded.** Both reads grouped by `account_id` with
no `limit` and no paging, so each returned one row per distinct purchasing
customer and was silently truncated at the endpoint's default page size — and
because the second read filtered on `$in` built from the first, truncation also
shrank `returning` and inflated `new`. `fetchAccountIds` now pages in batches of
1,000 up to 20 pages, deduplicates into a set, and warns on truncation. The
prior-history lookup is chunked at 500 ids per request. The paging loop also
stops as soon as a page adds no new ids, so it stays correct if the endpoint
ignores `page` on a grouped read and replays the same rows.

**Monthly covers a calendar month.** `monthly` was a rolling 30 days fired on the
1st, so the Feb 1 report covered Jan 2–31 — Jan 1 appeared in no monthly report
at all — and after a 28-day February the Mar 1 window reached back into January
and counted those days twice. `buildReport` now takes a `ReportWindow` rather
than a day count, and `calendarMonthWindow` anchors on month boundaries. A
12-month sweep confirms consecutive windows abut exactly, with no gap and no
overlap. Monthly reports are labelled by name ("January 2026") instead of as a
date range, and `?days=N` on `run-report` still forces a rolling window, since an
arbitrary day count has no month to anchor to.

**Additional recipients are delivered.** The setting was parsed and then
discarded. `sendToExtraRecipients` now creates one notification record per
address via `POST /notifications`, where `to` overrides the configured contact —
which keeps `"admin": true` intact for the admin copy, since the deploy-time
notification config cannot read per-store app settings. Sends are attempted one
at a time and failures are logged and swallowed, so a single bad address cannot
take down a run whose report is already stored and whose admins are already
mailed. Addresses that are not shaped like an address are dropped at settings
resolution rather than failing later.

**Correction:** the short template id `<collection>.<file name>` (for example
`reports.sales-report`) is *not* correct for an app. The notification record is
created, but Swell adds `"error": "Notification template not found"` to it a
moment later and nothing is delivered — so recipient emails never arrived. An
app's notification is addressed as
`app_<app id>.apps_<app id>_<collection>.<file name>`, where the app id is the
installed app's record id (not its slug). `sendToExtraRecipients` now reads
that id from `app_id` on the collection's definition in `GET /:models`, and
checks each notification a few seconds after creating it, so a delivery error
is reported as a failure instead of "sent". `write_notifications` is still
required — see [Permissions](#permissions).

The notifications also set `"repeat": true`. Swell sends a notification once per
`(template, record)` unless `repeat` is set, which would let only the first of
several recipients receive a report.

**Testing emails:** send to addresses at `example.com`. Swell renders and logs
those notifications (check `/notifications?where[record_id]=<id>` for `error`)
but never delivers or counts them; a store that sends too many real emails,
test environment included, is deactivated.

**Pushing a change made only in `functions/lib/`:** Swell CLIs before 2.9.27
skip a function whose own file did not change, even when a file it imports did.
Update the CLI (`npm install -g @swell/cli@latest`) or push with `--force`.

**Settings were never read.** `swell.settings()` returns the whole settings
record, with this app's fields nested under its settings file name rather than
at the top level:

```json
{
  "report-config": { "enabled": true, "period": "weekly", "...": "..." },
  "id": "...",
  "date_created": "..."
}
```

`resolveSettings` read that record flat, so `enabled`, `period`,
`top_products_limit`, `recipients` and the rest were every one of them
`undefined` — and every one coerced cleanly to its default. The app ignored all
merchant configuration and always ran weekly, top 5, daily breakdown on, no
extra recipients, while looking perfectly healthy. Nothing ever errored, because
the defaults are exactly what a fresh install would have picked anyway.

That is what made it invisible, and it is why the recipients feature looked like
the bug when it was only a symptom. It shows up only by storing a non-default
value and watching it do nothing: with `period` saved as `monthly`, the function
still reported `weekly`. `resolveSettings` now unwraps the nested object and
falls back to the flat record. Note that `swell.settings('report-config')` is
not the alternative — it throws `Setting configuration not found`.

## Development

```bash
npm install
npm run typecheck       # tsc --noEmit across functions, test, frontend
npm run assets          # regenerate assets/icon.png and assets/image.png
swell app push          # sync to the test environment
swell app watch         # auto-sync on change
```

> **Gotcha:** `functions/lib/report.ts` is bundled into the two entry-point
> functions at compile time. Pushing only the lib file updates the stored file
> but leaves the deployed bundles running the previous version — the change
> appears to deploy cleanly and silently does nothing. After editing anything
> under `lib/`, re-push the entry points too:
>
> ```bash
> swell app push functions/run-report.ts
> swell app push functions/sales-report.ts
> swell app push functions/send-report-now.ts
> swell app push functions/inventory-report.ts
> swell app push functions/customer-report.ts
> swell app push functions/discount-report.ts
> swell app push functions/product-report.ts
> ```
>
> A plain `swell app push` with no arguments pushes everything, which is
> simplest after a change to `lib/`.

Preview a report without sending anything:

```bash
swell api get '/functions/report_pilot/run-report'
```

Override the window — `?period=daily|weekly|monthly`, or `?days=N` for anything
else (capped at 730):

```bash
swell api get '/functions/report_pilot/run-report?days=90'
```

Preview one of the other report types — `inventory`, `customers`,
`discounts` or `products` (`?period=` works too; `?days=` is sales-only):

```bash
swell api get '/functions/report_pilot/run-report?type=inventory'
```

Generate a report **and send the email**:

```bash
swell api post '/functions/report_pilot/run-report'
```

Inspect what is deployed:

```bash
swell inspect functions --app .
```

Tail logs:

```bash
swell logs -f --app report_pilot
```

> **Logs may be unavailable in test.** On this account `swell logs` refuses the
> test environment with `Error: Environment 'test' not allowed`, with or without
> `--app`, `--type` and `-s`. Anything a function only reports via `console.log`
> or `console.error` is therefore invisible there. When a swallowed failure has
> to be diagnosed, return the reason in the HTTP response instead — which is why
> `run-report` reports `extra_recipient_errors` rather than only logging them.

## Permissions

`read_orders`, `read_products`, `read_accounts`, `read_settings`,
`write_notifications`.

`read_products` and `read_accounts` are now exercised: the inventory and product
performance reports read `/products` and `/products:variants`, and the customer
report reads `/accounts`. (Before those reports existed both scopes were
declared but unused.)

The discount report also tries `/promotions` for promotion names. No scope is
declared for it; if the read is refused, the report labels those lines
"Promotion" and carries on.

`write_notifications` **is** load-bearing: without it the app's scoped token
cannot `POST /notifications`, and extra recipients silently receive nothing.
A non-empty `permissions` array restricts access, so the scope has to be named
explicitly even though the same call succeeds with store credentials.

> **Changing `permissions` needs the functions re-pushed.** Pushing `swell.json`
> alone updates the manifest but leaves the running functions on their old
> token, so the new scope appears to have no effect — an identical call keeps
> failing for no visible reason. Push the entry points again afterwards.

The app writes only to its own report models (`reports` and the four new ones), which needs no declared
permission. Note that inside a function the app's own model is addressed as
`/reports` — the fully-qualified `/apps/report_pilot/reports` path is reachable
with store credentials but denied to the app's own scoped token.

## Renamed from Sales Report

The app was renamed **Report Pilot** (ID `report_pilot`, previously
`sales_report`) while it was installed only in the test environment. Model,
notification and function file names are unchanged; "Sales report" still names
the sales report type itself.

## Releasing

Installed in **test** and **live** (v1.0.2). To ship a change:

```bash
swell app push                                    # sync to test
swell app version patch -m "what changed" -y
swell app install -e live -v <version> -s <store-id>
```

`swell app version` also runs git. This directory is not a git repo, so that step
fails — the version is still created server-side, because the git work happens
after `createRemoteVersion`.

`--no-git-tag` does **not** avoid the error, despite reading like it should. In
the CLI the sequence is `createRemoteVersion` → `gitCommit` → `if (!noGitTag)
gitTag`: the flag guards only the tag, while the commit runs unconditionally and
is what fails here. Run `git init` to make it quiet.

## Report table component

The inventory report's **Items** field is drawn by an app component,
`components/ReportTable.tsx`, instead of a built-in collection table. A
collection table shows only its first three sub-fields as columns; the
component shows every column, centred, with a "View product" link per row. It
is read-only and takes its columns from the field's `params.columns` in
`content/inventoryreports.json` (`type`: `text`, `number`, `currency` or
`product_link`), so other report tables can reuse it.

Links need the dashboard's address, which a component frame cannot see (the
admin sends no referrer to other origins, and test and live differ only by
`/admin/test`). The component asks `functions/dashboard-path.ts`, a route only
the app's own admin components can call, which reads the environment from the
app's model definition.

Components need `@swell/cli` 2.9.27 or later and `npm install` for `preact` and
`@swell/apps-sdk` (types only). `npm run typecheck` checks functions and
components.

**`read_:models` permission.** Emailing recipients needs the app's record id
(see the notification template correction above), read from `GET /:models`.
That path is not among those an app may read without a scope, so the call was
refused, the short template name was used, and every recipient email failed
with "Notification template not found" (seen on the Oct 12 scheduled run).
`swell.json` now declares `read_:models`. The dashboard links no longer use
`/:models`: `dashboard-path` reads the environment from `req.publicKey`, which
contains `_test_` in the test environment.

## Report summary component

The customer report's headline figures (customers, new and returning, repeat
buyers, rates, average spend) are drawn by `components/ReportSummary.tsx` as a
panel of cards instead of three rows of read-only inputs. The panel reads the
figures from the report record (`context.record`); its rows and figures come
from `params.rows` in `content/customerreports.json`, with each figure's hint
shown on its ⓘ. Types: `number`, `percent`, `change` (▲/▼) and `currency`.

A component field must match a model field, so `models/customerreports.json`
declares a display-only `summary` field. Nothing writes to it; the figures stay
in their own fields, which the list view, emails and API still use.

**Light mode only.** Both components are styled for the dashboard's light theme,
the default. A component cannot see the dashboard's Light/Dark/Match system
choice (it is kept in the browser's `localStorage` as `swell-theme`, on the
admin's origin), so following the computer's setting showed dark tables on a
light dashboard. Supporting dark mode needs the dashboard to pass its theme to
components; see the "Pass the dashboard theme to app components" proposal.

The customer report's **Top customers** uses the same `ReportTable`
component: Customer (a `link` column to `customers/{account_id}`), Orders,
Amount, Lifetime amount and Lifetime orders. Amounts use the report's own
`currency` unless the field's `params.currency` sets one.

The **Sales report** uses both components too: `ReportSummary` for its 18
headline figures (in the same five groups as before), and `ReportTable` for Top
products (Product, Quantity, Revenue, View product) and the Daily breakdown
(Date, Orders, Revenue; `date` columns show `YYYY-MM-DD` as "Oct 2, 2026").
`models/reports.json` declares the display-only `summary` field.

The **Discount** and **Product** reports use the same components.
Discount: the 13 headline figures in a panel, and Coupons and promotions as a
table (type shown as Coupon, Promotion or Other). Product: 8
figures, then Best sellers, Biggest movers, Slowest sellers and No sales as
tables, each with a View product link; revenue changes show ▲/▼ (`change`
columns). Both models declare the display-only `summary` field.

**Top customers: 10 stored, 5 shown.** The "Top customers to list" slider is
replaced by an "Include top customers" switch (`top_customers_enabled`, on by
default). On stores the top 10; off stores none, so no customer names or emails
reach the report or email. A store whose old slider was 0 stays off until the
switch is saved. The report page shows the first 5 with a "Show 5 more" link
(`collapsed_rows` in the table's params); the email lists the first 5
(`limit: 5` in `customer-report.tpl`). Reports made before this change hold at
most 5.

**Top products (sales report): 10 stored, 5 shown.** The "Top products to list"
slider is replaced by an "Include top products" switch (`top_products_enabled`,
on by default). On stores the top 10; off stores none. A store whose old slider
was 0 stays off until the switch is saved. The report page shows 5 with "Show 5
more"; the email lists the first 5 (`limit: 5` in `sales-report.tpl`).

**Inventory: all low and out-of-stock items, up to 50.** The "Items to list"
slider is removed. Each snapshot lists every out-of-stock and low item, up to a
fixed 50 (`INVENTORY_ITEMS` in `report-settings.ts`), out of stock first; past
50 the count not listed is kept in `items_hidden` and shown as a note under the
table and in the email. The report page shows the first 10 with "Show N more";
the email lists 10 and says how many more are on the report.

**Every 2 weeks.** Each report's period (and the inventory snapshot's "How
often") offers `biweekly`: the last 14 full days, compared with the 14 before.
It runs on alternate Mondays at the usual time, fixed from Monday Jan 5, 1970
UTC (`isBiweeklyMonday` in `report.ts`) so the schedule never depends on when
the app was installed: Oct 26, Nov 9, Nov 23 2026, and so on.

**Emails match the report pages.** Each email is laid out from its report's
dashboard view (`content/*.json`): the same sections in the same order, the
Summary as cards with the same figures and labels, and each table with the same
title, columns and formatting (▲/▼ changes, `Oct 2, 2026` dates), styled like
the dashboard's tables. Differences, because email can't do what the page does:
- no "View product" or customer links (the email doesn't know the dashboard
  address);
- no Currency or Partial cards (amounts show their currency, and partial data
  has its own note);
- rows of four cards are split into two rows of two, so amounts fit 600px; on
  phones cards stack one per row;
- where the page has "Show N more", the email lists the same first rows and
  says how many more are on the report; lists that are empty (or turned off)
  are left out, except Inventory's, whose empty text is the good news;
- dates are formatted from their `YYYY-MM-DD` text, so the store's time zone
  can't shift the day.
The tables now show what the page shows, so the customer email no longer lists
email addresses or the "New" badge, and the sales email's "Not counted above"
note is now the Cancelled and Unpaid cards. When a report view's summary or
columns change, change the email to match.

**Discount summary regrouped.** The discount report's Summary (page and email)
is four rows, each reading total → part → ratio: Discounts given · Previous
period discounts · Discount change; Orders · Discounted orders · Discounted
orders %; Revenue · Discounted order revenue · Discount rate; Discounted average
order · Full-price average order. Currency and Subtotal were removed (amounts
show their currency; Subtotal said nothing about discounts). Discount change has
`"tone": "neutral"` (a ReportSummary figure option, also honoured by the email):
its ▲/▼ is grey, because giving more discounts isn't necessarily good news. With
three boxes or fewer per row, the email now uses the same rows as the page.

**Coupons and promotions: 10 stored, 5 shown.** The "Coupons and promotions to
list" slider (`discount_codes_limit`, 1–25) is removed; each discount report
stores the 10 largest (`DISCOUNT_LINES` in `report-settings.ts`), like Top
products and Top customers. The report page shows 5 with "Show 5 more"
(`collapsed_rows`); the email lists 5 and says how many more are on the report.
Past 10, the count not listed is kept in `discounts_hidden` and shown as a note
under the table on the page and in the email. A store whose slider was saved
lower than 10 now gets 10; one saved higher gets 10 and the note. Reports made
before this change keep however many they stored.

**Product report reworked.** Summary is two rows of three: Products sold ·
Previous period products sold · Products with no sales; Units sold · Item
revenue · Best sellers' share (was "Top products' share"). Currency and Partial
were removed; when a report is partial, a note shows under Best sellers instead
(`unlisted_key: "truncated"` on that table; the email keeps its own warning).
Every list stores 10 and shows 5 with "Show 5 more"; the email lists 5. The
"Products per list" slider (`product_rank_limit`, 1–25) is removed
(`PRODUCT_LINES` in `report-settings.ts`); Biggest movers goes from 5 to 10
(`MOVERS_LIMIT` in `products.ts`). No sales stores `unsold_hidden`, the count
beyond the 10 listed, shown as a note on the page and in the email. Columns:
Best and Slowest sellers are Product · Quantity · Revenue · Previous revenue ·
Revenue change (Previous quantity dropped, though still stored); Biggest movers
is Product · Previous revenue · Revenue · Change · Change %. Reports made before
this change keep the lists they stored.

**Sales summary regrouped.** Six rows, each comparison next to what it compares:
Revenue · Previous revenue · Revenue change; Orders · Previous orders · Order
change; Average order value · Items sold; New customers · Returning customers;
Subtotal · Discounts · Shipping · Tax (they build up Revenue; the email shows them
as two rows of two); Cancelled orders · Unpaid orders. Currency was removed. Top
products now shows the partial-ranking note on the page too
(`unlisted_key: "top_products_truncated"`; the email keeps its own note). The
daily breakdown shows 7 days with "Show N more" (`collapsed_rows: 7`), so weekly
reports show every day and longer ones start with a week; the email lists 7 and
says how many more are on the report. Its empty text now just says the breakdown
is turned off (every period, up to 31 days, is covered).

**Per-report recipients.** Each report's tab in settings has an "Also send this
report to" list (`sales_recipients`, `customers_recipients`,
`inventory_recipients`, `products_recipients`, `discounts_recipients`). The main
Recipients list still gets every report that is switched on; a report's own list
gets that report only, in addition (`recipientsFor` in `report.ts` merges the
two, drops anything that isn't an address, and sends to an address on both
lists once, matching case-insensitively). A report that is switched off goes to
nobody. "Send a report now" and the run-report route use the same merged list.
Stores with no per-report lists behave exactly as before.

## Abandoned cart and subscription reports

Two more report types, built like the others: their own model, dashboard view
(summary + tables), notification and email, settings tab (switch, period,
"Also send this report to") and daily cron. Both are off until switched on.
They need `read_carts` and `read_subscriptions` (added to `swell.json`), so
stores that already have the app are asked to approve the new access.

**Abandoned carts** (`carts`, `functions/lib/carts.ts`, cron 08:25). Swell gives
a new cart `date_abandoned` 3 hours ahead and marks it `abandoned` /
`status: "abandoned"` when that passes; converting it sets `status: "converted"`,
`order_id`, `abandoned: false` and keeps `date_abandoned`. A cart counts when its
`date_abandoned` is in the period and it was really abandoned: marked so, or
turned into an order only after its abandon time (a cart checked out before then
never was). Empty and draft carts are skipped. Recovered = became an order
(not canceled); recovered revenue = those orders that are paid. Swell's own
`recovered` flag isn't used: it wasn't set when a cart was converted to an order
through the API, likely because it is set only when a customer returns through
the abandoned-cart email. Tables: the 10 largest carts (customer, items, value,
abandoned date, Recovered/Open) and the 10 products with the most value left.

**Subscriptions** (`subscriptions`, `functions/lib/subscriptions.ts`, cron 08:30).
Active (`status: "active"`), on trial, paused and past due (`pastdue`/`unpaid`)
describe the store when the report runs; new (`date_created`), canceled
(`date_canceled`) and paused (`date_paused`) count the period, each against the
previous period. Monthly recurring revenue sums active subscriptions'
`recurring_total`, converted to a month from `interval`/`interval_count`
(daily, weekly, monthly, yearly). Renewals and trials ending look 7 days past the
period. Tables: running subscriptions by plan, canceled in the period, failed
renewals (10 each, 5 shown). Abandoned carts and canceled subscriptions rising is
not good news, so those change figures use `tone: "neutral"`.

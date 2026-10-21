# Report Pilot

Report Pilot emails your store's key numbers to the people who need them, on a
schedule, so nobody has to open the dashboard to know how the store is doing.
Choose any of seven reports (sales, customers, inventory, products, discounts,
abandoned carts and subscriptions), how often each one runs, and who gets it.
Every report is also kept in the dashboard under **Reporting**, so you can open
any past period again.

## How it works

| When | What the app does |
| --- | --- |
| A report is due (around 08:00 in your time zone, on the days its schedule sets) | Works out the figures for the period, saves the report under **Reporting**, and emails it to the recipients for that report. |
| The period had nothing in it | Skips the report, unless **Send even when there is nothing to report** is on. |
| You choose **Actions → Send a report now** | Builds, saves and emails the report you pick straight away, even if that report is switched off. |
| You open a report under **Reporting** | Shows its summary and tables. Long tables show their first rows, with **Show more** for the rest. |

| Schedule | Arrives | Covers |
| --- | --- | --- |
| Daily | Every morning | The previous day |
| Weekly | Mondays | The previous Monday to Sunday |
| Every 2 weeks | Alternate Mondays (Oct 26, Nov 9, Nov 23 2026, then every 14 days) | The previous 14 days |
| Monthly | The 1st of the month | The previous calendar month |

Each day starts and ends at midnight in the time zone you choose, so a report
never includes part of a day. Daylight saving is handled. Changes compare with
the period just before: the previous day, week or 14 days, or the previous
calendar month.

## Before you begin

You don't need any other accounts or keys. You need:

- The email addresses that should get reports.
- Your store's time zone, as set under **Settings → General**. Swell doesn't share
  it with apps, so you choose it again in the app.
- Subscriptions in Swell, if you want the subscription report to show anything.

## Set up

1. **Install the app.** Install Report Pilot from the Swell App Store and approve
   the access it asks for. It reads your orders, products, customers, carts,
   subscriptions and promotions, and sends its own emails. It never changes your
   store data.
2. **Add recipients.** In **Apps → Report Pilot → Settings**, add the addresses
   that should get every report under **Recipients**.
3. **Choose your time zone.** Under **Time zone**, choose the same one as
   **Settings → General**.
4. **Choose your reports.** Under **Each report**, open each report's tab, switch
   it on, and choose how often it runs. The sales report is on, weekly, from the
   start. The others are off until you switch them on.
5. **Send a test report.** Choose **Actions → Send a report now**, pick a report
   and choose **Send**. It's emailed straight away and saved under
   **Reporting**.

## Using Report Pilot

### Sales report

Revenue and orders for the period, compared with the period before.

- **Summary:** Revenue, Previous revenue and Revenue change; Orders, Previous
  orders and Order change; Average order value and Items sold; New and
  Returning customers; Subtotal, Discounts, Shipping and Tax; Canceled orders,
  Unpaid orders and Refunds.
- **Top products:** the 10 products that earned the most, with their quantity
  and revenue. Can be turned off.
- **Daily breakdown:** orders and revenue for each day, including days with no
  orders. The page shows 7 days at first. Can be turned off. It's left out of
  any report longer than 31 days.
- The **Sales reports** list has **With sales** and **No sales** tabs.

Revenue counts orders that are paid and not canceled, less anything refunded
on them so far. On stores whose prices don't include tax, Subtotal − Discounts +
Shipping + Tax − Refunds = Revenue.
Shipping is after any shipping discount, so Discounts here are discounts on items
only (the discount report counts both). Canceled and unpaid orders are counted
separately and aren't in revenue; draft orders aren't counted at all. Refunds
count against the period the order was placed in, as they stand when the report
is built: a refund made after a report was sent isn't in that report. A customer is
"returning" if they had a paid order before the period started. Orders that
aren't linked to a customer account aren't counted as new or returning.

Top products are ranked by what the products themselves sold for: shipping and
tax aren't included, and discounts on the whole order aren't taken off. So the
list won't add up to Revenue.

### Customer report

Who bought in the period.

- **Summary:** Customers, Previous period and Change vs previous period; New
  customers, Returning customers and Returning rate; Repeat buyers (customers
  with 2 or more paid orders in the period), Repeat rate and Average spend per
  customer.
- **Top customers:** the 10 customers who spent the most, with their orders and
  amount in the period, their lifetime amount and orders, and a link to each
  customer. Turning this off keeps customer names out of the report and email
  entirely.

Customers are shown by name, in this report and in the cart and subscription
reports. A customer with no name on their account is shown as "Unnamed
customer": email addresses are never put in a report, because reports can go to
people outside your business.

Only orders linked to a customer account are counted, so guest checkouts aren't
in Customers. Spend is less any refunds.

### Inventory report

What's out of stock or running low. This report shows stock at the moment it
runs, not a period; its schedule only sets how often it's taken.

- **Summary:** Out of stock and Low stock counts.
- **Items:** every out-of-stock and low item, up to 50, out of stock first, then
  whatever will run out soonest. Each shows its stock, estimated days left, units
  sold in the last 30 days, SKU and a link to the product. The page shows 10 at
  first. Past 50, a note says how many more there are.

Only active products and variants that track stock are checked. Archived
variants (option combinations a product no longer offers) are left out. An item is low
when its stock is at or below **Low stock threshold**. Estimated days left is the
current stock divided by the average sold per day over the last 30 days; it
shows — for an item that sold nothing in that time.

### Product report

How each product did in the period.

- **Summary:** Products sold, Previous period products sold and Products with no
  sales; Units sold, Item revenue and Best sellers' share (the share of item
  revenue that came from the 10 best sellers, with how many products that is,
  such as "10 of 37 products").
- **Best sellers:** the 10 products that earned the most, with quantity, revenue,
  previous revenue and revenue change.
- **Biggest movers:** the 10 largest changes in revenue, up or down, including
  products that sold last period and not at all this one.
- **Slowest sellers:** the 10 products that earned the least. A product in Best
  sellers is never repeated here, so a store that sold 10 products or fewer sees
  this list empty.
- **No sales:** active products, older than the period, that sold nothing in it,
  up to 10. Past 10, a note says how many more there are. Can be turned off;
  Products with no sales then shows — instead of a count.

Revenue here is item revenue, worked out the same way as the sales report's top
products. Swell doesn't split refunds by product, so item revenue is before
refunds.

### Discount report

How much was given away in discounts, and through which coupons and promotions.

- **Summary:** Discounts given, Previous period discounts and Discount change;
  Orders, Discounted orders and Discounted orders %; Revenue, Discounted order
  revenue and Discount rate (discounts as a share of what the discounted orders
  would have cost without them); Discounted average order and Full-price average
  order.
- **Coupons and promotions:** the 10 largest, with the discount given, orders,
  order revenue, average discount and type (Coupon, Promotion or Other). Past 10,
  a note says how many more there are.

Discounts given include shipping discounts. Discounts that aren't tied to a
coupon or promotion are shown as "Shipping discounts" or "Item-level or manual
discounts", so the lines add up to the total. Revenue figures on this report are
before refunds. Discount change is shown in
grey rather than green or red, because giving more discounts isn't simply good or
bad.

### Abandoned cart report

Carts customers left without checking out, and how many came back.

- **Summary:** Abandoned carts, Abandoned change and Still open; Abandoned value
  and Average abandoned cart; Recovered carts, Recovery rate and Recovered
  revenue.
- **Largest abandoned carts:** the 10 largest, with the customer (or Guest),
  items, value, the day it was abandoned and whether it was recovered. Customers
  link to their page. Past 10, a note says how many more there are.
- **Products left in carts:** the 10 products with the most value left behind,
  with the number of carts, quantity and value.

Swell marks a cart abandoned after about 3 hours without activity. A cart counts
if it was abandoned in the period, including carts that later became an order.
Empty and draft carts are left out.

A cart is **recovered** when it later became an order that wasn't canceled,
however the customer came back: through Swell's abandoned cart email, on their
own, or because staff turned the cart into an order. The report doesn't show how
many came back because of the email. **Recovered revenue** counts only those
orders that are paid, less any refunds. **Still open** counts the rest: carts that never became an
order, or whose order was canceled, so Recovered carts and Still open add up to
Abandoned carts. Abandoned change is shown in grey.

### Subscription report

Recurring revenue and how your subscribers changed.

- **Summary:** Active subscriptions, Monthly recurring revenue and On trial; New
  subscriptions, New change and Net change; Canceled, Canceled change and Paused;
  Past due, Renewals in the next 7 days and Trials ending in the next 7 days.
- **By plan:** paying and trial subscriptions, and monthly revenue, for up to
  10 plans, highest monthly revenue first.
- **Canceled subscriptions:** who canceled in the period, their plan, the date
  and the monthly value lost. Past 10, a note says how many more there are.
- **Failed renewals:** subscriptions whose last renewal payment failed, shown as
  Past due while Swell retries or Unpaid once it stops, with the amount due. Past
  10, a note says how many more there are.

Active, on trial, paused and past due show your subscriptions as they are when
the report runs. New, canceled and net change describe the period. Monthly
recurring revenue adds up active subscriptions; plans billed daily, weekly or
yearly are converted to a monthly amount. A subscription set to cancel or pause
when its billing period ends still counts as active, but is left out of monthly
recurring revenue, plan revenue and Renewals in the next 7 days, because it won't
bill again. Canceled change is shown in grey.

Because the report shows your current subscriptions, it's only skipped as
"nothing to report" when nothing is active, on trial, paused or past due, and
none were started or canceled in the period.

### Recipients

- **Recipients** gets every report that's switched on.
- **Also send this report to**, on each report's tab, gets only that report, as
  well as Recipients.

An address on both lists gets one email. Anything that isn't an email address is
ignored. If no addresses are set, reports are still saved under **Reporting**,
but nobody is emailed. Store admins aren't emailed unless they're on a list.

### Sending a report now

**Actions → Send a report now** on the app's page builds, saves and emails a
report immediately. The dialog closes straight away. The report is listed
under **Reporting** once it's built, and the email usually arrives within a few
minutes. It covers the most recent full period: the previous day, the 7 or 14
days before today, or the previous calendar month.
The inventory report, which has no period, shows stock as it is when it runs.
On any day but Monday, a weekly report sent this way covers a different week from
the scheduled one. It sends even if that report is switched off or the period was
empty.

### Emails

Each email has the same summary and tables as the report's page, in the same
order. The differences:

- there are no links to products or customers;
- summary rows of four cards show as two rows of two, and on phones the cards
  stack;
- long lists show their first rows and link to the full report in the dashboard
  (the link needs a login, so it only opens for your store's admins);
- empty or switched-off lists are left out, except the inventory report's Items,
  which says when nothing is out of stock or running low.

You can change each email's intro line and footer note under **Settings →
Notifications**. The subject line is fixed.

### Looking back at past reports

Open **Reporting** in the dashboard's left menu and choose a report type, such as
**Sales reports** or **Abandoned cart reports**. Each row is one period, newest
first. Open a row to see the full report. The app never removes old reports.

## Settings

Settings are in **Apps → Report Pilot → Settings**.

| Setting | What it does |
| --- | --- |
| Send scheduled reports | Turns every scheduled report on or off without uninstalling the app. On by default. |
| Send even when there is nothing to report | When off (the default), a report is skipped if its period had nothing in it: no paid orders, no customers, no products sold, no discounted orders, no stock running low, no abandoned carts, or no subscriptions. |
| Recipients | Addresses that get every report that's switched on. |
| Time zone | Your store's time zone, from the same list as **Settings → General**. Reports arrive around 08:00 in it, and days, weeks and months start at its midnight. Defaults to Greenwich Mean Time (UTC). |

Each report has a tab under **Each report** with:

| Setting | What it does |
| --- | --- |
| Send the … report | Switches that report on or off. Sales is on by default; the others are off. |
| Reporting period (How often, for Inventory) | Daily, weekly, every 2 weeks or monthly. Weekly by default. |
| Also send this report to | Addresses that get only this report, as well as Recipients. |

Some tabs have more:

| Tab | Setting | What it does |
| --- | --- | --- |
| Sales | Include top products | Adds the Top products list. On by default. |
| Sales | Include daily breakdown | Adds the day-by-day table. On by default. |
| Customers | Include top customers | Adds the Top customers list. On by default. Off keeps customer names out of the report and email. |
| Inventory | Low stock threshold | Items at or below this stock level are listed as low, from 0 to 1,000. 5 by default. |
| Products | List products with no sales | Adds the No sales list. On by default. |

## Limitations

- **Large stores:** to finish within Swell's time limit, each report reads up to
  a fixed amount of data:
  - 2,500 orders for top products, the product report and the discount report
  - 20,000 customers for the customer report and the new and returning split
  - 2,000 products for the inventory report and the No sales list, plus their
    variants (500 per 100 products) and 2,500 orders for the last 30 days' sales
  - 2,500 carts and 2,500 subscriptions

  Order totals (revenue, order counts and discounts given) have no limit; cart,
  customer and subscription counts do. When a report reaches a limit, its page
  and email say the figures are partial.
- **The time zone is set in the app.** Swell doesn't let apps read your store's
  time zone, so the app has its own setting. If the two differ, reports follow
  the app's.
- **Stores that sell in more than one currency:** amounts are added up without
  converting them, and the report shows the currency of the most recent paid
  order in the period. If the period has none, it uses the currency of the
  store's most recent order (or USD for a store with no orders). The
  subscription report uses the subscriptions' currency. Treat totals on these stores as approximate.
- **Billing intervals:** plans billed daily, weekly, monthly or yearly are
  converted to a monthly amount. Any other interval is counted as monthly.
- **Send times:** reports are sent once a day, in the 08:00 hour of your time
  zone. The exact minute varies by report, from 08:00 to 08:30. In time zones
  offset by a half or quarter hour, such as India, they arrive anywhere in the
  08:00 hour.
- **Environments:** works in Swell's test and live environments. Settings and
  reports are separate for each.

## Troubleshooting

### A report didn't arrive

Check that **Send scheduled reports** and the report's own switch are on, that
today is a day its schedule sends (Monday for weekly, the 1st for monthly), and
that at least one recipient is set. If the period had nothing in it, the report
is skipped unless **Send even when there is nothing to report** is on. Then
choose **Actions → Send a report now** to check the email arrives. Give it a few
minutes: the report is built after the dialog closes, so the dialog can't show
a problem. If it still doesn't arrive, open **Developer → Console → Logs**,
filter by **App: Report Pilot**, and look for the report's last log line.

### The report covers the wrong days or arrives at the wrong hour

Check **Time zone** in the app's settings matches **Settings → General**.

### The figures say they're partial

The period had more data than the report reads. See Large stores under
Limitations. For the sales, customer, product, discount and abandoned cart
reports, a shorter schedule, such as weekly instead of monthly, keeps each report
within the limits. The inventory and subscription reports read every product or
subscription whatever the schedule, so a shorter schedule doesn't change them.

## Uninstalling

Uninstalling stops all scheduled reports and emails. Uninstalling applies to the
environment you're in, so remove the app from the test and live environments
separately.

## For developers

### What's in the app

| Part | Files |
| --- | --- |
| Cron functions, one per report, each running hourly at its own minute (UTC) | `functions/sales-report.ts` (:00), `inventory-report.ts` (:05), `customer-report.ts` (:10), `discount-report.ts` (:15), `product-report.ts` (:20), `cart-report.ts` (:25), `subscription-report.ts` (:30) |
| "Send a report now" action | `functions/send-report-now.ts`, declared as the `send_now` action in `settings/report-config.json` |
| Building, saving and emailing a report, in steps | `functions/send-report.ts` (a workflow, started by the crons and the action) |
| Preview or send any report on demand | `functions/run-report.ts` (route, not public) |
| Dashboard address for links | `functions/lib/dashboard.ts`, used by `functions/dashboard-path.ts` (route only the app's components call) and by the functions that start a send, which store the report's dashboard address for its email |
| Report types, schedule checks and the workflow's steps | `functions/lib/runner.ts` |
| Turning refused Swell calls in the workflow into errors | `functions/lib/refusals.ts` |
| Report calculations | `functions/lib/report.ts` (sales, periods, recipients, sending), `inventory.ts`, `customers.ts`, `products.ts`, `discounts.ts`, `carts.ts`, `subscriptions.ts`, `scan.ts` (bounded paging) |
| Time zone, periods and send hour | `functions/lib/time.ts` |
| Settings for the other report types | `functions/lib/report-settings.ts` |
| Collections (one per report) | `models/reports.json` (sales), `inventoryreports`, `customerreports`, `productreports`, `discountreports`, `cartreports`, `subscriptionreports` |
| Dashboard pages | `content/*.json`, one per collection |
| Emails | `notifications/*-report.json` and `.tpl` (Liquid), one per report |
| Page components | `components/ReportSummary.tsx` (summary cards), `ReportTable.tsx` (tables), `SettingsSection.tsx` (the Each report heading on the settings page) |
| Settings page | `settings/report-config.json` |
| App Store listing | `swell.json` (name, short and full descriptions, support and documentation links, gallery under `images`), `assets/icon.png` (512×512), `assets/image.png` (cover, 1200×630), `assets/screenshots/` (gallery, 3200×1800) |
| Icon generator | `scripts/make-icon.js` (`npm run icon`; not app config) |
| Cover and gallery sources | `design/listing/`: `build.py` writes mock-up pages with sample data, and `render.sh` renders them into `assets/` with headless Chrome (`npm run listing`; on Windows, run it from Git Bash) |

### Permissions

`read_orders`, `read_products`, `read_accounts`, `read_carts`,
`read_subscriptions`, `read_promotions` (for promotion names on the discount
report), `write_notifications` (to email
recipients) and `read_:models` (to find the app's notification templates). The
app writes only to its own collections.

### How a scheduled report runs

Each cron runs every hour. It returns straight away unless it's the store's
08:00 hour (`isSendHour`) and the report is due today (`isDueToday`), both in
the time zone setting. It then looks up the report's email template
(`resolveTemplate`, which reads `/:models`, something a workflow isn't allowed
to do), starts the `send-report` workflow with it, and returns.
**Send a report now** starts the same workflow, so the dialog doesn't wait.

The workflow runs in steps, each with its own time limit, so a large store's
report isn't cut off by the 10 seconds a function gets:

1. **Build report:** reads the settings and builds the report (for its window
   from `resolveWindow`, or as a snapshot for inventory). Read-only, so it's
   retried up to twice if it fails.
2. If the report is empty, it stops here (unless the setting says otherwise or
   it was sent from the action).
3. **Save report** to the report's collection.
4. **Email recipient 1, 2, …:** one step per address, then a short wait and a
   check that Swell sent each one. A failed address doesn't stop the others.

A step that finished isn't run again when a later one fails. Saving and
emailing are never retried, because a request that timed out may still have
gone through, so a report is never saved twice and nobody is emailed twice. Saving a record doesn't email anyone by itself: each
notification has a condition that never matches.

Inside a workflow, a Swell call that's refused comes back as `{ errors }`
instead of throwing, as it would in a function. `functions/lib/refusals.ts`
wraps the workflow's client so a refusal throws: a refused read fails the build
step rather than producing a report of zeros, and a refused save or email is
recorded as a failure.

### Running, testing and pushing

```bash
npm install
npm run typecheck   # type-checks functions and components
npm run assets      # regenerates the icon, cover and gallery
swell app push      # pushes the whole app
swell inspect functions --app .
```

There's no automated test suite yet; `npm run typecheck` is the only check. After
every push, run `swell inspect` and check every function, setting and content
view is registered. A push can succeed with no functions registered if the build
failed. Requires `@swell/cli` 2.9.27 or later, for app components.

Preview any report without sending it:

```bash
swell api get '/functions/report_pilot/run-report'
swell api get '/functions/report_pilot/run-report?type=carts&period=monthly'
```

- `type`: `sales` (the default), `inventory`, `customers`, `discounts`,
  `products`, `carts` or `subscriptions`.
- `period`: `daily`, `weekly`, `biweekly` or `monthly`.
- `days=N`: any number of days up to 730, sales report only.

`swell api post` on the same path starts the `send-report` workflow, which
saves and emails the report as the schedule would, if that report is switched
on. It returns straight away; follow the run on the app's **Workflows** tab. A
report is skipped when empty unless **Send even when there is nothing to report**
is on. `days` works with GET only. When
sending while developing, use `example.com` addresses: Swell processes those
emails but never delivers them, and a store that sends too many real emails can
be deactivated.

### Things to know

- **Push the whole app after changing `functions/lib/`.** Lib files are bundled
  into each function, so pushing only a lib file leaves the functions running the
  old code.
- **Push the functions again after changing `permissions`** in `swell.json`.
  Otherwise they keep their old access.
- **Inside a function, collections are addressed by name**, such as `/reports`
  or `/cartreports`. `/apps/report_pilot/...` is refused for the app's own access.
- **Collection file names have no separators.** Swell treats the part of a model
  file name before its first underscore as a namespace.
- **App settings arrive nested** under `report-config` (the settings file name)
  in `swell.settings()`. `settingsRecord` in `lib/report.ts` unwraps them.
- **Email templates are addressed by the installed app's id:**
  `app_<app id>.apps_<app id>_<collection>.<file name>`, where the app id is read
  from `GET /:models`. The short `<collection>.<file name>` creates the
  notification but Swell marks it "Notification template not found".
- **Notifications set `"repeat": true`**, so every recipient of the same report
  is emailed, not only the first.
- **Record pages avoid `field_group`.** Fields inside one reach the form with no
  value, so report pages use `field_row`s and the app's components.
- **Components:** `ReportSummary` reads its figures from the field's
  `params.rows`, and `ReportTable` its columns from `params.columns`, both in
  `content/*.json`. A component field needs a matching model field, which is why
  each model has a display-only `summary` field.
- **Keep emails in step with the pages.** When a report's summary or tables
  change in `content/`, change its `.tpl` to match.
- **Daily breakdown in other time zones.** The server groups dates in UTC, so
  outside UTC each local day is totalled with its own small read (up to 31).
- **Limits per run:** each function has a 10-second timeout, so the crons and
  the action, and `run-report` when it sends, only start the `send-report`
  workflow, whose build step has 5 minutes. A `run-report` preview (GET) still
  builds inline, so on a very large store it can time out. Recipients are
  emailed one at a time, and each send is checked about 5 seconds later.
- **Logs:** `swell logs -f --app report_pilot`, or **Developer → Console → Logs**
  filtered by the app. Each `send-report` run, its steps and any errors are on the
  app's **Workflows** tab. A `run-report` preview returns its errors in its
  response.

## Support

For help with Report Pilot, email support@swell.is.

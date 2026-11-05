"""Builds the App Store listing pages. Run render.sh to render them into ../../assets.

A made-up store (Harbor & Pine) with tidy sample figures, drawn from the real UI so the gallery matches what a merchant sees:

1. The sales email (notifications/sales-report.tpl) with its sections and figures in order.
2. A sales report record page (content/reports.json, components/ReportSummary.tsx). The info icons stay hidden until a
   card is hovered, so they aren't drawn. Top products starts below the crop, after the six rows of figures.
3. Abandoned cart and subscription report pages (content/cartreports.json, content/subscriptionreports.json), cropped
   side by side, with their sections in order. Each table is the first one on its page.
4. The app settings page (settings/report-config.json, swell-admin components/apps/view.js): field descriptions are
   tooltips, so they aren't printed. Save settings stays secondary until a field is edited.

Styles: listing.css is the frame, shared with the other official apps' listings. swell.css is the Swell dashboard, from
swell-admin's styles, and swell-ui/ holds its nav icons (client/src/components/icon/img/nav).
"""
import base64
import pathlib

HERE = pathlib.Path(__file__).parent
ICON = base64.b64encode((HERE / "../../assets/icon.png").read_bytes()).decode()
ICON_SRC = f"data:image/png;base64,{ICON}"
GLYPH = f'<img src="{ICON_SRC}" style="width:34px;height:34px;border-radius:8px">'

# Sizes each ring around its target and moves each callout or menu next to its anchor, in document order
PLACE = """<script>
const rect = (selector) => {
  const all = [...document.querySelectorAll(selector)].map((el) => el.getBoundingClientRect());
  const left = Math.min(...all.map((r) => r.left)), top = Math.min(...all.map((r) => r.top));
  const right = Math.max(...all.map((r) => r.right)), bottom = Math.max(...all.map((r) => r.bottom));
  return { left, top, right, bottom, width: right - left, height: bottom - top };
};
for (const el of document.querySelectorAll("[data-ring], [data-at]")) {
  if (el.dataset.ring) {
    const t = rect(el.dataset.ring), pad = Number(el.dataset.pad ?? 6);
    Object.assign(el.style, { left: `${t.left - pad}px`, top: `${t.top - pad}px`, width: `${t.width + 2 * pad}px`, height: `${t.height + 2 * pad}px` });
    continue;
  }
  const t = rect(el.dataset.at), own = el.getBoundingClientRect(), gap = Number(el.dataset.gap ?? 14);
  const [side, align = "center"] = el.dataset.side.split(" ");
  const along = (start, size, length) => (align === "start" ? start : align === "end" ? start + size - length : start + (size - length) / 2);
  const across = side === "left" || side === "right";
  const x = across ? (side === "right" ? t.right + gap : t.left - gap - own.width) : along(t.left, t.width, own.width);
  const y = across ? along(t.top, t.height, own.height) : side === "below" ? t.bottom + gap : t.top - gap - own.height;
  el.style.left = `${x + Number(el.dataset.dx ?? 0)}px`;
  el.style.top = `${y + Number(el.dataset.dy ?? 0)}px`;
}
</script>"""

TRIANGLE = '<svg class="deco" style="{}" width="96" height="84" viewBox="0 0 96 84"><path d="M48 6 90 78H6Z" fill="none" stroke="#c4bff4" stroke-width="5" stroke-linejoin="round"/></svg>'
PLUS = '<svg class="deco" style="{}" width="60" height="60" viewBox="0 0 60 60"><path d="M30 6v48M6 30h48" stroke="#c4bff4" stroke-width="5" stroke-linecap="round"/></svg>'
DOTS = '<div class="deco dots" style="{}"></div>'
DECOS = [
    TRIANGLE.format("left:58px;top:140px") + PLUS.format("right:92px;top:112px") + DOTS.format("right:0;top:300px"),
    DOTS.format("left:52px;top:118px") + TRIANGLE.format("right:62px;top:136px") + PLUS.format("left:12px;top:620px"),
]


def chev(direction="down"):
    path = {"down": "M2 3.5l3 3 3-3", "up": "M2 6.5l3-3 3 3"}[direction]
    return (f'<svg class="chev" viewBox="0 0 10 10"><path d="{path}" fill="none" stroke="currentColor" '
            'stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>')


REPORTS = ["Dashboard", "Sales reports", "Customer reports", "Inventory reports", "Product reports",
           "Discount reports", "Abandoned cart reports", "Subscription reports"]


def nav_item(icon, label, more=False, on=False, sub=""):
    chevron = f'<span style="margin-left:auto;color:#737373;display:inline-flex">{chev("up" if sub else "down")}</span>' if more else ""
    return (f'<li class="{"on" if on else ""}"><a><i style="background-image:url(swell-ui/{icon}{"-active" if on else ""}@2x.png)"></i>'
            f"{label}{chevron}</a>{sub}</li>")


def sidebar(active):
    """The left menu (swell-admin components/nav/main.js). An app's content views follow Dashboard under Reporting, and
    the active one shows the app icon (components/nav/nav.scss)."""
    sub = ""
    if active in REPORTS:
        rows = "".join(
            f'<li class="on"><a><span class="child-app"><img src="{ICON_SRC}"></span>{child}</a></li>' if child == active
            else f"<li><a>{child}</a></li>"
            for child in REPORTS
        )
        sub = f'<ul class="children">{rows}</ul>'
    reporting = active in REPORTS
    return f"""<aside class="nav">
  <div class="store"><span class="av">H</span><span class="nm">Harbor &amp; Pine</span><span style="color:#737373;display:inline-flex;margin-right:6px">{chev()}</span></div>
  <ul>
    {nav_item("home", "Home")}
    {nav_item("orders", "Orders", True)}
    {nav_item("subscriptions", "Subscriptions")}
    {nav_item("customers", "Customers")}
    {nav_item("products", "Products", True)}
    {nav_item("discounts", "Discounts", True)}
    {nav_item("apps", "Content", True)}
    {nav_item("reporting", "Reporting", True, reporting, sub)}
  </ul>
  <h6>Channels</h6>
  <ul>{nav_item("storefront", "Online Store", True)}</ul>
  <h6>Admin</h6>
  <ul>
    {nav_item("apps", "Apps", on=active == "Apps")}
    {nav_item("integrations", "Integrations")}
    {nav_item("developer", "Developer", True)}
    {nav_item("settings", "Settings")}
  </ul>
</aside>"""


def window(main, side="", zoom=1.0, width=1460, height=684, style=""):
    """The dashboard inside a frame, shown at `zoom`."""
    return (f'<div class="sw" style="zoom:{zoom};width:{round(width / zoom)}px;height:{round(height / zoom)}px">'
            f'{side}<div class="main" style="{style}">{main}</div></div>')


def page(title, lede, body, deco=0, style=""):
    return (
        '<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="listing.css"><link rel="stylesheet" href="swell.css">'
        + f"<style>{DASH_STYLE}{style}</style>"
        + "</head><body>"
        + DECOS[deco]
        + f'<div class="pill">{GLYPH}Report Pilot <span class="x">&times;</span> Swell</div>'
        + f'<h1>{title}</h1><div class="lede">{lede}</div>'
        + body
        + PLACE
        + "</body></html>"
    )


# The real sidebar width and child rows (components/nav/nav.scss, components/layout/main.scss), then the app's report
# pages: summary cards (components/ReportSummary.tsx) and tables (ReportTable.tsx), with their own styles
DASH_STYLE = """
.sw .nav { width: 256px; padding: 16px 15px; }
.sw .nav ul.children { margin: 0 0 5px; padding: 5px 0; }
.sw .nav ul.children li > a { height: 36.5px; margin: 0; padding: 7px 15px 7px 44px; color: var(--muted); }
.sw .nav ul.children li.on > a { color: var(--text); background: var(--bg); }
.sw .child-app { position: absolute; left: 15px; top: 8px; width: 20px; height: 20px; border-radius: 4px; overflow: hidden; }
.sw .child-app img { display: block; width: 100%; height: 100%; }
.sw .page { min-width: 0; }
.sw .flabel { display: block; }
.sw .rs { color: #171717; display: grid; gap: 12px; line-height: normal; }
.sw .rs .row { display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); gap: 12px; }
.sw .rs .card { background: #fff; border: 1px solid #e5e5e5; border-radius: 6px; padding: 12px 14px; min-width: 0; }
.sw .rs .label { display: flex; align-items: center; min-height: 18px; font-size: 12px; font-weight: 500; color: #737373; }
.sw .rs .value { margin-top: 6px; font-size: 22px; font-weight: 600; font-variant-numeric: tabular-nums; }
.sw .up { color: #059669; }
.sw .flat { color: #525252; }
.sw .rt { background: #fff; border: 1px solid #e5e5e5; border-radius: 6px; overflow: hidden; font-size: 14px; color: #171717; }
.sw .rt table { border-collapse: separate; border-spacing: 0; }
.sw .rt th { background: none; font-size: 12px; font-weight: 500; line-height: 19.2px; color: #171717; text-align: center; padding: 12px 16px; }
.sw .rt td { line-height: 22.4px; text-align: center; padding: 16px; border-top: 1px solid #e5e5e5; }
.sw .rt th:first-child, .sw .rt td:first-child { text-align: left; }
"""


def report_head(section, title):
    """A content record's header (components/collection/record.js). Delete is the view's default extra action."""
    return f"""<div class="back">&larr; {section}</div>
<div class="title-row"><div class="h1" id="title">{title}</div><div class="btns"><span class="btn sec">Actions {chev()}</span></div></div>"""


def summary(rows, tid=None):
    out = []
    for row in rows:
        cells = "".join(
            f'<div class="card"{f" id={f[2]!r}" if len(f) > 2 else ""}><div class="label">{f[0]}</div><div class="value">{f[1]}</div></div>'
            for f in row
        )
        out.append(f'<div class="row" style="--cols:{len(row)}">{cells}</div>')
    return f'<div class="rs"{f" id={tid!r}" if tid else ""}>{"".join(out)}</div>'


def table(head, rows):
    th = "".join(f"<th>{h}</th>" for h in head)
    tr = "".join("<tr>" + "".join(f"<td>{c}</td>" for c in r) + "</tr>" for r in rows)
    return f'<div class="rt"><table><tr>{th}</tr>{tr}</table></div>'


def field(label, content):
    return f'<div class="field"><label class="flabel">{label}</label>{content}</div>'


UP = '<span class="up">&#9650; {}</span>'
FLAT = '<span class="flat">&#9660; {}</span>'

# The same period and figures in every image
PERIOD = "Oct 5 &ndash; Oct 11, 2026"
REVENUE_ROWS = [
    [("Revenue", "$18,940.50"), ("Previous revenue", "$16,212.00"), ("Revenue change", UP.format("16.83%"))],
    [("Orders", "214"), ("Previous orders", "197"), ("Order change", UP.format("8.63%"))],
    [("Average order value", "$88.51"), ("Items sold", "402")],
    [("New customers", "61"), ("Returning customers", "127")],
]
SUBTOTAL, DISCOUNTS, SHIPPING, TAX = ("Subtotal", "$18,120.00"), ("Discounts", "$1,062.75"), ("Shipping", "$1,284.00"), ("Tax", "$1,109.25")

# 1. The sales report email (notifications/sales-report.tpl)
EMAIL_STYLE = """
.frame.mail { background: #f4f5f7; }
.mailz { zoom: 1.16; }
.em { width: 600px; margin: 19px 0 0 160px; background: #fff; border-radius: 12px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; }
.em .line { height: 4px; background: #4f46e5; }
.em .hd { padding: 28px 32px 20px; border-bottom: 1px solid #e6e8eb; }
.em .k { margin: 0 0 6px; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7280; }
.em .t { font-size: 22px; line-height: 1.3; color: #111827; font-weight: 600; }
.em .intro { margin-top: 10px; font-size: 14px; line-height: 1.5; color: #6b7280; }
.em .sec { padding: 24px 32px 0; }
.em .h { margin-bottom: 12px; font-size: 14px; line-height: 20px; font-weight: 600; color: #171717; }
.em .row { display: flex; gap: 12px; margin-bottom: 12px; }
.em .card { flex: 1 1 0; min-width: 0; padding: 12px 14px; border: 1px solid #e5e5e5; border-radius: 6px; background: #fff; }
.em .l { font-size: 12px; line-height: 16px; font-weight: 500; color: #737373; }
.em .v { margin-top: 6px; font-size: 22px; line-height: 28px; font-weight: 600; color: #171717; white-space: nowrap; }
.em .up { color: #059669; }
"""


def email_row(figures, rid=None):
    cells = "".join(f'<div class="card"><div class="l">{label}</div><div class="v">{value}</div></div>' for label, value in figures)
    return f'<div class="row"{f" id={rid!r}" if rid else ""}>{cells}</div>'


email = page(
    "Your key numbers, <mark>in every inbox</mark>",
    "Daily, weekly, every 2 weeks or monthly, at the time you choose in your store's time zone.",
    f"""
<div class="frame mail"><div class="mailz"><div class="em"><div class="line"></div>
  <div class="hd"><div id="subject"><div class="k">Sales report</div><div class="t">{PERIOD}</div><div class="intro">Here's how the store performed.</div></div></div>
  <div class="sec"><div class="h">Summary</div>
    <div id="compare">{email_row(REVENUE_ROWS[0])}{email_row(REVENUE_ROWS[1])}</div>
    {email_row(REVENUE_ROWS[2])}{email_row(REVENUE_ROWS[3], "customers")}
    {email_row([SUBTOTAL, DISCOUNTS])}{email_row([SHIPPING, TAX])}
  </div>
</div></div></div>
<div class="ring" id="ring-subject" data-ring="#subject" data-pad="9"></div>
<div class="callout" data-at="#ring-subject" data-side="right" data-gap="52"><b>1</b>One email for each report</div>
<div class="ring" id="ring-compare" data-ring="#compare" data-pad="7"></div>
<div class="callout" data-at="#ring-compare" data-side="right" data-gap="54"><b>2</b>Compared with the last period</div>
<div class="ring" id="ring-customers" data-ring="#customers" data-pad="5"></div>
<div class="callout" data-at="#ring-customers" data-side="right" data-gap="56"><b>3</b>New and returning customers</div>
""",
    deco=0,
    style=EMAIL_STYLE,
)

# 2. A sales report page under Reporting
report_page = page(
    "Every report <mark>kept in your dashboard</mark>",
    "Open any past period under Reporting, with the same figures as the email and more.",
    f"""
<div class="frame">{window(f'''<div class="page" style="width:790px">
    {report_head("Sales reports", PERIOD)}
    <label class="flabel" style="margin-top:20px">Sales report summary</label>
    {summary([
        REVENUE_ROWS[0], REVENUE_ROWS[1], REVENUE_ROWS[2],
        [("New customers", "61", "new"), ("Returning customers", "127", "returning")],
        [SUBTOTAL, DISCOUNTS, SHIPPING, TAX],
        [("Canceled orders", "6", "canceled"), ("Unpaid orders", "9"), ("Refunds", "$510.00", "refunds")],
    ])}
  </div>''', sidebar("Sales reports"), zoom=0.99, style="padding-top:16px")}</div>
<div class="callout" data-at="#title" data-side="right" data-gap="28"><b>1</b>Every period saved under Reporting</div>
<div class="ring" id="ring-customers" data-ring="#new, #returning" data-pad="5"></div>
<div class="callout" data-at="#ring-customers" data-side="right"><b>2</b>New versus returning</div>
<div class="ring" id="ring-held" data-ring="#canceled, #refunds" data-pad="5"></div>
<div class="callout" data-at="#ring-held" data-side="right"><b>3</b>Canceled, unpaid and refunds</div>
""",
    deco=1,
)

# 3. Abandoned cart and subscription reports side by side
HALF_STYLE = """
.frame.half-l, .frame.half-r { width: 712px; }
"""

carts_subs = page(
    "Abandoned carts and <mark>subscriptions</mark> too",
    "See what came back, what's left in carts, and how your recurring revenue is moving.",
    f"""
<div class="frame half-l">{window(f'''
  {report_head("Abandoned cart reports", PERIOD)}
  <label class="flabel" style="margin-top:20px">Abandoned cart report summary</label>
  {summary([
      [("Abandoned carts", "96"), ("Abandoned change", FLAT.format("7.69%")), ("Still open", "73")],
      [("Abandoned value", "$9,312.00"), ("Average abandoned cart", "$97.00")],
      [("Recovered carts", "23", "recovered"), ("Recovery rate", "23.96%"), ("Recovered revenue", "$2,184.00", "recovered-end")],
  ])}
  <label class="flabel" id="carts-label" style="margin-top:20px">Largest abandoned carts</label>
  {table(["Customer", "Items", "Value", "Abandoned", "Status"], [
      ["Maya Okafor", "3", "$412.00", "Oct 9, 2026", "Open"],
      ["Daniel Reyes", "2", "$386.00", "Oct 7, 2026", "Recovered"],
      ["Guest", "4", "$341.50", "Oct 10, 2026", "Open"],
      ["Lena Fischer", "3", "$298.00", "Oct 6, 2026", "Recovered"],
      ["Owen Clarke", "2", "$276.00", "Oct 8, 2026", "Open"],
  ])}''', width=712, style="padding:8px 20px 0")}</div>
<div class="frame half-r">{window(f'''
  {report_head("Subscription reports", PERIOD)}
  <label class="flabel" style="margin-top:20px">Subscription report summary</label>
  {summary([
      [("Active subscriptions", "412"), ("Monthly recurring revenue", "$9,876.00"), ("On trial", "38")],
      [("New subscriptions", "27"), ("New change", UP.format("12.5%")), ("Net change", "19")],
      [("Canceled", "8"), ("Canceled change", FLAT.format("20%")), ("Paused", "14")],
      [("Past due", "6", "pastdue"), ("Renewals in the next 7 days", "96"), ("Trials ending in the next 7 days", "11")],
  ])}
  <label class="flabel" id="plans-label" style="margin-top:20px">By plan</label>
  {table(["Plan", "Paying", "On trial", "Monthly revenue"], [
      ["Coffee Club &mdash; Monthly", "286", "30", "$6,864.00"],
      ["Coffee Club &mdash; Every 3 months", "96", "8", "$2,112.00"],
      ["Coffee Club &mdash; Yearly", "30", "0", "$900.00"],
  ])}''', width=712, style="padding:8px 20px 0")}</div>
<div class="ring" id="ring-recovered" data-ring="#recovered, #recovered-end" data-pad="4"></div>
<div class="callout" data-at="#ring-recovered" data-side="below end" data-gap="-9"><b>1</b>Carts that came back as orders</div>
<div class="ring" id="ring-pastdue" data-ring="#pastdue" data-pad="4"></div>
<div class="callout" data-at="#ring-pastdue" data-side="below start" data-gap="-9" data-dx="74"><b>2</b>Failed renewals to follow up</div>
""",
    deco=0,
    style=HALF_STYLE,
)

# 4. The settings page, with the Actions menu open
SETTINGS_STYLE = """
.sw .apphead { display: flex; align-items: center; gap: 15px; margin-top: 6px; }
.sw .apphead img { display: block; width: 60px; height: 60px; border-radius: 4px; }
.sw .section { margin-top: 24px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; }
.sw .section .top { padding: 16px; }
.sw .section .top b { display: block; font-size: 16px; font-weight: 500; line-height: 1.6; }
.sw .section .top div { font-size: 14px; color: var(--muted); }
.sw .section .fields { padding: 16px 16px 18px; border-top: 1px solid var(--border); }
.sw .switch { display: flex; align-items: center; gap: 10px; width: max-content; margin-bottom: 18px; font-size: 14px; }
.sw .tags { gap: 8px; padding: 0 6px; }
.sw .tag { position: relative; padding: 5px 28px 5px 10px; background: var(--hover); border-radius: 4px; font-size: 13px; line-height: 1.4; color: var(--text); }
.sw .tag svg { position: absolute; right: 9px; top: 50%; width: 10px; height: 10px; margin-top: -5px; stroke: var(--muted); stroke-width: 1.5; stroke-linecap: round; }
.sw .when { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
.sw .when .field { margin-bottom: 0; }
.sw .when .span2 { grid-column: span 2; }
.sw .each { margin-top: 40px; padding-top: 40px; border-top: 1px solid var(--border); }
.sw .each .wrap { width: fit-content; }
.sw .each b { display: block; font-size: 14px; font-weight: 500; line-height: 20px; color: var(--text); }
.sw .each small { display: block; margin-top: 2px; font-size: 12px; line-height: 18px; color: var(--muted); }
.sw .each .tabs { gap: 24px; margin-top: 16px; }
.sw .each .tabs span { font-weight: 500; }
.sw .tabs span.on { box-shadow: inset 0 -2px 0 var(--text); }
.sw .gd { margin: 16px 0; font-size: 14px; color: var(--muted); }
/* Actions menu (components/dropdown-menu: 6px padding, 32px items 2px apart, 8px radius, --shadow-lg) */
.sw .dm { position: absolute; z-index: 30; right: 0; top: 100%; margin-top: 8px; display: flex; flex-direction: column; gap: 2px; min-width: 224px; padding: 6px; background: var(--surface); border: 1px solid var(--border-strong); border-radius: 8px; font-size: 14px; font-weight: 500; color: var(--label); box-shadow: 0 12px 16px -4px rgba(23, 23, 23, 0.08), 0 4px 6px -2px rgba(23, 23, 23, 0.03); }
.sw .dm .it { display: flex; align-items: center; gap: 10px; height: 32px; padding: 6px 10px; border-radius: 6px; line-height: 20px; white-space: nowrap; }
.sw .dm .it img { width: 16px; height: 16px; border-radius: 4px; }
.sw .dm .sep { border-bottom: 1px solid var(--border); margin: 6px -6px; }
.sw .dm .red { color: #d92d20; }
"""

X = '<svg viewBox="0 0 10 10"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7"/></svg>'
SELECT = f'<span style="margin-left:auto;display:inline-flex">{chev()}</span>'
MENU = (f'<div class="dm"><div class="it" id="sendnow"><img src="{ICON_SRC}">Send a report now</div><div class="sep"></div>'
        '<div class="it">Disable app</div><div class="sep"></div><div class="it red">Uninstall app</div></div>')
REPORT_TABS = ["Sales", "Customers", "Inventory", "Products", "Discounts", "Abandoned carts", "Subscriptions"]


def switch(label, on=True):
    return f'<div class="switch"><span class="toggle{"" if on else " off"}"></span>{label}</div>'


def tag(text):
    return f'<span class="tag">{text}{X}</span>'


settings = page(
    "Set it once, <mark>send to the right people</mark>",
    "Everyone on the main list gets every report. Add extra people to any single report.",
    f"""
<div class="frame">{window(f'''<div style="position:relative">
    <div class="back">&larr; Apps</div>
    <div class="title-row">
      <div class="apphead"><img src="{ICON_SRC}"><div><div class="h1" style="margin:0">Report Pilot</div><div style="font-size:15px;line-height:20px">Scheduled store reports, delivered by email and kept in your dashboard</div></div></div>
      <div class="btns" style="margin-top:14px"><span style="position:relative;display:inline-flex"><span class="btn sec">Actions {chev()}</span>{MENU}</span><span class="btn sec">Save settings</span></div>
    </div>
    <div class="tabs" style="margin-top:16px"><span>Overview</span><span class="on">Settings</span><span>Workflows</span><span>Versions</span></div>
    <div class="section">
      <div class="top"><b>Reports</b><div>Choose which reports are emailed, how often each one runs, and who receives them.</div></div>
      <div class="fields">
        {switch("Send scheduled reports")}
        {switch("Send even when there is nothing to report", on=False)}
        {field("Recipients", f'<div class="input tags">{tag("owner@example.com")}{tag("finance@example.com")}</div>')}
        <div class="when">
          <div class="span2" id="tz">{field("Time zone", f'<div class="input">Pacific Daylight Time{SELECT}</div>')}</div>
          <div id="at">{field("Send at", f'<div class="input">07:00{SELECT}</div>')}</div>
        </div>
        <div class="each"><div class="wrap" id="each">
          <b>Each report</b><small>Switch each report on, choose how often it runs, and add anyone who should get only that report.</small>
          <div class="tabs">{"".join(f'<span class="{"on" if t == "Sales" else ""}">{t}</span>' for t in REPORT_TABS)}</div>
        </div></div>
        <div class="gd">Revenue, orders, top products and the day-by-day picture.</div>
        {switch("Send the sales report")}
      </div>
    </div>
  </div>''', sidebar("Apps"), zoom=0.925, style="padding-top:18px")}</div>
<div class="ring" id="ring-send" data-ring="#sendnow" data-pad="2"></div>
<div class="callout" data-at="#ring-send" data-side="left"><b>1</b>Send any report now</div>
<div class="ring" id="ring-tz" data-ring="#tz, #at" data-pad="8"></div>
<div class="callout" data-at="#ring-tz" data-side="right"><b>2</b>At your local time</div>
<div class="ring" id="ring-each" data-ring="#each" data-pad="8"></div>
<div class="callout" data-at="#ring-each" data-side="right"><b>3</b>Extra people for one report</div>
""",
    deco=1,
    style=SETTINGS_STYLE,
)

cover = f"""<!doctype html><html><head><meta charset="utf-8"><style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{ width: 1200px; height: 630px; overflow: hidden; display: flex; align-items: center; gap: 70px; padding: 0 90px;
  font-family: -apple-system, "SF Pro Display", "Helvetica Neue", Arial, sans-serif;
  background: linear-gradient(170deg, #ffffff 0%, #eceef4 100%); }}
.mark {{ width: 300px; height: 300px; flex: none; border-radius: 64px; box-shadow: 0 10px 24px rgba(30,27,75,.22); }}
h1 {{ font-size: 76px; font-weight: 800; letter-spacing: -2px; color: #1e1b4b; line-height: 1.02; }}
.bar {{ width: 128px; height: 8px; border-radius: 4px; background: linear-gradient(90deg, #4f46e5, #f59e0b); margin: 24px 0; }}
p {{ font-size: 30px; color: #52556e; line-height: 1.35; white-space: nowrap; }}
.pills {{ display: flex; gap: 14px; margin-top: 30px; }}
.pills span {{ border: 2px solid #6366f1; color: #4338ca; border-radius: 999px; padding: 9px 20px; font-size: 22px; }}
</style></head><body>
<img class="mark" src="{ICON_SRC}">
<div><h1>Report<br>Pilot</h1><div class="bar"></div>
<p>Your store's key numbers, emailed on a schedule.</p>
<div class="pills"><span>7 reports</span><span>Your time zone</span><span>Saved in Swell</span></div></div>
</body></html>"""

pages = {
    "1-key-numbers-by-email.html": email,
    "2-every-report-kept.html": report_page,
    "3-carts-and-subscriptions.html": carts_subs,
    "4-set-it-once.html": settings,
    "image.html": cover,
}

for name, html in pages.items():
    (HERE / name).write_text(html, encoding="utf-8")
    print("wrote", name)

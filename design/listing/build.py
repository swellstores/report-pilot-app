"""Builds the App Store listing pages. Run render.sh to render them into ../../assets.

The pages are mock-ups with a made-up store (Harbor & Pine) and tidy sample
figures, laid out like the Swell dashboard and the app's own report pages and
emails. Styles are shared with the other official apps' listings (listing.css).
"""
import base64
import pathlib

HERE = pathlib.Path(__file__).parent
ICON = base64.b64encode((HERE / "../../assets/icon.png").read_bytes()).decode()
GLYPH = f'<img src="data:image/png;base64,{ICON}" style="width:34px;height:34px;border-radius:8px">'

# Sizes each ring around its target and moves each callout or menu next to its anchor, in document order
PLACE = """<script>
const rect = (selector) => document.querySelector(selector).getBoundingClientRect();
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

CHEVRON = '<svg class="chev" viewBox="0 0 24 24"><path d="m7 10 5 5 5-5"/></svg>'
INFO = '<svg class="info" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>'
ICONS = {
    "Home": '<path d="M4 10.5 12 4l8 6.5V20h-5v-5.5H9V20H4z"/>',
    "Orders": '<path d="M7 3.5h7l4 4v13H7z"/><path d="M13.5 3.5V8H18M9.5 12.5h6M9.5 16h6"/>',
    "Subscriptions": '<path d="M19.5 10.5A7.5 7.5 0 0 0 5.6 8M4.5 13.5a7.5 7.5 0 0 0 13.9 2.5"/><path d="M5 4v4h4M19 20v-4h-4"/>',
    "Customers": '<circle cx="9.5" cy="8.5" r="3.5"/><path d="M3 20c.7-3.4 3.2-5.3 6.5-5.3S15.3 16.6 16 20M15.5 5.2a3.5 3.5 0 0 1 0 6.6M18 14.9c1.6.8 2.6 2.4 3 5.1"/>',
    "Products": '<path d="M12 3.5 19.5 7.5v9L12 20.5 4.5 16.5v-9z"/><path d="M4.5 7.5 12 11.5l7.5-4M12 11.5v9"/>',
    "Discounts": '<path d="M4 12.5V4h8.5l8 8-8.5 8.5z"/><circle cx="8.5" cy="8.5" r="1.4"/>',
    "Content": '<rect x="4" y="4" width="6.5" height="6.5" rx="1.2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2"/>',
    "Reporting": '<path d="M11 4.5a7.5 7.5 0 1 0 8.5 8.5H11z"/><path d="M14 3.5a7 7 0 0 1 6.5 6.5H14z"/>',
    "Apps": '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
}
EXPANDS = {"Orders", "Products", "Discounts", "Content", "Reporting"}
REPORTS = ["Dashboard", "Sales reports", "Customer reports", "Inventory reports", "Product reports",
           "Discount reports", "Abandoned cart reports", "Subscription reports"]


def icon(name):
    return f'<svg class="ico" viewBox="0 0 24 24">{ICONS[name]}</svg>'


def sidebar(section, children=(), active_child=None, admin=None):
    rows = []
    for item in ["Home", "Orders", "Subscriptions", "Customers", "Products", "Discounts", "Content", "Reporting"]:
        rows.append(f'<div class="item{" open" if item == section else ""}">{icon(item)}<span>{item}</span>{CHEVRON if item in EXPANDS else ""}</div>')
        if item == section:
            rows += [f'<div class="child{" on" if child == active_child else ""}">{child}</div>' for child in children]
    rows.append('<div class="group">Admin</div>')
    rows.append(f'<div class="item{" open" if admin == "Apps" else ""}">{icon("Apps")}<span>Apps</span></div>')
    return f'<div class="side"><div class="store"><span class="avatar">H</span>Harbor &amp; Pine{CHEVRON}</div><div class="nav">{"".join(rows)}</div></div>'


def page(title, lede, body, deco=0, style=""):
    return (
        '<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="listing.css">'
        + f"<style>{REPORT_STYLE}{style}</style>"
        + "</head><body>"
        + DECOS[deco]
        + f'<div class="pill">{GLYPH}Report Pilot <span class="x">&times;</span> Swell</div>'
        + f'<h1>{title}</h1><div class="lede">{lede}</div>'
        + body
        + PLACE
        + "</body></html>"
    )


# The app's report pages: summary cards (components/ReportSummary.tsx) and tables (ReportTable.tsx)
REPORT_STYLE = """
.avatar { background: #0f766e; }
.info { width: 15px; height: 15px; fill: none; stroke: #a1a1aa; stroke-width: 2; stroke-linecap: round; vertical-align: -2px; margin-left: 4px; }
.section { font-size: 15px; font-weight: 600; color: var(--text); margin: 18px 0 8px; }
.cards { display: grid; gap: 10px; }
.cards.c3 { grid-template-columns: repeat(3, 1fr); }
.cards.c2 { grid-template-columns: repeat(2, 1fr); }
.cards + .cards { margin-top: 10px; }
.cardx { border: 1px solid var(--line); border-radius: 8px; padding: 11px 14px; background: #fff; }
.cardx .l { font-size: 13px; color: #737373; font-weight: 500; }
.cardx .v { font-size: 22px; font-weight: 650; margin-top: 4px; color: #171717; font-variant-numeric: tabular-nums; }
.up { color: #059669; } .down { color: #dc2626; } .flat { color: #525252; }
.rt { width: 100%; border-collapse: collapse; font-size: 14.5px; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; margin-top: 0; }
.rt th { background: #fafafa; color: var(--soft); font-weight: 500; padding: 9px 12px; text-align: center; border-bottom: 1px solid var(--line); }
.rt td { padding: 10px 12px; text-align: center; border-bottom: 1px solid var(--line); font-variant-numeric: tabular-nums; }
.rt th:first-child, .rt td:first-child { text-align: left; }
.rt .more td { text-align: center; color: #4338ca; font-size: 14px; }
.rt a { color: #4338ca; text-decoration: none; }
"""


def cards(rows, cols=3):
    out = []
    for row in rows:
        cells = "".join(
            f'<div class="cardx"{f" id={i!r}" if i else ""}><div class="l">{label}{INFO}</div><div class="v">{value}</div></div>'
            for label, value, *rest in row
            for i in [rest[0] if rest else None]
        )
        out.append(f'<div class="cards c{len(row)}">{cells}</div>')
    return "".join(out)


def table(head, rows, more=None, tid=None):
    th = "".join(f"<th>{h}</th>" for h in head)
    tr = "".join("<tr>" + "".join(f"<td>{c}</td>" for c in r) + "</tr>" for r in rows)
    if more:
        tr += f'<tr class="more"><td colspan="{len(head)}">{more}</td></tr>'
    return f'<table class="rt"{f" id={tid!r}" if tid else ""}><tr>{th}</tr>{tr}</table>'


# 1. The sales report email, styled like notifications/sales-report.tpl
EMAIL_STYLE = """
.mail { display: flex; height: 100%; background: #f4f4f5; }
.inbox { width: 320px; flex: none; background: #fff; border-right: 1px solid var(--line); }
.inbox .hd { padding: 18px 20px; font-weight: 650; font-size: 18px; border-bottom: 1px solid var(--line); }
.msg { padding: 14px 20px; border-bottom: 1px solid var(--line); font-size: 14.5px; }
.msg .from { display: flex; justify-content: space-between; font-weight: 650; color: var(--text); }
.msg .from span { color: var(--soft); font-weight: 500; font-size: 13px; }
.msg .sub { margin-top: 3px; color: var(--text); }
.msg .pre { margin-top: 2px; color: var(--soft); font-size: 13.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.msg.on { background: #eef2ff; }
.msg.on .sub { font-weight: 600; }
.read { flex: 1; padding: 22px 0 22px 44px; overflow: hidden; }
.em { width: 640px; margin: 0; background: #fff; border-radius: 14px; border: 1px solid #ececf1; padding: 26px 30px; }
.em .k { font-size: 12.5px; letter-spacing: .9px; text-transform: uppercase; color: #6b7280; }
.em .t { font-size: 26px; font-weight: 650; color: #111827; margin-top: 4px; }
.em hr { border: 0; border-top: 1px solid #ececf1; margin: 16px -30px; }
.em .section { margin-top: 0; }
.em .rt .more td { color: #737373; }
"""

email = page(
    "Your key numbers, <mark>in every inbox</mark>",
    "Daily, weekly, every 2 weeks or monthly, around 08:00 in your store's time zone.",
    f"""
<div class="frame"><div class="mail">
  <div class="inbox">
    <div class="hd">Inbox</div>
    <div class="msg on" id="msg"><div class="from">Harbor &amp; Pine<span>8:00 AM</span></div>
      <div class="sub">Sales report: Oct 5 &ndash; Oct 11, 2026 &mdash; 214 orders, $18,940.50</div>
      <div class="pre">Here's how the store did last week.</div></div>
    <div class="msg"><div class="from">Harbor &amp; Pine<span>8:10 AM</span></div>
      <div class="sub">Customers: Oct 5 &ndash; Oct 11, 2026 &mdash; 188 bought, 61 new</div>
      <div class="pre">Who bought from you last week.</div></div>
    <div class="msg"><div class="from">Harbor &amp; Pine<span>8:25 AM</span></div>
      <div class="sub">Abandoned carts: Oct 5 &ndash; Oct 11, 2026 &mdash; 96 abandoned, 23 recovered</div>
      <div class="pre">Carts left behind last week.</div></div>
    <div class="msg"><div class="from">Harbor &amp; Pine<span>Mon</span></div>
      <div class="sub">Inventory: 3 out of stock, 9 running low</div>
      <div class="pre">What needs restocking.</div></div>
    <div id="inbox-end"></div>
  </div>
  <div class="read"><div class="em">
    <div class="k">Sales report</div><div class="t">Oct 5 &ndash; Oct 11, 2026</div><hr>
    <div class="section">Summary</div>
    <div id="summary">{cards([
        [("Revenue", "$18,940.50"), ("Previous revenue", "$16,212.00"), ("Revenue change", '<span class="up">&#9650; 16.83%</span>')],
        [("Orders", "214"), ("Previous orders", "197"), ("Order change", '<span class="up">&#9650; 8.63%</span>')],
    ])}</div>
    <div class="section" style="margin-top:16px">Top products</div>
    {table(["Product", "Quantity", "Revenue"], [
        ["Merino Crew Sweater", "58", "$5,510.00"],
        ["Canvas Weekender Bag", "31", "$3,720.00"],
        ["Waxed Field Jacket", "14", "$2,660.00"],
        ["Linen Camp Shirt", "36", "$2,340.00"],
        ["Leather Card Holder", "44", "$1,540.00"],
    ], more="5 more on this report in your dashboard", tid="top")}
  </div></div>
</div></div>
<div class="ring" id="ring-msg" data-ring="#msg" data-pad="-2"></div>
<div class="callout" data-at="#inbox-end" data-side="below start" data-gap="34" data-dx="20"><b>1</b>Arrives at 08:00 your time</div>
<div class="ring" id="ring-summary" data-ring="#summary" data-pad="8"></div>
<div class="callout" data-at="#ring-summary" data-side="right"><b>2</b>Each figure against last period</div>
<div class="ring" id="ring-top" data-ring="#top" data-pad="6"></div>
<div class="callout" data-at="#ring-top" data-side="right"><b>3</b>Best sellers by revenue</div>
""",
    deco=0,
    style=EMAIL_STYLE,
)

# 2. A sales report page under Reporting
report_page = page(
    "Every report <mark>kept in your dashboard</mark>",
    "Open any past period under Reporting, with the same figures as the email and more.",
    f"""
<div class="frame"><div class="dash">
  {sidebar("Reporting", REPORTS, "Sales reports")}
  <div class="main" style="max-width:860px">
    <div class="crumb">&larr; Sales reports</div>
    <div class="head"><div class="title" id="title">Oct 5 &ndash; Oct 11, 2026</div></div>
    <div class="section" style="margin-top:4px">Sales report summary</div>
    <div id="summary">{cards([
        [("Revenue", "$18,940.50"), ("Previous revenue", "$16,212.00"), ("Revenue change", '<span class="up">&#9650; 16.83%</span>')],
        [("Orders", "214"), ("Previous orders", "197"), ("Order change", '<span class="up">&#9650; 8.63%</span>')],
        [("Average order value", "$88.51"), ("Items sold", "402")],
        [("New customers", "61"), ("Returning customers", "127", "returning")],
    ])}</div>
    <div class="section">Top products</div>
    {table(["Product", "Quantity", "Revenue", ""], [
        ["Merino Crew Sweater", "58", "$5,510.00", '<a>View product</a>'],
        ["Canvas Weekender Bag", "31", "$3,720.00", '<a>View product</a>'],
        ["Waxed Field Jacket", "14", "$2,660.00", '<a>View product</a>'],
        ["Linen Camp Shirt", "36", "$2,340.00", '<a>View product</a>'],
        ["Leather Card Holder", "44", "$1,540.00", '<a>View product</a>'],
    ], more="Show 5 more", tid="top")}
  </div>
</div></div>
<div class="callout" data-at="#title" data-side="right" data-gap="36"><b>1</b>Every period saved under Reporting</div>
<div class="ring" id="ring-returning" data-ring="#returning" data-pad="5"></div>
<div class="callout" data-at="#ring-returning" data-side="right"><b>2</b>New versus returning</div>
<div class="ring" id="ring-top" data-ring="#top" data-pad="5"></div>
<div class="callout" data-at="#ring-top" data-side="right"><b>3</b>Links to each product</div>
""",
    deco=1,
)

# 3. Abandoned cart and subscription reports side by side
HALF_STYLE = """
.frame.half-l, .frame.half-r { width: 712px; }
.half .title { font-size: 24px; }
.half .cardx .l { white-space: nowrap; }
.half .cardx { padding: 11px 12px; }
"""

carts_subs = page(
    "Abandoned carts and <mark>subscriptions</mark> too",
    "See what came back, what's left in carts, and how your recurring revenue is moving.",
    f"""
<div class="frame half-l"><div class="pad half">
  <div class="crumb">&larr; Abandoned cart reports</div>
  <div class="head"><div class="title">Oct 5 &ndash; Oct 11, 2026</div></div>
  <div class="section" style="margin-top:2px">Abandoned cart report summary</div>
  <div id="recovered">{cards([
      [("Abandoned carts", "96"), ("Abandoned change", '<span class="flat">&#9660; 7.69%</span>'), ("Still open", "73")],
      [("Recovered carts", "23"), ("Recovery rate", "23.96%"), ("Recovered revenue", "$2,184.00")],
  ])}</div>
  <div class="section">Products left in carts</div>
  {table(["Product", "Carts", "Value"], [
      ["Waxed Field Jacket", "12", "$2,280.00"],
      ["Canvas Weekender Bag", "15", "$1,800.00"],
      ["Merino Crew Sweater", "17", "$1,615.00"],
  ], tid="left")}
</div></div>
<div class="frame half-r"><div class="pad half">
  <div class="crumb">&larr; Subscription reports</div>
  <div class="head"><div class="title">Oct 5 &ndash; Oct 11, 2026</div></div>
  <div class="section" style="margin-top:2px">Subscription report summary</div>
  <div id="mrr">{cards([
      [("Active subscriptions", "412"), ("Monthly recurring revenue", "$9,876.00"), ("On trial", "38")],
      [("New subscriptions", "27"), ("New change", '<span class="up">&#9650; 12.5%</span>'), ("Net change", "19")],
  ])}</div>
  <div class="section">Failed renewals</div>
  {table(["Customer", "Plan", "Amount due", "Status"], [
      ["Priya Raman", "Coffee Club &mdash; Monthly", "$24.00", "Past due"],
      ["Tom Becker", "Coffee Club &mdash; Every 3 months", "$66.00", "Unpaid"],
  ], tid="failed")}
</div></div>
<div class="ring" id="ring-recovered" data-ring="#recovered .cards:nth-child(2)" data-pad="5"></div>
<div class="callout" data-at="#left" data-side="below start" data-gap="26"><b>1</b>Carts that came back as orders</div>
<div class="ring" id="ring-failed" data-ring="#failed" data-pad="5"></div>
<div class="callout" data-at="#failed" data-side="below end" data-gap="26"><b>2</b>Failed renewals to follow up</div>
""",
    deco=0,
    style=HALF_STYLE,
)

# 4. The settings page, with the Actions menu open
SETTINGS_STYLE = """
.set { border: 1px solid var(--line); border-radius: 12px; margin-top: 16px; background: #fff; }
.set .top { padding: 16px 20px; border-bottom: 1px solid var(--line); }
.set .top b { font-size: 16px; font-weight: 600; }
.set .top div { font-size: 13.5px; color: var(--soft); margin-top: 2px; }
.set .body { padding: 16px 20px; }
.row { display: flex; align-items: center; font-size: 15px; margin-bottom: 14px; }
.toggle.off { background: #d4d4d8; }
.toggle.off::after { right: auto; left: 3px; }
.chip { display: inline-block; background: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 6px; padding: 3px 9px; font-size: 13.5px; margin-right: 6px; }
.lbl { font-size: 14px; color: #3f3f46; margin: 4px 0 6px; font-weight: 500; }
.inp { border: 1px solid #d4d4d8; border-radius: 8px; padding: 8px 12px; font-size: 14.5px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.inp.ph { color: #a1a1aa; }
.divide { border-top: 1px solid var(--line); margin: 6px -20px 18px; }
.sh b { font-size: 15px; font-weight: 600; } .sh div { font-size: 13px; color: var(--soft); margin: 2px 0 12px; }
.rtabs { display: flex; gap: 18px; font-size: 14px; color: var(--soft); border-bottom: 1px solid var(--line); margin-bottom: 14px; }
.rtabs div { padding-bottom: 8px; } .rtabs .on { color: var(--text); font-weight: 600; border-bottom: 2px solid var(--text); }
.appicon { width: 46px; height: 46px; border-radius: 10px; }
.apphead { display: flex; align-items: center; gap: 14px; }
"""

settings = page(
    "Set it once, <mark>send to the right people</mark>",
    "Everyone on the main list gets every report. Add extra people to any single report.",
    f"""
<div class="frame"><div class="dash">
  {sidebar(None, admin="Apps")}
  <div class="main">
    <div class="crumb">&larr; Apps</div>
    <div class="head">
      <div class="apphead"><img class="appicon" src="data:image/png;base64,{ICON}"><div><div class="title" style="font-size:24px">Report Pilot</div><div class="subtle">Scheduled store reports, delivered by email and kept in your dashboard</div></div></div>
      <div class="buttons"><span class="button" id="actions">Actions{CHEVRON}</span><span class="button dark">Save settings</span></div>
    </div>
    <div class="tabs"><div>Overview</div><div class="on">Settings</div><div>Versions</div></div>
    <div class="set">
      <div class="top"><b>Reports</b><div>Choose which reports are emailed, how often each one runs, and who receives them.</div></div>
      <div class="body">
        <div class="row"><span class="toggle"></span>Send scheduled reports</div>
        <div class="lbl">Recipients</div>
        <div class="inp" id="recipients"><span><span class="chip">owner@example.com &times;</span><span class="chip">finance@example.com &times;</span></span></div>
        <div class="lbl">Time zone</div>
        <div class="inp" id="tz" style="width:46%">Pacific Daylight Time{CHEVRON}</div>
        <div class="divide"></div>
        <div class="sh"><b>Each report</b><div>Switch each report on, choose how often it runs, and add anyone who should get only that report.</div></div>
        <div class="rtabs"><div>Sales</div><div>Customers</div><div class="on">Inventory</div><div>Products</div><div>Discounts</div><div>Abandoned carts</div><div>Subscriptions</div></div>
        <div class="row"><span class="toggle"></span>Send the inventory report</div>
        <div class="lbl">Also send this report to</div>
        <div class="inp" id="extra" style="width:60%"><span><span class="chip">warehouse@example.com &times;</span></span></div>
      </div>
    </div>
  </div>
</div></div>
<div class="menu" data-at="#actions" data-side="below end" data-gap="8" style="width:250px">
  <div class="mi app" id="sendnow">Send a report now</div><div class="mi">Disable app</div><hr><div class="mi danger">Uninstall app</div>
</div>
<div class="ring" id="ring-send" data-ring="#sendnow" data-pad="3"></div>
<div class="callout" data-at="#ring-send" data-side="left"><b>1</b>Send any report right now</div>
<div class="ring" id="ring-tz" data-ring="#tz" data-pad="5"></div>
<div class="callout" data-at="#ring-tz" data-side="right"><b>2</b>Mornings in your time zone</div>
<div class="ring" id="ring-extra" data-ring="#extra" data-pad="5"></div>
<div class="callout" data-at="#ring-extra" data-side="right"><b>3</b>Extra people for one report</div>
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
p {{ font-size: 30px; color: #52556e; line-height: 1.35; max-width: 600px; }}
.pills {{ display: flex; gap: 14px; margin-top: 30px; }}
.pills span {{ border: 2px solid #6366f1; color: #4338ca; border-radius: 999px; padding: 9px 20px; font-size: 22px; }}
</style></head><body>
<img class="mark" src="data:image/png;base64,{ICON}">
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

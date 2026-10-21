<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Inventory report: {{ period_label }}</title>
    <style>
      @media only screen and (max-width: 480px) {
        .rp-pad { padding-left: 16px !important; padding-right: 16px !important; }
        .rp-card { display: block !important; width: auto !important; }
        .rp-gap { display: block !important; width: auto !important; height: 12px !important; }
        .rp-th { padding: 8px 6px !important; font-size: 11px !important; }
        .rp-td { padding: 10px 6px !important; font-size: 12px !important; }
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f5f7;">
  {% if content.intro %}<div style="display:none; max-height:0; max-width:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#f4f5f7; opacity:0;">{{ content.intro }}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>{% endif %}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f5f7;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px; background-color:#ffffff; border-radius:12px; overflow:hidden; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

            <tr><td style="height:4px; line-height:4px; font-size:0; background-color:#4f46e5;">&nbsp;</td></tr>
            <!-- Header -->
            <tr>
              <td class="rp-pad" style="padding:28px 32px 20px 32px; border-bottom:1px solid #e6e8eb;">
                <p style="margin:0 0 6px 0; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:#6b7280;">Inventory report</p>
                <h1 style="margin:0; font-size:22px; line-height:1.3; color:#111827; font-weight:600;">Stock as of {{ period_label }}</h1>
                {% if content.intro %}
                  <p style="margin:10px 0 0 0; font-size:14px; line-height:1.5; color:#6b7280;">{{ content.intro }}</p>
                {% endif %}
              </td>
            </tr>

            <!-- Built from the report's dashboard view (content/inventoryreports.json): same sections, figures and columns. -->
            <tr>
              <td class="rp-pad" style="padding:24px 32px 0 32px;">
                <h2 style="margin:0 0 12px 0; font-size:14px; line-height:20px; font-weight:600; color:#171717;">Summary</h2>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                  <tr><td class="rp-card" width="50%" valign="top" style="width:50%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Out of stock</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if out_of_stock_count == nil or out_of_stock_count == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{% assign rp_n = out_of_stock_count | round: 0 %}{% if rp_n < 0 %}-{% assign rp_n = rp_n | abs %}{% endif %}{% if rp_n >= 1000000 %}{{ rp_n | divided_by: 1000000 | floor }},{{ rp_n | divided_by: 1000 | floor | modulo: 1000 | prepend: "00" | slice: -3, 3 }},{{ rp_n | modulo: 1000 | prepend: "00" | slice: -3, 3 }}{% elsif rp_n >= 1000 %}{{ rp_n | divided_by: 1000 | floor }},{{ rp_n | modulo: 1000 | prepend: "00" | slice: -3, 3 }}{% else %}{{ rp_n }}{% endif %}{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="50%" valign="top" style="width:50%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Low stock</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if low_stock_count == nil or low_stock_count == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{% assign rp_n = low_stock_count | round: 0 %}{% if rp_n < 0 %}-{% assign rp_n = rp_n | abs %}{% endif %}{% if rp_n >= 1000000 %}{{ rp_n | divided_by: 1000000 | floor }},{{ rp_n | divided_by: 1000 | floor | modulo: 1000 | prepend: "00" | slice: -3, 3 }},{{ rp_n | modulo: 1000 | prepend: "00" | slice: -3, 3 }}{% elsif rp_n >= 1000 %}{{ rp_n | divided_by: 1000 | floor }},{{ rp_n | modulo: 1000 | prepend: "00" | slice: -3, 3 }}{% else %}{{ rp_n }}{% endif %}{% endif %}</p></td></tr>
                </table>
                {% if truncated %}
                <p style="margin:8px 0 0 0; font-size:12px; line-height:18px; color:#737373;">This store has more products, variants or recent orders than the report reads, so some items may be missing and the counts and days left are approximate.</p>
                {% endif %}
              </td>
            </tr>

            <tr>
              <td class="rp-pad" style="padding:24px 32px 0 32px;">
                <h2 style="margin:0 0 12px 0; font-size:14px; line-height:20px; font-weight:600; color:#171717;">Items</h2>
                {% if items.size > 0 %}
                <table class="rp-table" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border:1px solid #e5e5e5; border-radius:6px; border-collapse:separate; border-spacing:0; background-color:#ffffff;">
                  <tr><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:left;">Product</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Stock</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Est. days left</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Sold (30 days)</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">SKU</th></tr>
                  {% for row in items limit: 10 %}
                  <tr><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:left;">{% if row.name == nil or row.name == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.name }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.stock_level == nil or row.stock_level == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{% assign rp_n = row.stock_level | round: 0 %}{% if rp_n < 0 %}-{% assign rp_n = rp_n | abs %}{% endif %}{% if rp_n >= 1000000 %}{{ rp_n | divided_by: 1000000 | floor }},{{ rp_n | divided_by: 1000 | floor | modulo: 1000 | prepend: "00" | slice: -3, 3 }},{{ rp_n | modulo: 1000 | prepend: "00" | slice: -3, 3 }}{% elsif rp_n >= 1000 %}{{ rp_n | divided_by: 1000 | floor }},{{ rp_n | modulo: 1000 | prepend: "00" | slice: -3, 3 }}{% else %}{{ rp_n }}{% endif %}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.days_of_cover == nil or row.days_of_cover == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{% assign rp_n = row.days_of_cover | round: 0 %}{% if rp_n < 0 %}-{% assign rp_n = rp_n | abs %}{% endif %}{% if rp_n >= 1000000 %}{{ rp_n | divided_by: 1000000 | floor }},{{ rp_n | divided_by: 1000 | floor | modulo: 1000 | prepend: "00" | slice: -3, 3 }},{{ rp_n | modulo: 1000 | prepend: "00" | slice: -3, 3 }}{% elsif rp_n >= 1000 %}{{ rp_n | divided_by: 1000 | floor }},{{ rp_n | modulo: 1000 | prepend: "00" | slice: -3, 3 }}{% else %}{{ rp_n }}{% endif %}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.sold_30d == nil or row.sold_30d == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{% assign rp_n = row.sold_30d | round: 0 %}{% if rp_n < 0 %}-{% assign rp_n = rp_n | abs %}{% endif %}{% if rp_n >= 1000000 %}{{ rp_n | divided_by: 1000000 | floor }},{{ rp_n | divided_by: 1000 | floor | modulo: 1000 | prepend: "00" | slice: -3, 3 }},{{ rp_n | modulo: 1000 | prepend: "00" | slice: -3, 3 }}{% elsif rp_n >= 1000 %}{{ rp_n | divided_by: 1000 | floor }},{{ rp_n | modulo: 1000 | prepend: "00" | slice: -3, 3 }}{% else %}{{ rp_n }}{% endif %}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.sku == nil or row.sku == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.sku }}{% endif %}</td></tr>
                  {% endfor %}
                  {% if items.size > 10 %}<tr><td colspan="5" style="padding:12px; font-size:14px; line-height:20px; color:#737373; border-top:1px solid #e5e5e5; text-align:center;">{% if dashboard_url %}<a href="{{ dashboard_url }}/{{ id }}" style="color:#4338ca; text-decoration:none;">{{ items.size | minus: 10 }} more on this report in your dashboard</a>{% else %}{{ items.size | minus: 10 }} more on this report in your dashboard{% endif %}</td></tr>{% endif %}
                  {% if items_hidden > 0 %}<tr><td colspan="5" style="padding:12px; font-size:13px; line-height:18px; color:#737373; border-top:1px solid #e5e5e5;">{% assign rp_n = items_hidden | round: 0 %}{% if rp_n < 0 %}-{% assign rp_n = rp_n | abs %}{% endif %}{% if rp_n >= 1000000 %}{{ rp_n | divided_by: 1000000 | floor }},{{ rp_n | divided_by: 1000 | floor | modulo: 1000 | prepend: "00" | slice: -3, 3 }},{{ rp_n | modulo: 1000 | prepend: "00" | slice: -3, 3 }}{% elsif rp_n >= 1000 %}{{ rp_n | divided_by: 1000 | floor }},{{ rp_n | modulo: 1000 | prepend: "00" | slice: -3, 3 }}{% else %}{{ rp_n }}{% endif %} more low or out-of-stock items were not listed. Each report lists up to 50.</td></tr>{% endif %}
                </table>
                <p style="margin:8px 0 0 0; font-size:12px; line-height:18px; color:#737373;">Est. days left is an estimate: current stock divided by the average daily sales over the last 30 days. &mdash; means none sold in that time.</p>
                {% else %}
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border:1px solid #e5e5e5; border-radius:6px; border-collapse:separate; border-spacing:0; background-color:#ffffff;"><tr><td style="padding:16px; font-size:14px; line-height:20px; color:#737373;">No products or variants are out of stock or running low.</td></tr></table>
                {% endif %}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td class="rp-pad" style="padding:24px 32px 28px 32px;">
                <p style="margin:0; font-size:12px; line-height:1.6; color:#9ca3af; border-top:1px solid #e6e8eb; padding-top:16px;">
                  {{ content.footer }}
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>

<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{{ subject }}</title>
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
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f5f7;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px; background-color:#ffffff; border-radius:12px; overflow:hidden; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

            <!-- Header -->
            <tr>
              <td class="rp-pad" style="padding:28px 32px 20px 32px; border-bottom:1px solid #e6e8eb;">
                <p style="margin:0 0 6px 0; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:#6b7280;">Sales report</p>
                <h1 style="margin:0; font-size:22px; line-height:1.3; color:#111827; font-weight:600;">{{ period_label }}</h1>
                {% if content.intro %}
                  <p style="margin:10px 0 0 0; font-size:14px; line-height:1.5; color:#6b7280;">{{ content.intro }}</p>
                {% endif %}
              </td>
            </tr>

            <!-- Built from the report's dashboard view (content/reports.json): same sections, figures and columns. -->
            <tr>
              <td class="rp-pad" style="padding:24px 32px 0 32px;">
                <h2 style="margin:0 0 12px 0; font-size:14px; line-height:20px; font-weight:600; color:#171717;">Summary</h2>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                  <tr><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Revenue</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if grand_total == nil or grand_total == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ grand_total | currency }}{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Previous revenue</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if prev_grand_total == nil or prev_grand_total == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ prev_grand_total | currency }}{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Revenue change</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if revenue_change_pct == nil %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% elsif revenue_change_pct > 0 %}<span style="color:#059669; white-space:nowrap;">&#9650; {% assign rp_v = revenue_change_pct | abs | round: 2 %}{% assign rp_w = rp_v | floor %}{% assign rp_f = rp_v | minus: rp_w | round: 2 %}{% if rp_w >= 1000000 %}{{ rp_w | divided_by: 1000000 | floor }},{{ rp_w | divided_by: 1000 | floor | modulo: 1000 | prepend: "00" | slice: -3, 3 }},{{ rp_w | modulo: 1000 | prepend: "00" | slice: -3, 3 }}{% elsif rp_w >= 1000 %}{{ rp_w | divided_by: 1000 | floor }},{{ rp_w | modulo: 1000 | prepend: "00" | slice: -3, 3 }}{% else %}{{ rp_w }}{% endif %}{{ rp_f | remove_first: "0" }}%</span>{% elsif revenue_change_pct < 0 %}<span style="color:#dc2626; white-space:nowrap;">&#9660; {% assign rp_v = revenue_change_pct | abs | round: 2 %}{% assign rp_w = rp_v | floor %}{% assign rp_f = rp_v | minus: rp_w | round: 2 %}{% if rp_w >= 1000000 %}{{ rp_w | divided_by: 1000000 | floor }},{{ rp_w | divided_by: 1000 | floor | modulo: 1000 | prepend: "00" | slice: -3, 3 }},{{ rp_w | modulo: 1000 | prepend: "00" | slice: -3, 3 }}{% elsif rp_w >= 1000 %}{{ rp_w | divided_by: 1000 | floor }},{{ rp_w | modulo: 1000 | prepend: "00" | slice: -3, 3 }}{% else %}{{ rp_w }}{% endif %}{{ rp_f | remove_first: "0" }}%</span>{% else %}<span style="color:#a3a3a3;">0%</span>{% endif %}</p></td></tr>
                </table>
                <div class="rp-space" style="height:12px; line-height:12px; font-size:0;">&nbsp;</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                  <tr><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Orders</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if order_count == nil or order_count == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ order_count }}{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Previous orders</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if prev_order_count == nil or prev_order_count == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ prev_order_count }}{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Order change</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if order_change_pct == nil %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% elsif order_change_pct > 0 %}<span style="color:#059669; white-space:nowrap;">&#9650; {% assign rp_v = order_change_pct | abs | round: 2 %}{% assign rp_w = rp_v | floor %}{% assign rp_f = rp_v | minus: rp_w | round: 2 %}{% if rp_w >= 1000000 %}{{ rp_w | divided_by: 1000000 | floor }},{{ rp_w | divided_by: 1000 | floor | modulo: 1000 | prepend: "00" | slice: -3, 3 }},{{ rp_w | modulo: 1000 | prepend: "00" | slice: -3, 3 }}{% elsif rp_w >= 1000 %}{{ rp_w | divided_by: 1000 | floor }},{{ rp_w | modulo: 1000 | prepend: "00" | slice: -3, 3 }}{% else %}{{ rp_w }}{% endif %}{{ rp_f | remove_first: "0" }}%</span>{% elsif order_change_pct < 0 %}<span style="color:#dc2626; white-space:nowrap;">&#9660; {% assign rp_v = order_change_pct | abs | round: 2 %}{% assign rp_w = rp_v | floor %}{% assign rp_f = rp_v | minus: rp_w | round: 2 %}{% if rp_w >= 1000000 %}{{ rp_w | divided_by: 1000000 | floor }},{{ rp_w | divided_by: 1000 | floor | modulo: 1000 | prepend: "00" | slice: -3, 3 }},{{ rp_w | modulo: 1000 | prepend: "00" | slice: -3, 3 }}{% elsif rp_w >= 1000 %}{{ rp_w | divided_by: 1000 | floor }},{{ rp_w | modulo: 1000 | prepend: "00" | slice: -3, 3 }}{% else %}{{ rp_w }}{% endif %}{{ rp_f | remove_first: "0" }}%</span>{% else %}<span style="color:#a3a3a3;">0%</span>{% endif %}</p></td></tr>
                </table>
                <div class="rp-space" style="height:12px; line-height:12px; font-size:0;">&nbsp;</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                  <tr><td class="rp-card" width="50%" valign="top" style="width:50%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Average order value</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if average_order_value == nil or average_order_value == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ average_order_value | currency }}{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="50%" valign="top" style="width:50%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Items sold</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if item_quantity == nil or item_quantity == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ item_quantity }}{% endif %}</p></td></tr>
                </table>
                <div class="rp-space" style="height:12px; line-height:12px; font-size:0;">&nbsp;</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                  <tr><td class="rp-card" width="50%" valign="top" style="width:50%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">New customers</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if new_customer_count == nil or new_customer_count == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ new_customer_count }}{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="50%" valign="top" style="width:50%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Returning customers</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if returning_customer_count == nil or returning_customer_count == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ returning_customer_count }}{% endif %}</p></td></tr>
                </table>
                <div class="rp-space" style="height:12px; line-height:12px; font-size:0;">&nbsp;</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                  <tr><td class="rp-card" width="50%" valign="top" style="width:50%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Subtotal</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if sub_total == nil or sub_total == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ sub_total | currency }}{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="50%" valign="top" style="width:50%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Discounts</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if discount_total == nil or discount_total == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ discount_total | currency }}{% endif %}</p></td></tr>
                </table>
                <div class="rp-space" style="height:12px; line-height:12px; font-size:0;">&nbsp;</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                  <tr><td class="rp-card" width="50%" valign="top" style="width:50%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Shipping</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if shipping_total == nil or shipping_total == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ shipping_total | currency }}{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="50%" valign="top" style="width:50%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Tax</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if tax_total == nil or tax_total == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ tax_total | currency }}{% endif %}</p></td></tr>
                </table>
                <div class="rp-space" style="height:12px; line-height:12px; font-size:0;">&nbsp;</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                  <tr><td class="rp-card" width="50%" valign="top" style="width:50%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Cancelled orders</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if cancelled_count == nil or cancelled_count == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ cancelled_count }}{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="50%" valign="top" style="width:50%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Unpaid orders</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if unpaid_count == nil or unpaid_count == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ unpaid_count }}{% endif %}</p></td></tr>
                </table>
              </td>
            </tr>

            {% if top_products.size > 0 %}
            <tr>
              <td class="rp-pad" style="padding:24px 32px 0 32px;">
                <h2 style="margin:0 0 12px 0; font-size:14px; line-height:20px; font-weight:600; color:#171717;">Top products</h2>
                <table class="rp-table" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border:1px solid #e5e5e5; border-radius:6px; border-collapse:separate; border-spacing:0; background-color:#ffffff;">
                  <tr><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:left;">Product</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Quantity</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Revenue</th></tr>
                  {% for row in top_products limit: 5 %}
                  <tr><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:left;">{% if row.name == nil or row.name == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.name }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.quantity == nil or row.quantity == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.quantity }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.revenue == nil or row.revenue == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.revenue | currency }}{% endif %}</td></tr>
                  {% endfor %}
                  {% if top_products.size > 5 %}<tr><td colspan="3" style="padding:12px; font-size:14px; line-height:20px; color:#737373; border-top:1px solid #e5e5e5; text-align:center;">{{ top_products.size | minus: 5 }} more on this report in your dashboard</td></tr>{% endif %}
                </table>
                {% if top_products_truncated %}
                <p style="margin:8px 0 0 0; font-size:12px; line-height:18px; color:#737373;">This period had more orders than the ranking reads, so the list covers only part of it.</p>
                {% endif %}
              </td>
            </tr>
            {% endif %}

            {% if daily_totals.size > 0 %}
            <tr>
              <td class="rp-pad" style="padding:24px 32px 0 32px;">
                <h2 style="margin:0 0 12px 0; font-size:14px; line-height:20px; font-weight:600; color:#171717;">Daily breakdown</h2>
                <table class="rp-table" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border:1px solid #e5e5e5; border-radius:6px; border-collapse:separate; border-spacing:0; background-color:#ffffff;">
                  <tr><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:left;">Date</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Orders</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Revenue</th></tr>
                  {% for row in daily_totals limit: 7 %}
                  <tr><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:left;">{% if row.date == nil or row.date == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{% assign rp_d = row.date | split: "-" %}{% assign rp_m = rp_d[1] | minus: 1 %}{% assign rp_months = "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec" | split: "," %}{{ rp_months[rp_m] }} {{ rp_d[2] | plus: 0 }}, {{ rp_d[0] }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.orders == nil or row.orders == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.orders }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.revenue == nil or row.revenue == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.revenue | currency }}{% endif %}</td></tr>
                  {% endfor %}
                  {% if daily_totals.size > 7 %}<tr><td colspan="3" style="padding:12px; font-size:14px; line-height:20px; color:#737373; border-top:1px solid #e5e5e5; text-align:center;">{{ daily_totals.size | minus: 7 }} more on this report in your dashboard</td></tr>{% endif %}
                </table>
              </td>
            </tr>
            {% endif %}

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

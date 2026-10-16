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
                <p style="margin:0 0 6px 0; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:#6b7280;">Product report</p>
                <h1 style="margin:0; font-size:22px; line-height:1.3; color:#111827; font-weight:600;">{{ period_label }}</h1>
                {% if content.intro %}
                  <p style="margin:10px 0 0 0; font-size:14px; line-height:1.5; color:#6b7280;">{{ content.intro }}</p>
                {% endif %}
              </td>
            </tr>

            <!-- Built from the report's dashboard view (content/productreports.json): same sections, figures and columns. -->
            <tr>
              <td class="rp-pad" style="padding:24px 32px 0 32px;">
                <h2 style="margin:0 0 12px 0; font-size:14px; line-height:20px; font-weight:600; color:#171717;">Summary</h2>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                  <tr><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Products sold</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if products_sold_count == nil or products_sold_count == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ products_sold_count }}{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Previous period products sold</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if prev_products_sold_count == nil or prev_products_sold_count == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ prev_products_sold_count }}{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Products with no sales</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if unsold_count == nil or unsold_count == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ unsold_count }}{% endif %}</p></td></tr>
                </table>
                <div class="rp-space" style="height:12px; line-height:12px; font-size:0;">&nbsp;</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                  <tr><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Units sold</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if units_sold == nil or units_sold == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ units_sold }}{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Item revenue</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if item_revenue == nil or item_revenue == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ item_revenue | currency }}{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Best sellers' share</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if top_share_pct == nil or top_share_pct == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ top_share_pct }}%{% endif %}</p></td></tr>
                </table>
              </td>
            </tr>

            {% if top_products.size > 0 %}
            <tr>
              <td class="rp-pad" style="padding:24px 32px 0 32px;">
                <h2 style="margin:0 0 12px 0; font-size:14px; line-height:20px; font-weight:600; color:#171717;">Best sellers</h2>
                <table class="rp-table" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border:1px solid #e5e5e5; border-radius:6px; border-collapse:separate; border-spacing:0; background-color:#ffffff;">
                  <tr><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:left;">Product</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Quantity</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Revenue</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Previous revenue</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Revenue change</th></tr>
                  {% for row in top_products limit: 5 %}
                  <tr><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:left;">{% if row.name == nil or row.name == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.name }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.quantity == nil or row.quantity == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.quantity }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.revenue == nil or row.revenue == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.revenue | currency }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.prev_revenue == nil or row.prev_revenue == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.prev_revenue | currency }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.revenue_change_pct == nil %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% elsif row.revenue_change_pct > 0 %}<span style="color:#059669; white-space:nowrap;">&#9650; {% assign rp_v = row.revenue_change_pct | abs | round: 2 %}{% assign rp_w = rp_v | floor %}{% assign rp_f = rp_v | minus: rp_w | round: 2 %}{% if rp_w >= 1000000 %}{{ rp_w | divided_by: 1000000 | floor }},{{ rp_w | divided_by: 1000 | floor | modulo: 1000 | prepend: "00" | slice: -3, 3 }},{{ rp_w | modulo: 1000 | prepend: "00" | slice: -3, 3 }}{% elsif rp_w >= 1000 %}{{ rp_w | divided_by: 1000 | floor }},{{ rp_w | modulo: 1000 | prepend: "00" | slice: -3, 3 }}{% else %}{{ rp_w }}{% endif %}{{ rp_f | remove_first: "0" }}%</span>{% elsif row.revenue_change_pct < 0 %}<span style="color:#dc2626; white-space:nowrap;">&#9660; {% assign rp_v = row.revenue_change_pct | abs | round: 2 %}{% assign rp_w = rp_v | floor %}{% assign rp_f = rp_v | minus: rp_w | round: 2 %}{% if rp_w >= 1000000 %}{{ rp_w | divided_by: 1000000 | floor }},{{ rp_w | divided_by: 1000 | floor | modulo: 1000 | prepend: "00" | slice: -3, 3 }},{{ rp_w | modulo: 1000 | prepend: "00" | slice: -3, 3 }}{% elsif rp_w >= 1000 %}{{ rp_w | divided_by: 1000 | floor }},{{ rp_w | modulo: 1000 | prepend: "00" | slice: -3, 3 }}{% else %}{{ rp_w }}{% endif %}{{ rp_f | remove_first: "0" }}%</span>{% else %}<span style="color:#a3a3a3;">0%</span>{% endif %}</td></tr>
                  {% endfor %}
                  {% if top_products.size > 5 %}<tr><td colspan="5" style="padding:12px; font-size:14px; line-height:20px; color:#737373; border-top:1px solid #e5e5e5; text-align:center;">{{ top_products.size | minus: 5 }} more on this report in your dashboard</td></tr>{% endif %}
                </table>
              </td>
            </tr>
            {% endif %}

            {% if movers.size > 0 %}
            <tr>
              <td class="rp-pad" style="padding:24px 32px 0 32px;">
                <h2 style="margin:0 0 12px 0; font-size:14px; line-height:20px; font-weight:600; color:#171717;">Biggest movers</h2>
                <table class="rp-table" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border:1px solid #e5e5e5; border-radius:6px; border-collapse:separate; border-spacing:0; background-color:#ffffff;">
                  <tr><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:left;">Product</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Previous revenue</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Revenue</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Change</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Change %</th></tr>
                  {% for row in movers limit: 5 %}
                  <tr><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:left;">{% if row.name == nil or row.name == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.name }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.prev_revenue == nil or row.prev_revenue == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.prev_revenue | currency }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.revenue == nil or row.revenue == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.revenue | currency }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.change == nil or row.change == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.change | currency }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.revenue_change_pct == nil %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% elsif row.revenue_change_pct > 0 %}<span style="color:#059669; white-space:nowrap;">&#9650; {% assign rp_v = row.revenue_change_pct | abs | round: 2 %}{% assign rp_w = rp_v | floor %}{% assign rp_f = rp_v | minus: rp_w | round: 2 %}{% if rp_w >= 1000000 %}{{ rp_w | divided_by: 1000000 | floor }},{{ rp_w | divided_by: 1000 | floor | modulo: 1000 | prepend: "00" | slice: -3, 3 }},{{ rp_w | modulo: 1000 | prepend: "00" | slice: -3, 3 }}{% elsif rp_w >= 1000 %}{{ rp_w | divided_by: 1000 | floor }},{{ rp_w | modulo: 1000 | prepend: "00" | slice: -3, 3 }}{% else %}{{ rp_w }}{% endif %}{{ rp_f | remove_first: "0" }}%</span>{% elsif row.revenue_change_pct < 0 %}<span style="color:#dc2626; white-space:nowrap;">&#9660; {% assign rp_v = row.revenue_change_pct | abs | round: 2 %}{% assign rp_w = rp_v | floor %}{% assign rp_f = rp_v | minus: rp_w | round: 2 %}{% if rp_w >= 1000000 %}{{ rp_w | divided_by: 1000000 | floor }},{{ rp_w | divided_by: 1000 | floor | modulo: 1000 | prepend: "00" | slice: -3, 3 }},{{ rp_w | modulo: 1000 | prepend: "00" | slice: -3, 3 }}{% elsif rp_w >= 1000 %}{{ rp_w | divided_by: 1000 | floor }},{{ rp_w | modulo: 1000 | prepend: "00" | slice: -3, 3 }}{% else %}{{ rp_w }}{% endif %}{{ rp_f | remove_first: "0" }}%</span>{% else %}<span style="color:#a3a3a3;">0%</span>{% endif %}</td></tr>
                  {% endfor %}
                  {% if movers.size > 5 %}<tr><td colspan="5" style="padding:12px; font-size:14px; line-height:20px; color:#737373; border-top:1px solid #e5e5e5; text-align:center;">{{ movers.size | minus: 5 }} more on this report in your dashboard</td></tr>{% endif %}
                </table>
              </td>
            </tr>
            {% endif %}

            {% if slow_products.size > 0 %}
            <tr>
              <td class="rp-pad" style="padding:24px 32px 0 32px;">
                <h2 style="margin:0 0 12px 0; font-size:14px; line-height:20px; font-weight:600; color:#171717;">Slowest sellers</h2>
                <table class="rp-table" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border:1px solid #e5e5e5; border-radius:6px; border-collapse:separate; border-spacing:0; background-color:#ffffff;">
                  <tr><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:left;">Product</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Quantity</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Revenue</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Previous revenue</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Revenue change</th></tr>
                  {% for row in slow_products limit: 5 %}
                  <tr><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:left;">{% if row.name == nil or row.name == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.name }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.quantity == nil or row.quantity == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.quantity }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.revenue == nil or row.revenue == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.revenue | currency }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.prev_revenue == nil or row.prev_revenue == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.prev_revenue | currency }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.revenue_change_pct == nil %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% elsif row.revenue_change_pct > 0 %}<span style="color:#059669; white-space:nowrap;">&#9650; {% assign rp_v = row.revenue_change_pct | abs | round: 2 %}{% assign rp_w = rp_v | floor %}{% assign rp_f = rp_v | minus: rp_w | round: 2 %}{% if rp_w >= 1000000 %}{{ rp_w | divided_by: 1000000 | floor }},{{ rp_w | divided_by: 1000 | floor | modulo: 1000 | prepend: "00" | slice: -3, 3 }},{{ rp_w | modulo: 1000 | prepend: "00" | slice: -3, 3 }}{% elsif rp_w >= 1000 %}{{ rp_w | divided_by: 1000 | floor }},{{ rp_w | modulo: 1000 | prepend: "00" | slice: -3, 3 }}{% else %}{{ rp_w }}{% endif %}{{ rp_f | remove_first: "0" }}%</span>{% elsif row.revenue_change_pct < 0 %}<span style="color:#dc2626; white-space:nowrap;">&#9660; {% assign rp_v = row.revenue_change_pct | abs | round: 2 %}{% assign rp_w = rp_v | floor %}{% assign rp_f = rp_v | minus: rp_w | round: 2 %}{% if rp_w >= 1000000 %}{{ rp_w | divided_by: 1000000 | floor }},{{ rp_w | divided_by: 1000 | floor | modulo: 1000 | prepend: "00" | slice: -3, 3 }},{{ rp_w | modulo: 1000 | prepend: "00" | slice: -3, 3 }}{% elsif rp_w >= 1000 %}{{ rp_w | divided_by: 1000 | floor }},{{ rp_w | modulo: 1000 | prepend: "00" | slice: -3, 3 }}{% else %}{{ rp_w }}{% endif %}{{ rp_f | remove_first: "0" }}%</span>{% else %}<span style="color:#a3a3a3;">0%</span>{% endif %}</td></tr>
                  {% endfor %}
                  {% if slow_products.size > 5 %}<tr><td colspan="5" style="padding:12px; font-size:14px; line-height:20px; color:#737373; border-top:1px solid #e5e5e5; text-align:center;">{{ slow_products.size | minus: 5 }} more on this report in your dashboard</td></tr>{% endif %}
                </table>
              </td>
            </tr>
            {% endif %}

            {% if unsold_products.size > 0 %}
            <tr>
              <td class="rp-pad" style="padding:24px 32px 0 32px;">
                <h2 style="margin:0 0 12px 0; font-size:14px; line-height:20px; font-weight:600; color:#171717;">No sales</h2>
                <table class="rp-table" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border:1px solid #e5e5e5; border-radius:6px; border-collapse:separate; border-spacing:0; background-color:#ffffff;">
                  <tr><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:left;">Product</th></tr>
                  {% for row in unsold_products limit: 5 %}
                  <tr><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:left;">{% if row.name == nil or row.name == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.name }}{% endif %}</td></tr>
                  {% endfor %}
                  {% if unsold_products.size > 5 %}<tr><td colspan="1" style="padding:12px; font-size:14px; line-height:20px; color:#737373; border-top:1px solid #e5e5e5; text-align:center;">{{ unsold_products.size | minus: 5 }} more on this report in your dashboard</td></tr>{% endif %}
                  {% if unsold_hidden > 0 %}<tr><td colspan="1" style="padding:12px; font-size:13px; line-height:18px; color:#737373; border-top:1px solid #e5e5e5;">{{ unsold_hidden }} more products had no sales. Each report lists up to 10.</td></tr>{% endif %}
                </table>
              </td>
            </tr>
            {% endif %}

            {% if truncated %}
              <tr>
                <td style="padding:20px 32px 0 32px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fffbeb; border-radius:8px;">
                    <tr>
                      <td style="padding:14px 16px; font-size:13px; color:#92400e; line-height:1.6;">
                        This store has more records than a single report reads, so some figures cover only part of the period and counts are a lower bound.
                      </td>
                    </tr>
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

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
                <p style="margin:0 0 6px 0; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:#6b7280;">Discount report</p>
                <h1 style="margin:0; font-size:22px; line-height:1.3; color:#111827; font-weight:600;">{{ period_label }}</h1>
                {% if content.intro %}
                  <p style="margin:10px 0 0 0; font-size:14px; line-height:1.5; color:#6b7280;">{{ content.intro }}</p>
                {% endif %}
              </td>
            </tr>

            <!-- Built from the report's dashboard view (content/discountreports.json): same sections, figures and columns. -->
            <tr>
              <td class="rp-pad" style="padding:24px 32px 0 32px;">
                <h2 style="margin:0 0 12px 0; font-size:14px; line-height:20px; font-weight:600; color:#171717;">Summary</h2>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                  <tr><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Discounts given</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if discount_total == nil or discount_total == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ discount_total | currency }}{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Previous period discounts</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if prev_discount_total == nil or prev_discount_total == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ prev_discount_total | currency }}{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Discount change</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if discount_change_pct == nil %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% elsif discount_change_pct > 0 %}<span style="color:#525252; white-space:nowrap;">&#9650; {{ discount_change_pct }}%</span>{% elsif discount_change_pct < 0 %}<span style="color:#525252; white-space:nowrap;">&#9660; {{ discount_change_pct | abs }}%</span>{% else %}<span style="color:#a3a3a3;">0%</span>{% endif %}</p></td></tr>
                </table>
                <div class="rp-space" style="height:12px; line-height:12px; font-size:0;">&nbsp;</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                  <tr><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Orders</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if order_count == nil or order_count == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ order_count }}{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Discounted orders</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if discounted_order_count == nil or discounted_order_count == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ discounted_order_count }}{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Discounted orders %</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if discounted_order_pct == nil or discounted_order_pct == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ discounted_order_pct }}%{% endif %}</p></td></tr>
                </table>
                <div class="rp-space" style="height:12px; line-height:12px; font-size:0;">&nbsp;</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                  <tr><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Revenue</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if grand_total == nil or grand_total == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ grand_total | currency }}{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Discounted order revenue</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if discounted_revenue == nil or discounted_revenue == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ discounted_revenue | currency }}{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Discount rate</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if discount_rate_pct == nil or discount_rate_pct == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ discount_rate_pct }}%{% endif %}</p></td></tr>
                </table>
                <div class="rp-space" style="height:12px; line-height:12px; font-size:0;">&nbsp;</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                  <tr><td class="rp-card" width="50%" valign="top" style="width:50%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Discounted average order</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if discounted_aov == nil or discounted_aov == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ discounted_aov | currency }}{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="50%" valign="top" style="width:50%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Full-price average order</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if full_price_aov == nil or full_price_aov == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ full_price_aov | currency }}{% endif %}</p></td></tr>
                </table>
              </td>
            </tr>

            {% if discounts.size > 0 %}
            <tr>
              <td class="rp-pad" style="padding:24px 32px 0 32px;">
                <h2 style="margin:0 0 12px 0; font-size:14px; line-height:20px; font-weight:600; color:#171717;">Coupons and promotions</h2>
                <table class="rp-table" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border:1px solid #e5e5e5; border-radius:6px; border-collapse:separate; border-spacing:0; background-color:#ffffff;">
                  <tr><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:left;">Coupon or promotion</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Discount given</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Orders</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Order revenue</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Average discount</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Type</th></tr>
                  {% for row in discounts limit: 5 %}
                  <tr><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:left;">{% if row.label == nil or row.label == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.label }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.discount == nil or row.discount == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.discount | currency }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.orders == nil or row.orders == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.orders }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.revenue == nil or row.revenue == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.revenue | currency }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.average_discount == nil or row.average_discount == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.average_discount | currency }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.type == nil or row.type == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{% if row.type == "coupon" %}Coupon{% elsif row.type == "promotion" %}Promotion{% elsif row.type == "other" %}Other{% else %}{{ row.type }}{% endif %}{% endif %}</td></tr>
                  {% endfor %}
                  {% if discounts.size > 5 %}<tr><td colspan="6" style="padding:12px; font-size:14px; line-height:20px; color:#737373; border-top:1px solid #e5e5e5; text-align:center;">{{ discounts.size | minus: 5 }} more on this report in your dashboard</td></tr>{% endif %}
                  {% if discounts_hidden > 0 %}<tr><td colspan="6" style="padding:12px; font-size:13px; line-height:18px; color:#737373; border-top:1px solid #e5e5e5;">{{ discounts_hidden }} more coupons and promotions were not listed. Each report lists up to 10.</td></tr>{% endif %}
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

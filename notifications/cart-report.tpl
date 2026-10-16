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
                <p style="margin:0 0 6px 0; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:#6b7280;">Abandoned cart report</p>
                <h1 style="margin:0; font-size:22px; line-height:1.3; color:#111827; font-weight:600;">{{ period_label }}</h1>
                {% if content.intro %}
                  <p style="margin:10px 0 0 0; font-size:14px; line-height:1.5; color:#6b7280;">{{ content.intro }}</p>
                {% endif %}
              </td>
            </tr>

            <!-- Built from the report's dashboard view (content/cartreports.json): same sections, figures and columns. -->
            <tr>
              <td class="rp-pad" style="padding:24px 32px 0 32px;">
                <h2 style="margin:0 0 12px 0; font-size:14px; line-height:20px; font-weight:600; color:#171717;">Summary</h2>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                  <tr><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Abandoned carts</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if abandoned_count == nil or abandoned_count == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ abandoned_count }}{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Abandoned change</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if abandoned_change_pct == nil %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% elsif abandoned_change_pct > 0 %}<span style="color:#525252; white-space:nowrap;">&#9650; {{ abandoned_change_pct }}%</span>{% elsif abandoned_change_pct < 0 %}<span style="color:#525252; white-space:nowrap;">&#9660; {{ abandoned_change_pct | abs }}%</span>{% else %}<span style="color:#a3a3a3;">0%</span>{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Still open</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if open_count == nil or open_count == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ open_count }}{% endif %}</p></td></tr>
                </table>
                <div class="rp-space" style="height:12px; line-height:12px; font-size:0;">&nbsp;</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                  <tr><td class="rp-card" width="50%" valign="top" style="width:50%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Abandoned value</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if abandoned_value == nil or abandoned_value == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ abandoned_value | currency }}{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="50%" valign="top" style="width:50%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Average abandoned cart</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if average_cart_value == nil or average_cart_value == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ average_cart_value | currency }}{% endif %}</p></td></tr>
                </table>
                <div class="rp-space" style="height:12px; line-height:12px; font-size:0;">&nbsp;</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                  <tr><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Recovered carts</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if recovered_count == nil or recovered_count == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ recovered_count }}{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Recovery rate</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if recovery_rate_pct == nil or recovery_rate_pct == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ recovery_rate_pct }}%{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Recovered revenue</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if recovered_revenue == nil or recovered_revenue == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ recovered_revenue | currency }}{% endif %}</p></td></tr>
                </table>
              </td>
            </tr>

            {% if abandoned_carts.size > 0 %}
            <tr>
              <td class="rp-pad" style="padding:24px 32px 0 32px;">
                <h2 style="margin:0 0 12px 0; font-size:14px; line-height:20px; font-weight:600; color:#171717;">Largest abandoned carts</h2>
                <table class="rp-table" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border:1px solid #e5e5e5; border-radius:6px; border-collapse:separate; border-spacing:0; background-color:#ffffff;">
                  <tr><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:left;">Customer</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Items</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Value</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Abandoned</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Status</th></tr>
                  {% for row in abandoned_carts limit: 5 %}
                  <tr><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:left;">{% if row.customer == nil or row.customer == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.customer }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.items == nil or row.items == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.items }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.value == nil or row.value == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.value | currency }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.abandoned_date == nil or row.abandoned_date == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{% assign rp_d = row.abandoned_date | split: "-" %}{% assign rp_m = rp_d[1] | minus: 1 %}{% assign rp_months = "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec" | split: "," %}{{ rp_months[rp_m] }} {{ rp_d[2] | plus: 0 }}, {{ rp_d[0] }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.status == nil or row.status == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{% if row.status == "recovered" %}Recovered{% elsif row.status == "open" %}Open{% else %}{{ row.status }}{% endif %}{% endif %}</td></tr>
                  {% endfor %}
                  {% if abandoned_carts.size > 5 %}<tr><td colspan="5" style="padding:12px; font-size:14px; line-height:20px; color:#737373; border-top:1px solid #e5e5e5; text-align:center;">{{ abandoned_carts.size | minus: 5 }} more on this report in your dashboard</td></tr>{% endif %}
                  {% if carts_hidden > 0 %}<tr><td colspan="5" style="padding:12px; font-size:13px; line-height:18px; color:#737373; border-top:1px solid #e5e5e5;">{{ carts_hidden }} more abandoned carts were not listed. Each report lists up to 10.</td></tr>{% endif %}
                </table>
              </td>
            </tr>
            {% endif %}

            {% if products_left.size > 0 %}
            <tr>
              <td class="rp-pad" style="padding:24px 32px 0 32px;">
                <h2 style="margin:0 0 12px 0; font-size:14px; line-height:20px; font-weight:600; color:#171717;">Products left in carts</h2>
                <table class="rp-table" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border:1px solid #e5e5e5; border-radius:6px; border-collapse:separate; border-spacing:0; background-color:#ffffff;">
                  <tr><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:left;">Product</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Carts</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Quantity</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Value</th></tr>
                  {% for row in products_left limit: 5 %}
                  <tr><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:left;">{% if row.name == nil or row.name == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.name }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.carts == nil or row.carts == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.carts }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.quantity == nil or row.quantity == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.quantity }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.value == nil or row.value == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.value | currency }}{% endif %}</td></tr>
                  {% endfor %}
                  {% if products_left.size > 5 %}<tr><td colspan="4" style="padding:12px; font-size:14px; line-height:20px; color:#737373; border-top:1px solid #e5e5e5; text-align:center;">{{ products_left.size | minus: 5 }} more on this report in your dashboard</td></tr>{% endif %}
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

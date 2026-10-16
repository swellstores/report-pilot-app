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
                <p style="margin:0 0 6px 0; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:#6b7280;">Customer report</p>
                <h1 style="margin:0; font-size:22px; line-height:1.3; color:#111827; font-weight:600;">{{ period_label }}</h1>
                {% if content.intro %}
                  <p style="margin:10px 0 0 0; font-size:14px; line-height:1.5; color:#6b7280;">{{ content.intro }}</p>
                {% endif %}
              </td>
            </tr>

            <!-- Built from the report's dashboard view (content/customerreports.json): same sections, figures and columns. -->
            <tr>
              <td class="rp-pad" style="padding:24px 32px 0 32px;">
                <h2 style="margin:0 0 12px 0; font-size:14px; line-height:20px; font-weight:600; color:#171717;">Summary</h2>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                  <tr><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Customers</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if customer_count == nil or customer_count == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ customer_count }}{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Previous period</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if prev_customer_count == nil or prev_customer_count == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ prev_customer_count }}{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Change vs previous period</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if customer_change_pct == nil %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% elsif customer_change_pct > 0 %}<span style="color:#059669; white-space:nowrap;">&#9650; {{ customer_change_pct }}%</span>{% elsif customer_change_pct < 0 %}<span style="color:#dc2626; white-space:nowrap;">&#9660; {{ customer_change_pct | abs }}%</span>{% else %}<span style="color:#a3a3a3;">0%</span>{% endif %}</p></td></tr>
                </table>
                <div class="rp-space" style="height:12px; line-height:12px; font-size:0;">&nbsp;</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                  <tr><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">New customers</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if new_customer_count == nil or new_customer_count == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ new_customer_count }}{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Returning customers</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if returning_customer_count == nil or returning_customer_count == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ returning_customer_count }}{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Returning rate</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if returning_rate_pct == nil or returning_rate_pct == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ returning_rate_pct }}%{% endif %}</p></td></tr>
                </table>
                <div class="rp-space" style="height:12px; line-height:12px; font-size:0;">&nbsp;</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                  <tr><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Repeat buyers</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if repeat_buyer_count == nil or repeat_buyer_count == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ repeat_buyer_count }}{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Repeat rate</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if repeat_rate_pct == nil or repeat_rate_pct == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ repeat_rate_pct }}%{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Average spend per customer</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if average_spend == nil or average_spend == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ average_spend | currency }}{% endif %}</p></td></tr>
                </table>
              </td>
            </tr>

            {% if top_customers.size > 0 %}
            <tr>
              <td class="rp-pad" style="padding:24px 32px 0 32px;">
                <h2 style="margin:0 0 12px 0; font-size:14px; line-height:20px; font-weight:600; color:#171717;">Top customers</h2>
                <table class="rp-table" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border:1px solid #e5e5e5; border-radius:6px; border-collapse:separate; border-spacing:0; background-color:#ffffff;">
                  <tr><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:left;">Customer</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Orders</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Amount</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Lifetime amount</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Lifetime orders</th></tr>
                  {% for row in top_customers limit: 5 %}
                  <tr><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:left;">{% if row.name == nil or row.name == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.name }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.orders == nil or row.orders == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.orders }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.spend == nil or row.spend == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.spend | currency }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.lifetime_value == nil or row.lifetime_value == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.lifetime_value | currency }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.lifetime_orders == nil or row.lifetime_orders == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.lifetime_orders }}{% endif %}</td></tr>
                  {% endfor %}
                  {% if top_customers.size > 5 %}<tr><td colspan="5" style="padding:12px; font-size:14px; line-height:20px; color:#737373; border-top:1px solid #e5e5e5; text-align:center;">{{ top_customers.size | minus: 5 }} more on this report in your dashboard</td></tr>{% endif %}
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

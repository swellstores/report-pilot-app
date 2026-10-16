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
                <p style="margin:0 0 6px 0; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:#6b7280;">Subscription report</p>
                <h1 style="margin:0; font-size:22px; line-height:1.3; color:#111827; font-weight:600;">{{ period_label }}</h1>
                {% if content.intro %}
                  <p style="margin:10px 0 0 0; font-size:14px; line-height:1.5; color:#6b7280;">{{ content.intro }}</p>
                {% endif %}
              </td>
            </tr>

            <!-- Built from the report's dashboard view (content/subscriptionreports.json): same sections, figures and columns. -->
            <tr>
              <td class="rp-pad" style="padding:24px 32px 0 32px;">
                <h2 style="margin:0 0 12px 0; font-size:14px; line-height:20px; font-weight:600; color:#171717;">Summary</h2>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                  <tr><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Active subscriptions</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if active_count == nil or active_count == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ active_count }}{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Monthly recurring revenue</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if monthly_recurring_revenue == nil or monthly_recurring_revenue == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ monthly_recurring_revenue | currency }}{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">On trial</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if trial_count == nil or trial_count == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ trial_count }}{% endif %}</p></td></tr>
                </table>
                <div class="rp-space" style="height:12px; line-height:12px; font-size:0;">&nbsp;</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                  <tr><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">New subscriptions</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if new_count == nil or new_count == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ new_count }}{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">New change</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if new_change_pct == nil %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% elsif new_change_pct > 0 %}<span style="color:#059669; white-space:nowrap;">&#9650; {{ new_change_pct }}%</span>{% elsif new_change_pct < 0 %}<span style="color:#dc2626; white-space:nowrap;">&#9660; {{ new_change_pct | abs }}%</span>{% else %}<span style="color:#a3a3a3;">0%</span>{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Net change</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if net_change == nil or net_change == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ net_change }}{% endif %}</p></td></tr>
                </table>
                <div class="rp-space" style="height:12px; line-height:12px; font-size:0;">&nbsp;</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                  <tr><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Canceled</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if canceled_count == nil or canceled_count == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ canceled_count }}{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Canceled change</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if canceled_change_pct == nil %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% elsif canceled_change_pct > 0 %}<span style="color:#525252; white-space:nowrap;">&#9650; {{ canceled_change_pct }}%</span>{% elsif canceled_change_pct < 0 %}<span style="color:#525252; white-space:nowrap;">&#9660; {{ canceled_change_pct | abs }}%</span>{% else %}<span style="color:#a3a3a3;">0%</span>{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Paused</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if paused_count == nil or paused_count == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ paused_count }}{% endif %}</p></td></tr>
                </table>
                <div class="rp-space" style="height:12px; line-height:12px; font-size:0;">&nbsp;</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                  <tr><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Past due</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if past_due_count == nil or past_due_count == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ past_due_count }}{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Renewals in the next 7 days</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if renewals_next_7_days == nil or renewals_next_7_days == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ renewals_next_7_days }}{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="33%" valign="top" style="width:33%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Trials ending in the next 7 days</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if trials_ending_next_7_days == nil or trials_ending_next_7_days == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ trials_ending_next_7_days }}{% endif %}</p></td></tr>
                </table>
              </td>
            </tr>

            {% if plans.size > 0 %}
            <tr>
              <td class="rp-pad" style="padding:24px 32px 0 32px;">
                <h2 style="margin:0 0 12px 0; font-size:14px; line-height:20px; font-weight:600; color:#171717;">By plan</h2>
                <table class="rp-table" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border:1px solid #e5e5e5; border-radius:6px; border-collapse:separate; border-spacing:0; background-color:#ffffff;">
                  <tr><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:left;">Plan</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Paying</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">On trial</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Monthly revenue</th></tr>
                  {% for row in plans limit: 5 %}
                  <tr><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:left;">{% if row.plan == nil or row.plan == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.plan }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.paying == nil or row.paying == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.paying }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.trial == nil or row.trial == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.trial }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.monthly_revenue == nil or row.monthly_revenue == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.monthly_revenue | currency }}{% endif %}</td></tr>
                  {% endfor %}
                  {% if plans.size > 5 %}<tr><td colspan="4" style="padding:12px; font-size:14px; line-height:20px; color:#737373; border-top:1px solid #e5e5e5; text-align:center;">{{ plans.size | minus: 5 }} more on this report in your dashboard</td></tr>{% endif %}
                </table>
              </td>
            </tr>
            {% endif %}

            {% if canceled_subscriptions.size > 0 %}
            <tr>
              <td class="rp-pad" style="padding:24px 32px 0 32px;">
                <h2 style="margin:0 0 12px 0; font-size:14px; line-height:20px; font-weight:600; color:#171717;">Canceled subscriptions</h2>
                <table class="rp-table" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border:1px solid #e5e5e5; border-radius:6px; border-collapse:separate; border-spacing:0; background-color:#ffffff;">
                  <tr><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:left;">Customer</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Plan</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Canceled</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Monthly value</th></tr>
                  {% for row in canceled_subscriptions limit: 5 %}
                  <tr><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:left;">{% if row.customer == nil or row.customer == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.customer }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.plan == nil or row.plan == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.plan }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.canceled_date == nil or row.canceled_date == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{% assign rp_d = row.canceled_date | split: "-" %}{% assign rp_m = rp_d[1] | minus: 1 %}{% assign rp_months = "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec" | split: "," %}{{ rp_months[rp_m] }} {{ rp_d[2] | plus: 0 }}, {{ rp_d[0] }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.monthly_value == nil or row.monthly_value == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.monthly_value | currency }}{% endif %}</td></tr>
                  {% endfor %}
                  {% if canceled_subscriptions.size > 5 %}<tr><td colspan="4" style="padding:12px; font-size:14px; line-height:20px; color:#737373; border-top:1px solid #e5e5e5; text-align:center;">{{ canceled_subscriptions.size | minus: 5 }} more on this report in your dashboard</td></tr>{% endif %}
                  {% if canceled_hidden > 0 %}<tr><td colspan="4" style="padding:12px; font-size:13px; line-height:18px; color:#737373; border-top:1px solid #e5e5e5;">{{ canceled_hidden }} more canceled subscriptions were not listed. Each report lists up to 10.</td></tr>{% endif %}
                </table>
              </td>
            </tr>
            {% endif %}

            {% if past_due_subscriptions.size > 0 %}
            <tr>
              <td class="rp-pad" style="padding:24px 32px 0 32px;">
                <h2 style="margin:0 0 12px 0; font-size:14px; line-height:20px; font-weight:600; color:#171717;">Failed renewals</h2>
                <table class="rp-table" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border:1px solid #e5e5e5; border-radius:6px; border-collapse:separate; border-spacing:0; background-color:#ffffff;">
                  <tr><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:left;">Customer</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Plan</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Amount due</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Status</th></tr>
                  {% for row in past_due_subscriptions limit: 5 %}
                  <tr><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:left;">{% if row.customer == nil or row.customer == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.customer }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.plan == nil or row.plan == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.plan }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.amount == nil or row.amount == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.amount | currency }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.status == nil or row.status == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{% if row.status == "pastdue" %}Past due{% elsif row.status == "unpaid" %}Unpaid{% else %}{{ row.status }}{% endif %}{% endif %}</td></tr>
                  {% endfor %}
                  {% if past_due_subscriptions.size > 5 %}<tr><td colspan="4" style="padding:12px; font-size:14px; line-height:20px; color:#737373; border-top:1px solid #e5e5e5; text-align:center;">{{ past_due_subscriptions.size | minus: 5 }} more on this report in your dashboard</td></tr>{% endif %}
                  {% if past_due_hidden > 0 %}<tr><td colspan="4" style="padding:12px; font-size:13px; line-height:18px; color:#737373; border-top:1px solid #e5e5e5;">{{ past_due_hidden }} more subscriptions with failed renewals were not listed. Each report lists up to 10.</td></tr>{% endif %}
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

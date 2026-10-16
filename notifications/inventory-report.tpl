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
                  <tr><td class="rp-card" width="50%" valign="top" style="width:50%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Out of stock</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if out_of_stock_count == nil or out_of_stock_count == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ out_of_stock_count }}{% endif %}</p></td><td class="rp-gap" width="12" style="width:12px; min-width:12px; font-size:0; line-height:0;">&nbsp;</td><td class="rp-card" width="50%" valign="top" style="width:50%; padding:12px 14px; border:1px solid #e5e5e5; border-radius:6px; background-color:#ffffff;"><p style="margin:0; font-size:12px; line-height:16px; font-weight:500; color:#737373;">Low stock</p><p style="margin:6px 0 0 0; font-size:22px; line-height:28px; font-weight:600; color:#171717;">{% if low_stock_count == nil or low_stock_count == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ low_stock_count }}{% endif %}</p></td></tr>
                </table>
              </td>
            </tr>

            <tr>
              <td class="rp-pad" style="padding:24px 32px 0 32px;">
                <h2 style="margin:0 0 12px 0; font-size:14px; line-height:20px; font-weight:600; color:#171717;">Items</h2>
                {% if items.size > 0 %}
                <table class="rp-table" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border:1px solid #e5e5e5; border-radius:6px; border-collapse:separate; border-spacing:0; background-color:#ffffff;">
                  <tr><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:left;">Product</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Stock</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Est. days left</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">Sold (30 days)</th><th class="rp-th" scope="col" style="padding:10px 12px; font-size:12px; line-height:18px; font-weight:500; color:#171717; text-align:center;">SKU</th></tr>
                  {% for row in items limit: 10 %}
                  <tr><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:left;">{% if row.name == nil or row.name == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.name }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.stock_level == nil or row.stock_level == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.stock_level }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.days_of_cover == nil or row.days_of_cover == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.days_of_cover }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.sold_30d == nil or row.sold_30d == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.sold_30d }}{% endif %}</td><td class="rp-td" style="padding:12px; font-size:14px; line-height:20px; color:#171717; border-top:1px solid #e5e5e5; text-align:center;">{% if row.sku == nil or row.sku == "" %}<span style="color:#a3a3a3; font-weight:400;">&mdash;</span>{% else %}{{ row.sku }}{% endif %}</td></tr>
                  {% endfor %}
                  {% if items.size > 10 %}<tr><td colspan="5" style="padding:12px; font-size:14px; line-height:20px; color:#737373; border-top:1px solid #e5e5e5; text-align:center;">{{ items.size | minus: 10 }} more on this report in your dashboard</td></tr>{% endif %}
                  {% if items_hidden > 0 %}<tr><td colspan="5" style="padding:12px; font-size:13px; line-height:18px; color:#737373; border-top:1px solid #e5e5e5;">{{ items_hidden }} more low or out-of-stock items were not listed. Each report lists up to 50.</td></tr>{% endif %}
                </table>
                <p style="margin:8px 0 0 0; font-size:12px; line-height:18px; color:#737373;">Est. days left is an estimate: current stock divided by the average daily sales over the last 30 days.</p>
                {% else %}
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border:1px solid #e5e5e5; border-radius:6px; border-collapse:separate; border-spacing:0; background-color:#ffffff;"><tr><td style="padding:16px; font-size:14px; line-height:20px; color:#737373;">No products or variants are out of stock or running low.</td></tr></table>
                {% endif %}
              </td>
            </tr>

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

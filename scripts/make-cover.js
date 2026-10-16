/**
 * Generate the Report Pilot App Store cover image, with no image dependencies.
 *
 * The marketplace uses this asset two ways, both with `object-cover`:
 *   - the grid card, at a 4:3 aspect, uncropped
 *   - the featured banner, full width at 385px tall, which crops to the
 *     vertical middle band and lays a bottom-up black gradient over it
 *
 * A paper plane, the same one as on the icon, takes off above the newest bar.
 *
 * The card is the primary surface and shows the image uncropped, so the chart
 * is sized to fill it. The banner then shows the vertical middle of that chart,
 * which is the intent: there it is a backdrop, sitting under a black gradient
 * and the app name. There is deliberately no text in the image, since the
 * banner already renders the name and tagline over it, and the card prints the
 * name beneath it.
 */
const { inRoundRect, mix, render, writePNG } = require('./lib/draw');
const { BG, BG_DEEP, BAR, BAR_DIM } = require('./lib/brand');
const { makePlane } = require('./lib/plane');

const WIDTH = 1600;
const HEIGHT = 1200; // 4:3, the aspect the marketplace grid card lays out
const SS = 4;

// Chart geometry, in final pixels, scaled up to the supersampled grid below.
const CHART_LEFT = 230;
const CHART_WIDTH = 1140;
const BASELINE = 860;
const MAX_BAR = 500;

// An ascending run with one dip, so it reads as real data rather than a ramp.
const HEIGHTS = [0.3, 0.42, 0.36, 0.55, 0.62, 0.78, 1];

const s = (v) => v * SS;
const baselineY = s(BASELINE);
const pitch = s(CHART_WIDTH) / HEIGHTS.length;
const barW = pitch * 0.62;
const barRadius = barW * 0.3;
const inset = (pitch - barW) / 2;

const bars = HEIGHTS.map((f, i) => {
  const h = f * s(MAX_BAR);
  return {
    x: s(CHART_LEFT) + i * pitch + inset,
    y: baselineY - h,
    w: barW,
    h,
    // Earliest columns dimmed, brightening toward the newest, echoing the icon.
    color: mix(BAR_DIM, BAR, i / (HEIGHTS.length - 1)),
  };
});

// Gridlines sit behind the bars, spanning the chart plus a small margin so they
// read as chart furniture rather than as full-bleed stripes.
const gridYs = [1, 2, 3, 4].map((k) => baselineY - (s(MAX_BAR) * k) / 4);
const gridLeft = s(CHART_LEFT - 30);
const gridRight = s(CHART_LEFT + CHART_WIDTH + 30);
const gridHalf = s(1.5);
const baseHalf = s(2.5);

// The paper plane from the icon, taking off above the tallest (newest) bar.
const PLANE_AT = [1430, 96];
const PLANE_SCALE = 1.35;
const planeAt = makePlane(([x, y]) => [s(PLANE_AT[0] + x * PLANE_SCALE), s(PLANE_AT[1] + y * PLANE_SCALE)]);

const glowX = s(WIDTH / 2);
const glowY = s(600);

function shade(px, py, W, H) {
  // Vertical gradient, the same two indigos as the icon.
  let c = mix(BG, BG_DEEP, py / H);

  // Soft radial lift behind the chart, to give the flat gradient some depth.
  const dx = (px - glowX) / (W * 0.55);
  const dy = (py - glowY) / (H * 0.55);
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d < 1) {
    c = mix(c, BAR, (1 - d) * (1 - d) * 0.16);
  }

  if (px >= gridLeft && px <= gridRight) {
    for (const gy of gridYs) {
      if (Math.abs(py - gy) <= gridHalf) {
        c = mix(c, BAR, 0.1);
        break;
      }
    }

    if (Math.abs(py - baselineY) <= baseHalf) {
      c = mix(c, BAR, 0.28);
    }
  }

  const planeColor = planeAt(px, py);
  if (planeColor) {
    return planeColor;
  }

  for (const bar of bars) {
    if (inRoundRect(px, py, bar.x, bar.y, bar.w, bar.h, barRadius)) {
      return bar.color;
    }
  }

  return c;
}

// Exported so the crop the marketplace banner actually shows can be previewed
// without duplicating the drawing code.
module.exports = { WIDTH, HEIGHT, SS, shade };

if (require.main === module) {
  const raw = render({ width: WIDTH, height: HEIGHT, supersample: SS, shade });
  writePNG(process.argv[2], WIDTH, HEIGHT, raw);
}

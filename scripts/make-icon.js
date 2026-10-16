/**
 * Generate the Report Pilot app icon as a PNG, with no image dependencies.
 *
 * Renders a full square mark with three ascending report bars and a paper
 * plane taking off above them (the reports, and them being sent), at 4x, then
 * box downsamples for antialiasing. Writes 512x512 RGBA.
 *
 * Shapes are laid out on a 512-unit grid and scaled by the supersample factor.
 *
 * The icon is a full, opaque square with no corners of its own, like every
 * other app's: swell.is/apps, the App Store and the dashboard each round it
 * themselves (swell.is uses an 8px radius on a 72px frame).
 */
const { inRoundRect, render, writePNG } = require('./lib/draw');
const { BG, BG_DEEP, BAR, BAR_DIM } = require('./lib/brand');
const { makePlane } = require('./lib/plane');

const SIZE = 512;
const SS = 4; // supersample factor
const S = SIZE * SS;
const u = (n) => n * SS; // 512-unit grid -> supersampled pixels

// Three ascending bars: the shortest dimmed, the other two full strength.
const barRadius = u(18);
const bars = [
  { x: 112, y: 300, w: 64, h: 100, color: BAR_DIM },
  { x: 200, y: 250, w: 64, h: 150, color: BAR },
  { x: 288, y: 196, w: 64, h: 204, color: BAR },
].map((bar) => ({ x: u(bar.x), y: u(bar.y), w: u(bar.w), h: u(bar.h), color: bar.color }));

// The paper plane, heading up and to the right above the tallest bar.
const PLANE_AT = [410, 98];
const PLANE_SCALE = 0.62;
const planeAt = makePlane(([x, y]) => [u(PLANE_AT[0] + x * PLANE_SCALE), u(PLANE_AT[1] + y * PLANE_SCALE)]);

function shade(px, py) {
  const planeColor = planeAt(px, py);
  if (planeColor) {
    return planeColor;
  }

  for (const bar of bars) {
    if (inRoundRect(px, py, bar.x, bar.y, bar.w, bar.h, barRadius)) {
      return bar.color;
    }
  }

  // Vertical gradient across the card.
  const t = py / S;
  return [
    BG[0] + (BG_DEEP[0] - BG[0]) * t,
    BG[1] + (BG_DEEP[1] - BG[1]) * t,
    BG[2] + (BG_DEEP[2] - BG[2]) * t,
  ];
}

const raw = render({ width: SIZE, height: SIZE, supersample: SS, shade });
writePNG(process.argv[2], SIZE, SIZE, raw);

/**
 * The paper plane shared by the icon and the cover, so the two cannot drift
 * apart. Drawn around its nose at (0, 0), heading up and to the right, about
 * 150 units wide and 150 tall.
 */
const { BAR, BAR_DIM, PLANE_FOLD } = require('./brand');

/** Front to back, so the first part that contains a point wins. */
const PLANE_PARTS = [
  // The keel, the darkest fold.
  { points: [[-88, 86], [-74, 132], [-62, 150], [-60, 108]], color: PLANE_FOLD },
  // The lower wing.
  { points: [[0, 0], [-88, 86], [-62, 150]], color: BAR_DIM },
  // The upper wing.
  { points: [[0, 0], [-150, 62], [-88, 86]], color: BAR },
];

/** Even-odd test: is (px, py) inside the polygon? */
function inPolygon(px, py, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * The plane's parts with their points mapped through `place` (plane units to
 * supersampled pixels), plus a test that returns the color at a pixel, or null.
 */
function makePlane(place) {
  const parts = PLANE_PARTS.map((part) => ({ points: part.points.map(place), color: part.color }));
  return (px, py) => {
    for (const part of parts) {
      if (inPolygon(px, py, part.points)) {
        return part.color;
      }
    }
    return null;
  };
}

module.exports = { makePlane };

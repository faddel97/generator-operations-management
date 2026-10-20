import type { Calibration, ControlPoint, MapPoint } from "./model";

// Affine least-squares fit in local degrees. It is used only after an admin
// publishes at least four independently verified survey control points.
function solve3(matrix: number[][], vector: number[]): number[] | null {
  const rows = matrix.map((row, i) => [...row, vector[i]]);
  for (let col = 0; col < 3; col++) {
    let pivot = col;
    for (let i = col + 1; i < 3; i++)
      if (Math.abs(rows[i][col]) > Math.abs(rows[pivot][col])) pivot = i;
    if (Math.abs(rows[pivot][col]) < 1e-12) return null;
    [rows[col], rows[pivot]] = [rows[pivot], rows[col]];
    const divisor = rows[col][col];
    for (let j = col; j < 4; j++) rows[col][j] /= divisor;
    for (let i = 0; i < 3; i++) {
      if (i === col) continue;
      const factor = rows[i][col];
      for (let j = col; j < 4; j++) rows[i][j] -= factor * rows[col][j];
    }
  }
  return rows.map((row) => row[3]);
}

export function fitCalibration(points: ControlPoint[]) {
  if (points.length < 4) return null;
  if (Math.max(...points.map((p) => p.x)) - Math.min(...points.map((p) => p.x)) < 800 ||
      Math.max(...points.map((p) => p.y)) - Math.min(...points.map((p) => p.y)) < 400) return null;
  const originLat = points.reduce((sum, p) => sum + p.latitude, 0) / points.length;
  const originLng = points.reduce((sum, p) => sum + p.longitude, 0) / points.length;
  const terms = points.map((p) => [1, (p.longitude - originLng) * 1000, (p.latitude - originLat) * 1000]);
  const normal = Array.from({ length: 3 }, (_, i) =>
    Array.from({ length: 3 }, (_, j) => terms.reduce((sum, row) => sum + row[i] * row[j], 0)));
  const rhsX = [0, 1, 2].map((j) => terms.reduce((sum, row, i) => sum + row[j] * points[i].x, 0));
  const rhsY = [0, 1, 2].map((j) => terms.reduce((sum, row, i) => sum + row[j] * points[i].y, 0));
  const coeffX = solve3(normal, rhsX);
  const coeffY = solve3(normal, rhsY);
  if (!coeffX || !coeffY) return null;
  const project = (latitude: number, longitude: number): MapPoint => {
    const row = [1, (longitude - originLng) * 1000, (latitude - originLat) * 1000];
    return {
      x: row.reduce((sum, v, i) => sum + v * coeffX[i], 0),
      y: row.reduce((sum, v, i) => sum + v * coeffY[i], 0),
    };
  };
  const rmsPx = Math.sqrt(points.reduce((sum, point) => {
    const result = project(point.latitude, point.longitude);
    return sum + (result.x - point.x) ** 2 + (result.y - point.y) ** 2;
  }, 0) / points.length);
  return { project, rmsPx };
}

export function projectPosition(calibration: Calibration | null, latitude: number, longitude: number): MapPoint | null {
  if (calibration?.status !== "published") return null;
  const fit = fitCalibration(calibration.points);
  if (!fit || fit.rmsPx > 40) return null;
  return fit.project(latitude, longitude);
}

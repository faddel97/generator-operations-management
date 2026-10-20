import assert from "node:assert/strict";
import fs from "node:fs";
import Module from "node:module";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadTypeScript(relativePath, dependencies = {}) {
  const filename = path.join(root, relativePath);
  const source = fs.readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const loaded = new Module(filename);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalRequire = loaded.require.bind(loaded);
  loaded.require = (id) => id === "server-only" ? {} : id in dependencies ? dependencies[id] : originalRequire(id);
  loaded._compile(compiled, filename);
  return loaded.exports;
}

const geometry = loadTypeScript("src/lib/tracking/geometry.ts");
const demoSeed = loadTypeScript("src/lib/tracking/demo-seed.ts");
const demo = loadTypeScript("src/lib/tracking/demo.ts", { "@/lib/tracking/geometry": geometry, "@/lib/tracking/demo-seed": demoSeed });
const geo = loadTypeScript("src/lib/tracking/geo.ts");

test("four synthetic operational zones take precedence over enclosing demo yard", () => {
  assert.equal(geometry.DEMO_WIDTH_M * geometry.DEMO_HEIGHT_M, 12_000_000);
  assert.equal(geometry.zoneAt({ x: 900, y: 600 }, demo.demoZones)?.id, "A");
  assert.equal(geometry.zoneAt({ x: 900, y: 1600 }, demo.demoZones)?.id, "B");
  assert.equal(geometry.zoneAt({ x: 900, y: 2600 }, demo.demoZones)?.id, "C");
  assert.equal(geometry.zoneAt({ x: 900, y: 3900 }, demo.demoZones)?.id, "D");
  assert.equal(geometry.zoneAt({ x: -10, y: -10 }, demo.demoZones), null);
});

test("50 isolated demo assets populate the four zones and industrial categories", () => {
  const snapshot = demo.initialDemoSnapshot();
  assert.equal(snapshot.assets.length, 50);
  assert.equal(snapshot.dataVersion, 3);
  assert.deepEqual(["A", "B", "C", "D"].map((id) => snapshot.assets.filter((asset) => asset.position.zoneId === id).length), [13, 12, 13, 12]);
  for (const category of ["generator", "forklift", "truck", "crane", "trailer", "portable", "machinery"]) {
    assert.ok(snapshot.assets.some((asset) => asset.category === category));
  }
  assert.ok(snapshot.alerts.length > 0);
  assert.ok(snapshot.assets.some((asset) => asset.connection === "offline"));
  assert.ok(snapshot.assets.some((asset) => asset.connection === "stale"));
  assert.deepEqual(geometry.demoCoordinate({ x: 1250, y: 2400 }), { latitude: 27.5089855, longitude: 49.2384049 });
});

test("simulation advances moving assets while preserving disconnected last-known fixes", () => {
  const before = demo.initialDemoSnapshot();
  const after = demo.advanceDemoSnapshot(before);
  const movingBefore = before.assets.find((asset) => asset.id === "SIM-A-TRK-01");
  const movingAfter = after.assets.find((asset) => asset.id === "SIM-A-TRK-01");
  const offlineBefore = before.assets.find((asset) => asset.connection === "offline");
  const offlineAfter = after.assets.find((asset) => asset.id === offlineBefore.id);
  assert.equal(after.sequence, before.sequence + 1);
  assert.equal(movingAfter.history.length, movingBefore.history.length + 1);
  assert.notEqual(movingAfter.position.eventId, movingBefore.position.eventId);
  assert.deepEqual(offlineAfter.position, offlineBefore.position);
  assert.equal(offlineAfter.connection, "offline");
  const crossed = demo.advanceDemoSnapshot(demo.advanceDemoSnapshot(after));
  assert.ok(crossed.alerts.some((alert) => alert.assetId === "SIM-A-TRK-01" && alert.kind === "zone_entry"));
});

test("operational polygons validate WGS84 geometry without inventing a site", () => {
  const rectangle = { type: "Polygon", coordinates: [[[49.2, 27.5], [49.21, 27.5], [49.21, 27.51], [49.2, 27.51]]] };
  const parsed = geo.validatePolygon(rectangle);
  assert.equal(parsed.error, null);
  assert.equal(parsed.polygon.coordinates[0].length, 5);
  assert.ok(geo.polygonAreaM2(parsed.polygon) > 900_000);
  assert.equal(geo.pointInGeoPolygon([49.205, 27.505], parsed.polygon), true);
  assert.equal(geo.pointInGeoPolygon([49.23, 27.505], parsed.polygon), false);
  assert.equal(geo.validatePolygon({ type: "Polygon", coordinates: [[[49.2, 27.5], [49.21, 27.51], [49.2, 27.51], [49.21, 27.5]]] }).error, "Boundary crosses itself.");
});

test("adjacent operational zones are allowed but overlapping zones are rejected", () => {
  const a = geo.validatePolygon({ type: "Polygon", coordinates: [[[0, 0], [0.01, 0], [0.01, 0.01], [0, 0.01]]] }).polygon;
  const adjacent = geo.validatePolygon({ type: "Polygon", coordinates: [[[0.01, 0], [0.02, 0], [0.02, 0.01], [0.01, 0.01]]] }).polygon;
  const overlap = geo.validatePolygon({ type: "Polygon", coordinates: [[[0.005, 0], [0.015, 0], [0.015, 0.01], [0.005, 0.01]]] }).polygon;
  assert.equal(geo.polygonsOverlap(a, adjacent), false);
  assert.equal(geo.polygonsOverlap(a, overlap), true);
});

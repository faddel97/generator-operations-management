"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ChevronDown, Crosshair, Layers3, LocateFixed, Minus, Pause, Play, Plus, RotateCcw, Search, Settings2, X } from "lucide-react";

import { advanceDemoAssets, demoOperators, demoParking, demoPlaces, demoRoads, demoScenarios, initialDemoAssets } from "@/lib/facility-map/demo";
import annotations from "@/lib/facility-map/pdf-annotations.json";
import { demoIllustrativeRoute, verifiedRoute } from "@/lib/facility-map/navigation";
import { fuelLitres, fuelState, type ControlPoint, type FacilityMapSnapshot, type MapAsset, type MapObservation, type MapPlace, type MapPoint } from "@/lib/facility-map/model";
import type { MapCommand } from "./facility-canvas";
import "./facility-workspace.css";

const FacilityCanvas = dynamic(() => import("./facility-canvas").then((module) => module.FacilityCanvas), { ssr: false });
type Pick = "place" | "point" | "calibration" | "node" | "return" | "translation-start" | "translation-end" | null;
type Hit = { id: string; name: string; subtitle: string; kind: string; point: MapPoint | null };

const normalized = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const pdfPlaces: MapPlace[] = annotations.map((row) => ({ id: `PDF-${row.code}`, code: row.code,
  name: row.code, kind: "annotation", point: row.annotationBoxes[0], source: "pdf", reviewRequired: true }));
function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = row[0]; row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return row[b.length];
}
const stamp = (value: string | null) => value ? new Date(value).toLocaleString() : "Unknown";

export function FacilityWorkspace({ initial, role, authenticated }: { initial: FacilityMapSnapshot; role: string; authenticated: boolean }) {
  const [real, setReal] = useState(initial);
  const [mode, setMode] = useState<"real" | "demo">(initial.assets.length ? "real" : "demo");
  const [demoAssets, setDemoAssets] = useState(initialDemoAssets);
  const [sequence, setSequence] = useState(0);
  const sequenceRef = useRef(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [scenario, setScenario] = useState("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [showLayers, setShowLayers] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showMobile, setShowMobile] = useState(true);
  const [showFixed, setShowFixed] = useState(true);
  const [showPlaces, setShowPlaces] = useState(true);
  const [showParking, setShowParking] = useState(true);
  const [showRoads, setShowRoads] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [route, setRoute] = useState<MapPoint[] | null>(null);
  const [routeMessage, setRouteMessage] = useState("");
  const [command, setCommand] = useState<MapCommand | null>(null);
  const [pick, setPick] = useState<Pick>(null);
  const [picked, setPicked] = useState<MapPoint | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [placeCode, setPlaceCode] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [placeKind, setPlaceKind] = useState<MapPlace["kind"]>("building");
  const [parkingRadius, setParkingRadius] = useState("80");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [controlPoints, setControlPoints] = useState<ControlPoint[]>(initial.calibration?.points ?? []);
  const [nodeName, setNodeName] = useState("");
  const [fromNode, setFromNode] = useState("");
  const [toNode, setToNode] = useState("");
  const [roadMode, setRoadMode] = useState<"walk" | "vehicle" | "both">("walk");
  const [parkingChoice, setParkingChoice] = useState("");
  const [returnDue, setReturnDue] = useState("");
  const [returnConfirmed, setReturnConfirmed] = useState(false);
  const [manualFuel, setManualFuel] = useState("");
  const [fuelKind, setFuelKind] = useState<"reading" | "refuel">("reading");
  const [labelStart, setLabelStart] = useState<MapPoint | null>(null);
  const [labelEnd, setLabelEnd] = useState<MapPoint | null>(null);
  const [sourceText, setSourceText] = useState("");
  const [englishText, setEnglishText] = useState("");
  const [selectedHistory, setSelectedHistory] = useState<MapObservation[] | null>(null);
  const [selectedFuelHistory, setSelectedFuelHistory] = useState<Array<{ kind: string; percent: number | null; litres: number | null; at: string; source: string }>>([]);
  const [uncalibratedCount, setUncalibratedCount] = useState(0);
  const admin = role === "admin" && authenticated;
  const canWrite = authenticated && (admin || role === "supervisor" || role === "technician");
  const assets = mode === "demo" ? demoAssets : real.assets;
  const places = useMemo(() => mode === "demo" ? [...demoPlaces, ...demoParking, ...pdfPlaces] : [...real.places, ...pdfPlaces], [mode, real.places]);
  const roads = useMemo(() => {
    if (mode === "demo") return demoRoads.map((road) => ({ points: road.points, verified: false, restricted: false }));
    const nodes = new Map(real.routeNodes.map((node) => [node.id, node]));
    return real.routeEdges.filter((edge) => nodes.has(edge.from) && nodes.has(edge.to))
      .map((edge) => ({ points: [nodes.get(edge.from)!.point, nodes.get(edge.to)!.point], verified: edge.verified, restricted: edge.restricted }));
  }, [mode, real.routeNodes, real.routeEdges]);
  const roadNodes = useMemo(() => mode === "demo" ? [] : real.routeNodes.map((node) => ({ point: node.point, verified: node.verified })), [mode, real.routeNodes]);
  const selectedAsset = assets.find((asset) => asset.id === selectedId) ?? null;
  const selectedPlace = places.find((place) => place.id === selectedId) ?? null;
  const parking = places.find((place) => place.id === selectedAsset?.parkingId) ?? null;

  const refresh = useCallback(async () => {
    const response = await fetch("/api/facility-map", { cache: "no-store" });
    if (response.ok) setReal(await response.json() as FacilityMapSnapshot);
  }, []);
  useEffect(() => {
    if (mode !== "real") return;
    const timer = window.setInterval(() => void refresh(), 20_000);
    return () => window.clearInterval(timer);
  }, [mode, refresh]);
  useEffect(() => {
    if (mode !== "real" || !selectedId || !real.assets.some((asset) => asset.id === selectedId)) return;
    const controller = new AbortController();
    fetch(`/api/facility-map/history?code=${encodeURIComponent(selectedId)}`, { cache: "no-store", signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((result) => { if (result) { setSelectedHistory(result.history); setSelectedFuelHistory(result.fuelHistory ?? []); setUncalibratedCount(result.uncalibratedGpsCount); } })
      .catch(() => {});
    return () => controller.abort();
  }, [mode, selectedId, real.assets]);
  useEffect(() => {
    if (mode !== "demo" || !running || !liveUpdates) return;
    const timer = window.setInterval(() => {
      sequenceRef.current += 1;
      setSequence(sequenceRef.current);
      setDemoAssets((current) => advanceDemoAssets(current, sequenceRef.current));
    }, 1300 / speed);
    return () => window.clearInterval(timer);
  }, [mode, running, liveUpdates, speed]);

  const visibleAssets = useMemo(() => assets.filter((asset) => {
    if (asset.mobile ? !showMobile : !showFixed) return false;
    if (statusFilter === "all") return true;
    if (statusFilter === "low-fuel") return fuelState(asset) === "critical" || fuelState(asset) === "low";
    if (statusFilter === "unreturned") return asset.returnStatus === "overdue" || asset.returnStatus === "not_returned";
    if (statusFilter === "offline") return asset.connection === "offline" || asset.connection === "stale" || asset.connection === "not_connected";
    return true;
  }), [assets, showMobile, showFixed, statusFilter]);

  const searchHits = useMemo(() => {
    const term = normalized(search.trim());
    if (!term) return [];
    const entries: Hit[] = [
      ...assets.map((asset) => ({ id: asset.id, name: asset.name, subtitle: asset.id, kind: asset.mobile ? "Mobile asset" : "Fixed asset", point: asset.point })),
      ...places.map((place) => ({ id: place.id, name: place.name, subtitle: place.code, kind: place.kind === "parking" ? "Return area" : place.kind === "annotation" ? "PDF reference" : place.kind, point: place.point })),
    ];
    return entries.map((item) => {
      const name = normalized(item.name), code = normalized(item.subtitle);
      const score = code === term ? 0 : name === term ? 1 : code.startsWith(term) ? 2 : name.startsWith(term) ? 3
        : code.includes(term) ? 4 : name.includes(term) ? 5 : editDistance(term, code.slice(0, term.length)) <= 2 ? 6 : 100;
      return { item, score };
    }).filter(({ score }) => score < 100).sort((a, b) => a.score - b.score || a.item.name.localeCompare(b.item.name))
      .slice(0, 25).map(({ item }) => item);
  }, [search, assets, places]);
  const groupedHits = useMemo(() => {
    const groups = new Map<string, Hit[]>();
    for (const hit of searchHits) groups.set(hit.kind, [...groups.get(hit.kind) ?? [], hit]);
    return [...groups.entries()];
  }, [searchHits]);

  const sendCommand = (kind: MapCommand["kind"], point?: MapPoint) => setCommand({ token: Date.now() + Math.random(), kind, point });
  const select = (id: string) => {
    setSelectedId(id); setShowDetails(true); setRoute(null); setRouteMessage("");
    setSelectedHistory(null); setSelectedFuelHistory([]); setUncalibratedCount(0);
    const point = assets.find((item) => item.id === id)?.point ?? places.find((item) => item.id === id)?.point;
    if (point) sendCommand("focus", point);
  };
  const switchMode = (next: "real" | "demo") => {
    setMode(next); setSelectedId(null); setRoute(null); setRouteMessage(""); setSearch("");
    setRunning(false); setScenario("");
  };
  const chooseScenario = (id: string) => {
    setScenario(id);
    const config = demoScenarios.find((item) => item.id === id);
    if (!config) return;
    const fresh = initialDemoAssets();
    sequenceRef.current = 0; setSequence(0); setDemoAssets(fresh); setRunning(false);
    setRoute(null); setRouteMessage(""); setShowDetails(true);
    const targetId = id === "search" ? demoPlaces[14].id : config.assetId;
    setSelectedId(targetId);
    const point = fresh.find((asset) => asset.id === targetId)?.point ?? demoPlaces.find((place) => place.id === targetId)?.point;
    if (point) sendCommand("focus", point);
    if (id === "find" || id === "unreturned") { setSearch(config.assetId); setShowResults(true); }
    else setSearch("");
    if (id === "movement" || id === "return") setRunning(true);
    if (id === "search") { setSearch("D1"); setShowResults(true); }
  };
  const tourSearch = (id: string, query: string) => { setSearch(query); setShowResults(true); select(id); };
  const directions = () => {
    if (!selectedAsset?.point || !parking?.point) {
      setRoute(null); setRouteMessage("A mapped current or last known point and assigned return area are both required."); return;
    }
    if (mode === "demo") {
      setRoute(demoIllustrativeRoute(parking.point, selectedAsset.point, demoRoads[1].points));
      setRouteMessage("Illustrative demo route on traced corridors. Road access is not verified; no distance or ETA is claimed.");
    } else {
      const verified = verifiedRoute(parking.point, selectedAsset.point, real.routeNodes, real.routeEdges,
        selectedAsset.mobile ? "vehicle" : "walk");
      setRoute(verified);
      setRouteMessage(verified ? "Route uses administrator verified road segments. Building access and map scale remain unverified."
        : "Directions unavailable: verified road connections and destination access are incomplete.");
    }
  };
  const post = async (body: Record<string, unknown>) => {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/facility-map", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Request failed");
      setMessage(body.action === "return" ? result.matchesParking ? "Return confirmed inside the approved parking area." : "Observation recorded; equipment is outside its approved parking area." : "Saved to GOM.");
      setPicked(null); setPick(null); await refresh();
      return true;
    } catch (error) { setMessage(error instanceof Error ? error.message : "Request failed"); return false; }
    finally { setBusy(false); }
  };
  const addControl = () => {
    const lat = Number(latitude), lng = Number(longitude);
    if (!picked || !Number.isFinite(lat) || !Number.isFinite(lng) || !latitude || !longitude) {
      setMessage("Select a map point and enter verified latitude and longitude."); return;
    }
    setControlPoints((current) => [...current, { ...picked, latitude: lat, longitude: lng }]);
    setPicked(null); setLatitude(""); setLongitude("");
  };

  return <section className="facility-shell">
    <header className="facility-top">
      <div className="facility-title"><span className="facility-kicker">GOM / FACILITY INTELLIGENCE</span><h1>Facility Map</h1><span className="facility-subtitle">Original modular shipyard layout · asset discovery and return monitoring</span></div>
      <div className="facility-top-actions"><span className={`facility-mode-tag ${mode}`}>{mode === "demo" ? "FICTIONAL DEMO" : "GOM OPERATIONAL"}</span>
        <div className="facility-segment"><button type="button" className={mode === "real" ? "active" : ""} onClick={() => switchMode("real")}>Real records</button><button type="button" className={mode === "demo" ? "active" : ""} onClick={() => switchMode("demo")}>Demo live mode</button></div>
      </div>
    </header>
    <div className="facility-toolbar">
      <button type="button" className="facility-icon-btn" title="Toggle search panel" onClick={() => setShowResults((v) => !v)}><Search size={18} /></button>
      <div className="facility-search"><Search size={18} /><input aria-label="Search facility locations and assets" placeholder="Search asset ID, building, D1 / D2, parking…" value={search} onChange={(event) => { setSearch(event.target.value); setShowResults(true); }} />{search && <button type="button" title="Clear search" onClick={() => setSearch("")}><X size={16} /></button>}</div>
      <button type="button" className="facility-tool-button" onClick={() => { setShowLayers((v) => !v); setShowAdmin(false); }}><Layers3 size={16} /> Layers</button>
      {admin && <button type="button" className="facility-tool-button" onClick={() => { if (mode === "demo") switchMode("real"); setShowAdmin((v) => !v); setShowLayers(false); setShowRoads(true); }}><Settings2 size={16} /> Map admin</button>}
      <button type="button" className="facility-tool-button" onClick={() => sendCommand("fit")}><LocateFixed size={16} /> Fit</button>
    </div>
    {mode === "demo" && <div className="facility-demo-bar">
      <span className="facility-demo-flag">DEMO DATA ONLY</span>
      <select aria-label="Select demo scenario" value={scenario} onChange={(event) => chooseScenario(event.target.value)}><option value="">Choose stakeholder scenario…</option>{demoScenarios.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <button type="button" onClick={() => setRunning((v) => !v)}>{running ? <Pause size={15} /> : <Play size={15} />}{running ? "Pause" : "Start"}</button>
      <label>Speed <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}><option value={1}>1×</option><option value={2}>2×</option><option value={5}>5×</option></select></label>
      <label className="facility-check"><input type="checkbox" checked={liveUpdates} onChange={(event) => setLiveUpdates(event.target.checked)} /> Updates</label>
      <button type="button" onClick={() => { sequenceRef.current = 0; setDemoAssets(initialDemoAssets()); setSequence(0); setRunning(false); setScenario(""); setRoute(null); setSelectedId(null); setMessage("Demo reset to its starting state."); }}><RotateCcw size={15} /> Reset</button>
      <span className="facility-demo-count">100 fictional assets · 25 demo locations · 20 return areas · {demoOperators.length} operators</span>
      {scenario === "search" && <div className="facility-search-tour"><button onClick={() => tourSearch(demoPlaces[14].id, "D1")}>D1 block</button><button onClick={() => tourSearch(demoPlaces[6].id, "factory")}>Facility</button><button onClick={() => tourSearch("DEMO-FLK-001", "DEMO-FLK-001")}>Forklift</button><button onClick={() => tourSearch(demoParking[0].id, "P-01")}>Return area</button></div>}
    </div>}
    {mode === "real" && real.error && <div className="facility-real-notice"><AlertTriangle size={16} />{real.error}</div>}
    {showLayers && <div className="facility-popover facility-layer-popover"><strong>Map layers</strong><label><input type="checkbox" checked={showMobile} onChange={(e) => setShowMobile(e.target.checked)} /> Mobile equipment</label><label><input type="checkbox" checked={showFixed} onChange={(e) => setShowFixed(e.target.checked)} /> Fixed assets</label><label><input type="checkbox" checked={showPlaces} onChange={(e) => setShowPlaces(e.target.checked)} /> Buildings and areas</label><label><input type="checkbox" checked={showParking} onChange={(e) => setShowParking(e.target.checked)} /> Return areas</label><label><input type="checkbox" checked={showRoads} onChange={(e) => setShowRoads(e.target.checked)} /> {mode === "demo" ? "Illustrative paths" : "Verified and draft roads"}</label><span>All overlays use the original PDF coordinate system.</span></div>}
    <div className="facility-body">
      {showResults && <aside className="facility-list-panel"><div className="facility-panel-heading"><strong>{search ? `${searchHits.length} search results` : "Asset index"}</strong><button title="Collapse results" onClick={() => setShowResults(false)}><X size={16} /></button></div>
        <div className="facility-filter-row"><select aria-label="Filter assets" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">All assets</option><option value="unreturned">Not returned</option><option value="low-fuel">Low fuel</option><option value="offline">Offline / unconnected</option></select><span>{visibleAssets.length} shown</span></div>
        <div className="facility-scroll-list">
          {search ? searchHits.length ? groupedHits.map(([kind, hits]) => <div key={kind}><div className="facility-result-group">{kind} · {hits.length}</div>{hits.map((hit) => <button type="button" className={`facility-result ${selectedId === hit.id ? "active" : ""}`} key={hit.id} onClick={() => select(hit.id)}><strong>{hit.name}</strong><small>{hit.subtitle}{!hit.point ? " · Position unknown" : ""}</small></button>)}</div>) : <p className="facility-empty">No registered match. Search codes, names or return areas.</p>
            : visibleAssets.slice(0, 150).map((asset) => <button type="button" className={`facility-result ${selectedId === asset.id ? "active" : ""}`} key={asset.id} onClick={() => select(asset.id)}><span className="facility-result-kind">{asset.mobile ? "Mobile" : "Fixed"} · {asset.connection.replace("_", " ")}</span><strong>{asset.name}</strong><small>{asset.id} · {asset.point ? "Mapped" : "Location unknown"}{fuelState(asset) === "critical" ? " · CRITICAL FUEL" : ""}</small></button>)}
        </div>
      </aside>}
      <div className="facility-map-area"><FacilityCanvas assets={visibleAssets} places={places} translations={real.translations} roads={roads} roadNodes={roadNodes} selectedId={selectedId} showAssets showPlaces={showPlaces} showParking={showParking} showRoads={showRoads} route={route} command={command} pickMode={pick !== null} onSelect={select} onPick={(point) => {
        if (pick === "translation-start") { setLabelStart(point); setLabelEnd(null); setPick("translation-end"); setMessage("Now select the opposite corner of the exact text area."); return; }
        if (pick === "translation-end") { setLabelEnd(point); setPick(null); setMessage("Translation rectangle selected. Review its text before saving."); return; }
        setPicked(point); setMessage(`Selected image coordinate ${Math.round(point.x)}, ${Math.round(point.y)}.`);
      }} />
        <div className="facility-map-badge">SOURCE PDF · 6429 × 4500 · {mode === "demo" ? "DEMO OVERLAYS" : real.calibration?.status === "published" ? "CALIBRATED" : "GPS NOT CALIBRATED"}</div>
        <div className="facility-map-controls"><button title="Zoom in" onClick={() => sendCommand("zoom-in")}><Plus size={19} /></button><button title="Zoom out" onClick={() => sendCommand("zoom-out")}><Minus size={19} /></button><button title="Fit map" onClick={() => sendCommand("fit")}><Crosshair size={18} /></button></div>
        {pick && <div className="facility-pick-tip">Click the exact position on the map for {pick.replace("_", " ")}. <button onClick={() => { setPick(null); setPicked(null); }}>Cancel</button></div>}
        {routeMessage && <div className="facility-route-note"><AlertTriangle size={15} />{routeMessage}<button onClick={() => { setRoute(null); setRouteMessage(""); }} title="Close route note"><X size={14} /></button></div>}
      </div>
      {showDetails && (selectedAsset || selectedPlace) && <aside className="facility-detail-panel"><div className="facility-panel-heading"><span><small>{mode === "demo" ? "FICTIONAL DEMONSTRATION" : "GOM RECORD"}</small><strong>{selectedAsset ? "Asset intelligence" : "Facility location"}</strong></span><button title="Close details" onClick={() => setShowDetails(false)}><X size={16} /></button></div>
        {selectedAsset ? <div className="facility-detail-content"><h2>{selectedAsset.name}</h2><p className="facility-code">{selectedAsset.id} · {selectedAsset.category}</p>
          <div className="facility-status-row"><span className={`facility-pill ${selectedAsset.connection}`}>{selectedAsset.connection.replace("_", " ")}</span><span className={`facility-pill ${selectedAsset.returnStatus}`}>{selectedAsset.returnStatus.replace("_", " ")}</span></div>
          <h3>Find Asset</h3><dl><dt>Last known position</dt><dd>{selectedAsset.point ? selectedAsset.positionSource === "simulated" ? "Simulated map position" : "Mapped observation" : "Unknown — no mapped observation"}</dd><dt>Observed</dt><dd>{stamp(selectedAsset.positionAt)}</dd><dt>Position source</dt><dd>{selectedAsset.positionSource ?? "Not Connected"}</dd><dt>Current operator</dt><dd>{selectedAsset.operator ?? "Unknown"}</dd><dt>Last operator</dt><dd>{selectedAsset.lastOperator ?? "Unknown"}</dd><dt>Checkout</dt><dd>{stamp(selectedAsset.checkoutAt)}</dd><dt>Return deadline</dt><dd>{stamp(selectedAsset.returnDeadline)}</dd><dt>Assigned parking</dt><dd>{parking?.name ?? "Unknown"}</dd></dl>
          {selectedAsset.checkoutAt && selectedAsset.positionAt && Date.parse(selectedAsset.positionAt) < Date.parse(selectedAsset.checkoutAt) && <p className="facility-warning">Last observation predates the checkout. Current location is unknown.</p>}
          <button className="facility-primary" type="button" onClick={directions}>Directions to last known position</button>
          <h3>Fuel tank</h3><div className="facility-fuel"><strong>{selectedAsset.fuelPercent === null ? "No Fuel Data" : `${Math.round(selectedAsset.fuelPercent)}%`}</strong><span>{fuelLitres(selectedAsset) === null ? "Liters unavailable" : `${fuelLitres(selectedAsset)} L remaining`}</span><i className={`facility-fuel-state ${fuelState(selectedAsset)}`}>{fuelState(selectedAsset)}</i></div><dl><dt>Tank capacity</dt><dd>{selectedAsset.fuelCapacity === null ? "Unknown" : `${selectedAsset.fuelCapacity} L`}</dd><dt>Last fuel reading</dt><dd>{stamp(selectedAsset.fuelAt)}</dd><dt>Reading source</dt><dd>{selectedAsset.fuelSource ?? "Unavailable"}</dd><dt>Last refuel</dt><dd>{stamp(selectedAsset.lastRefuelAt)}</dd></dl>{mode === "real" && selectedFuelHistory.length > 0 && <div className="facility-history"><strong>Fuel history</strong>{selectedFuelHistory.slice(0, 6).map((entry, index) => <div key={`${entry.at}-${index}`}><strong>{entry.kind} · {entry.percent === null ? entry.litres === null ? "Unknown" : `${entry.litres} L` : `${Math.round(entry.percent)}%`}</strong><span>{entry.source} · {stamp(entry.at)}</span></div>)}</div>}
          <h3>Movement and usage</h3><div className="facility-history">{(mode === "real" ? selectedHistory ?? selectedAsset.history : selectedAsset.history).length ?
            (mode === "real" ? selectedHistory ?? selectedAsset.history : selectedAsset.history.slice().reverse()).slice(0, 12).map((entry, index) => <div key={`${entry.at}-${index}`}><strong>{entry.source}</strong><span>{stamp(entry.at)}</span></div>)
            : <p>Movement history unavailable.</p>}{uncalibratedCount > 0 && <p>{uncalibratedCount} GPS fixes exist but cannot be placed on this PDF until calibration is published.</p>}</div>
          {selectedAsset.events.length > 0 && <div className="facility-history facility-events">{selectedAsset.events.slice(0, 6).map((event, index) => <div key={`${event.kind}-${event.at}-${index}`}><strong>{event.kind}: {event.detail}</strong><span>{stamp(event.at)}</span></div>)}</div>}
          {mode === "real" && canWrite && <div className="facility-operator-actions"><h3>Operator actions</h3><label>Expected return area<select value={parkingChoice} onChange={(e) => setParkingChoice(e.target.value)}><option value="">Choose approved parking…</option>{places.filter((place) => place.kind === "parking" && !place.reviewRequired).map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}</select></label><label>Return deadline<input type="datetime-local" value={returnDue} onChange={(e) => setReturnDue(e.target.value)} /></label><button disabled={busy || !parkingChoice || !returnDue} onClick={() => void post({ action: "checkout", assetCode: selectedAsset.id, parkingId: parkingChoice, dueAt: new Date(returnDue).toISOString() })}>Check out to me</button><button onClick={() => { setPick("return"); setPicked(null); }}>Pick actual return position</button>{pick === "return" && picked && <label className="facility-check"><input type="checkbox" checked={returnConfirmed} onChange={(e) => setReturnConfirmed(e.target.checked)} /> I personally verified the equipment at this point.</label>}<button disabled={busy || !picked || !returnConfirmed} onClick={() => picked && void post({ action: "return", assetCode: selectedAsset.id, ...picked, confirmed: returnConfirmed })}>Confirm return</button><h3>Manual fuel observation</h3><label>Reading type<select value={fuelKind} onChange={(e) => setFuelKind(e.target.value as "reading" | "refuel")}><option value="reading">Fuel level reading</option><option value="refuel">After refueling</option></select></label><label>Verified tank level (%)<input type="number" min="0" max="100" step="0.1" value={manualFuel} onChange={(e) => setManualFuel(e.target.value)} /></label><button disabled={busy || manualFuel === "" || Number(manualFuel) < 0 || Number(manualFuel) > 100} onClick={() => void post({ action: "fuel_observation", assetCode: selectedAsset.id, kind: fuelKind, percent: Number(manualFuel) })}>Record fuel reading</button></div>}
        </div> : selectedPlace && <div className="facility-detail-content"><h2>{selectedPlace.name}</h2><p className="facility-code">{selectedPlace.code} · {selectedPlace.kind}</p><dl><dt>Record type</dt><dd>{selectedPlace.source === "demo" ? "Fictional demonstration placement" : selectedPlace.source === "pdf" ? "Original PDF text annotation" : "Administrator registered"}</dd><dt>Image coordinate</dt><dd>{Math.round(selectedPlace.point.x)}, {Math.round(selectedPlace.point.y)}</dd><dt>Review</dt><dd>{selectedPlace.reviewRequired ? "Needs site verification" : "Verified"}</dd>{selectedPlace.kind === "parking" && <><dt>Return tolerance</dt><dd>{selectedPlace.radiusPx ?? "Unknown"} image px</dd></>}</dl>{selectedPlace.source === "pdf" && <p className="facility-warning">This point is the annotation box, not a verified equipment or building position. The original code is preserved exactly.</p>}{selectedPlace.kind === "parking" && <p>Assets assigned here appear in their Find Asset panel.</p>}{admin && selectedPlace.source === "admin" && selectedPlace.reviewRequired && <button className="facility-primary" onClick={() => void post({ action: "verify_place", id: selectedPlace.id, confirmed: true })}>Confirm site location reviewed</button>}</div>}
      </aside>}
    </div>
    {showAdmin && admin && <div className="facility-admin-panel"><div className="facility-panel-heading"><strong>Map administration</strong><button onClick={() => setShowAdmin(false)}><X size={16} /></button></div><p>All coordinates use the rendered PDF image. Review positions against the site before operational use.</p>
      <details open><summary>Register location or return area <ChevronDown size={15} /></summary><div className="facility-admin-fields"><input placeholder="Unique code" value={placeCode} onChange={(e) => setPlaceCode(e.target.value)} /><input placeholder="Verified English name" value={placeName} onChange={(e) => setPlaceName(e.target.value)} /><select value={placeKind} onChange={(e) => setPlaceKind(e.target.value as MapPlace["kind"])}><option value="building">Building</option><option value="area">Area</option><option value="gate">Gate</option><option value="parking">Parking / return</option></select>{placeKind === "parking" && <input type="number" min="10" max="500" value={parkingRadius} onChange={(e) => setParkingRadius(e.target.value)} aria-label="Return tolerance in image pixels" />}<button onClick={() => setPick("place")}>Pick map point</button><button disabled={busy || !picked || pick !== "place"} onClick={() => picked && void post({ action: "place", code: placeCode, name: placeName, kind: placeKind, radiusPx: Number(parkingRadius), ...picked })}>Save location</button></div></details>
      <details><summary>Assign a real asset position <ChevronDown size={15} /></summary><div className="facility-admin-fields"><select value={selectedAsset?.id ?? ""} onChange={(e) => select(e.target.value)}><option value="">Choose asset…</option>{real.assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.id} · {asset.name}</option>)}</select><button onClick={() => setPick("point")}>Pick observed point</button><button disabled={busy || !picked || pick !== "point" || !selectedAsset || selectedAsset.demo} onClick={() => picked && selectedAsset && void post({ action: "manual_point", assetCode: selectedAsset.id, ...picked })}>Record manual observation</button></div></details>
      <details><summary>GPS to PDF calibration <ChevronDown size={15} /></summary><div className="facility-admin-fields"><p>{controlPoints.length} control points. Publish requires at least 4 surveyed pairs spread across the site and residual ≤40 image pixels.</p><button onClick={() => setPick("calibration")}>Pick control point</button><input type="number" step="any" placeholder="Verified latitude" value={latitude} onChange={(e) => setLatitude(e.target.value)} /><input type="number" step="any" placeholder="Verified longitude" value={longitude} onChange={(e) => setLongitude(e.target.value)} /><button onClick={addControl}>Add point</button><button disabled={busy || controlPoints.length < 4} onClick={() => void post({ action: "calibration", points: controlPoints, publish: false })}>Save draft</button><button disabled={busy || controlPoints.length < 4} onClick={() => void post({ action: "calibration", points: controlPoints, publish: true })}>Publish calibration</button></div></details>
      <details><summary>English label review <ChevronDown size={15} /></summary><div className="facility-admin-fields"><p>Embedded Chinese labels require a verified translation and a tight text rectangle. The PDF remains untouched.</p><button onClick={() => { setLabelStart(null); setLabelEnd(null); setPick("translation-start"); }}>Pick two corners of text only</button><input placeholder="Original Chinese text" value={sourceText} onChange={(e) => setSourceText(e.target.value)} /><input placeholder="Verified English translation" value={englishText} onChange={(e) => setEnglishText(e.target.value)} /><p>{labelStart && labelEnd ? `Box: ${Math.round(Math.abs(labelEnd.x - labelStart.x))} × ${Math.round(Math.abs(labelEnd.y - labelStart.y))} image px` : "No label box selected"}</p><button disabled={busy || !labelStart || !labelEnd || !sourceText || !englishText} onClick={() => { if (!labelStart || !labelEnd) return; void post({ action: "translation", sourceText, englishText, x: Math.min(labelStart.x, labelEnd.x), y: Math.min(labelStart.y, labelEnd.y), width: Math.abs(labelEnd.x - labelStart.x), height: Math.abs(labelEnd.y - labelStart.y), confirmed: true }); }}>Publish reviewed translation</button></div></details>
      <details><summary>Verified road graph <ChevronDown size={15} /></summary><div className="facility-admin-fields"><p>Trace only roads confirmed for the permitted travel mode. New nodes and edges start as drafts.</p><input placeholder="Road node name" value={nodeName} onChange={(e) => setNodeName(e.target.value)} /><button onClick={() => setPick("node")}>Pick road node</button><button disabled={busy || !picked || pick !== "node"} onClick={() => picked && void post({ action: "route_node", name: nodeName, ...picked })}>Add draft node</button><select value={fromNode} onChange={(e) => setFromNode(e.target.value)}><option value="">From node…</option>{real.routeNodes.map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}</select><select value={toNode} onChange={(e) => setToNode(e.target.value)}><option value="">To node…</option>{real.routeNodes.map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}</select><select value={roadMode} onChange={(e) => setRoadMode(e.target.value as "walk" | "vehicle" | "both")}><option value="walk">Walkway</option><option value="vehicle">Vehicle road</option><option value="both">Walk and vehicle</option></select><button disabled={busy || !fromNode || !toNode} onClick={() => void post({ action: "route_edge", from: fromNode, to: toNode, mode: roadMode })}>Connect draft edge</button><div className="facility-admin-route-list">{real.routeNodes.map((node) => <div key={node.id}>{node.name} · {node.verified ? "verified" : "draft"}{!node.verified && <button onClick={() => void post({ action: "verify_route", kind: "node", id: node.id, confirmed: true })}>Verify</button>}</div>)}{real.routeEdges.map((edge) => <div key={edge.id}>Road segment · {edge.permittedModes.join("/")} · {edge.verified ? "verified" : "draft"}{!edge.verified && <button onClick={() => void post({ action: "verify_route", kind: "edge", id: edge.id, confirmed: true })}>Verify</button>}<button onClick={() => void post({ action: "restrict_route", id: edge.id, restricted: !edge.restricted })}>{edge.restricted ? "Reopen" : "Restrict"}</button></div>)}</div></div></details>
    </div>}
    {message && <div className="facility-toast" role="status">{message}<button onClick={() => setMessage("")}><X size={14} /></button></div>}
    <footer className="facility-footer"><span>Base drawing: supplied “Modular SS Layout_china lg.pdf” · exact page render; overlays are separate.</span><span>{mode === "real" ? `Operational data: ${real.assets.length} assets · ${real.assets.filter((asset) => asset.point).length} mapped` : `Simulated clock: +${sequence} min · fictional records only`}</span></footer>
  </section>;
}

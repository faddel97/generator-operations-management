"use client";

import { useEffect, useRef } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

import { MAP_HEIGHT, MAP_SCALE, MAP_WIDTH, mapToSource, sourceToMap, type MapAsset, type MapPlace, type MapPoint, type MapTranslation } from "@/lib/facility-map/model";
import { demoBuildings, vectorBreakwaters, vectorRoads, vectorWater } from "@/lib/facility-map/vector";

export type MapCommand = { token: number; kind: "fit" | "focus" | "zoom-in" | "zoom-out"; point?: MapPoint };

export function FacilityCanvas({ assets, places, translations, roads, roadNodes, selectedId, showAssets, showPlaces, showParking, showRoads, route, routeStartId, routeDestinationId,
  baseMode, demoMode, navigationPoint,
  command, pickMode, onSelect, onPick }: {
  assets: MapAsset[];
  places: MapPlace[];
  translations: MapTranslation[];
  roads: Array<{ points: MapPoint[]; verified: boolean; restricted: boolean }>;
  roadNodes: Array<{ point: MapPoint; verified: boolean }>;
  selectedId: string | null;
  showAssets: boolean;
  showPlaces: boolean;
  showParking: boolean;
  showRoads: boolean;
  route: MapPoint[] | null;
  routeStartId: string;
  routeDestinationId: string;
  baseMode: "vector" | "drawing";
  demoMode: boolean;
  navigationPoint: MapPoint | null;
  command: MapCommand | null;
  pickMode: boolean;
  onSelect: (id: string) => void;
  onPick: (point: MapPoint) => void;
}) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const overlay = useRef<L.LayerGroup | null>(null);
  const routeLayer = useRef<L.LayerGroup | null>(null);
  const tileLayer = useRef<L.TileLayer | null>(null);
  const vectorLayer = useRef<L.LayerGroup | null>(null);
  const navigationLayer = useRef<L.LayerGroup | null>(null);
  const localizedLayer = useRef<L.LayerGroup | null>(null);
  const roadLayer = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  const onPickRef = useRef(onPick);
  const pickRef = useRef(pickMode);
  useEffect(() => {
    onSelectRef.current = onSelect;
    onPickRef.current = onPick;
    pickRef.current = pickMode;
  }, [onSelect, onPick, pickMode]);

  useEffect(() => {
    if (!element.current || map.current) return;
    const bounds: L.LatLngBoundsExpression = [[-MAP_HEIGHT / MAP_SCALE, 0], [0, MAP_WIDTH / MAP_SCALE]];
    const instance = L.map(element.current, {
      crs: L.CRS.Simple,
      minZoom: -1.5, maxZoom: 4, zoomSnap: 0.25, zoomDelta: 0.75,
      zoomControl: false, scrollWheelZoom: true, wheelPxPerZoomLevel: 85, wheelDebounceTime: 40,
      doubleClickZoom: true, dragging: true, touchZoom: true,
      keyboard: true, attributionControl: false, preferCanvas: true, zoomAnimation: true,
    });
    tileLayer.current = L.tileLayer("/facility-map/tiles/{z}/{x}/{y}.webp", {
      tileSize: 256, minZoom: -2, maxZoom: 4, minNativeZoom: 0, maxNativeZoom: 4,
      noWrap: true, bounds, className: "facility-map-tile",
    });
    instance.setMaxBounds(L.latLngBounds(bounds).pad(0.2));
    instance.setView(sourceToMap({ x: 3300, y: 1550 }), element.current.clientWidth < 500 ? 1.35 : 1.1);
    instance.on("click", (event) => {
      if (pickRef.current) onPickRef.current(mapToSource(event.latlng.lat, event.latlng.lng));
    });
    const group = L.layerGroup().addTo(instance);
    map.current = instance;
    overlay.current = group;
    const resize = new ResizeObserver(() => instance.invalidateSize({ pan: false }));
    resize.observe(element.current);
    return () => {
      resize.disconnect();
      instance.remove();
      map.current = null;
      overlay.current = null;
      tileLayer.current = null;
    };
  }, []);

  useEffect(() => {
    const instance = map.current, tiles = tileLayer.current;
    if (!instance || !tiles) return;
    if (baseMode === "drawing") tiles.addTo(instance);
    else tiles.remove();
    instance.invalidateSize({ pan: false });
  }, [baseMode]);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    vectorLayer.current?.remove();
    const group = L.layerGroup().addTo(instance);
    vectorLayer.current = group;
    if (baseMode === "drawing") return () => { group.remove(); };
    for (const water of vectorWater) L.polygon(water.map(sourceToMap), {
      stroke: false, fillColor: "#b9dce8", fillOpacity: 1, interactive: false,
    }).addTo(group);
    for (const building of [...demoBuildings].sort((a, b) => (a.kind === "area" ? -1 : 1) - (b.kind === "area" ? -1 : 1))) {
      if (!showPlaces) continue;
      const selected = demoMode && selectedId === building.id;
      const area = building.kind === "area";
      const shape = L.polygon(building.outline.map(sourceToMap), {
        color: selected ? "#087bb8" : area ? "#d0dbd7" : "#9cabb2",
        weight: selected ? 3 : area ? 1 : 1.4,
        fillColor: area ? "#edf1ed" : selected ? "#aedce9" : "#e2e8e8",
        fillOpacity: area ? 0.2 : 1,
        interactive: demoMode, renderer: L.svg(),
        className: `facility-building-footprint facility-building-${building.code.toLowerCase()}`,
      });
      if (demoMode) {
        shape.on("click", () => onSelectRef.current(building.id));
        shape.bindTooltip(`${building.name} · demo digitization`, { sticky: true });
      }
      shape.addTo(group);
    }
    if (showRoads) {
      for (const road of vectorRoads) {
        const coords = road.points.map(sourceToMap);
        const primary = road.className === "primary";
        L.polyline(coords, { color: "#a8b8bd", weight: primary ? 17 : 12,
          opacity: 1, lineCap: "round", lineJoin: "round", interactive: false }).addTo(group);
        L.polyline(coords, { color: "#fffdf9", weight: primary ? 12 : 8,
          opacity: 1, lineCap: "round", lineJoin: "round", interactive: false }).addTo(group);
      }
    }
    for (const breakwater of vectorBreakwaters) L.polyline(breakwater.map(sourceToMap), {
      color: "#e3e8e3", weight: 8, opacity: 1, interactive: false,
    }).addTo(group);
    const redrawLabels = () => {
      group.eachLayer((layer) => { if (layer instanceof L.Marker) group.removeLayer(layer); });
      const zoom = instance.getZoom();
      if (zoom >= 0.85) {
        for (const road of vectorRoads.filter((item) => item.className === "primary" || zoom >= 1.5)) {
          const middle = road.points[Math.floor(road.points.length / 2)];
          L.marker(sourceToMap(middle), { interactive: false,
            icon: L.divIcon({ className: "facility-vector-label-wrap",
              html: `<span class="facility-road-label">${road.name}</span>`, iconSize: [150, 18], iconAnchor: [75, 9] }),
          }).addTo(group);
        }
      }
      if (zoom >= 1.35) for (const building of demoBuildings) {
        if (building.kind === "area" && zoom < 1.8 && selectedId !== building.id) continue;
        L.marker(sourceToMap(building.point), { interactive: false,
          icon: L.divIcon({ className: "facility-vector-label-wrap",
            html: `<span class="facility-building-label ${selectedId === building.id ? "selected" : ""}">${building.code}</span>`,
            iconSize: [110, 22], iconAnchor: [55, 11] }),
        }).addTo(group);
      }
    };
    redrawLabels();
    instance.on("zoomend", redrawLabels);
    return () => { instance.off("zoomend", redrawLabels); group.remove(); };
  }, [baseMode, demoMode, selectedId, showRoads, showPlaces]);

  useEffect(() => {
    const instance = map.current;
    const group = overlay.current;
    if (!instance || !group) return;
    const redraw = () => {
      group.clearLayers();
      const zoom = instance.getZoom();
      const visibleAssets = showAssets ? assets.filter((asset) => asset.point) : [];
      if (zoom < 1.5) {
        const buckets = new Map<string, MapAsset[]>();
        const size = zoom < 0.5 ? 1050 : 520;
        for (const asset of visibleAssets) {
          const key = `${Math.floor(asset.point!.x / size)}:${Math.floor(asset.point!.y / size)}`;
          buckets.set(key, [...(buckets.get(key) ?? []), asset]);
        }
        for (const bucket of buckets.values()) {
          if (bucket.length === 1 || bucket.some((asset) => asset.id === selectedId)) {
            for (const asset of bucket) addAsset(group, asset, selectedId, onSelectRef);
          } else {
            const center = { x: bucket.reduce((n, asset) => n + asset.point!.x, 0) / bucket.length,
              y: bucket.reduce((n, asset) => n + asset.point!.y, 0) / bucket.length };
            const marker = L.marker(sourceToMap(center), {
              icon: L.divIcon({ className: "facility-cluster-wrap", html: `<span class="facility-cluster">${bucket.length}</span>`, iconSize: [38, 38], iconAnchor: [19, 19] }),
              keyboard: true, title: `${bucket.length} assets; zoom in to inspect`,
            });
            marker.on("click", () => instance.flyTo(sourceToMap(center), Math.min(3, zoom + 1.5)));
            group.addLayer(marker);
          }
        }
      } else for (const asset of visibleAssets) addAsset(group, asset, selectedId, onSelectRef);
      for (const place of places) {
        if (place.kind === "parking" ? !showParking : !showPlaces) continue;
        if (place.kind === "annotation" && place.id !== selectedId) continue;
        if (place.kind === "parking" && zoom < 1.5 && place.id !== selectedId) continue;
        if (zoom < 1.5 && place.id !== selectedId && place.code !== "D1" && place.code !== "D2") continue;
        const selected = place.id === selectedId;
        if (place.outline?.length && place.outline.length > 2 && baseMode === "drawing") {
          const footprint = L.polygon(place.outline.map(sourceToMap), {
            color: selected ? "#087fa8" : place.kind === "area" ? "#7c5bb7" : "#4d7f96",
            weight: selected ? 3 : 1.5,
            opacity: selected ? 1 : 0.72,
            fillColor: place.kind === "area" ? "#b9a4df" : "#b9d9e6",
            fillOpacity: selected ? 0.28 : 0.14,
            dashArray: place.kind === "area" ? "7 5" : undefined,
          });
          footprint.on("click", () => onSelectRef.current(place.id));
          footprint.bindTooltip(place.name, { sticky: true, direction: "top" });
          group.addLayer(footprint);
        }
        if (baseMode === "vector" && place.source === "demo" && place.kind !== "parking") continue;
        const marker = L.marker(sourceToMap(place.point), {
          icon: L.divIcon({ className: "facility-place-wrap", html: `<span class="facility-place ${place.kind} ${selected ? "selected" : ""}">${place.kind === "parking" ? "P" : place.kind === "gate" ? "G" : "⌂"}</span>`, iconSize: [26, 26], iconAnchor: [13, 13] }),
          title: place.name, keyboard: true,
        });
        marker.on("click", () => onSelectRef.current(place.id));
        group.addLayer(marker);
      }
    };
    redraw();
    instance.on("zoomend", redraw);
    return () => { instance.off("zoomend", redraw); };
  }, [assets, places, selectedId, showAssets, showPlaces, showParking, baseMode]);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    localizedLayer.current?.remove();
    const group = L.layerGroup().addTo(instance);
    localizedLayer.current = group;
    const redraw = () => {
      group.clearLayers();
      if (instance.getZoom() < 1.5) return;
      for (const item of translations) {
        const bounds: L.LatLngBoundsExpression = [[-(item.y + item.height) / MAP_SCALE, item.x / MAP_SCALE],
          [-item.y / MAP_SCALE, (item.x + item.width) / MAP_SCALE]];
        L.rectangle(bounds, { stroke: false, fillColor: "#e4dcc6", fillOpacity: 0.97, interactive: false }).addTo(group);
        const safe = item.englishText.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
        L.marker(sourceToMap({ x: item.x + item.width / 2, y: item.y + item.height / 2 }), {
          interactive: false, icon: L.divIcon({ className: "facility-translation-wrap", html: `<span class="facility-translation">${safe}</span>`, iconSize: [140, 26], iconAnchor: [70, 13] }),
        }).addTo(group);
      }
    };
    redraw(); instance.on("zoomend", redraw);
    return () => { instance.off("zoomend", redraw); group.remove(); };
  }, [translations]);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    roadLayer.current?.remove();
    const group = L.layerGroup().addTo(instance);
    roadLayer.current = group;
    if (showRoads) for (const road of roads) if (road.points.length > 1)
      L.polyline(road.points.map(sourceToMap), { color: road.restricted ? "#bd3c26" : road.verified ? "#0e795e" : "#f59e0b",
        weight: 3, opacity: 0.9, dashArray: road.verified ? undefined : "6 7", interactive: false }).addTo(group);
    if (showRoads) for (const node of roadNodes)
      L.circleMarker(sourceToMap(node.point), { radius: 5, color: "#fff", weight: 2,
        fillColor: node.verified ? "#0e795e" : "#f59e0b", fillOpacity: 1, interactive: false }).addTo(group);
    return () => { group.remove(); };
  }, [roads, roadNodes, showRoads]);

  useEffect(() => {
    if (!map.current) return;
    routeLayer.current?.remove();
    if (!route?.length || route.length < 2) { routeLayer.current = null; return; }
    const group = L.layerGroup().addTo(map.current);
    const points = route.map(sourceToMap);
    L.polyline(points, { color: "#ffffff", weight: 9, opacity: 0.94, interactive: false }).addTo(group);
    const blueLine = L.polyline(points, { color: "#1597e5", weight: 5, opacity: 1, interactive: true, className: "facility-active-route", renderer: L.svg() }).addTo(group);
    blueLine.bindTooltip("Open route destination", { sticky: true });
    blueLine.on("click", () => onSelectRef.current(routeDestinationId));
    const startMarker = L.circleMarker(points[0], { radius: 7, color: "#ffffff", weight: 3, fillColor: "#1597e5", fillOpacity: 1, renderer: L.svg(), className: "facility-route-start" }).addTo(group);
    startMarker.bindTooltip("Route start", { direction: "top" });
    startMarker.on("click", () => onSelectRef.current(routeStartId));
    const endMarker = L.circleMarker(points[points.length - 1], { radius: 8, color: "#ffffff", weight: 3, fillColor: "#df3f33", fillOpacity: 1, renderer: L.svg(), className: "facility-route-end" }).addTo(group);
    endMarker.bindTooltip("Route destination", { direction: "top" });
    endMarker.on("click", () => onSelectRef.current(routeDestinationId));
    map.current.fitBounds(L.latLngBounds(points), { animate: true, padding: [48, 48], maxZoom: 2.4 });
    routeLayer.current = group;
  }, [route, routeStartId, routeDestinationId]);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    navigationLayer.current?.remove();
    if (!navigationPoint) return;
    const group = L.layerGroup().addTo(instance);
    L.circleMarker(sourceToMap(navigationPoint), { radius: 10, color: "#fff", weight: 3,
      fillColor: "#0a88dd", fillOpacity: 1, className: "facility-navigation-dot", renderer: L.svg() }).addTo(group);
    L.circleMarker(sourceToMap(navigationPoint), { radius: 19, color: "#0a88dd", weight: 2,
      opacity: 0.35, fillOpacity: 0, interactive: false }).addTo(group);
    navigationLayer.current = group;
    return () => { group.remove(); };
  }, [navigationPoint]);

  useEffect(() => {
    if (!map.current || !command) return;
    const instance = map.current;
    if (command.kind === "fit") instance.fitBounds([[-MAP_HEIGHT / MAP_SCALE, 0], [0, MAP_WIDTH / MAP_SCALE]], { animate: true, padding: [18, 18] });
    if (command.kind === "focus" && command.point) instance.flyTo(sourceToMap(command.point), Math.max(2.3, instance.getZoom()), { duration: 0.65 });
    if (command.kind === "zoom-in") instance.zoomIn(0.75);
    if (command.kind === "zoom-out") instance.zoomOut(0.75);
  }, [command]);

  return <div ref={element} className={`facility-map-canvas ${pickMode ? "picking" : ""}`} role="application" aria-label="Interactive vector facility map" />;
}

function addAsset(group: L.LayerGroup, asset: MapAsset, selectedId: string | null,
  onSelect: React.MutableRefObject<(id: string) => void>) {
  if (!asset.point) return;
  const status = asset.connection === "reporting" || asset.connection === "simulated" ? "active"
    : asset.connection === "offline" || asset.connection === "stale" ? "offline" : "manual";
  const selected = asset.id === selectedId;
  const marker = L.marker(sourceToMap(asset.point), {
    icon: L.divIcon({ className: "facility-asset-wrap",
      html: `<span class="facility-asset ${status} ${selected ? "selected" : ""} ${asset.demo ? "demo" : ""}">${asset.mobile ? "●" : "◆"}</span>`,
      iconSize: [26, 26], iconAnchor: [13, 13] }), title: `${asset.id} · ${asset.name}`, keyboard: true,
  });
  marker.on("click", () => onSelect.current(asset.id));
  group.addLayer(marker);
}

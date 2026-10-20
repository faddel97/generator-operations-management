"use client";

import { useEffect, useRef } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

import { MAP_HEIGHT, MAP_SCALE, MAP_WIDTH, mapToSource, sourceToMap, type MapAsset, type MapPlace, type MapPoint, type MapTranslation } from "@/lib/facility-map/model";

export type MapCommand = { token: number; kind: "fit" | "focus" | "zoom-in" | "zoom-out"; point?: MapPoint };

export function FacilityCanvas({ assets, places, translations, roads, roadNodes, selectedId, showAssets, showPlaces, showParking, showRoads, route,
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
  command: MapCommand | null;
  pickMode: boolean;
  onSelect: (id: string) => void;
  onPick: (point: MapPoint) => void;
}) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const overlay = useRef<L.LayerGroup | null>(null);
  const routeLayer = useRef<L.Polyline | null>(null);
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
      zoomControl: false, scrollWheelZoom: true, wheelPxPerZoomLevel: 85,
      doubleClickZoom: true, dragging: true, touchZoom: true,
      keyboard: true, attributionControl: false, preferCanvas: true,
    });
    L.tileLayer("/facility-map/tiles/{z}/{x}/{y}.webp", {
      tileSize: 256, minZoom: -2, maxZoom: 4, minNativeZoom: 0, maxNativeZoom: 4,
      noWrap: true, bounds, className: "facility-map-tile",
    }).addTo(instance);
    instance.setMaxBounds(L.latLngBounds(bounds).pad(0.2));
    instance.fitBounds(bounds, { padding: [18, 18] });
    if (element.current.clientWidth < 500) instance.setView(sourceToMap({ x: 3050, y: 1500 }), 1.15);
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
    };
  }, []);

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
        if (zoom < 1.5 && place.id !== selectedId && place.code !== "D1" && place.code !== "D2") continue;
        const selected = place.id === selectedId;
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
  }, [assets, places, selectedId, showAssets, showPlaces, showParking]);

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
    routeLayer.current = route?.length && route.length > 1
      ? L.polyline(route.map(sourceToMap), { color: "#db6b20", weight: 5, opacity: 0.92, dashArray: "9 8" }).addTo(map.current)
      : null;
  }, [route]);

  useEffect(() => {
    if (!map.current || !command) return;
    const instance = map.current;
    if (command.kind === "fit") instance.fitBounds([[-MAP_HEIGHT / MAP_SCALE, 0], [0, MAP_WIDTH / MAP_SCALE]], { animate: true, padding: [18, 18] });
    if (command.kind === "focus" && command.point) instance.flyTo(sourceToMap(command.point), Math.max(2.3, instance.getZoom()), { duration: 0.65 });
    if (command.kind === "zoom-in") instance.zoomIn(0.75);
    if (command.kind === "zoom-out") instance.zoomOut(0.75);
  }, [command]);

  return <div ref={element} className={`facility-map-canvas ${pickMode ? "picking" : ""}`} role="application" aria-label="Original facility drawing map" />;
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

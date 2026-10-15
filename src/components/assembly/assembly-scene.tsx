"use client";

import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
import { Box3, CanvasTexture, CubicBezierCurve3, Group, MathUtils, PerspectiveCamera, Sprite, SRGBColorSpace, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import type { AssemblyConnection, AssemblyPart, EquipmentPackage, Vector3Tuple } from "@/lib/assembly/training-generator";
import { PartGeometry } from "./part-geometry";

export type SceneProps = {
  equipment: EquipmentPackage; selectedId: string; explode: number;
  showInternals: boolean; showConnections: boolean; showDimensions: boolean;
  isolate: boolean; hiddenIds: string[]; stageIds: string[] | null;
  selectedConnection: string | null; resetKey: number; focusKey: number;
  cameraView: "perspective" | "front" | "top";
  zoomRequest: { direction: "in" | "out"; sequence: number };
  pivotRequest: { kind: "part" | "assembly"; partId: string | null; sequence: number };
  onSelect: (id: string) => void; onConnectionSelect: (id: string) => void; onClearFocus: () => void;
};

// GPU sprites keep labels readable without creating nested React DOM roots.
function SceneLabel({ text, position, small = false }: { text: string; position: Vector3Tuple; small?: boolean }) {
  const sprite = useRef<Sprite>(null);
  const world = useRef(new Vector3());
  const { camera, size } = useThree();
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    context.font = "500 24px Arial";
    canvas.width = Math.ceil(context.measureText(text).width) + 32;
    canvas.height = 56;
    context.fillStyle = "rgba(8, 22, 28, 0.94)";
    context.beginPath(); context.roundRect(1, 1, canvas.width - 2, 54, 9); context.fill();
    context.strokeStyle = "rgba(75, 181, 164, 0.5)"; context.stroke();
    context.font = "500 24px Arial"; context.fillStyle = "#c0f5ec";
    context.textBaseline = "middle"; context.textAlign = "center";
    context.fillText(text, canvas.width / 2, 29);
    const map = new CanvasTexture(canvas); map.colorSpace = SRGBColorSpace;
    return map;
  }, [text]);
  useEffect(() => () => texture.dispose(), [texture]);
  useFrame(() => {
    if (!sprite.current) return;
    sprite.current.getWorldPosition(world.current);
    const height = camera.position.distanceTo(world.current) * 2 * Math.tan(MathUtils.degToRad(20)) * (small ? 18 : 25) / size.height;
    sprite.current.scale.set(height * texture.image.width / texture.image.height, height, 1);
  });
  return <sprite ref={sprite} position={position} renderOrder={50}><spriteMaterial map={texture} depthTest={false} depthWrite={false} /></sprite>;
}

export function displayedPosition(part: AssemblyPart, explode: number): Vector3Tuple {
  return part.position.map((value, i) => value + part.explode[i] * explode) as Vector3Tuple;
}
function endpoint(part: AssemblyPart, offset: Vector3Tuple, explode: number) {
  return new Vector3(...displayedPosition(part, explode)).add(new Vector3(...offset));
}

function Connection({ connection, equipment, explode, selected, onSelect }: { connection: AssemblyConnection; equipment: EquipmentPackage; explode: number; selected: boolean; onSelect: () => void }) {
  const from = equipment.parts.find((p) => p.id === connection.from)!;
  const to = equipment.parts.find((p) => p.id === connection.to)!;
  const start = endpoint(from, connection.fromOffset, explode);
  const end = endpoint(to, connection.toOffset, explode);
  const bend = new Vector3(...connection.bend);
  const curve = new CubicBezierCurve3(start, start.clone().lerp(end, .3).add(bend), start.clone().lerp(end, .7).add(bend), end);
  const radius = connection.kind === "Exhaust" ? .022 : connection.kind === "Cooling" ? .016 : .006;
  return <group>
    <mesh onClick={(event) => { event.stopPropagation(); onSelect(); }}>
      <tubeGeometry args={[curve, 32, radius * (selected ? 1.4 : 1), 8, false]} />
      <meshStandardMaterial color={selected ? "#16b8a6" : connection.color} metalness={.18} roughness={.6} emissive={selected ? "#16b8a6" : "#000000"} emissiveIntensity={.25} />
    </mesh>
    {selected && [start, end].map((position, i) => <mesh key={i} position={position}><sphereGeometry args={[.019, 12, 12]} /><meshStandardMaterial color="#20b9a6" /></mesh>)}
  </group>;
}

function DimensionGuides({ part }: { part: AssemblyPart }) {
  const [w, h, d] = part.size;
  const color = "#53c8b8";
  return <group>
    <Line points={[[-w / 2, -h / 2 - .06, d / 2 + .04], [w / 2, -h / 2 - .06, d / 2 + .04]]} color={color} lineWidth={1} />
    <Line points={[[w / 2 + .06, -h / 2, d / 2 + .04], [w / 2 + .06, h / 2, d / 2 + .04]]} color={color} lineWidth={1} />
    <SceneLabel position={[0, -h / 2 - .065, d / 2 + .04]} text={`${Math.round(w * 1000)} mm*`} small />
    <SceneLabel position={[w / 2 + .075, 0, d / 2 + .04]} text={`${Math.round(h * 1000)} mm*`} small />
  </group>;
}

function CameraRig({ model, controls, resetKey, focusKey, isolate, selectedId, cameraView, zoomRequest, pivotRequest }: { model: React.RefObject<Group | null>; controls: React.RefObject<OrbitControlsImpl | null>; resetKey: number; focusKey: number; isolate: boolean; selectedId: string; cameraView: SceneProps["cameraView"]; zoomRequest: SceneProps["zoomRequest"]; pivotRequest: SceneProps["pivotRequest"] }) {
  const { camera, size, invalidate } = useThree();
  const desired = useRef<{ position: Vector3; target: Vector3 } | null>(null);
  const previous = useRef<{ resetKey: number; focusKey: number; isolate: boolean; cameraView: SceneProps["cameraView"]; width: number; height: number; pivotSequence: number } | null>(null);
  useEffect(() => {
    if (!model.current || !controls.current) return;
    model.current.updateWorldMatrix(true, true);
    const current = { resetKey, focusKey, isolate, cameraView, width: size.width, height: size.height, pivotSequence: pivotRequest.sequence };
    const last = previous.current;
    previous.current = current;
    const selectedObject = model.current.getObjectByName(`part-geometry:${selectedId}`);
    const boundsCenter = (target: Group | ReturnType<Group["getObjectByName"]>) => {
      if (!target) return null;
      const bounds = new Box3().setFromObject(target);
      return bounds.isEmpty() ? null : { bounds, center: bounds.getCenter(new Vector3()) };
    };
    const fit = (target: Group | ReturnType<Group["getObjectByName"]>) => {
      const measured = boundsCenter(target);
      if (!measured) return;
      const radius = Math.max(measured.bounds.getSize(new Vector3()).length() / 2, .06);
      const distance = radius / Math.sin(MathUtils.degToRad(40 / 2)) * 1.12 * Math.max(1, size.height / size.width);
      const direction = cameraView === "top" ? new Vector3(.001, 1, .001) : cameraView === "front" ? new Vector3(0, .17, 1) : new Vector3(-1.2, .8, 1.6);
      desired.current = { position: measured.center.clone().add(direction.normalize().multiplyScalar(distance)), target: measured.center };
      invalidate();
    };
    const shiftPivot = (target: Group | ReturnType<Group["getObjectByName"]>, useObjectOrigin = false) => {
      const center = useObjectOrigin && target ? target.getWorldPosition(new Vector3()) : boundsCenter(target)?.center;
      if (!center) return;
      const delta = center.clone().sub(controls.current!.target);
      desired.current = { position: camera.position.clone().add(delta), target: center };
      invalidate();
    };

    const frameChanged = !last || last.resetKey !== resetKey || last.cameraView !== cameraView || last.width !== size.width || last.height !== size.height;
    if (frameChanged) fit(isolate && selectedObject ? selectedObject : model.current);
    else if (last.isolate !== isolate) fit(isolate && selectedObject ? selectedObject : model.current);
    else if (last.focusKey !== focusKey && selectedObject) fit(selectedObject);
    else if (last.pivotSequence !== pivotRequest.sequence) {
      const requestedPart = pivotRequest.partId ? model.current.getObjectByName(`part-geometry:${pivotRequest.partId}`) : null;
      shiftPivot(pivotRequest.kind === "part" && requestedPart ? requestedPart : model.current, Boolean(requestedPart && pivotRequest.kind === "part"));
    }
  // Exploding only moves parts. Keeping it out of these dependencies preserves
  // the technician's current close-up, orbit target, and zoom while parts move.
  }, [resetKey, focusKey, isolate, selectedId, cameraView, size.width, size.height, camera, controls, invalidate, model, pivotRequest]);
  useEffect(() => {
    const control = controls.current;
    if (!control) return;
    const cancel = () => { desired.current = null; };
    control.addEventListener("start", cancel);
    return () => control.removeEventListener("start", cancel);
  }, [controls]);
  useEffect(() => {
    if (!zoomRequest.sequence || !controls.current) return;
    const target = controls.current.target.clone();
    const offset = camera.position.clone().sub(target);
    const distance = MathUtils.clamp(offset.length() * (zoomRequest.direction === "in" ? .76 : 1.32), .12, 30);
    desired.current = { position: target.clone().add(offset.normalize().multiplyScalar(distance)), target };
  }, [zoomRequest, camera, controls]);
  useFrame((_, delta) => {
    if (!desired.current || !controls.current) return;
    const alpha = 1 - Math.exp(-10 * Math.min(delta, .1));
    camera.position.lerp(desired.current.position, alpha);
    controls.current.target.lerp(desired.current.target, alpha);
    controls.current.update();
    if (camera.position.distanceTo(desired.current.position) < .0005) desired.current = null;
  });
  return null;
}

function MouseNavigation({ controls, onClearFocus }: { controls: React.RefObject<OrbitControlsImpl | null>; onClearFocus: () => void }) {
  const { camera, gl, size, invalidate } = useThree();
  useEffect(() => {
    const element = gl.domElement;
    const ownerDocument = element.ownerDocument;
    const orbitControls = controls.current;
    if (!orbitControls) return;
    let rightStart: { x: number; y: number } | null = null;
    let rightDragged = false;
    let chordActive = false;
    let previousPoint = { x: 0, y: 0 };
    let controlsWereEnabled = true;

    const beginChord = (event: PointerEvent) => {
      if (chordActive) return;
      chordActive = true;
      rightDragged = true;
      previousPoint = { x: event.clientX, y: event.clientY };
      controlsWereEnabled = orbitControls.enabled;
      orbitControls.enabled = false;
    };
    const pointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      if (event.button === 2) {
        rightStart = { x: event.clientX, y: event.clientY };
        rightDragged = false;
      }
      if (event.buttons === 3) beginChord(event);
    };
    const pointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      if (rightStart && Math.hypot(event.clientX - rightStart.x, event.clientY - rightStart.y) > 5) rightDragged = true;
      if (event.buttons !== 3) return;
      if (!chordActive) beginChord(event);
      const dx = event.clientX - previousPoint.x;
      const dy = event.clientY - previousPoint.y;
      previousPoint = { x: event.clientX, y: event.clientY };
      const perspective = camera as PerspectiveCamera;
      const distance = camera.position.distanceTo(orbitControls.target);
      const worldPerPixel = 2 * distance * Math.tan(MathUtils.degToRad(perspective.fov / 2)) / Math.max(size.height, 1);
      const movement = new Vector3(1, 0, 0).applyQuaternion(camera.quaternion).multiplyScalar(-dx * worldPerPixel)
        .add(new Vector3(0, 1, 0).applyQuaternion(camera.quaternion).multiplyScalar(dy * worldPerPixel));
      camera.position.add(movement);
      orbitControls.target.add(movement);
      orbitControls.update();
      invalidate();
      event.preventDefault();
    };
    const pointerUp = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const clear = event.button === 2 && rightStart !== null && !rightDragged && !chordActive;
      if (event.button === 2) rightStart = null;
      if (event.buttons === 0) {
        orbitControls.enabled = controlsWereEnabled;
        chordActive = false;
      }
      if (clear) onClearFocus();
    };
    const cancelGesture = () => {
      rightStart = null;
      rightDragged = false;
      chordActive = false;
      orbitControls.enabled = controlsWereEnabled;
    };
    const contextMenu = (event: MouseEvent) => event.preventDefault();

    element.addEventListener("pointerdown", pointerDown, true);
    ownerDocument.addEventListener("pointermove", pointerMove, true);
    ownerDocument.addEventListener("pointerup", pointerUp, true);
    ownerDocument.addEventListener("pointercancel", cancelGesture, true);
    window.addEventListener("blur", cancelGesture);
    element.addEventListener("contextmenu", contextMenu);
    return () => {
      element.removeEventListener("pointerdown", pointerDown, true);
      ownerDocument.removeEventListener("pointermove", pointerMove, true);
      ownerDocument.removeEventListener("pointerup", pointerUp, true);
      ownerDocument.removeEventListener("pointercancel", cancelGesture, true);
      window.removeEventListener("blur", cancelGesture);
      element.removeEventListener("contextmenu", contextMenu);
      orbitControls.enabled = controlsWereEnabled;
    };
  }, [camera, controls, gl, invalidate, onClearFocus, size.height]);
  return null;
}

function Model(props: SceneProps) {
  const { equipment, selectedId, explode, showInternals, showConnections, showDimensions, isolate, hiddenIds, stageIds, selectedConnection, onSelect, onConnectionSelect } = props;
  const model = useRef<Group>(null);
  const controls = useRef<OrbitControlsImpl>(null);
  const selected = equipment.parts.find((p) => p.id === selectedId)!;
  const visibleParts = equipment.parts.filter((part) => !hiddenIds.includes(part.id) && (!part.internal || showInternals || (isolate && selectedId === part.id)) && (!isolate || selectedId === part.id) && (!stageIds || stageIds.includes(part.id)));
  const visible = new Set(visibleParts.map((part) => part.id));
  const edge = equipment.connections.find((item) => item.id === selectedConnection);
  return <>
    <ambientLight intensity={1.1} />
    <hemisphereLight args={["#dae7f1", "#384641", 1.5]} />
    <directionalLight position={[-3, 6, 4]} intensity={3} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} shadow-bias={-.0004} />
    <directionalLight position={[3, 3, -4]} intensity={2} color="#9bbcd0" />
    <group ref={model}>
      {visibleParts.map((part) => {
        const highlighted = selectedId === part.id || edge?.from === part.id || edge?.to === part.id;
        const ghost = showInternals && !isolate && ["engine", "head", "sump", "alternator", "terminal"].includes(part.id) && !highlighted;
        return <group key={part.id} name={`part:${part.id}`} position={isolate ? [0, .5, 0] : displayedPosition(part, explode)} onClick={(event) => { if (event.nativeEvent.button !== 0 || event.delta > 5) return; event.stopPropagation(); onSelect(part.id); }}>
          <group name={`part-geometry:${part.id}`}><PartGeometry part={part} selected={highlighted} ghost={ghost} /></group>
          {selectedId === part.id && showDimensions && <DimensionGuides part={part} />}
          {selectedId === part.id && <SceneLabel position={[0, part.size[1] / 2 + .10, 0]} text={part.name} />}
        </group>;
      })}
      {showConnections && !isolate && equipment.connections.filter((item) => visible.has(item.from) && visible.has(item.to)).map((item) => <Connection key={item.id} equipment={equipment} connection={item} explode={explode} selected={selectedConnection === item.id} onSelect={() => onConnectionSelect(item.id)} />)}
    </group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.17, 0]} receiveShadow><planeGeometry args={[100, 100]} /><meshStandardMaterial color="#15252b" roughness={1} /></mesh>
    <gridHelper args={[20, 80, "#38525a", "#243b43"]} position={[0, -.165, 0]} />
    <OrbitControls ref={controls} makeDefault minDistance={.12} maxDistance={30} enableDamping dampingFactor={.08} />
    <MouseNavigation controls={controls} onClearFocus={props.onClearFocus} />
    <CameraRig model={model} controls={controls} {...props} selectedId={selected.id} />
  </>;
}

class GraphicsBoundary extends Component<{ children: ReactNode; onFailed: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailed(); }
  render() {
    if (this.state.failed) return <div role="alert" className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-slate-200"><p>3D graphics could not start.</p><p className="text-sm text-slate-400">Enable hardware acceleration or try another browser. The parts list and reference information remain available.</p><button type="button" className="rounded border border-slate-500 px-3 py-2 text-sm" onClick={() => this.setState({ failed: false })}>Retry 3D viewer</button></div>;
    return this.props.children;
  }
}

export default function AssemblyScene(props: SceneProps) {
  const [ready, setReady] = useState(false);
  return <div className="absolute inset-0" data-testid="assembly-scene" data-ready={ready}>
    <GraphicsBoundary onFailed={() => setReady(true)}>
      <Canvas shadows dpr={[1, 1.5]} camera={{ position: [-3, 2.3, 4], fov: 40, near: .01, far: 100 }} gl={{ antialias: true, powerPreference: "high-performance" }} onCreated={() => setReady(true)} fallback={<div className="p-8 text-slate-200">WebGL is unavailable. Use the parts list to inspect component information.</div>}>
        <color attach="background" args={["#15252b"]} />
        <fog attach="fog" args={["#15252b", 12, 40]} />
        <Suspense fallback={null}><Model {...props} /></Suspense>
      </Canvas>
    </GraphicsBoundary>
    {!ready && <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-slate-300">Preparing 3D assembly…</div>}
  </div>;
}

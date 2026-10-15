"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Box, Check, ChevronLeft, ChevronRight, Eye, EyeOff, Focus, Info, Layers3, Maximize2, Minus, Plus, RotateCcw, Search, Unplug, Wrench } from "lucide-react";

import { lifecycleTopics, trainingGenerator, type EquipmentPackage } from "@/lib/assembly/training-generator";
import { generatorPartImagePath, generatorParts } from "@/lib/generator-parts";

const AssemblyScene = dynamic(() => import("./assembly-scene"), { ssr: false, loading: () => <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-300">Loading 3D viewer…</div> });
const button = "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:cursor-not-allowed disabled:opacity-40";
const lightButton = `${button} border-slate-200 bg-white text-slate-600 hover:bg-slate-50`;
const darkButton = `${button} border-white/15 bg-white/5 text-slate-200 hover:bg-white/10`;
const iconsize = "h-3.5 w-3.5";
type Tab = "overview" | "service" | "connections" | "sources";
type Mode = "explore" | "assembly" | "usage";

export function AssemblyWorkspace({ equipment = trainingGenerator }: { equipment?: EquipmentPackage }) {
  const [selectedId, setSelectedId] = useState("engine");
  const [explode, setExplode] = useState(0);
  const [internals, setInternals] = useState(false);
  const [connections, setConnections] = useState(true);
  const [dimensions, setDimensions] = useState(false);
  const [isolate, setIsolate] = useState(false);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [mode, setMode] = useState<Mode>("explore");
  const [step, setStep] = useState(0);
  const [query, setQuery] = useState("");
  const [system, setSystem] = useState("All systems");
  const [resetKey, setResetKey] = useState(0);
  const [focusKey, setFocusKey] = useState(0);
  const [cameraView, setCameraView] = useState<"perspective" | "front" | "top">("perspective");
  const [zoomRequest, setZoomRequest] = useState<{ direction: "in" | "out"; sequence: number }>({ direction: "in", sequence: 0 });
  const [pivotRequest, setPivotRequest] = useState<{ kind: "part" | "assembly"; partId: string | null; sequence: number }>({ kind: "assembly", partId: null, sequence: 0 });
  const animation = useRef<number | null>(null);
  const selected = equipment.parts.find((part) => part.id === selectedId) ?? equipment.parts[0];
  const stageIds = mode === "assembly" ? Array.from(new Set(equipment.stages.slice(0, step + 1).flatMap((stage) => stage.parts))) : null;
  const systemNames = Array.from(new Set(equipment.parts.map((part) => part.system)));
  const listedParts = equipment.parts.filter((part) => (system === "All systems" || part.system === system) && `${part.name} ${part.system}`.toLowerCase().includes(query.toLowerCase()));
  const partConnections = equipment.connections.filter((edge) => edge.from === selected.id || edge.to === selected.id);
  const visibleCount = equipment.parts.filter((part) => !hiddenIds.includes(part.id) && (!part.internal || internals || (isolate && selected.id === part.id)) && (!isolate || part.id === selected.id) && (!stageIds || stageIds.includes(part.id))).length;
  const photoPart = generatorParts.find((part) => part.number === selected.catalogNumber);
  const pivotPart = pivotRequest.partId ? equipment.parts.find((part) => part.id === pivotRequest.partId) : null;

  useEffect(() => () => { if (animation.current !== null) cancelAnimationFrame(animation.current); }, []);
  const clearCameraFocus = useCallback(() => {
    setPivotRequest((request) => ({ kind: "assembly", partId: null, sequence: request.sequence + 1 }));
  }, []);
  function animateExplode(target: number) {
    if (animation.current !== null) cancelAnimationFrame(animation.current);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setExplode(target); return; }
    const start = performance.now();
    const origin = explode;
    function update(time: number) {
      const t = Math.min((time - start) / 550, 1);
      const eased = t * t * (3 - 2 * t);
      setExplode(origin + (target - origin) * eased);
      animation.current = t < 1 ? requestAnimationFrame(update) : null;
    }
    animation.current = requestAnimationFrame(update);
  }
  function selectPart(id: string) {
    const part = equipment.parts.find((item) => item.id === id);
    if (!part) return;
    setSelectedId(id);
    setPivotRequest((request) => ({ kind: "part", partId: id, sequence: request.sequence + 1 }));
    setSelectedConnection(null);
    setHiddenIds((ids) => ids.filter((item) => item !== id));
    if (part.internal) setInternals(true);
    if (stageIds && !stageIds.includes(id)) setMode("explore");
  }
  function selectConnection(id: string) {
    const edge = equipment.connections.find((item) => item.id === id);
    if (!edge) return;
    setSelectedConnection(id);
    setSelectedId(edge.from);
    setPivotRequest((request) => ({ kind: "part", partId: edge.from, sequence: request.sequence + 1 }));
    setHiddenIds((ids) => ids.filter((item) => item !== edge.from && item !== edge.to));
    setConnections(true); setIsolate(false); setMode("explore");
    if (equipment.parts.some((part) => (part.id === edge.from || part.id === edge.to) && part.internal)) setInternals(true);
    setTab("connections");
  }
  function reset() {
    if (animation.current !== null) cancelAnimationFrame(animation.current);
    setExplode(0); setIsolate(false); setHiddenIds([]); setInternals(false); setConnections(true); setDimensions(false);
    setMode("explore"); setStep(0); setTab("overview"); setQuery(""); setSystem("All systems"); setSelectedId("engine"); setSelectedConnection(null); setCameraView("perspective"); setResetKey((key) => key + 1);
    clearCameraFocus();
  }
  function changeStep(index: number) {
    setStep(index); setMode("assembly"); setIsolate(false); setSelectedConnection(null);
    setHiddenIds([]); setSelectedId(equipment.stages[index].parts[0]);
    setResetKey((key) => key + 1);
    clearCameraFocus();
  }

  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><Link href="/parts" className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-teal-700"><ArrowLeft className={iconsize} /> Parts catalog</Link><div className="flex flex-wrap items-center gap-3"><h2 className="text-2xl font-semibold tracking-tight text-slate-950">3D Assembly Lab</h2><span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-800">{equipment.revision}</span></div><p className="mt-2 text-sm text-slate-600">Explore the assembly. Follow its connections. Understand every component.</p></div>
      <div className="pt-1 text-right"><p className="text-xs font-semibold text-slate-800">{equipment.name}</p><p className="mt-1 text-[11px] text-slate-500">{equipment.parts.length} component groups · {equipment.connections.length} connection paths</p></div>
    </div>

    <div className="flex items-start gap-2.5 rounded-md border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs leading-5 text-amber-900"><Info className="mt-0.5 h-4 w-4 shrink-0" /><p><strong>Illustrative training model.</strong> Shapes, dimensions, materials and connection routes are approximate. This is not a verified replica of your installed generator. <button type="button" className="underline underline-offset-2" onClick={() => setTab("sources")}>View reference scope</button>.</p></div>

    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1" role="tablist" aria-label="Workspace mode">
        {([{ id: "explore", label: "Explore", icon: Box }, { id: "assembly", label: "Assembly story", icon: Layers3 }, { id: "usage", label: "Installation & use", icon: Wrench }] as const).map((item) => <button key={item.id} type="button" role="tab" aria-selected={mode === item.id} className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium ${mode === item.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`} onClick={() => { if (item.id === "assembly") changeStep(step); else setMode(item.id); }}><item.icon className={iconsize} />{item.label}</button>)}
      </div>
      <button type="button" onClick={reset} className={lightButton}><RotateCcw className={iconsize} /> Reset assembly</button>
    </div>

    {mode === "assembly" && <section className="rounded-md border border-slate-200 bg-white p-4" aria-label="Assembly story">
      <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-wider text-teal-700">Illustrative assembly overview · {step + 1} / {equipment.stages.length}</p><h3 className="mt-1 text-sm font-semibold text-slate-900">{equipment.stages[step].name}</h3></div><div className="flex gap-2"><button type="button" aria-label="Previous assembly stage" disabled={step === 0} onClick={() => changeStep(step - 1)} className={lightButton}><ChevronLeft className={iconsize} /></button><button type="button" aria-label="Next assembly stage" disabled={step === equipment.stages.length - 1} onClick={() => changeStep(step + 1)} className={lightButton}><ChevronRight className={iconsize} /></button></div></div>
      <p className="mt-2 text-xs leading-5 text-slate-600">{equipment.stages[step].description}</p><div className="mt-3 flex flex-wrap gap-1.5">{equipment.stages.map((stage, i) => <button key={stage.name} type="button" aria-label={`Assembly stage ${i + 1}: ${stage.name}`} aria-current={step === i ? "step" : undefined} onClick={() => changeStep(i)} className={`rounded px-2 py-1 text-[11px] ${step === i ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600"}`}>{i < step ? <Check className="inline h-3 w-3" /> : i + 1} {stage.name}</button>)}</div>
    </section>}

    {mode === "usage" && <section className="grid gap-3 sm:grid-cols-2" aria-label="Installation and operation planning">{lifecycleTopics.map((topic) => <div key={topic.name} className="rounded-md border border-slate-200 bg-white p-4"><h3 className="text-sm font-semibold text-slate-900">{topic.name}</h3><p className="mt-2 text-xs leading-5 text-slate-600">{topic.text}</p></div>)}</section>}

    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[210px_minmax(0,1fr)_320px]">
      <aside className="order-3 min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white xl:col-span-2 2xl:order-1 2xl:col-span-1" aria-label="Assembly component list">
        <div className="border-b border-slate-100 p-3.5"><div className="flex items-center justify-between"><h3 className="text-xs font-semibold text-slate-900">Components</h3><span className="text-[10px] text-slate-400">{equipment.parts.length}</span></div><div className="relative mt-3"><Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a component…" aria-label="Search components" className="w-full rounded-md border border-slate-200 bg-slate-50 py-2 pl-8 pr-2 text-xs outline-teal-600" /></div><select aria-label="Filter component system" value={system} onChange={(event) => setSystem(event.target.value)} className="mt-2 w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-xs text-slate-600"><option>All systems</option>{systemNames.map((name) => <option key={name}>{name}</option>)}</select></div>
        <div className="grid max-h-[520px] overflow-y-auto p-1.5 sm:grid-cols-2 2xl:block" data-testid="component-list">{listedParts.map((part) => <button key={part.id} type="button" data-part-id={part.id} aria-pressed={selected.id === part.id} onClick={() => selectPart(part.id)} className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2.5 text-left transition ${selected.id === part.id ? "bg-teal-50 text-teal-900" : "text-slate-600 hover:bg-slate-50"}`}><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${selected.id === part.id ? "bg-teal-600" : hiddenIds.includes(part.id) ? "bg-slate-200" : "bg-slate-400"}`} /><span className="min-w-0 flex-1"><span className="block text-[11px] font-medium">{part.name}</span><span className="mt-0.5 block text-[10px] text-slate-400">{part.system}{part.internal ? " · Internal" : ""}{hiddenIds.includes(part.id) ? " · Hidden" : ""}</span></span>{selected.id === part.id && <ChevronRight className="h-3 w-3 shrink-0" />}</button>)}{listedParts.length === 0 && <p className="p-3 text-xs text-slate-500">No matching components.</p>}</div>
        <div className="flex items-center justify-between border-t border-slate-100 px-3 py-3 text-[10px] text-slate-500"><span>{visibleCount} visible</span>{hiddenIds.length > 0 && <button type="button" className="font-medium text-teal-700" onClick={() => setHiddenIds([])}>Show hidden ({hiddenIds.length})</button>}</div>
      </aside>

      <section className="order-1 min-w-0 overflow-hidden rounded-lg border border-slate-800 bg-[#15252b] 2xl:order-2" aria-label="Interactive 3D assembly" data-camera-pivot={pivotRequest.kind === "part" ? pivotRequest.partId : "assembly"}>
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3"><div><span className="text-[10px] font-semibold uppercase tracking-[.15em] text-teal-300">{isolate ? "Part inspection" : "Assembly viewport"}</span><p className="mt-1 text-xs text-slate-300">{isolate ? selected.name : equipment.name}</p></div><span className="rounded-full bg-white/5 px-2 py-1 text-[10px] text-slate-400">{isolate ? "Independent orbit" : pivotPart ? `Pivot · ${pivotPart.name}` : "Assembly pivot"}</span></header>
        <div className="relative h-[410px] sm:h-[520px] 2xl:h-[580px]">
          <AssemblyScene equipment={equipment} selectedId={selected.id} explode={explode} showInternals={internals} showConnections={connections} showDimensions={dimensions} isolate={isolate} hiddenIds={hiddenIds} stageIds={stageIds} selectedConnection={selectedConnection} resetKey={resetKey} focusKey={focusKey} cameraView={cameraView} zoomRequest={zoomRequest} pivotRequest={pivotRequest} onSelect={selectPart} onConnectionSelect={selectConnection} onClearFocus={clearCameraFocus} />
          <div className="absolute right-3 top-3 flex gap-1.5">{(["perspective", "front", "top"] as const).map((view) => <button key={view} type="button" aria-label={`${view} camera view`} aria-pressed={cameraView === view} onClick={() => { setCameraView(view); setResetKey((key) => key + 1); clearCameraFocus(); }} className={`rounded border px-2 py-1.5 text-[10px] capitalize backdrop-blur ${cameraView === view ? "border-teal-400/40 bg-teal-400/10 text-teal-200" : "border-white/10 bg-slate-950/30 text-slate-400 hover:text-white"}`}>{view === "perspective" ? "3D" : view}</button>)}</div>
          <div className="absolute bottom-12 right-3 flex flex-col gap-1.5"><button type="button" aria-label="Zoom in" onClick={() => setZoomRequest((value) => ({ direction: "in", sequence: value.sequence + 1 }))} className={`${darkButton} !bg-slate-950/50 !px-2.5`}><Plus className="h-4 w-4" /></button><button type="button" aria-label="Zoom out" onClick={() => setZoomRequest((value) => ({ direction: "out", sequence: value.sequence + 1 }))} className={`${darkButton} !bg-slate-950/50 !px-2.5`}><Minus className="h-4 w-4" /></button></div>
          <div className="pointer-events-none absolute bottom-3 left-4 right-4 flex flex-wrap justify-between gap-2 text-[10px] text-slate-400"><span>Click part to pivot · Right-click to clear · Right-drag / both buttons / Ctrl-drag to pan</span><span>{visibleCount} component groups</span></div>
        </div>
        <div className="space-y-3 border-t border-white/10 bg-[#112027] p-4">
          <div className="flex flex-wrap items-center gap-2"><button type="button" className={`${darkButton} ${isolate ? "!border-teal-500/50 !bg-teal-500/10 !text-teal-200" : ""}`} aria-pressed={isolate} onClick={() => { setIsolate(!isolate); setSelectedConnection(null); setHiddenIds((ids) => ids.filter((id) => id !== selected.id)); }}><Maximize2 className={iconsize} />{isolate ? "Return to assembly" : "Isolate part"}</button><button type="button" className={darkButton} onClick={() => { setPivotRequest((request) => ({ kind: "part", partId: selected.id, sequence: request.sequence + 1 })); setFocusKey((key) => key + 1); }}><Focus className={iconsize} /> Focus</button><button type="button" disabled={isolate} className={darkButton} onClick={() => setHiddenIds((ids) => ids.includes(selected.id) ? ids.filter((id) => id !== selected.id) : [...ids, selected.id])}>{hiddenIds.includes(selected.id) ? <Eye className={iconsize} /> : <EyeOff className={iconsize} />}{hiddenIds.includes(selected.id) ? "Show part" : "Hide part"}</button></div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-300"><label className="flex items-center gap-1.5"><input type="checkbox" checked={internals} disabled={isolate} onChange={(event) => setInternals(event.target.checked)} className="accent-teal-400" /> Internal components</label><label className="flex items-center gap-1.5"><input type="checkbox" checked={connections} disabled={isolate} onChange={(event) => setConnections(event.target.checked)} className="accent-teal-400" /> Connections</label><label className="flex items-center gap-1.5"><input type="checkbox" checked={dimensions} onChange={(event) => setDimensions(event.target.checked)} className="accent-teal-400" /> Design dimensions*</label></div>
          <div className="border-t border-white/10 pt-3"><div className="mb-2 flex justify-between gap-2 text-[10px] text-slate-400"><label htmlFor="assembly-explode">Assembly separation</label><output htmlFor="assembly-explode" className="tabular-nums text-teal-200">{Math.round(explode * 100)}%</output></div><div className="flex items-center gap-3"><button type="button" onClick={() => animateExplode(0)} disabled={isolate} className="text-[11px] font-medium text-slate-300 disabled:opacity-40">Assemble</button><input id="assembly-explode" type="range" min="0" max="100" value={Math.round(explode * 100)} disabled={isolate} onChange={(event) => { if (animation.current !== null) cancelAnimationFrame(animation.current); setExplode(Number(event.target.value) / 100); }} className="h-1.5 min-w-0 flex-1 accent-teal-400" /><button type="button" onClick={() => animateExplode(1)} disabled={isolate} className="text-[11px] font-medium text-teal-200 disabled:opacity-40">Explode</button></div></div>
        </div>
      </section>

      <aside className="order-2 min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white xl:col-start-2 xl:row-start-1 2xl:order-3 2xl:col-start-3" aria-label="Selected component inspector">
        <div className="border-b border-slate-100 p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-teal-700">{selected.system}{selected.internal ? " / internal component" : ""}</p><h3 className="mt-2 text-lg font-semibold leading-snug text-slate-950" data-testid="selected-part-name">{selected.name}</h3><p className="mt-1 text-[11px] text-slate-400">{selected.id} · Illustrative geometry</p></div>
        <div className="flex border-b border-slate-100 px-2" role="tablist" aria-label="Component information">{(["overview", "service", "connections", "sources"] as const).map((id) => <button key={id} type="button" role="tab" aria-selected={tab === id} className={`min-w-0 flex-1 border-b-2 px-1 py-3 text-[10px] font-medium capitalize ${tab === id ? "border-teal-600 text-teal-800" : "border-transparent text-slate-500 hover:text-slate-900"}`} onClick={() => setTab(id)}>{id === "connections" ? `Links (${partConnections.length})` : id}</button>)}</div>
        <div className="space-y-4 p-4" role="tabpanel" aria-label={`${tab} information`}>
          {tab === "overview" && <>
            <p className="text-xs leading-5 text-slate-600">{selected.purpose}</p>
            <div className="rounded-md bg-slate-50 p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Illustrative nominal size*</p><p className="mt-1.5 text-sm font-semibold tabular-nums text-slate-900" data-testid="part-dimensions">{selected.size.map((value) => Math.round(value * 1000)).join(" × ")} <span className="text-[10px] font-normal text-slate-500">mm</span></p><p className="mt-1 text-[10px] leading-4 text-slate-500">X × Y × Z design values. These are not measured or OEM dimensions.</p></div>
            <div><h4 className="text-[11px] font-semibold text-slate-900">Materials & construction</h4><p className="mt-1.5 text-xs leading-5 text-slate-600">{selected.construction}</p></div>
            <dl className="divide-y divide-slate-100 text-[11px]"><div className="flex justify-between gap-3 py-2"><dt className="text-slate-500">OEM part number</dt><dd className="text-slate-700">Not verified</dd></div><div className="flex justify-between gap-3 py-2"><dt className="text-slate-500">Mass / handling rating</dt><dd className="text-slate-700">Not verified</dd></div><div className="flex justify-between gap-3 py-2"><dt className="text-slate-500">Parent assembly</dt><dd className="text-right text-slate-700">{equipment.parts.find((part) => part.id === selected.parentId)?.name ?? "Generator set"}</dd></div></dl>
            {photoPart && <figure className="border-t border-slate-100 pt-3"><Image src={generatorPartImagePath(photoPart)} width={320} height={160} alt={`${selected.name}: catalog reference, variant may differ`} className="h-28 w-full object-contain" /><figcaption className="mt-2 text-[10px] leading-4 text-slate-400">Existing catalog reference image. Shape and variant may differ from the training model.</figcaption></figure>}
          </>}
          {tab === "service" && <>
            <div><h4 className="text-[11px] font-semibold text-slate-900">Inspection focus</h4><p className="mt-2 text-xs leading-5 text-slate-600">{selected.inspection}</p></div>
            <div><h4 className="text-[11px] font-semibold text-slate-900">Tools to plan</h4><ul className="mt-2 space-y-2">{selected.tools.map((tool) => <li key={tool} className="flex items-start gap-2 text-xs leading-5 text-slate-600"><Wrench className="mt-1 h-3 w-3 shrink-0 text-teal-700" />{tool}</li>)}</ul></div>
            <div><h4 className="text-[11px] font-semibold text-slate-900">Handling & replacement planning</h4><p className="mt-2 text-xs leading-5 text-slate-600">{selected.handling}</p></div>
            <div className="rounded-md border border-amber-100 bg-amber-50 p-3 text-[11px] leading-5 text-amber-900">This package has inspection guidance, not an approved repair procedure. Replacement part numbers, intervals, fastener torques and lifting instructions need the applicable OEM documents.</div>
            <button type="button" className={`${lightButton} w-full`} onClick={() => { setTab("connections"); setConnections(true); }}><Unplug className={iconsize} /> Inspect connected components <ArrowRight className={iconsize} /></button>
          </>}
          {tab === "connections" && <>
            <p className="text-[11px] leading-5 text-slate-500">Select a path to highlight both components and their connection. Routes and port positions are illustrative.</p>
            {partConnections.length === 0 ? <p className="py-3 text-xs text-slate-500">No external connection paths are mapped for this component. Mechanical interfaces are represented by the assembly layout.</p> : partConnections.map((edge) => <button key={edge.id} type="button" data-connection-id={edge.id} aria-pressed={selectedConnection === edge.id} onClick={() => selectConnection(edge.id)} className={`w-full rounded-md border p-3 text-left ${selectedConnection === edge.id ? "border-teal-300 bg-teal-50" : "border-slate-200 hover:bg-slate-50"}`}><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: edge.color }} /><span className="text-[10px] font-semibold uppercase text-slate-500">{edge.kind}</span></span><span className="mt-1.5 block text-xs font-semibold text-slate-900">{edge.name}</span><span className="mt-2 block text-[10px] leading-4 text-slate-500">{equipment.parts.find((part) => part.id === edge.from)?.name} / {edge.fromPort}<br />↓<br />{equipment.parts.find((part) => part.id === edge.to)?.name} / {edge.toPort}</span>{selectedConnection === edge.id && <span className="mt-2 block text-[11px] leading-5 text-teal-900">{edge.description}</span>}</button>)}
          </>}
          {tab === "sources" && <>
            <p className="text-xs leading-5 text-slate-600">{equipment.description}</p><div className="rounded-md bg-slate-50 p-3 text-[11px] leading-5 text-slate-600">All geometry is authored for this prototype. No exact OEM CAD, material grades, routing or service specifications are claimed.</div>
            {equipment.sources.map((source) => <div key={source.id} className="border-t border-slate-100 pt-3"><a href={source.url} target={source.url.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="text-xs font-semibold text-teal-800 hover:underline">{source.title} ↗</a><p className="mt-1 text-[11px] leading-5 text-slate-500">{source.scope}</p>{selected.sourceIds.includes(source.id) && <span className="mt-1 block text-[10px] font-medium text-teal-700">Referenced for this component</span>}</div>)}
          </>}
        </div>
      </aside>
    </div>
    <p className="text-[11px] leading-5 text-slate-500" aria-live="polite">{isolate ? `Inspecting ${selected.name} in isolation. Drag to rotate it independently; return to assembly restores its installed design pose.` : `${visibleCount} component groups visible. ${Math.round(explode * 100)}% separation.`} {dimensions ? "* Dimensions describe the illustrative design only." : "Select a component in the model or parts list to inspect it."} {!isolate && (pivotPart ? ` Rotation pivot: ${pivotPart.name}.` : " Rotation pivot: full assembly.")}</p>
  </div>;
}

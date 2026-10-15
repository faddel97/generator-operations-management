"use client";

import type { AssemblyPart, Vector3Tuple } from "@/lib/assembly/training-generator";

type SolidProps = { size: Vector3Tuple; at?: Vector3Tuple; color: string; opacity?: number; selected?: boolean; rotation?: Vector3Tuple };
const metal = "#a8b3b6";
const dark = "#34434a";
const copper = "#b87d51";
function Box({ size, at = [0, 0, 0], color, opacity = 1, selected = false, rotation }: SolidProps) {
  return <mesh position={at} rotation={rotation} castShadow receiveShadow><boxGeometry args={size} /><meshStandardMaterial color={color} metalness={.32} roughness={.48} transparent={opacity < 1} opacity={opacity} depthWrite={opacity === 1} emissive={selected ? "#2bbda8" : "#000000"} emissiveIntensity={.22} /></mesh>;
}
function Cylinder({ length, radius, at = [0, 0, 0], color, axis = "x", opacity = 1, selected = false, open = false }: { length: number; radius: number; at?: Vector3Tuple; color: string; axis?: "x" | "y" | "z"; opacity?: number; selected?: boolean; open?: boolean }) {
  return <mesh position={at} rotation={axis === "x" ? [0, 0, Math.PI / 2] : axis === "z" ? [Math.PI / 2, 0, 0] : [0, 0, 0]} castShadow receiveShadow><cylinderGeometry args={[radius, radius, length, 32, 1, open]} /><meshStandardMaterial color={color} metalness={.48} roughness={.4} transparent={opacity < 1} opacity={opacity} depthWrite={opacity === 1} emissive={selected ? "#2bbda8" : "#000000"} emissiveIntensity={.22} /></mesh>;
}
function Ring({ radius, tube = .012, x = 0, color = metal }: { radius: number; tube?: number; x?: number; color?: string }) {
  return <mesh position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]} castShadow><torusGeometry args={[radius, tube, 8, 40]} /><meshStandardMaterial color={color} metalness={.55} roughness={.4} /></mesh>;
}

export function PartGeometry({ part, selected, ghost = false }: { part: AssemblyPart; selected: boolean; ghost?: boolean }) {
  const [w, h, d] = part.size;
  const color = part.color;
  const opacity = ghost ? .13 : 1;
  const box = (size: Vector3Tuple, at: Vector3Tuple = [0, 0, 0], c = color, o = opacity) => <Box key={`${at.join(",")}:${size.join(",")}`} size={size} at={at} color={c} opacity={o} selected={selected} />;
  const bolt = (at: Vector3Tuple, radius = .012) => <Cylinder length={.012} radius={radius} at={at} color={metal} axis="y" />;
  switch (part.shape) {
    case "frame": return <>
      {[-1, 1].map((side) => <group key={side}>{box([w, h, .065], [0, 0, side * (d / 2 - .04)])}{box([w, .025, .11], [0, h / 2, side * (d / 2 - .04)])}</group>)}
      {[-.72, -.36, .30, .72].map((x) => <group key={x}>{box([.075, h * .6, d - .08], [x, 0, 0])}{[-1, 1].map((s) => <group key={s}><Cylinder length={.065} radius={.043} at={[x, .09, s * .25]} color="#20292b" axis="y" />{bolt([x, .128, s * .25])}</group>)}</group>)}
    </>;
    case "tank": return <>{box([w, h, d])}{[-.45, .45].map((x) => box([.025, h + .008, d + .006], [x, 0, 0], dark))}<Cylinder length={.025} radius={.035} at={[-.45, h / 2 + .012, .19]} color={metal} axis="y" />{box([.06, .02, .045], [.35, h / 2 + .01, .17], dark)}</>;
    case "engine": return <>
      {box([w, h, d])}{box([w * .85, h * .74, .02], [0, 0, d / 2 + .01], "#2c6c60")}
      {[-.24, -.08, .08, .24].map((x) => <group key={x}><Cylinder length={.055} radius={.067} at={[x, h / 2, 0]} axis="y" color={metal} opacity={opacity} /><Box size={[.115, .21, .02]} at={[x, -.02, d / 2 + .025]} color={color} opacity={opacity} />{[-.075, .075].map((y) => <Cylinder key={y} length={.012} radius={.008} at={[x, y, d / 2 + .04]} axis="z" color={metal} opacity={opacity} />)}</group>)}
      {box([.06, .08, .12], [-w * .3, -h / 2, 0])}{box([.06, .08, .12], [w * .3, -h / 2, 0])}
    </>;
    case "head": return <>{box([w, h * .6, d], [0, -h * .2, 0], "#4c786a")}{box([w * .96, h * .45, d * .88], [0, h * .23, 0])}
      {[-.27, -.09, .09, .27].map((x) => <group key={x}>{box([.02, .012, d * .82], [x, h / 2, 0], metal)}{bolt([x, h / 2 + .006, .10], .008)}</group>)}<Cylinder length={.025} radius={.025} at={[-.23, h / 2 + .014, -.09]} color={dark} axis="y" opacity={opacity} />
    </>;
    case "sump": return <>{box([w, .025, d], [0, h / 2 - .01, 0])}{box([w * .8, h * .85, d * .80], [0, -.01, 0])}<Cylinder length={.014} radius={.014} at={[w * .33, -h / 2, .06]} color={metal} axis="y" /></>;
    case "radiator": return <>
      {box([w * .7, h * .84, d * .9], [0, 0, 0], "#27383d")}
      {[-1, 1].map((s) => <group key={s}>{box([w, .075, d], [0, s * (h / 2 - .038), 0], color)}{box([w, h, .025], [0, 0, s * (d / 2 - .013)], color)}</group>)}
      {Array.from({ length: 42 }, (_, i) => <Box key={i} size={[w * .76, .004, d * .91]} at={[-.015, -.37 + i * .018, 0]} color="#6b7e80" />)}
      {Array.from({ length: 18 }, (_, i) => <Box key={i} size={[.008, h * .84, .004]} at={[-w / 2 - .002, 0, -.28 + i * .033]} color="#8c9a98" />)}
      <Cylinder length={.025} radius={.028} at={[0, h / 2 + .01, -.10]} axis="y" color={metal} />
    </>;
    case "fan": return <>
      <Cylinder length={w + .03} radius={h * .09} color={metal} />
      {Array.from({ length: 7 }, (_, i) => <group key={i} rotation={[i * Math.PI * 2 / 7, 0, 0]}><Box size={[.025, h * .36, d * .12]} at={[0, h * .28, 0]} rotation={[0, .35, -.13]} color={color} selected={selected} /></group>)}
    </>;
    case "alternator": return <>
      <Cylinder length={w * .82} radius={h / 2} color={color} opacity={opacity} open />
      {[-1, 1].map((s) => <group key={s}><Cylinder length={.035} radius={h * .46} at={[s * w * .44, 0, 0]} color={color} opacity={opacity} />{box([.13, .06, d * .73], [s * w * .29, -h / 2 + .015, 0])}</group>)}
      {Array.from({ length: 14 }, (_, i) => <group key={i} rotation={[i * Math.PI * 2 / 14, 0, 0]}><Box size={[w * .73, .025, .014]} at={[0, h / 2, 0]} color={color} opacity={opacity} /></group>)}
      {!ghost && Array.from({ length: 8 }, (_, i) => <Box key={i} size={[.004, .04, .022]} at={[w * .47, -.12 + i * .032, .09]} color={dark} />)}
    </>;
    case "stator": return <><Cylinder length={w} radius={h / 2} color="#535d62" open /><Ring radius={h * .42} tube={.035} x={-w * .47} color={copper} /><Ring radius={h * .42} tube={.035} x={w * .47} color={copper} />{Array.from({ length: 20 }, (_, i) => <group key={i} rotation={[i * Math.PI * 2 / 20, 0, 0]}><Box size={[w * .96, .025, .016]} at={[0, h * .39, 0]} color={copper} selected={selected} /></group>)}</>;
    case "rotor": return <><Cylinder length={w} radius={.025} color={metal} /><Cylinder length={w * .64} radius={h * .43} color="#586468" /><Ring radius={h * .35} tube={.028} x={-w * .25} color={copper} /><Ring radius={h * .35} tube={.028} x={w * .25} color={copper} />{[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle) => <group key={angle} rotation={[angle, 0, 0]}><Box size={[w * .57, .025, .08]} at={[0, h * .39, 0]} color={copper} selected={selected} /></group>)}</>;
    case "crankshaft": return <><Cylinder length={w} radius={.025} color={metal} />{[-.24, -.08, .08, .24].map((x, i) => <group key={x}><Cylinder length={.035} radius={.065} at={[x - .03, 0, 0]} color="#71828a" /><Cylinder length={.035} radius={.065} at={[x + .03, 0, 0]} color="#71828a" /><Cylinder length={.06} radius={.021} at={[x, i % 2 ? .04 : -.04, 0]} color={metal} /></group>)}</>;
    case "piston": return <><Cylinder length={h * .3} radius={w / 2} at={[0, h * .34, 0]} color={metal} axis="y" selected={selected} />{[-.015, .005, .025].map((y) => <mesh key={y} position={[0, h * .34 + y, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[w * .50, .003, 6, 24]} /><meshStandardMaterial color={dark} /></mesh>)}<Box size={[.025, h * .65, .025]} at={[0, -.025, 0]} color="#788990" /><Cylinder length={.04} radius={.035} at={[0, -h * .39, 0]} color={metal} /></>;
    case "coupling": return <>{[-.04, 0, .04].map((x) => <Cylinder key={x} length={.014} radius={h / 2} at={[x, 0, 0]} color={x === 0 ? "#48575b" : metal} selected={selected} />)}<Cylinder length={w} radius={h * .20} color={metal} />{Array.from({ length: 8 }, (_, i) => <Cylinder key={i} length={w + .01} radius={.010} at={[0, Math.sin(i * Math.PI / 4) * h * .38, Math.cos(i * Math.PI / 4) * h * .38]} color={metal} />)}</>;
    case "filter": return <><Cylinder length={h * .85} radius={w / 2} color={color} axis="y" selected={selected} /><Cylinder length={.03} radius={w * .53} at={[0, h / 2, 0]} color={dark} axis="y" /><Box size={[w * .55, h * .30, .004]} at={[0, -.005, d / 2]} color="#b8c1bc" /><Cylinder length={.025} radius={.015} at={[0, h / 2 + .025, 0]} color={metal} axis="y" /></>;
    case "air-filter": return <><Cylinder length={w} radius={h / 2} color={color} selected={selected} /><Ring radius={h / 2 + .004} x={-w * .33} /><Ring radius={h / 2 + .004} x={w * .33} /><Cylinder length={.08} radius={h * .23} at={[w / 2 + .02, 0, 0]} color={dark} /><Box size={[w * .5, .025, .10]} at={[0, -h * .5, 0]} color={metal} /></>;
    case "muffler": return <><Cylinder length={w} radius={h / 2} color={color} selected={selected} /><Ring radius={h / 2 + .003} x={-w * .42} /><Ring radius={h / 2 + .003} x={w * .42} /><Cylinder length={.16} radius={h * .23} at={[w / 2 + .07, 0, 0]} color={color} /><Cylinder length={.11} radius={h * .23} at={[-w * .34, -.10, 0]} color={color} axis="y" /></>;
    case "motor": return <><Cylinder length={w * .8} radius={h / 2} color={color} selected={selected} /><Cylinder length={w * .25} radius={h * .4} at={[-w * .45, 0, 0]} color={metal} /><Cylinder length={w * .22} radius={h * .15} at={[-w * .65, 0, 0]} color={dark} />{Array.from({ length: 8 }, (_, i) => <group key={i} rotation={[i * Math.PI / 4, 0, 0]}><Box size={[w * .66, .012, .012]} at={[0, h / 2, 0]} color={metal} /></group>)}</>;
    case "pump": return <>{box([w * .75, h * .8, d])}<Cylinder length={w * .35} radius={h * .48} at={[-w * .45, 0, 0]} color={metal} />{[-1, 1].map((s) => <Cylinder key={s} length={.04} radius={.015} at={[s * w * .20, h / 2, 0]} axis="y" color={metal} />)}</>;
    case "battery": return <>{box([w, h * .87, d], [0, -h * .065, 0])}{box([w + .01, .03, d + .01], [0, h / 2 - .015, 0], "#20292f")}{[-1, 1].map((s) => <Cylinder key={s} length={.026} radius={.014} at={[s * w * .31, h / 2 + .013, 0]} color={s < 0 ? "#c26056" : metal} axis="y" />)}<Box size={[w * .65, h * .45, .005]} at={[0, -.01, d / 2 + .003]} color="#c7d2c4" /></>;
    case "panel": return <>{box([w, h, d])}{box([w * .84, h * .83, .012], [0, 0, d / 2 + .007], dark)}{box([w * .52, h * .32, .008], [-w * .08, h * .12, d / 2 + .016], "#699e99")}{[-.25, 0, .25].map((x, i) => <Cylinder key={x} length={.013} radius={w * .035} at={[x * w, -h * .22, d / 2 + .02]} color={["#a2b5b8", "#73a780", "#c4954c"][i]} axis="z" />)}{part.id === "panel" && [-1, 1].map((s) => box([.025, .30, .025], [s * w * .35, -h / 2 - .15, -.03], metal))}</>;
    case "terminal-box": return <>{box([w, h, d])}{box([w + .012, .018, d + .012], [0, h / 2, 0])}{[-.10, 0, .10].map((x) => <Cylinder key={x} length={.025} radius={.015} at={[x, -.01, d / 2 + .015]} axis="z" color={dark} />)}</>;
    case "breaker": return <>{box([w, h, d])}{[-.05, 0, .05].map((x) => <group key={x}><Box size={[.035, h * .50, .015]} at={[x, .01, d / 2 + .008]} color="#aebbb8" /><Box size={[.022, .06, .024]} at={[x, .015, d / 2 + .025]} color={dark} /></group>)}</>;
    case "pcb": return <>{box([w, h * .25, d], [0, -h * .2, 0])}{Array.from({ length: 6 }, (_, i) => <Box key={i} size={[.017, .025, .030]} at={[-w * .36 + i * w * .14, .01, -.04]} color={dark} />)}{[-.05, 0, .05].map((x) => <Cylinder key={x} length={.028} radius={.012} at={[x, .014, .035]} color="#313d47" axis="y" />)}</>;
    case "stop": return <><Cylinder length={.015} radius={w * .57} color="#c8a955" axis="z" /><Cylinder length={.035} radius={w / 2} at={[0, 0, .02]} color={color} axis="z" selected={selected} /></>;
  }
}

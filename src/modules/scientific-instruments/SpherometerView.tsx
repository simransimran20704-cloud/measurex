import React, { useState } from 'react';
import { useHistoryStore } from '../../stores/historyStore';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import { soundEffects } from '../../utils/soundEffects';
import {
  Compass,
  RotateCcw,
  Copy,
  BookOpen,
  CheckCircle2,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface LensSpecimen {
  id: string;
  name: string;
  type: 'flat' | 'convex' | 'concave';
  trueRadiusMm: number; // infinity for flat
  description: string;
}

const SPECIMENS: LensSpecimen[] = [
  { id: 'flat', name: 'Precision Flat Optical Standard Plate', type: 'flat', trueRadiusMm: Infinity, description: 'Zero reference plate for setting spherometer zero' },
  { id: 'convex150', name: 'Eyepiece Convex Lens (R = 150 mm)', type: 'convex', trueRadiusMm: 150.0, description: 'Single crown glass biconvex optical element' },
  { id: 'convex80', name: 'High-Power Macro Objective (R = 80 mm)', type: 'convex', trueRadiusMm: 80.0, description: 'Deep curvature condensing lens element' },
  { id: 'concave250', name: 'Newtonian Concave Mirror Blank (R = 250 mm)', type: 'concave', trueRadiusMm: 250.0, description: 'Reflecting telescope astronomical parabolic mirror' },
];

export const SpherometerView: React.FC = () => {
  const { addItem } = useHistoryStore();
  const { showToast } = useAppStore();
  const { requireAuth } = useAuthStore();

  const [selectedSpecimen, setSelectedSpecimen] = useState<LensSpecimen>(SPECIMENS[1]);
  // Distance between 3 triangular outer legs (l in mm)
  const [legDistanceMm, setLegDistanceMm] = useState<number>(45.0);
  // Central screw sagitta (h in mm)
  const [screwSagittaMm, setScrewSagittaMm] = useState<number>(1.70);

  // If specimen is selected, auto-align sagitta to realistic value:
  // h = R - sqrt(R^2 - (l / sqrt(3))^2)
  const handleSelectSpecimen = (spec: LensSpecimen) => {
    setSelectedSpecimen(spec);
    soundEffects.click();
    if (spec.type === 'flat') {
      setScrewSagittaMm(0.0);
    } else {
      const rOuter = legDistanceMm / Math.sqrt(3);
      const hCalc = spec.trueRadiusMm - Math.sqrt(spec.trueRadiusMm * spec.trueRadiusMm - rOuter * rOuter);
      setScrewSagittaMm(parseFloat(hCalc.toFixed(3)));
    }
  };

  // Spherometer formula: R = (l^2 / (6 * h)) + (h / 2)
  const h = screwSagittaMm;
  const l = legDistanceMm;
  const calculatedRadiusMm = h <= 0.001 ? Infinity : (l * l) / (6 * h) + h / 2;
  const focalLengthMm = isFinite(calculatedRadiusMm) ? calculatedRadiusMm / 2 : Infinity;
  // Lens maker optical power (approx n = 1.52 crown glass)
  const diopters = isFinite(focalLengthMm) ? 1000 / focalLengthMm : 0;

  // Least count: Pitch 0.5 mm / 100 divisions = 0.005 mm
  const leastCountMm = 0.005;
  const msr = Math.floor(h / 0.5) * 0.5;
  const vsr = Math.round((h - msr) / leastCountMm);

  const handleLogMeasurement = () => {
    requireAuth('save spherometer optical curvature', () => {
      addItem({
        tool: 'Spherometer',
        title: `Curvature: ${selectedSpecimen.name}`,
        value: isFinite(calculatedRadiusMm) ? `${calculatedRadiusMm.toFixed(2)} mm` : '∞',
        rawNumericValue: isFinite(calculatedRadiusMm) ? parseFloat(calculatedRadiusMm.toFixed(2)) : 0,
        unit: 'mm',
        details: `Sagitta h: ${h.toFixed(3)} mm, Leg distance l: ${l.toFixed(1)} mm, Diopters: ${diopters.toFixed(2)} D`,
      });
      showToast('Spherometer optical measurement saved', 'success');
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 select-none pb-12">
      {/* Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-white/90 border border-[#DCE5F2] shadow-glass flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-cyan-50 text-[#0284C7] border border-cyan-200">
              <Compass className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-[#1D2940]">Spherometer Optical Curvature Simulator</h1>
          </div>
          <p className="text-xs md:text-sm text-[#66758D]">
            Precision metrology standard for measuring radius of curvature ($R$) and focal length ($f$) of optical lenses and mirrors.
          </p>
        </div>

        <button
          onClick={handleLogMeasurement}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4385E8] to-[#8064E8] text-white text-xs font-bold shadow-md shadow-brand-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
        >
          <Copy className="w-4 h-4" />
          <span>Save Curvature</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Spherometer Simulator */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {/* Spherometer 3D-styled SVG Canvas */}
          <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border-2 border-slate-800 shadow-2xl flex flex-col items-center justify-center relative min-h-[380px]">
            <div className="absolute top-4 left-4 z-10">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                Formula: R = (l² / 6h) + (h / 2)
              </span>
            </div>

            <div className="absolute top-4 right-4 z-10 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Radius of Curvature (R)
              </span>
              <span className="text-3xl font-mono font-black text-emerald-400">
                {isFinite(calculatedRadiusMm) ? `${calculatedRadiusMm.toFixed(1)} mm` : '∞ (FLAT)'}
              </span>
            </div>

            {/* SVG Instrument Visualizer */}
            <div className="w-full max-w-md h-64 flex items-center justify-center relative mt-6">
              <svg viewBox="0 0 320 220" className="w-full h-full drop-shadow-xl overflow-visible">
                {/* 1. Curved Optical Specimen Under Test */}
                {(() => {
                  let pathD = 'M 40,180 L 280,180 L 280,195 L 40,195 Z';
                  if (selectedSpecimen.type === 'convex') {
                    pathD = 'M 40,180 Q 160,160 280,180 L 280,195 L 40,195 Z';
                  } else if (selectedSpecimen.type === 'concave') {
                    pathD = 'M 40,180 Q 160,200 280,180 L 280,195 L 40,195 Z';
                  }
                  return (
                    <path
                      d={pathD}
                      fill="url(#lensGlassGrad)"
                      stroke="#38BDF8"
                      strokeWidth="1.5"
                      opacity="0.85"
                    />
                  );
                })()}

                {/* 2. Spherometer Triangular Base Frame with Fixed Legs */}
                <g transform="translate(60, 110)">
                  {/* Triangular Crossbar */}
                  <rect x="0" y="0" width="200" height="18" rx="4" fill="url(#brassFrameGrad)" stroke="#B45309" strokeWidth="1" />
                  {/* Left Leg */}
                  <rect x="15" y="18" width="8" height="52" fill="#E2E8F0" stroke="#64748B" strokeWidth="1" />
                  <polygon points="15,70 19,75 23,70" fill="#E2E8F0" stroke="#64748B" strokeWidth="1" />
                  {/* Right Leg */}
                  <rect x="177" y="18" width="8" height="52" fill="#E2E8F0" stroke="#64748B" strokeWidth="1" />
                  <polygon points="177,70 181,75 185,70" fill="#E2E8F0" stroke="#64748B" strokeWidth="1" />

                  {/* Vertical Main Scale Rule */}
                  <rect x="80" y="-80" width="16" height="80" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1" />
                  {/* Main Scale Markings */}
                  {[0, 10, 20, 30, 40, 50, 60, 70].map((y, idx) => (
                    <line key={idx} x1="88" y1={-y} x2="96" y2={-y} stroke="#334155" strokeWidth="1" />
                  ))}

                  {/* Central Vertical Micrometer Screw Stem */}
                  {(() => {
                    const screwY = -60 + h * 8;
                    const screwBottomY = 18 + 52 - (selectedSpecimen.type === 'convex' ? h * 8 : 0);
                    return (
                      <>
                        {/* Rotating Circular Head Disc */}
                        <ellipse cx="100" cy={screwY} rx="35" ry="10" fill="url(#brassDiscGrad)" stroke="#D97706" strokeWidth="1.5" />
                        <ellipse cx="100" cy={screwY - 6} rx="22" ry="6" fill="#FBBF24" stroke="#B45309" strokeWidth="1" />
                        {/* Central Screw Tip Pointing Down */}
                        <rect x="96" y={screwY} width="8" height={Math.max(20, screwBottomY - screwY)} fill="#CBD5E1" stroke="#64748B" strokeWidth="1" />
                        <polygon points={`96,${screwBottomY} 100,${screwBottomY + 5} 104,${screwBottomY}`} fill="#CBD5E1" stroke="#64748B" strokeWidth="1" />
                      </>
                    );
                  })()}
                </g>

                <defs>
                  <linearGradient id="lensGlassGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#0284C7" stopOpacity="0.4" />
                  </linearGradient>
                  <linearGradient id="brassFrameGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="50%" stopColor="#D97706" />
                    <stop offset="100%" stopColor="#B45309" />
                  </linearGradient>
                  <linearGradient id="brassDiscGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#FDE68A" />
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#D97706" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Live Formula Decomposition */}
            <div className="w-full mt-2 p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between text-xs">
              <span className="text-slate-300 font-mono">
                Sagitta (h): <span className="text-cyan-400 font-bold">{h.toFixed(3)} mm</span>
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 font-mono">
                Leg Distance (l): <span className="text-emerald-400 font-bold">{l.toFixed(1)} mm</span>
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 font-mono">
                Focal Length (f):{' '}
                <span className="text-amber-400 font-bold">
                  {isFinite(focalLengthMm) ? `${focalLengthMm.toFixed(1)} mm` : '∞'}
                </span>
              </span>
            </div>
          </div>

          {/* Mathematical Step-By-Step Metrology Card */}
          <div className="p-6 rounded-3xl bg-white border border-[#DCE5F2] shadow-sm flex flex-col gap-3 text-xs">
            <span className="font-bold text-[#1D2940] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#4385E8]" />
              <span>Step-by-Step Physics Calculation Breakdown</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">1. Spherometer Reading</span>
                <span className="font-bold text-slate-800">MSR: {msr.toFixed(1)} mm</span>
                <span className="block text-[11px] text-slate-500">VSR: {vsr} × 0.005mm</span>
                <span className="text-brand-blue font-black mt-1 block">h = {h.toFixed(3)} mm</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">2. Radius Calculation</span>
                <span className="text-[11px] text-slate-600 block">R = (l² / 6h) + (h / 2)</span>
                <span className="text-[11px] text-slate-600 block">
                  R = ({l}² / {6 * h ? (6 * h).toFixed(2) : 1}) + {(h / 2).toFixed(3)}
                </span>
                <span className="text-emerald-600 font-black mt-1 block">
                  R = {isFinite(calculatedRadiusMm) ? `${calculatedRadiusMm.toFixed(2)} mm` : '∞'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">3. Optical Power</span>
                <span className="text-[11px] text-slate-600 block">Focal Length: f = R / 2</span>
                <span className="text-[11px] text-slate-600 block">Power: P = 1 / f (meters)</span>
                <span className="text-purple-600 font-black mt-1 block">
                  P = {isFinite(diopters) ? `+${diopters.toFixed(2)} D` : '0.00 D'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Specimen Selection & Fine Adjust */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Specimen Selector */}
          <div className="p-6 rounded-3xl bg-white border border-[#DCE5F2] shadow-sm flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              1. Optical Surface Specimen
            </span>

            <div className="flex flex-col gap-2">
              {SPECIMENS.map((spec) => {
                const isSelected = selectedSpecimen.id === spec.id;
                return (
                  <button
                    key={spec.id}
                    onClick={() => handleSelectSpecimen(spec)}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50/70 border-brand-blue text-[#1D2940] shadow-xs font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                    }`}
                  >
                    <div>
                      <span className="text-xs block">{spec.name}</span>
                      <span className="text-[10px] text-slate-400">{spec.description}</span>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-[#4385E8] flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Spherometer Mechanics Controls */}
          <div className="p-6 rounded-3xl bg-white border border-[#DCE5F2] shadow-sm flex flex-col gap-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              2. Spherometer Mechanics
            </span>

            {/* Leg Distance l */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Leg Spacing (l):</span>
                <span className="font-mono font-bold text-[#4385E8]">{legDistanceMm.toFixed(1)} mm</span>
              </div>
              <input
                type="range"
                min="30"
                max="60"
                step="0.5"
                value={legDistanceMm}
                onChange={(e) => setLegDistanceMm(Number(e.target.value))}
                className="accent-[#4385E8]"
              />
            </div>

            {/* Screw Sagitta h */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Screw Elevation Sagitta (h):</span>
                <span className="font-mono font-bold text-emerald-600">{screwSagittaMm.toFixed(3)} mm</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="5.0"
                step="0.005"
                value={screwSagittaMm}
                onChange={(e) => setScrewSagittaMm(Number(e.target.value))}
                className="accent-emerald-600"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

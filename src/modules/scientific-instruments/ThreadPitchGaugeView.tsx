import React, { useState } from 'react';
import { useHistoryStore } from '../../stores/historyStore';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import { soundEffects } from '../../utils/soundEffects';
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Copy,
  BookOpen,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface PitchLeaf {
  id: string;
  standard: 'metric' | 'imperial';
  value: number; // mm for metric, TPI for imperial
  label: string;
}

const METRIC_LEAVES: PitchLeaf[] = [
  { id: 'm-0.5', standard: 'metric', value: 0.5, label: '0.50 mm' },
  { id: 'm-0.75', standard: 'metric', value: 0.75, label: '0.75 mm' },
  { id: 'm-1.0', standard: 'metric', value: 1.0, label: '1.00 mm' },
  { id: 'm-1.25', standard: 'metric', value: 1.25, label: '1.25 mm' },
  { id: 'm-1.5', standard: 'metric', value: 1.5, label: '1.50 mm' },
  { id: 'm-1.75', standard: 'metric', value: 1.75, label: '1.75 mm' },
  { id: 'm-2.0', standard: 'metric', value: 2.0, label: '2.00 mm' },
  { id: 'm-2.5', standard: 'metric', value: 2.5, label: '2.50 mm' },
];

const IMPERIAL_LEAVES: PitchLeaf[] = [
  { id: 'i-28', standard: 'imperial', value: 28, label: '28 TPI' },
  { id: 'i-24', standard: 'imperial', value: 24, label: '24 TPI' },
  { id: 'i-20', standard: 'imperial', value: 20, label: '20 TPI' },
  { id: 'i-18', standard: 'imperial', value: 18, label: '18 TPI' },
  { id: 'i-16', standard: 'imperial', value: 16, label: '16 TPI' },
  { id: 'i-14', standard: 'imperial', value: 14, label: '14 TPI' },
  { id: 'i-12', standard: 'imperial', value: 12, label: '12 TPI' },
  { id: 'i-11', standard: 'imperial', value: 11, label: '11 TPI' },
];

interface ScrewSpecimen {
  id: string;
  name: string;
  nominalDia: string;
  actualPitch: number; // in mm or TPI
  standard: 'metric' | 'imperial';
  threadAngleDeg: number;
  tapDrillMm: number;
}

const SPECIMENS: ScrewSpecimen[] = [
  { id: 'm6', name: 'M6 × 1.0 Coarse Hex Bolt', nominalDia: '6.0 mm', actualPitch: 1.0, standard: 'metric', threadAngleDeg: 60, tapDrillMm: 5.0 },
  { id: 'm8', name: 'M8 × 1.25 Standard Stud', nominalDia: '8.0 mm', actualPitch: 1.25, standard: 'metric', threadAngleDeg: 60, tapDrillMm: 6.8 },
  { id: 'm10', name: 'M10 × 1.50 Engine Bolt', nominalDia: '10.0 mm', actualPitch: 1.5, standard: 'metric', threadAngleDeg: 60, tapDrillMm: 8.5 },
  { id: 'm12', name: 'M12 × 1.75 Heavy Flange Screw', nominalDia: '12.0 mm', actualPitch: 1.75, standard: 'metric', threadAngleDeg: 60, tapDrillMm: 10.2 },
  { id: 'unc-1/4', name: '1/4"-20 UNC Aviation Screw', nominalDia: '0.250 in (6.35 mm)', actualPitch: 20, standard: 'imperial', threadAngleDeg: 60, tapDrillMm: 5.1 },
  { id: 'unc-3/8', name: '3/8"-16 UNC Machine Bolt', nominalDia: '0.375 in (9.52 mm)', actualPitch: 16, standard: 'imperial', threadAngleDeg: 60, tapDrillMm: 7.9 },
];

export const ThreadPitchGaugeView: React.FC = () => {
  const { addItem } = useHistoryStore();
  const { showToast } = useAppStore();
  const { requireAuth } = useAuthStore();

  const [activeStandard, setActiveStandard] = useState<'metric' | 'imperial'>('metric');
  const [selectedSpecimen, setSelectedSpecimen] = useState<ScrewSpecimen>(SPECIMENS[0]);
  const [selectedLeaf, setSelectedLeaf] = useState<PitchLeaf>(METRIC_LEAVES[2]); // 1.0 mm default

  const isMatched =
    selectedLeaf.standard === selectedSpecimen.standard &&
    Math.abs(selectedLeaf.value - selectedSpecimen.actualPitch) < 0.001;

  const handleSelectLeaf = (leaf: PitchLeaf) => {
    setSelectedLeaf(leaf);
    soundEffects.click();
    if (leaf.standard === selectedSpecimen.standard && Math.abs(leaf.value - selectedSpecimen.actualPitch) < 0.001) {
      soundEffects.snap();
    }
  };

  const handleSelectSpecimen = (specimen: ScrewSpecimen) => {
    setSelectedSpecimen(specimen);
    soundEffects.click();
  };

  const handleLogMeasurement = () => {
    requireAuth('save thread pitch inspection', () => {
      addItem({
        tool: 'Thread Pitch Gauge',
        title: `Thread Pitch: ${selectedSpecimen.name}`,
        value: selectedLeaf.label,
        rawNumericValue: selectedLeaf.value,
        unit: selectedLeaf.standard === 'metric' ? 'mm' : 'TPI',
        details: `Specimen: ${selectedSpecimen.nominalDia}, Angle: ${selectedSpecimen.threadAngleDeg}°, Tap Drill: ${selectedSpecimen.tapDrillMm}mm`,
      });
      showToast('Thread pitch record saved to Project History', 'success');
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 select-none pb-12">
      {/* Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-white/90 border border-[#DCE5F2] shadow-glass flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-purple-50 text-[#8064E8] border border-purple-200">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-[#1D2940]">Screw Thread Pitch Gauge Simulator</h1>
          </div>
          <p className="text-xs md:text-sm text-[#66758D]">
            Precision leaf-blade metrology standard for identifying ISO Metric and Imperial Unified UNC/UNF thread pitch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLogMeasurement}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4385E8] to-[#8064E8] text-white text-xs font-bold shadow-md shadow-brand-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            <span>Save Inspection</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Screw Specimen & Optical Mesh Inspection Viewer */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {/* Optical Alignment Window */}
          <div className="relative p-6 rounded-3xl bg-slate-900 border-2 border-slate-800 shadow-2xl overflow-hidden flex flex-col items-center justify-center min-h-[380px]">
            {/* Background Light Box Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

            {/* Light Gap Status Pill */}
            <div className="absolute top-4 left-4 z-10">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  isMatched
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                }`}
              >
                {isMatched ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>PERFECT TOOTH MESH: 0% Light Gap (Match!)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>LIGHT GAP DETECTED: Crest/Root Mismatch</span>
                  </>
                )}
              </span>
            </div>

            {/* Active Gauge Reading Watermark */}
            <div className="absolute top-4 right-4 z-10 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Blade In Use</span>
              <span className="text-sm font-mono font-black text-cyan-400">{selectedLeaf.label}</span>
            </div>

            {/* SVG Visualizer: Screw Threads vs Leaf Blade Teeth */}
            <div className="w-full max-w-lg h-64 flex items-center justify-center relative mt-6">
              <svg viewBox="0 0 400 200" className="w-full h-full drop-shadow-xl overflow-visible">
                {/* 1. Leaf Blade (Top Component, Metallic Steel Finish) */}
                <g transform="translate(40, 20)">
                  {/* Gauge Blade Body */}
                  <path
                    d="M 10,10 L 310,10 L 310,60 L 10,60 Z"
                    fill="url(#steelBladeGrad)"
                    stroke="#94A3B8"
                    strokeWidth="1.5"
                  />
                  {/* Pivot Hole */}
                  <circle cx="30" cy="35" r="8" fill="#1E293B" stroke="#CBD5E1" strokeWidth="2" />
                  {/* Stamped Leaf Text */}
                  <text x="70" y="40" fill="#1E293B" fontSize="13" fontWeight="900" fontFamily="monospace">
                    {selectedLeaf.label.toUpperCase()} - 60°
                  </text>

                  {/* Leaf Teeth Profile Along Bottom Edge (y = 60) */}
                  {(() => {
                    // Compute visual tooth spacing
                    const pitchWidth = selectedLeaf.standard === 'metric'
                      ? selectedLeaf.value * 22
                      : (25.4 / selectedLeaf.value) * 22;
                    const toothCount = Math.floor(250 / pitchWidth);
                    let d = `M 40,60 `;
                    for (let i = 0; i < toothCount; i++) {
                      const startX = 40 + i * pitchWidth;
                      const midX = startX + pitchWidth / 2;
                      const endX = startX + pitchWidth;
                      d += `L ${midX},${60 + 14} L ${endX},60 `;
                    }
                    return (
                      <path
                        d={d}
                        fill="#CBD5E1"
                        stroke="#64748B"
                        strokeWidth="1.2"
                      />
                    );
                  })()}
                </g>

                {/* 2. Light Gap Simulation Glow if Mismatched */}
                {!isMatched && (
                  <rect
                    x="80"
                    y="88"
                    width="230"
                    height="8"
                    fill="#F59E0B"
                    opacity="0.45"
                    filter="blur(2px)"
                  />
                )}

                {/* 3. Threaded Screw Specimen (Bottom Component) */}
                <g transform="translate(40, 94)">
                  {/* Thread Teeth Profile on Screw Outer Crest */}
                  {(() => {
                    const specPitchWidth = selectedSpecimen.standard === 'metric'
                      ? selectedSpecimen.actualPitch * 22
                      : (25.4 / selectedSpecimen.actualPitch) * 22;
                    const toothCount = Math.floor(250 / specPitchWidth);
                    let d = `M 40,${isMatched ? 0 : 2} `;
                    for (let i = 0; i < toothCount; i++) {
                      const startX = 40 + i * specPitchWidth;
                      const midX = startX + specPitchWidth / 2;
                      const endX = startX + specPitchWidth;
                      d += `L ${midX},${(isMatched ? 0 : 2) + 14} L ${endX},${isMatched ? 0 : 2} `;
                    }
                    // Complete screw body
                    d += `L 310,${(isMatched ? 0 : 2)} L 310,75 L 40,75 Z`;
                    return (
                      <path
                        d={d}
                        fill="url(#screwBlackOxideGrad)"
                        stroke="#475569"
                        strokeWidth="1.5"
                      />
                    );
                  })()}
                  {/* Screw Root Thread Lines */}
                  <line x1="40" y1="50" x2="310" y2="50" stroke="#334155" strokeDasharray="4,4" strokeWidth="1" />
                  <text x="50" y="66" fill="#94A3B8" fontSize="10" fontFamily="monospace">
                    {selectedSpecimen.name}
                  </text>
                </g>

                {/* Gradients */}
                <defs>
                  <linearGradient id="steelBladeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F8FAFC" />
                    <stop offset="50%" stopColor="#CBD5E1" />
                    <stop offset="100%" stopColor="#94A3B8" />
                  </linearGradient>
                  <linearGradient id="screwBlackOxideGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#334155" />
                    <stop offset="50%" stopColor="#1E293B" />
                    <stop offset="100%" stopColor="#0F172A" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Live Visual Summary Card */}
            <div className="w-full mt-4 p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3.5 h-3.5 rounded-full ${
                    isMatched ? 'bg-emerald-400 shadow-md shadow-emerald-400/50' : 'bg-amber-400'
                  }`}
                />
                <div>
                  <span className="font-bold text-white block">
                    {isMatched ? '100% Geometry Match Verified' : 'Thread Pitch Mismatch'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {isMatched
                      ? `Leaf blade fits snugly into the roots of ${selectedSpecimen.nominalDia} thread.`
                      : `Selected ${selectedLeaf.label} does not mesh properly with ${selectedSpecimen.name}.`}
                  </span>
                </div>
              </div>

              {isMatched && (
                <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs border border-emerald-500/40">
                  PASSED QC
                </span>
              )}
            </div>
          </div>

          {/* Engineering Thread Standards Table */}
          <div className="p-6 rounded-3xl bg-white border border-[#DCE5F2] shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#4385E8]" />
                <h3 className="font-extrabold text-sm text-[#1D2940]">Machinist & Engineering Thread Reference</h3>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-500">ISO 68-1 / ASME B1.1</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Pitch (P)</span>
                <span className="font-mono font-black text-sm text-[#1D2940]">
                  {selectedSpecimen.standard === 'metric'
                    ? `${selectedSpecimen.actualPitch} mm`
                    : `${selectedSpecimen.actualPitch} TPI`}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Included Angle</span>
                <span className="font-mono font-black text-sm text-[#1D2940]">{selectedSpecimen.threadAngleDeg}°</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Tap Drill Diameter</span>
                <span className="font-mono font-black text-sm text-emerald-600">{selectedSpecimen.tapDrillMm} mm</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Major / Nominal Dia</span>
                <span className="font-mono font-black text-sm text-[#4385E8]">{selectedSpecimen.nominalDia}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Specimen Selection & Pitch Leaves Magazine */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Specimen Selector */}
          <div className="p-6 rounded-3xl bg-white border border-[#DCE5F2] shadow-sm flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              1. Select Screw Under Test
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
                      <span className="text-[10px] text-slate-400 font-mono">
                        {spec.nominalDia} • {spec.standard === 'metric' ? `${spec.actualPitch}mm` : `${spec.actualPitch} TPI`}
                      </span>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-[#4385E8]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Leaf Blades Magazine */}
          <div className="p-6 rounded-3xl bg-white border border-[#DCE5F2] shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                2. Test Pitch Leaf Blades
              </span>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setActiveStandard('metric')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    activeStandard === 'metric' ? 'bg-white text-[#4385E8] shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Metric
                </button>
                <button
                  onClick={() => setActiveStandard('imperial')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    activeStandard === 'imperial' ? 'bg-white text-[#8064E8] shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Imperial TPI
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1">
              {(activeStandard === 'metric' ? METRIC_LEAVES : IMPERIAL_LEAVES).map((leaf) => {
                const isLeafSelected = selectedLeaf.id === leaf.id;
                return (
                  <button
                    key={leaf.id}
                    onClick={() => handleSelectLeaf(leaf)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isLeafSelected
                        ? 'bg-gradient-to-r from-[#4385E8] to-[#8064E8] text-white font-bold shadow-md shadow-brand-blue/20'
                        : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold'
                    }`}
                  >
                    <span className="text-xs font-mono">{leaf.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

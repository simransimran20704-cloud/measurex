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
  Layers,
  ArrowRight,
  ShieldCheck,
  Plus,
  Trash2,
} from 'lucide-react';

interface FeelerLeaf {
  thicknessMm: number;
  thicknessIn: number;
  labelMm: string;
  labelIn: string;
}

const FEELER_LEAVES: FeelerLeaf[] = [
  { thicknessMm: 0.02, thicknessIn: 0.0008, labelMm: '0.02 mm', labelIn: '0.0008"' },
  { thicknessMm: 0.04, thicknessIn: 0.0015, labelMm: '0.04 mm', labelIn: '0.0015"' },
  { thicknessMm: 0.05, thicknessIn: 0.0020, labelMm: '0.05 mm', labelIn: '0.0020"' },
  { thicknessMm: 0.08, thicknessIn: 0.0030, labelMm: '0.08 mm', labelIn: '0.0030"' },
  { thicknessMm: 0.10, thicknessIn: 0.0040, labelMm: '0.10 mm', labelIn: '0.0040"' },
  { thicknessMm: 0.15, thicknessIn: 0.0060, labelMm: '0.15 mm', labelIn: '0.0060"' },
  { thicknessMm: 0.20, thicknessIn: 0.0080, labelMm: '0.20 mm', labelIn: '0.0080"' },
  { thicknessMm: 0.25, thicknessIn: 0.0100, labelMm: '0.25 mm', labelIn: '0.0100"' },
  { thicknessMm: 0.30, thicknessIn: 0.0120, labelMm: '0.30 mm', labelIn: '0.0120"' },
  { thicknessMm: 0.40, thicknessIn: 0.0160, labelMm: '0.40 mm', labelIn: '0.0160"' },
  { thicknessMm: 0.50, thicknessIn: 0.0200, labelMm: '0.50 mm', labelIn: '0.0200"' },
  { thicknessMm: 0.75, thicknessIn: 0.0300, labelMm: '0.75 mm', labelIn: '0.0300"' },
  { thicknessMm: 1.00, thicknessIn: 0.0400, labelMm: '1.00 mm', labelIn: '0.0400"' },
];

interface GapSpecimen {
  id: string;
  name: string;
  nominalGapMm: number;
  description: string;
}

const SPECIMENS: GapSpecimen[] = [
  { id: 'valve', name: 'Engine Valve Tappet Clearance', nominalGapMm: 0.20, description: 'Automotive camshaft to rocker arm gap standard' },
  { id: 'plug', name: 'Spark Plug Ignition Electrode', nominalGapMm: 0.75, description: 'Ground electrode spark gap' },
  { id: 'guide', name: 'Lathe Machine Guideway Way Gap', nominalGapMm: 0.05, description: 'Precision dovetailed slide tolerance' },
  { id: 'bearing', name: 'Radial Roller Bearing Clearance', nominalGapMm: 0.12, description: 'C3 internal clearance check' },
];

export const FeelerGaugeView: React.FC = () => {
  const { addItem } = useHistoryStore();
  const { showToast } = useAppStore();
  const { requireAuth } = useAuthStore();

  const [selectedSpecimen, setSelectedSpecimen] = useState<GapSpecimen>(SPECIMENS[0]);
  const [selectedLeaves, setSelectedLeaves] = useState<FeelerLeaf[]>([FEELER_LEAVES[6]]); // 0.20 mm default
  const [customGapMode, setCustomGapMode] = useState<boolean>(false);
  const [customGapMm, setCustomGapMm] = useState<number>(0.20);

  const activeGapMm = customGapMode ? customGapMm : selectedSpecimen.nominalGapMm;

  // Calculate total stacked blade thickness
  const totalThicknessMm = selectedLeaves.reduce((acc, curr) => acc + curr.thicknessMm, 0);
  const roundedTotalMm = Math.round(totalThicknessMm * 1000) / 1000;

  // Fit classification
  const diff = roundedTotalMm - activeGapMm;
  const isPerfectFit = Math.abs(diff) < 0.005;
  const isTooLoose = diff < -0.005;
  const isTooTight = diff > 0.005;

  const toggleLeaf = (leaf: FeelerLeaf) => {
    soundEffects.click();
    const exists = selectedLeaves.some((l) => l.thicknessMm === leaf.thicknessMm);
    if (exists) {
      if (selectedLeaves.length === 1) {
        showToast('At least one feeler leaf must remain active in stack', 'warning');
        return;
      }
      setSelectedLeaves(selectedLeaves.filter((l) => l.thicknessMm !== leaf.thicknessMm));
    } else {
      setSelectedLeaves([...selectedLeaves, leaf]);
    }
  };

  const handleClearStack = () => {
    setSelectedLeaves([FEELER_LEAVES[6]]); // Reset to 0.20mm
    soundEffects.click();
  };

  const handleLogMeasurement = () => {
    requireAuth('save feeler gauge clearance record', () => {
      addItem({
        tool: 'Feeler Gauge',
        title: `Clearance: ${customGapMode ? 'Custom Gap' : selectedSpecimen.name}`,
        value: `${roundedTotalMm} mm`,
        rawNumericValue: roundedTotalMm,
        unit: 'mm',
        details: `Target Gap: ${activeGapMm} mm, Stack: [${selectedLeaves.map((l) => l.labelMm).join(' + ')}]`,
      });
      showToast('Clearance record saved to Project History', 'success');
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 select-none pb-12">
      {/* Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-white/90 border border-[#DCE5F2] shadow-glass flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-cyan-50 text-[#0284C7] border border-cyan-200">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-[#1D2940]">Precision Feeler Gauge Simulator</h1>
          </div>
          <p className="text-xs md:text-sm text-[#66758D]">
            Multi-leaf hardened spring steel clearance gap gauge for micro-gap metrology, valve lash, and spark gaps.
          </p>
        </div>

        <button
          onClick={handleLogMeasurement}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4385E8] to-[#8064E8] text-white text-xs font-bold shadow-md shadow-brand-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
        >
          <Copy className="w-4 h-4" />
          <span>Save Clearance</span>
        </button>
      </div>

      {/* Main Interactive Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Gap Insertion Test Bench */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {/* Workstation Screen */}
          <div className="relative p-6 rounded-3xl bg-slate-900 border-2 border-slate-800 shadow-2xl overflow-hidden flex flex-col items-center justify-center min-h-[380px]">
            {/* Status Pill */}
            <div className="absolute top-4 left-4 z-10">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  isPerfectFit
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                    : isTooLoose
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                    : 'bg-red-500/20 text-red-400 border-red-500/50'
                }`}
              >
                {isPerfectFit ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>PERFECT SLIDING DRAG FIT (Target Tolerance Met)</span>
                  </>
                ) : isTooLoose ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-blue-400" />
                    <span>LOOSE FIT: Gauge slides with zero friction (Stack too thin)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span>NO-GO / BLOCKED: Total stack exceeds gap clearance</span>
                  </>
                )}
              </span>
            </div>

            {/* Thickness Readout */}
            <div className="absolute top-4 right-4 z-10 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Total Leaf Stack
              </span>
              <span className="text-xl font-mono font-black text-cyan-400">
                {roundedTotalMm.toFixed(3)} mm
              </span>
              <span className="text-[10px] font-mono text-slate-400 block">
                {(roundedTotalMm * 0.03937).toFixed(4)} inches
              </span>
            </div>

            {/* SVG Interactive Gap Cross-Section */}
            <div className="w-full max-w-lg h-60 flex items-center justify-center relative mt-6">
              <svg viewBox="0 0 400 200" className="w-full h-full drop-shadow-xl overflow-visible">
                {/* 1. Upper Solid Anvil Block (Stationary) */}
                <g transform="translate(60, 20)">
                  <rect x="0" y="0" width="280" height="40" rx="4" fill="url(#metalBlockGrad)" stroke="#64748B" strokeWidth="1.5" />
                  <text x="140" y="24" fill="#94A3B8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                    UPPER MATING ANVIL
                  </text>
                </g>

                {/* 2. Lower Solid Anvil Block (Calculated Gap) */}
                {(() => {
                  // Visual gap pixels: scale activeGapMm
                  const gapPixels = Math.min(60, Math.max(8, activeGapMm * 100));
                  const lowerY = 60 + gapPixels;
                  const stackPixels = Math.min(gapPixels + 15, Math.max(4, roundedTotalMm * 100));

                  return (
                    <>
                      {/* Lower Block */}
                      <g transform={`translate(60, ${lowerY})`}>
                        <rect x="0" y="0" width="280" height="40" rx="4" fill="url(#metalBlockGrad)" stroke="#64748B" strokeWidth="1.5" />
                        <text x="140" y="24" fill="#94A3B8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                          LOWER MATING FACE
                        </text>
                      </g>

                      {/* Dimension Arrow for Gap */}
                      <g transform="translate(350, 60)">
                        <line x1="0" y1="0" x2="0" y2={gapPixels} stroke="#38BDF8" strokeWidth="1.5" />
                        <polygon points="-3,5 0,0 3,5" fill="#38BDF8" />
                        <polygon points={`-3,${gapPixels - 5} 0,${gapPixels} 3,${gapPixels - 5}`} fill="#38BDF8" />
                        <text x="8" y={gapPixels / 2 + 3} fill="#38BDF8" fontSize="9" fontFamily="monospace" fontWeight="bold">
                          {activeGapMm.toFixed(2)}mm
                        </text>
                      </g>

                      {/* Feeler Leaf Blade Inserting Into Gap */}
                      <g transform="translate(10, 60)">
                        {/* Blade Body */}
                        <path
                          d={`M 0,0 L 260,0 L 260,${stackPixels} L 0,${stackPixels} Z`}
                          fill="url(#feelerBladeGrad)"
                          stroke={isTooTight ? '#EF4444' : isPerfectFit ? '#10B981' : '#38BDF8'}
                          strokeWidth="1.5"
                          opacity={isTooTight ? 0.75 : 0.95}
                          transform={isTooTight ? 'translate(-40, 0)' : 'translate(0, 0)'}
                        />
                        {/* Blade Engraved Text */}
                        <text
                          x={isTooTight ? 50 : 90}
                          y={Math.max(10, stackPixels / 2 + 3)}
                          fill="#0F172A"
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          STACK: {roundedTotalMm.toFixed(3)} mm {isTooTight ? '(BLOCKED)' : ''}
                        </text>
                      </g>
                    </>
                  );
                })()}

                {/* Shaders & Gradients */}
                <defs>
                  <linearGradient id="metalBlockGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#334155" />
                    <stop offset="100%" stopColor="#1E293B" />
                  </linearGradient>
                  <linearGradient id="feelerBladeGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#F8FAFC" />
                    <stop offset="70%" stopColor="#CBD5E1" />
                    <stop offset="100%" stopColor="#94A3B8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Clearance Summary Footer */}
            <div className="w-full mt-4 p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-slate-300">
                  Target Gap: <span className="text-cyan-400 font-extrabold">{activeGapMm.toFixed(3)} mm</span>
                </span>
                <span className="text-slate-500">•</span>
                <span className="font-mono text-xs font-bold text-slate-300">
                  Total Stack: <span className="text-emerald-400 font-extrabold">{roundedTotalMm.toFixed(3)} mm</span>
                </span>
                <span className="text-slate-500">•</span>
                <span className="font-mono text-xs font-bold text-slate-300">
                  Delta: <span className={diff === 0 ? 'text-emerald-400' : 'text-amber-400'}>{diff.toFixed(3)} mm</span>
                </span>
              </div>

              <span
                className={`px-3 py-1 rounded-xl font-mono font-bold text-xs border ${
                  isPerfectFit
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : isTooLoose
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    : 'bg-red-500/20 text-red-300 border-red-500/40'
                }`}
              >
                {isPerfectFit ? 'GO (FIT)' : isTooLoose ? 'LOOSE' : 'NO-GO'}
              </span>
            </div>
          </div>

          {/* Active Stack Breakdown Pill Bar */}
          <div className="p-5 rounded-3xl bg-white border border-[#DCE5F2] shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1D2940] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#4385E8]" />
                <span>Active Leaves in Stack ({selectedLeaves.length} blades combined)</span>
              </span>
              <button
                onClick={handleClearStack}
                className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Stack</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {selectedLeaves.map((leaf) => (
                <span
                  key={leaf.thicknessMm}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-mono font-bold border border-slate-200"
                >
                  <span>{leaf.labelMm}</span>
                  <span className="text-[10px] text-slate-400">({leaf.labelIn})</span>
                </span>
              ))}
              <span className="text-xs font-mono font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                = {roundedTotalMm.toFixed(3)} mm
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Specimen Selection & Leaf Magazine */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Target Gap Selector */}
          <div className="p-6 rounded-3xl bg-white border border-[#DCE5F2] shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                1. Target Clearance Gap
              </span>
              <button
                onClick={() => setCustomGapMode(!customGapMode)}
                className="text-[11px] font-bold text-[#4385E8]"
              >
                {customGapMode ? 'Use Preset' : 'Custom Gap'}
              </button>
            </div>

            {!customGapMode ? (
              <div className="flex flex-col gap-2">
                {SPECIMENS.map((spec) => {
                  const isSelected = selectedSpecimen.id === spec.id;
                  return (
                    <button
                      key={spec.id}
                      onClick={() => {
                        setSelectedSpecimen(spec);
                        soundEffects.click();
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-50/70 border-brand-blue text-[#1D2940] shadow-xs font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                      }`}
                    >
                      <div>
                        <span className="text-xs block">{spec.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Gap: {spec.nominalGapMm.toFixed(2)} mm
                        </span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-[#4385E8]" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold">Custom Clearance:</span>
                  <span className="font-mono font-black text-brand-blue">{customGapMm.toFixed(3)} mm</span>
                </div>
                <input
                  type="range"
                  min="0.02"
                  max="1.50"
                  step="0.01"
                  value={customGapMm}
                  onChange={(e) => setCustomGapMm(Number(e.target.value))}
                  className="accent-[#4385E8]"
                />
              </div>
            )}
          </div>

          {/* Leaf Blades Magazine (Toggle to Stack) */}
          <div className="p-6 rounded-3xl bg-white border border-[#DCE5F2] shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                2. Feeler Leaves (Click to Stack)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">13 Blades</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1 max-h-[360px] overflow-y-auto pr-1">
              {FEELER_LEAVES.map((leaf) => {
                const isSelected = selectedLeaves.some((l) => l.thicknessMm === leaf.thicknessMm);
                return (
                  <button
                    key={leaf.thicknessMm}
                    onClick={() => toggleLeaf(leaf)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#4385E8] to-[#8064E8] text-white font-bold shadow-md shadow-brand-blue/20'
                        : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-mono block">{leaf.labelMm}</span>
                      <span className={`text-[9px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                        {leaf.labelIn}
                      </span>
                    </div>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white flex-shrink-0" />}
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

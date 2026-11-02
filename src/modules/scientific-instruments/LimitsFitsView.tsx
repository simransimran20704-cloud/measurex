import React, { useState } from 'react';
import { useHistoryStore } from '../../stores/historyStore';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import { soundEffects } from '../../utils/soundEffects';
import {
  Sliders,
  CheckCircle2,
  Copy,
  Layers,
  ArrowRight,
  ShieldCheck,
  Scale,
  Settings2,
} from 'lucide-react';

interface FitPreset {
  id: string;
  name: string;
  hole: string;
  shaft: string;
  type: 'Clearance' | 'Transition' | 'Interference';
  application: string;
}

const PRESET_FITS: FitPreset[] = [
  { id: 'h7-g6', name: 'H7/g6 - Precision Sliding Fit', hole: 'H7', shaft: 'g6', type: 'Clearance', application: 'Spindles, sliding gears, precision bearings' },
  { id: 'h7-h6', name: 'H7/h6 - Close Running Fit', hole: 'H7', shaft: 'h6', type: 'Clearance', application: 'Pulleys, hand wheels, machine tool spacers' },
  { id: 'h7-k6', name: 'H7/k6 - Light Press / Keying Fit', hole: 'H7', shaft: 'k6', type: 'Transition', application: 'Gears mounted on shafts, precision dowel pins' },
  { id: 'h7-p6', name: 'H7/p6 - Permanent Press Fit', hole: 'H7', shaft: 'p6', type: 'Interference', application: 'Bronze bushings in cast iron housings, wheel hubs' },
  { id: 'h8-f7', name: 'H8/f7 - Normal Running Fit', hole: 'H8', shaft: 'f7', type: 'Clearance', application: 'General engineering shafts, sleeve bearings' },
];

export const LimitsFitsView: React.FC = () => {
  const { addItem } = useHistoryStore();
  const { showToast } = useAppStore();
  const { requireAuth } = useAuthStore();

  const [nominalSizeMm, setNominalSizeMm] = useState<number>(25.0);
  const [selectedFit, setSelectedFit] = useState<FitPreset>(PRESET_FITS[0]);

  // ISO 286 Standard IT calculations (in microns µm) for given nominal diameter
  const D = nominalSizeMm;
  // Fundamental tolerance unit i in µm
  const i = 0.45 * Math.pow(D, 1 / 3) + 0.001 * D;

  // IT grades in microns
  const it6 = Math.round(10 * i); // IT6
  const it7 = Math.round(16 * i); // IT7
  const it8 = Math.round(25 * i); // IT8

  // Fundamental deviations (µm) based on selected fit
  let holeEI = 0; // H has lower deviation 0
  let holeES = it7;
  let shaftES = 0;
  let shaftEI = 0;

  if (selectedFit.id === 'h7-g6') {
    shaftES = -Math.round(2.5 * Math.pow(D, 0.34)); // g fundamental deviation is negative
    shaftEI = shaftES - it6;
    holeES = it7;
  } else if (selectedFit.id === 'h7-h6') {
    shaftES = 0; // h fundamental deviation is 0
    shaftEI = -it6;
    holeES = it7;
  } else if (selectedFit.id === 'h7-k6') {
    shaftEI = Math.round(0.6 * Math.pow(D, 1 / 3)); // transition
    shaftES = shaftEI + it6;
    holeES = it7;
  } else if (selectedFit.id === 'h7-p6') {
    shaftEI = Math.round(14 + 0.4 * D); // interference
    shaftES = shaftEI + it6;
    holeES = it7;
  } else if (selectedFit.id === 'h8-f7') {
    shaftES = -Math.round(5.5 * Math.pow(D, 0.41));
    shaftEI = shaftES - it7;
    holeES = it8;
  }

  // Millimeters conversions
  const holeMax = D + holeES / 1000;
  const holeMin = D + holeEI / 1000;
  const shaftMax = D + shaftES / 1000;
  const shaftMin = D + shaftEI / 1000;

  const maxClearance = Math.round((holeMax - shaftMin) * 1000);
  const minClearance = Math.round((holeMin - shaftMax) * 1000);

  const handleSelectPreset = (preset: FitPreset) => {
    setSelectedFit(preset);
    soundEffects.click();
  };

  const handleLogMeasurement = () => {
    requireAuth('save limits and fits calculation', () => {
      addItem({
        tool: 'ISO Limits & Fits',
        title: `Ø${nominalSizeMm} mm ${selectedFit.hole}/${selectedFit.shaft}`,
        value: `Ø${nominalSizeMm} mm ${selectedFit.name}`,
        rawNumericValue: nominalSizeMm,
        unit: 'mm',
        details: `Hole: [${holeMin.toFixed(3)}, ${holeMax.toFixed(3)}] mm, Shaft: [${shaftMin.toFixed(3)}, ${shaftMax.toFixed(3)}] mm, Clearance: [${minClearance}, ${maxClearance}] µm`,
      });
      showToast('Tolerance calculations saved to Project History', 'success');
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 select-none pb-12">
      {/* Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-white/90 border border-[#DCE5F2] shadow-glass flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-purple-50 text-[#8064E8] border border-purple-200">
              <Settings2 className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-[#1D2940]">ISO Limits & Fits (GD&T) Calculator</h1>
          </div>
          <p className="text-xs md:text-sm text-[#66758D]">
            ISO 286 / ANSI standard hole-basis and shaft-basis engineering tolerances, fits, and Go/No-Go limits.
          </p>
        </div>

        <button
          onClick={handleLogMeasurement}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4385E8] to-[#8064E8] text-white text-xs font-bold shadow-md shadow-brand-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
        >
          <Copy className="w-4 h-4" />
          <span>Save Tolerance</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tolerance Zone Diagram & Inspection Gauges */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {/* Tolerance Zone SVG Diagram */}
          <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border-2 border-slate-800 shadow-2xl flex flex-col items-center justify-center relative min-h-[380px]">
            {/* Fit Pill */}
            <div className="absolute top-4 left-4 z-10">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  selectedFit.type === 'Clearance'
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                    : selectedFit.type === 'Transition'
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/50'
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/50'
                }`}
              >
                <span>{selectedFit.type.toUpperCase()} FIT: {selectedFit.hole}/{selectedFit.shaft}</span>
              </span>
            </div>

            <div className="absolute top-4 right-4 z-10 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Basic Size
              </span>
              <span className="text-2xl font-mono font-black text-cyan-400">
                Ø{nominalSizeMm.toFixed(2)} mm
              </span>
            </div>

            {/* SVG Tolerance Zones */}
            <div className="w-full max-w-lg h-60 flex items-center justify-center relative mt-6">
              <svg viewBox="0 0 400 180" className="w-full h-full drop-shadow-xl overflow-visible">
                {/* Zero Nominal Line */}
                <line x1="20" y1="90" x2="380" y2="90" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4,4" />
                <text x="35" y="85" fill="#94A3B8" fontSize="9" fontWeight="bold" fontFamily="monospace">
                  ZERO LINE (Ø{nominalSizeMm} mm)
                </text>

                {/* 1. Hole Tolerance Zone (Green / Emerald Box) */}
                {(() => {
                  const scale = 2.5; // pixels per micron
                  const holeHeight = Math.max(16, (holeES - holeEI) * scale);
                  const holeY = 90 - holeES * scale;

                  return (
                    <g transform="translate(100, 0)">
                      <rect
                        x="0"
                        y={holeY}
                        width="80"
                        height={holeHeight}
                        rx="4"
                        fill="#10B981"
                        fillOpacity="0.3"
                        stroke="#10B981"
                        strokeWidth="2"
                      />
                      <text x="40" y={holeY - 8} fill="#10B981" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                        HOLE ({selectedFit.hole})
                      </text>
                      <text x="40" y={holeY + holeHeight / 2 + 4} fill="#A7F3D0" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                        +{holeES}µm
                      </text>
                    </g>
                  );
                })()}

                {/* 2. Shaft Tolerance Zone (Blue or Rose Box) */}
                {(() => {
                  const scale = 2.5;
                  const shaftHeight = Math.max(16, (shaftES - shaftEI) * scale);
                  const shaftY = 90 - shaftES * scale;

                  return (
                    <g transform="translate(220, 0)">
                      <rect
                        x="0"
                        y={shaftY}
                        width="80"
                        height={shaftHeight}
                        rx="4"
                        fill={selectedFit.type === 'Interference' ? '#F43F5E' : '#38BDF8'}
                        fillOpacity="0.3"
                        stroke={selectedFit.type === 'Interference' ? '#F43F5E' : '#38BDF8'}
                        strokeWidth="2"
                      />
                      <text
                        x="40"
                        y={shaftY - 8}
                        fill={selectedFit.type === 'Interference' ? '#F43F5E' : '#38BDF8'}
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily="sans-serif"
                      >
                        SHAFT ({selectedFit.shaft})
                      </text>
                      <text
                        x="40"
                        y={shaftY + shaftHeight / 2 + 4}
                        fill="#E0F2FE"
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {shaftES >= 0 ? `+${shaftES}` : shaftES}µm
                      </text>
                    </g>
                  );
                })()}
              </svg>
            </div>

            {/* Clearance / Interference Summary Bar */}
            <div className="w-full mt-2 p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between text-xs">
              <span className="text-slate-300 font-mono">
                {selectedFit.type === 'Interference' ? 'Max Interference:' : 'Max Clearance:'}{' '}
                <span className="text-cyan-400 font-bold">{Math.abs(maxClearance)} µm</span>
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 font-mono">
                {selectedFit.type === 'Interference' ? 'Min Interference:' : 'Min Clearance:'}{' '}
                <span className="text-emerald-400 font-bold">{Math.abs(minClearance)} µm</span>
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 text-[11px] truncate max-w-[200px]">
                {selectedFit.application}
              </span>
            </div>
          </div>

          {/* Go / No-Go Gauge Inspection Standard */}
          <div className="p-6 rounded-3xl bg-white border border-[#DCE5F2] shadow-sm flex flex-col gap-4">
            <span className="text-xs font-bold text-[#1D2940] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#4385E8]" />
              <span>Workshop Inspection Gauges (Taylor's Principle of Gauging)</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              {/* Plug Gauge for Hole */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex flex-col gap-2">
                <span className="font-bold text-emerald-900 font-sans">Plug Gauge for Hole ({selectedFit.hole})</span>
                <div className="flex justify-between">
                  <span className="text-slate-600">GO Member (Lower Limit):</span>
                  <span className="font-bold text-emerald-700">{holeMin.toFixed(3)} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">NO-GO Member (Upper Limit):</span>
                  <span className="font-bold text-emerald-700">{holeMax.toFixed(3)} mm</span>
                </div>
              </div>

              {/* Snap Gauge for Shaft */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 flex flex-col gap-2">
                <span className="font-bold text-blue-900 font-sans">Snap / Caliper Gauge for Shaft ({selectedFit.shaft})</span>
                <div className="flex justify-between">
                  <span className="text-slate-600">GO Anvil (Upper Limit):</span>
                  <span className="font-bold text-blue-700">{shaftMax.toFixed(3)} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">NO-GO Anvil (Lower Limit):</span>
                  <span className="font-bold text-blue-700">{shaftMin.toFixed(3)} mm</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Nominal Size Slider & Fit Presets */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Nominal Size Slider */}
          <div className="p-6 rounded-3xl bg-white border border-[#DCE5F2] shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wider">1. Nominal Diameter</span>
              <span className="font-mono font-black text-[#4385E8]">{nominalSizeMm} mm</span>
            </div>
            <input
              type="range"
              min="5"
              max="150"
              value={nominalSizeMm}
              onChange={(e) => setNominalSizeMm(Number(e.target.value))}
              className="accent-[#4385E8]"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Ø5 mm</span>
              <span>Ø50 mm</span>
              <span>Ø100 mm</span>
              <span>Ø150 mm</span>
            </div>
          </div>

          {/* Standard Engineering Fit Presets */}
          <div className="p-6 rounded-3xl bg-white border border-[#DCE5F2] shadow-sm flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              2. Standard ISO Fit Class
            </span>

            <div className="flex flex-col gap-2">
              {PRESET_FITS.map((preset) => {
                const isSelected = selectedFit.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-purple-50/70 border-brand-blue text-[#1D2940] shadow-xs font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                    }`}
                  >
                    <div>
                      <span className="text-xs block">{preset.name}</span>
                      <span className="text-[10px] text-slate-400">{preset.application}</span>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-[#8064E8] flex-shrink-0" />}
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

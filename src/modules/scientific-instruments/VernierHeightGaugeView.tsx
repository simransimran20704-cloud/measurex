import React, { useState, useRef } from 'react';
import { useHistoryStore } from '../../stores/historyStore';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import { soundEffects } from '../../utils/soundEffects';
import {
  Layers,
  RotateCcw,
  Copy,
  Sliders,
  Tv,
  BookOpen,
  Award,
  Package,
  CheckCircle2,
} from 'lucide-react';

const STEP_BLOCKS = [
  { id: 'none', name: 'Free Scriber Drag', heightMm: 0 },
  { id: 'block50', name: 'Gauge Block 50.00 mm', heightMm: 50.0 },
  { id: 'step125', name: 'Step Standard 125.40 mm', heightMm: 125.4 },
  { id: 'step210', name: 'Precision Column 210.80 mm', heightMm: 210.8 },
];

export const VernierHeightGaugeView: React.FC = () => {
  const { addItem } = useHistoryStore();
  const { showToast } = useAppStore();
  const { requireAuth } = useAuthStore();

  const [heightMm, setHeightMm] = useState<number>(125.4);
  const [leastCount, setLeastCount] = useState<number>(0.02); // 0.02mm (50 divisions)
  const [zeroErrorMm, setZeroErrorMm] = useState<number>(0.0);
  const [selectedBlock, setSelectedBlock] = useState<string>('step125');
  const [mode, setMode] = useState<'interactive' | 'digital' | 'quiz'>('interactive');

  const [userQuizAnswer, setUserQuizAnswer] = useState('');
  const [quizScore, setQuizScore] = useState<{ total: number; correct: number }>({ total: 0, correct: 0 });
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);

  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const startHeightMmRef = useRef(0);
  const lastTickRef = useRef(0);

  // Height gauge reading calculation:
  // Height = MSR + (VSR * LC) + Zero Correction
  const numDivisions = Math.round(1.0 / leastCount); // 50 for 0.02mm
  const apparentHeight = Math.max(0, heightMm + zeroErrorMm);
  const msr = Math.floor(apparentHeight);
  const remainder = apparentHeight - msr;
  let vsr = Math.round(remainder / leastCount);
  if (vsr >= numDivisions) vsr = numDivisions - 1;
  if (vsr < 0) vsr = 0;

  const zeroCorrection = -zeroErrorMm;
  const observedReading = Number((msr + vsr * leastCount).toFixed(3));
  const finalReading = Number((observedReading + zeroCorrection).toFixed(3));

  // Scale: 1 mm = 1.3 SVG pixels (vertical range 0 to 300 mm = ~390px)
  const pxPerMm = 1.3;
  const scriberY = 400 - heightMm * pxPerMm;

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    dragStartYRef.current = e.clientY;
    startHeightMmRef.current = heightMm;
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaY = dragStartYRef.current - e.clientY; // upward drag increases height
    const deltaMm = deltaY / pxPerMm;
    const newMm = Math.max(0, Math.min(300, startHeightMmRef.current + deltaMm));
    setHeightMm(Number(newMm.toFixed(2)));

    const now = Date.now();
    if (now - lastTickRef.current > 70) {
      soundEffects.playSliderTick();
      lastTickRef.current = now;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  };

  const handleSelectBlock = (id: string) => {
    setSelectedBlock(id);
    const blk = STEP_BLOCKS.find((b) => b.id === id);
    if (blk && blk.heightMm > 0) {
      setHeightMm(blk.heightMm);
      soundEffects.playSliderTick();
      showToast(`Scriber contacting ${blk.name}`, 'success');
    }
  };

  const handleCopy = () => {
    const formatted = `${finalReading.toFixed(2)} mm`;
    navigator.clipboard.writeText(formatted);
    requireAuth('save measurements to history', () => {
      addItem({
        tool: 'Height Gauge',
        title: 'Vernier Height Gauge',
        value: formatted,
        rawNumericValue: finalReading,
        unit: 'mm',
        details: `Surface Plate MSR: ${msr}mm, VSR: ${vsr}, LC: ${leastCount}mm`,
      });
      showToast(`Logged ${formatted} to Measurement History!`, 'success');
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 pb-12 select-none">
      {/* Header Banner */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/90 border border-[#DCE5F2] shadow-glass flex flex-wrap items-center justify-between gap-4 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-xl bg-purple-100 text-[#8064E8] font-bold text-xs">LAB-03</span>
            <h1 className="text-xl font-extrabold text-[#1D2940]">Vernier Height Gauge Simulator</h1>
          </div>
          <p className="text-xs text-[#66758D]">
            Granite surface plate metrology standard with vertical scriber, fine adjustment clamp & dual vernier reading.
          </p>
        </div>

        {/* Mode & Reset */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setMode('interactive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'interactive' ? 'bg-white text-[#8064E8] shadow-sm' : 'text-slate-600'
              }`}
            >
              Simulation
            </button>
            <button
              onClick={() => setMode('digital')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'digital' ? 'bg-white text-[#4385E8] shadow-sm' : 'text-slate-600'
              }`}
            >
              Digital LCD
            </button>
          </div>

          <button
            onClick={() => {
              setHeightMm(0);
              setSelectedBlock('none');
            }}
            title="Reset Scriber to Granite Zero"
            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Workpiece Standard Blocks Bar */}
      <div className="p-4 rounded-2xl bg-white/80 border border-[#DCE5F2] shadow-sm flex flex-wrap items-center justify-between gap-3 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-[#8064E8]" />
          <span className="text-xs font-bold text-[#1D2940]">Granite Surface Plate Workpieces:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {STEP_BLOCKS.map((blk) => (
            <button
              key={blk.id}
              onClick={() => handleSelectBlock(blk.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedBlock === blk.id
                  ? 'bg-gradient-to-r from-[#4385E8] to-[#8064E8] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {blk.name}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Height Gauge SVG Stage */}
      <div className="relative w-full overflow-x-auto p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-white/95 to-[#F1F5FB] border border-white shadow-xl flex flex-col items-center justify-center min-h-[360px] sm:min-h-[480px]">
        <div className="relative w-[860px] h-[460px]">
          <svg viewBox="0 0 860 460" className="w-full h-full filter drop-shadow-md">
            <defs>
              {/* Granite Texture */}
              <linearGradient id="graniteSurface" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="20%" stopColor="#1E293B" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>

              {/* Steel Column Beam */}
              <linearGradient id="verticalBeam" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#CBD5E1" />
                <stop offset="30%" stopColor="#FFFFFF" />
                <stop offset="70%" stopColor="#E2E8F0" />
                <stop offset="100%" stopColor="#94A3B8" />
              </linearGradient>
            </defs>

            {/* 1. Heavy Granite Surface Plate at bottom */}
            <rect x="40" y="400" width="780" height="50" rx="4" fill="url(#graniteSurface)" stroke="#0F172A" strokeWidth="2" />
            <line x1="40" y1="400" x2="820" y2="400" stroke="#94A3B8" strokeWidth="1" />
            <text x="60" y="430" fill="#94A3B8" fontSize="11" fontWeight="bold" fontFamily="monospace">
              PRECISION GRANITE SURFACE PLATE GRADE 00 (ZERO DATUM)
            </text>

            {/* Workpiece on Granite Plate (under scriber) */}
            {selectedBlock !== 'none' && heightMm > 0 && (
              <g>
                <rect
                  x="200"
                  y={400 - heightMm * pxPerMm}
                  width="130"
                  height={heightMm * pxPerMm}
                  fill="#64748B"
                  stroke="#334155"
                  strokeWidth="1.5"
                  rx="2"
                />
                <line x1="210" y1={400 - heightMm * pxPerMm} x2="210" y2="400" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3 3" />
                <text
                  x="265"
                  y={400 - (heightMm * pxPerMm) / 2 + 4}
                  textAnchor="middle"
                  fill="white"
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {heightMm.toFixed(2)} mm
                </text>
              </g>
            )}

            {/* 2. Heavy Cast Iron Base */}
            <path
              d="M380 400 L380 370 L430 360 L500 360 L550 370 L550 400 Z"
              fill="#334155"
              stroke="#0F172A"
              strokeWidth="1.5"
            />
            {/* Clamping Base Grip */}
            <rect x="440" y="380" width="50" height="15" rx="2" fill="#475569" />

            {/* 3. Vertical Graduated Beam (0 to 300 mm) */}
            <rect x="450" y="10" width="30" height="360" rx="2" fill="url(#verticalBeam)" stroke="#64748B" strokeWidth="1" />
            <rect x="477" y="10" width="3" height="360" fill="#475569" />

            {/* Main Beam Graduation Marks */}
            {Array.from({ length: 31 }).map((_, i) => {
              const mm = i * 10; // every 10mm
              const y = 400 - mm * pxPerMm;
              if (y < 15) return null;
              return (
                <g key={`beam-${i}`}>
                  <line x1="450" y1={y} x2="466" y2={y} stroke="#0F172A" strokeWidth="1.2" />
                  <line x1="450" y1={y + 5 * pxPerMm} x2="460" y2={y + 5 * pxPerMm} stroke="#0F172A" strokeWidth="0.8" />
                  <text
                    x="474"
                    y={y + 3}
                    fontSize="8"
                    fontFamily="monospace"
                    fontWeight="bold"
                    fill="#1E293B"
                    textAnchor="end"
                  >
                    {mm}
                  </text>
                </g>
              );
            })}

            {/* 4. Sliding Scriber Head (Draggable) */}
            <g
              transform={`translate(0, ${scriberY})`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="cursor-ns-resize group touch-none"
            >
              {/* Slider Body Collar around Beam */}
              <rect x="435" y="-25" width="60" height="50" rx="3" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
              
              {/* Locking Screw on Right */}
              <circle cx="505" cy="0" r="8" fill="#334155" stroke="#64748B" strokeWidth="1" />
              <line x1="505" y1="-8" x2="505" y2="8" stroke="#94A3B8" strokeWidth="1.5" />

              {/* Vernier Scale Window on Head */}
              <rect x="440" y="-12" width="22" height="24" fill="white" stroke="#94A3B8" strokeWidth="0.8" rx="1" />
              <line x1="440" y1="0" x2="455" y2="0" stroke="#16A078" strokeWidth="1.8" />
              <text x="444" y="-3" fontSize="7" fill="#16A078" fontWeight="bold">0</text>

              {/* Horizontal Scriber Arm extending to the left */}
              <path
                d="M435 -8 L330 -8 L190 0 L330 8 L435 8 Z"
                fill="url(#verticalBeam)"
                stroke="#475569"
                strokeWidth="1.2"
              />
              {/* Carbide Scriber Tip */}
              <polygon points="190,0 200,-5 200,5" fill="#0F172A" />

              {/* Drag Handle Indicator */}
              <circle cx="465" cy="0" r="14" fill="#8064E8" opacity="0.15" className="animate-pulse" />
            </g>
          </svg>
        </div>

        {/* Digital Readout Mode */}
        {mode === 'digital' && (
          <div className="absolute top-6 left-12 px-6 py-3 rounded-2xl bg-slate-900 border-2 border-slate-700 shadow-2xl flex items-center gap-4 animate-in fade-in">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">DIGITAL HEIGHT GAUGE</span>
              <span className="font-mono text-3xl font-black text-cyan-400 tracking-wider">
                {finalReading.toFixed(2)} <span className="text-sm font-sans text-cyan-200">mm</span>
              </span>
            </div>
            <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 font-mono">OPTICAL ENCODER</span>
          </div>
        )}

        <div className="w-full max-w-md flex items-center gap-3 px-4 py-2 mt-4 bg-white/90 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Height (0-300mm):</span>
          <input
            type="range"
            min="0"
            max="300"
            step="0.02"
            value={heightMm}
            onChange={(e) => {
              setHeightMm(Number(e.target.value));
              soundEffects.playSliderTick();
            }}
            className="w-full accent-[#8064E8]"
            aria-label="Fine height adjustment slider"
          />
          <span className="font-mono text-xs font-bold text-slate-700 w-16 text-right">
            {heightMm.toFixed(2)}mm
          </span>
        </div>

        <p className="mt-4 text-xs text-[#8E9CAE] font-medium text-center">
          💡 Click and drag the scriber head vertically along the graduated beam to measure block height from the granite surface plate.
        </p>
      </div>

      {/* Calculation & Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white border border-[#DCE5F2] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#8064E8]" />
              <h3 className="font-bold text-sm text-[#1D2940]">Height Gauge Reading Analysis</h3>
            </div>
            <button
              onClick={handleCopy}
              className="text-xs font-semibold text-[#8064E8] hover:text-[#4385E8] flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Height</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100">
              <span className="text-[10px] text-slate-500 font-semibold">1. Beam Scale (MSR)</span>
              <div className="text-lg font-mono font-extrabold text-[#8064E8] mt-0.5">
                {msr.toFixed(0)} <span className="text-xs font-sans">mm</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100">
              <span className="text-[10px] text-slate-500 font-semibold">2. Vernier Coincidence</span>
              <div className="text-lg font-mono font-extrabold text-[#4385E8] mt-0.5">
                {vsr} <span className="text-xs font-sans">div</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-500 font-semibold">3. Least Count</span>
              <div className="text-lg font-mono font-bold text-slate-700 mt-0.5">
                {leastCount.toFixed(2)} <span className="text-xs font-sans">mm</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100">
              <span className="text-[10px] text-slate-500 font-semibold">4. Zero Datum</span>
              <div className="text-lg font-mono font-bold text-emerald-600 mt-0.5">
                Granite Plate (0.00)
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F8FAFF] border border-[#DCE5F2] flex items-center justify-between">
            <div className="text-xs text-slate-600 font-mono">
              Height = MSR + (VSR &times; LC) = {msr} + ({vsr} &times; {leastCount})
            </div>
            <div className="text-xl font-mono font-black text-[#1D2940]">
              = {finalReading.toFixed(2)} mm
            </div>
          </div>
        </div>

        {/* Configuration */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white border border-[#DCE5F2] shadow-sm flex flex-col justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Sliders className="w-4 h-4 text-[#8064E8]" />
              <h3 className="font-bold text-xs text-[#1D2940]">Height Gauge Settings</h3>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 font-medium">Vernier Least Count:</span>
              <select
                value={leastCount}
                onChange={(e) => setLeastCount(Number(e.target.value))}
                className="w-full mt-1 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#1D2940] outline-none"
              >
                <option value={0.02}>0.02 mm (50 Divisions Standard)</option>
                <option value={0.05}>0.05 mm (20 Divisions)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Direct Height Input:</span>
                <span className="font-mono font-bold text-xs">{heightMm.toFixed(2)} mm</span>
              </div>
              <input
                type="range"
                min="0"
                max="300"
                step="0.1"
                value={heightMm}
                onChange={(e) => setHeightMm(Number(e.target.value))}
                className="w-full mt-1 accent-[#8064E8]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

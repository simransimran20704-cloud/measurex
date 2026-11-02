import React, { useState, useRef } from 'react';
import { computeVernierReading } from '../../engine/instruments/vernierMath';
import { useHistoryStore } from '../../stores/historyStore';
import { useAppStore } from '../../stores/appStore';
import {
  HelpCircle,
  RotateCcw,
  Copy,
  Settings,
  CheckCircle2,
  Sliders,
  Tv,
  BookOpen,
  Award,
} from 'lucide-react';

export const VernierCaliperView: React.FC = () => {
  const { addItem } = useHistoryStore();
  const { showToast } = useAppStore();

  const [jawPositionMm, setJawPositionMm] = useState(19.4); // initial 19.4 mm
  const [numDivisions, setNumDivisions] = useState(10); // 10 divisions (LC = 0.1mm) or 50 (LC = 0.02mm)
  const [zeroErrorMm, setZeroErrorMm] = useState(0.0);
  const [mode, setMode] = useState<'interactive' | 'digital' | 'quiz'>('interactive');
  const [userQuizAnswer, setUserQuizAnswer] = useState('');
  const [quizScore, setQuizScore] = useState<{ total: number; correct: number }>({ total: 0, correct: 0 });
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);

  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const startJawMmRef = useRef(0);

  // Calculation from physics engine
  const calc = computeVernierReading(jawPositionMm, 1.0, numDivisions, zeroErrorMm);

  // Scale: 1 mm = 6 SVG pixels
  const pxPerMm = 6;
  const sliderOffsetPx = jawPositionMm * pxPerMm;

  // Pointer drag handler for movable jaw
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    startJawMmRef.current = jawPositionMm;
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaPx = e.clientX - dragStartXRef.current;
    const deltaMm = deltaPx / pxPerMm;
    const newMm = Math.max(0, Math.min(150, startJawMmRef.current + deltaMm));
    setJawPositionMm(Number(newMm.toFixed(2)));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  };

  const handleCopy = () => {
    const formatted = `${calc.finalReading.toFixed(2)} mm`;
    navigator.clipboard.writeText(formatted);
    addItem({
      tool: 'Vernier Caliper',
      title: 'Caliper Measurement',
      value: formatted,
      rawNumericValue: calc.finalReading,
      unit: 'mm',
      details: `MSR: ${calc.msr}mm, VSR: ${calc.vsr}, LC: ${calc.leastCount}mm`,
    });
    showToast(`Logged ${formatted} to Measurement History!`, 'success');
  };

  const handleNewQuiz = () => {
    const randomMm = Number((Math.random() * 40 + 2).toFixed(1));
    setJawPositionMm(randomMm);
    setUserQuizAnswer('');
    setQuizFeedback(null);
  };

  const handleCheckQuiz = () => {
    const userVal = parseFloat(userQuizAnswer);
    if (isNaN(userVal)) {
      setQuizFeedback('Please enter a valid numeric reading.');
      return;
    }
    const isCorrect = Math.abs(userVal - calc.finalReading) <= calc.leastCount / 2;
    setQuizScore((prev) => ({
      total: prev.total + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
    }));
    if (isCorrect) {
      setQuizFeedback('🎉 Outstanding! Exactly correct measurement reading.');
    } else {
      setQuizFeedback(`Incorrect. Correct reading is ${calc.finalReading} mm. (MSR: ${calc.msr} + VSR: ${calc.vsr} × LC: ${calc.leastCount})`);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 pb-12 select-none">
      {/* Top Banner & Mode Switches */}
      <div className="p-6 rounded-3xl bg-white/90 border border-[#DCE5F2] shadow-glass flex flex-wrap items-center justify-between gap-4 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-xl bg-blue-100 text-[#4385E8] font-bold text-xs">LAB-01</span>
            <h1 className="text-xl font-extrabold text-[#1D2940]">Vernier Caliper Simulator</h1>
          </div>
          <p className="text-xs text-[#66758D]">
            Interactive precision caliper with authentic coincidence alignment & zero-correction physics.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setMode('interactive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'interactive' ? 'bg-white text-[#4385E8] shadow-sm' : 'text-slate-600'
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
            <button
              onClick={() => {
                setMode('quiz');
                handleNewQuiz();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'quiz' ? 'bg-white text-[#8064E8] shadow-sm' : 'text-slate-600'
              }`}
            >
              Challenge Quiz
            </button>
          </div>

          <button
            onClick={() => {
              setJawPositionMm(0);
              setZeroErrorMm(0);
            }}
            title="Close Jaws (Reset)"
            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Interactive Caliper Stage */}
      <div className="relative w-full overflow-x-auto p-8 rounded-3xl bg-gradient-to-b from-white/95 to-[#F1F5FB] border border-white shadow-xl flex flex-col items-center justify-center min-h-[380px]">
        {/* Caliper SVG Rendering */}
        <div className="relative w-[880px] h-[260px]">
          <svg viewBox="0 0 880 260" className="w-full h-full filter drop-shadow-md">
            <defs>
              <linearGradient id="beamSteel" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="30%" stopColor="#E2E8F0" />
                <stop offset="70%" stopColor="#CBD5E1" />
                <stop offset="100%" stopColor="#94A3B8" />
              </linearGradient>

              <linearGradient id="sliderSteel" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="40%" stopColor="#F1F5F9" />
                <stop offset="80%" stopColor="#CBD5E1" />
                <stop offset="100%" stopColor="#94A3B8" />
              </linearGradient>

              <filter id="jawDrop" x="-10%" y="-10%" width="120%" height="130%">
                <feDropShadow dx="2" dy="5" stdDeviation="4" floodColor="#0F172A" floodOpacity="0.15" />
              </filter>
            </defs>

            {/* Depth Rod (moves with slider out the back) */}
            <rect
              x={640 + sliderOffsetPx}
              y="98"
              width="200"
              height="4"
              fill="#94A3B8"
              stroke="#64748B"
              strokeWidth="0.5"
            />

            {/* 1. Fixed Beam & Fixed Jaws */}
            <g id="fixed-body">
              {/* Main Beam */}
              <rect x="60" y="80" width="760" height="40" rx="3" fill="url(#beamSteel)" stroke="#94A3B8" strokeWidth="1" />

              {/* Fixed Lower External Jaw */}
              <path
                d="M60 80 L60 230 C60 235 75 220 85 185 L95 120 L95 80 Z"
                fill="url(#beamSteel)"
                stroke="#94A3B8"
                strokeWidth="1"
              />

              {/* Fixed Upper Internal Jaw */}
              <path
                d="M60 80 L60 20 C60 15 70 25 80 50 L90 80 Z"
                fill="url(#beamSteel)"
                stroke="#94A3B8"
                strokeWidth="1"
              />

              {/* Main Scale Markings (0 to 120 mm) */}
              {Array.from({ length: 121 }).map((_, i) => {
                const x = 95 + i * pxPerMm;
                const isCm = i % 10 === 0;
                const isHalfCm = i % 5 === 0;
                const tickLen = isCm ? 22 : isHalfCm ? 15 : 9;

                return (
                  <g key={`main-${i}`}>
                    <line
                      x1={x}
                      y1={120}
                      x2={x}
                      y2={120 - tickLen}
                      stroke="#1E293B"
                      strokeWidth={isCm ? 1.4 : isHalfCm ? 1 : 0.6}
                    />
                    {isCm && (
                      <text
                        x={x}
                        y={92}
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                        fill="#0F172A"
                        textAnchor="middle"
                      >
                        {i / 10}
                      </text>
                    )}
                  </g>
                );
              })}
              <text x="790" y="94" fontSize="10" fontWeight="bold" fill="#64748B" fontFamily="monospace">cm</text>
            </g>

            {/* 2. Movable Jaw Slider (Draggable) */}
            <g
              id="movable-slider"
              transform={`translate(${sliderOffsetPx}, 0)`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="cursor-ew-resize group"
              filter="url(#jawDrop)"
            >
              {/* Slider Main Body */}
              <rect x="95" y="65" width="120" height="70" rx="4" fill="url(#sliderSteel)" stroke="#64748B" strokeWidth="1.2" />

              {/* Thumb Wheel / Slider Knob */}
              <rect x="135" y="138" width="40" height="12" rx="3" fill="#64748B" />
              <line x1="145" y1="138" x2="145" y2="150" stroke="#CBD5E1" strokeWidth="1" />
              <line x1="155" y1="138" x2="155" y2="150" stroke="#CBD5E1" strokeWidth="1" />
              <line x1="165" y1="138" x2="165" y2="150" stroke="#CBD5E1" strokeWidth="1" />

              {/* Movable Lower External Jaw */}
              <path
                d="M95 135 L95 230 C95 235 80 220 70 185 L80 135 Z"
                fill="url(#sliderSteel)"
                stroke="#64748B"
                strokeWidth="1"
              />

              {/* Movable Upper Internal Jaw */}
              <path
                d="M95 65 L95 20 C95 15 85 25 75 50 L85 65 Z"
                fill="url(#sliderSteel)"
                stroke="#64748B"
                strokeWidth="1"
              />

              {/* Vernier Window Cutout */}
              <rect x="105" y="85" width="100" height="26" rx="2" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="0.8" />

              {/* Vernier Scale Markings (0 to 10 or 50) */}
              {Array.from({ length: numDivisions + 1 }).map((_, i) => {
                // In a 10-div vernier, 10 vernier divisions = 9 main scale divisions (9 mm = 54 px)
                // Each vernier div = (9/10) * pxPerMm = 0.9 * 6 = 5.4 px
                const stepVernierPx = ((numDivisions - 1) / numDivisions) * pxPerMm;
                const vx = 105 + i * stepVernierPx;
                const isCoincident = i === calc.coincidenceLineIndex;

                return (
                  <g key={`vernier-${i}`}>
                    <line
                      x1={vx}
                      y1={85}
                      x2={vx}
                      y2={i % 5 === 0 ? 98 : 94}
                      stroke={isCoincident ? '#16A078' : '#0F172A'}
                      strokeWidth={isCoincident ? 2.2 : 0.8}
                    />
                    {i % 5 === 0 && (
                      <text
                        x={vx}
                        y={108}
                        fontSize="8"
                        fontFamily="monospace"
                        fontWeight="bold"
                        fill={isCoincident ? '#16A078' : '#475569'}
                        textAnchor="middle"
                      >
                        {i}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Digital LCD Mode Display overlay (if mode === 'digital') */}
        {mode === 'digital' && (
          <div className="absolute top-6 left-12 px-6 py-3 rounded-2xl bg-slate-900 border-2 border-slate-700 shadow-2xl flex items-center gap-4 animate-in fade-in">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">DIGITAL CALIPER LCD</span>
              <span className="font-mono text-3xl font-black text-cyan-400 tracking-wider">
                {calc.finalReading.toFixed(2)} <span className="text-sm font-sans text-cyan-200">mm</span>
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 font-mono">ABS / ZERO</span>
              <span className="text-[9px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">LC: 0.01mm</span>
            </div>
          </div>
        )}

        <p className="mt-4 text-xs text-[#8E9CAE] font-medium text-center">
          💡 Click and drag the silver movable jaw to simulate real measurement. Vernier coincidence line glows <span className="font-bold text-emerald-600">green</span>.
        </p>
      </div>

      {/* Reading & Analysis Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step-by-Step Breakdown (8 Cols) */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white border border-[#DCE5F2] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#4385E8]" />
              <h3 className="font-bold text-sm text-[#1D2940]">Measurement Formula & Calculation</h3>
            </div>
            <button
              onClick={handleCopy}
              className="text-xs font-semibold text-[#4385E8] hover:text-[#8064E8] flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Reading</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100">
              <span className="text-[10px] text-slate-500 font-semibold">1. Main Scale (MSR)</span>
              <div className="text-lg font-mono font-extrabold text-[#4385E8] mt-0.5">
                {calc.msr.toFixed(1)} <span className="text-xs font-sans">mm</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100">
              <span className="text-[10px] text-slate-500 font-semibold">2. Vernier Coincidence (VSR)</span>
              <div className="text-lg font-mono font-extrabold text-[#8064E8] mt-0.5">
                {calc.vsr} <span className="text-xs font-sans">div</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-500 font-semibold">3. Least Count (LC)</span>
              <div className="text-lg font-mono font-bold text-slate-700 mt-0.5">
                {calc.leastCount.toFixed(2)} <span className="text-xs font-sans">mm</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100">
              <span className="text-[10px] text-slate-500 font-semibold">4. Zero Correction</span>
              <div className="text-lg font-mono font-bold text-emerald-600 mt-0.5">
                {calc.zeroCorrection >= 0 ? `+${calc.zeroCorrection.toFixed(2)}` : calc.zeroCorrection.toFixed(2)} mm
              </div>
            </div>
          </div>

          {/* Formula summary */}
          <div className="p-4 rounded-2xl bg-[#F8FAFF] border border-[#DCE5F2] flex items-center justify-between">
            <div className="text-xs text-slate-600 font-mono">
              Final = MSR + (VSR &times; LC) + Zero Correction = {calc.msr} + ({calc.vsr} &times; {calc.leastCount}) + ({calc.zeroCorrection})
            </div>
            <div className="text-xl font-mono font-black text-[#1D2940]">
              = {calc.finalReading.toFixed(2)} mm
            </div>
          </div>
        </div>

        {/* Configuration or Quiz Column (4 Cols) */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white border border-[#DCE5F2] shadow-sm flex flex-col justify-between">
          {mode === 'quiz' ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-xs text-[#8064E8] flex items-center gap-1.5">
                  <Award className="w-4 h-4" /> Caliper Quiz Challenge
                </span>
                <span className="text-xs font-mono font-bold text-slate-700">
                  Score: {quizScore.correct}/{quizScore.total}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Inspect the caliper scale above and type the exact reading in mm:
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={userQuizAnswer}
                  onChange={(e) => setUserQuizAnswer(e.target.value)}
                  placeholder="e.g. 19.4"
                  className="flex-1 px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 outline-none focus:border-brand-violet"
                />
                <button
                  onClick={handleCheckQuiz}
                  className="px-4 py-2 rounded-xl bg-[#8064E8] text-white text-xs font-bold hover:bg-[#6D28D9] transition-colors"
                >
                  Submit
                </button>
              </div>
              {quizFeedback && (
                <p className="text-xs font-medium text-slate-800 p-2 rounded-lg bg-slate-50 border border-slate-100">
                  {quizFeedback}
                </p>
              )}
              <button
                onClick={handleNewQuiz}
                className="mt-2 text-xs font-bold text-[#4385E8] hover:underline"
              >
                &rarr; Next Random Reading
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Sliders className="w-4 h-4 text-[#4385E8]" />
                <h3 className="font-bold text-xs text-[#1D2940]">Caliper Configuration</h3>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 font-medium">Vernier Divisions:</span>
                <select
                  value={numDivisions}
                  onChange={(e) => setNumDivisions(Number(e.target.value))}
                  className="w-full mt-1 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#1D2940] outline-none"
                >
                  <option value={10}>10 Divisions (LC = 0.1 mm)</option>
                  <option value={20}>20 Divisions (LC = 0.05 mm)</option>
                  <option value={50}>50 Divisions (LC = 0.02 mm)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Zero Error Adjustment:</span>
                  <span className="font-mono font-bold">{zeroErrorMm.toFixed(2)} mm</span>
                </div>
                <input
                  type="range"
                  min="-0.5"
                  max="0.5"
                  step="0.05"
                  value={zeroErrorMm}
                  onChange={(e) => setZeroErrorMm(Number(e.target.value))}
                  className="w-full mt-1 accent-[#4385E8]"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 text-[10px] text-slate-500 leading-snug">
                Positive error shifts zero right; negative error shifts zero left. Zero correction is always the opposite sign.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

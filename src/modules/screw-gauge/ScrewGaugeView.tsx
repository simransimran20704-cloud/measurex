import React, { useState, useRef } from 'react';
import { computeScrewGaugeReading } from '../../engine/instruments/screwGaugeMath';
import { useHistoryStore } from '../../stores/historyStore';
import { useAppStore } from '../../stores/appStore';
import {
  RotateCcw,
  Copy,
  Sliders,
  Tv,
  BookOpen,
  Award,
  Volume2,
  Lock,
  Unlock,
} from 'lucide-react';

export const ScrewGaugeView: React.FC = () => {
  const { addItem } = useHistoryStore();
  const { showToast } = useAppStore();

  const [spindlePositionMm, setSpindlePositionMm] = useState(7.35); // initial 7.35 mm
  const [pitchMm, setPitchMm] = useState(0.5); // standard 0.5 mm
  const [circularDivisions, setCircularDivisions] = useState(50); // LC = 0.5 / 50 = 0.01 mm
  const [zeroErrorMm, setZeroErrorMm] = useState(0.0);
  const [isLocked, setIsLocked] = useState(false);
  const [mode, setMode] = useState<'interactive' | 'digital' | 'quiz'>('interactive');

  const [userQuizAnswer, setUserQuizAnswer] = useState('');
  const [quizScore, setQuizScore] = useState<{ total: number; correct: number }>({ total: 0, correct: 0 });
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);

  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const startSpindleMmRef = useRef(0);

  // Math engine
  const calc = computeScrewGaugeReading(spindlePositionMm, pitchMm, circularDivisions, zeroErrorMm);

  // Visual scale mapping
  // 1 mm displacement = 12 SVG pixels
  const pxPerMm = 12;
  const spindleWidthPx = spindlePositionMm * pxPerMm;

  // Thimble rotation drag handler
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isLocked) {
      showToast('Micrometer spindle is locked. Unlock to adjust.', 'warning');
      return;
    }
    isDraggingRef.current = true;
    dragStartYRef.current = e.clientY;
    startSpindleMmRef.current = spindlePositionMm;
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || isLocked) return;
    const deltaY = dragStartYRef.current - e.clientY; // upward drag advances
    // Sensitivity: 40px drag = 1 complete 0.5mm turn
    const deltaMm = (deltaY / 40) * pitchMm;
    const newMm = Math.max(0, Math.min(25, startSpindleMmRef.current + deltaMm));
    setSpindlePositionMm(Number(newMm.toFixed(3)));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  };

  const handleRatchetClick = () => {
    if (isLocked) return;
    // Advance by exactly 1 least count (0.01 mm) with simulated ratchet click
    const next = Math.min(25, spindlePositionMm + calc.leastCount);
    setSpindlePositionMm(Number(next.toFixed(3)));
    showToast('Ratchet click: +0.01 mm advanced', 'info');
  };

  const handleCopy = () => {
    const formatted = `${calc.finalReading.toFixed(3)} mm`;
    navigator.clipboard.writeText(formatted);
    addItem({
      tool: 'Screw Gauge',
      title: 'Micrometer Screw Gauge',
      value: formatted,
      rawNumericValue: calc.finalReading,
      unit: 'mm',
      details: `MSR: ${calc.msr}mm, CSR: ${calc.csr}, LC: ${calc.leastCount}mm`,
    });
    showToast(`Logged ${formatted} to Measurement History!`, 'success');
  };

  const handleNewQuiz = () => {
    const randomMm = Number((Math.random() * 15 + 1).toFixed(2));
    setSpindlePositionMm(randomMm);
    setUserQuizAnswer('');
    setQuizFeedback(null);
  };

  const handleCheckQuiz = () => {
    const userVal = parseFloat(userQuizAnswer);
    if (isNaN(userVal)) {
      setQuizFeedback('Please enter a valid numeric value.');
      return;
    }
    const isCorrect = Math.abs(userVal - calc.finalReading) <= calc.leastCount / 2;
    setQuizScore((prev) => ({
      total: prev.total + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
    }));
    if (isCorrect) {
      setQuizFeedback('🎉 Bravo! Perfect reading calculation.');
    } else {
      setQuizFeedback(`Incorrect. Correct reading is ${calc.finalReading} mm. (MSR: ${calc.msr} + CSR: ${calc.csr} × LC: ${calc.leastCount})`);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 pb-12 select-none">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-white/90 border border-[#DCE5F2] shadow-glass flex flex-wrap items-center justify-between gap-4 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-xl bg-purple-100 text-[#8064E8] font-bold text-xs">LAB-02</span>
            <h1 className="text-xl font-extrabold text-[#1D2940]">Micrometer Screw Gauge Simulator</h1>
          </div>
          <p className="text-xs text-[#66758D]">
            Ultra-precise 0.01 mm micro-measurement laboratory with ratchet feedback & pitch kinematics.
          </p>
        </div>

        {/* Mode Selector & Lock */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLocked(!isLocked)}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              isLocked ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-slate-100 text-slate-600 border-transparent'
            }`}
          >
            {isLocked ? <Lock className="w-4 h-4 text-amber-600" /> : <Unlock className="w-4 h-4 text-slate-500" />}
            <span>{isLocked ? 'Locked' : 'Unlocked'}</span>
          </button>

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
            <button
              onClick={() => {
                setMode('quiz');
                handleNewQuiz();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'quiz' ? 'bg-white text-[#8064E8] shadow-sm' : 'text-slate-600'
              }`}
            >
              Quiz Challenge
            </button>
          </div>

          <button
            onClick={() => {
              setSpindlePositionMm(0);
              setZeroErrorMm(0);
            }}
            title="Reset to Zero"
            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Interactive Micrometer SVG Stage */}
      <div className="relative w-full overflow-x-auto p-8 rounded-3xl bg-gradient-to-b from-white/95 to-[#F1F5FB] border border-white shadow-xl flex flex-col items-center justify-center min-h-[420px]">
        {/* SVG Drawing */}
        <div className="relative w-[860px] h-[300px]">
          <svg viewBox="0 0 860 300" className="w-full h-full filter drop-shadow-lg">
            <defs>
              <linearGradient id="frameCast" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="50%" stopColor="#334155" />
                <stop offset="100%" stopColor="#1E293B" />
              </linearGradient>

              <linearGradient id="sleeveSteel" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="30%" stopColor="#E2E8F0" />
                <stop offset="70%" stopColor="#CBD5E1" />
                <stop offset="100%" stopColor="#94A3B8" />
              </linearGradient>

              <linearGradient id="thimbleChrome" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F8FAFC" />
                <stop offset="30%" stopColor="#E2E8F0" />
                <stop offset="70%" stopColor="#94A3B8" />
                <stop offset="100%" stopColor="#64748B" />
              </linearGradient>
            </defs>

            {/* 1. Heavy C-Frame */}
            <path
              d="M120 150 C120 270 340 270 340 150 L300 150 C300 230 160 230 160 150 Z"
              fill="url(#frameCast)"
              stroke="#0F172A"
              strokeWidth="2"
            />
            {/* Range Plate on Frame */}
            <rect x="180" y="210" width="100" height="24" rx="4" fill="#0F172A" stroke="#475569" strokeWidth="0.8" />
            <text x="230" y="226" textAnchor="middle" fill="#E2E8F0" fontSize="10" fontWeight="bold" fontFamily="monospace">
              0 - 25 mm 0.01mm
            </text>

            {/* Anvil (Left) */}
            <rect x="110" y="136" width="30" height="28" rx="2" fill="url(#sleeveSteel)" stroke="#475569" strokeWidth="1" />
            <rect x="140" y="142" width="10" height="16" fill="#94A3B8" />

            {/* Spindle (Advances from right to anvil) */}
            {/* Maximum stroke = 25 mm. The gap is (25 - spindlePositionMm) * pxPerMm */}
            <rect
              x={150 + spindleWidthPx}
              y="142"
              width={190 - spindleWidthPx}
              height="16"
              fill="url(#sleeveSteel)"
              stroke="#64748B"
              strokeWidth="1"
            />

            {/* Barrel / Sleeve (Stationary) */}
            <g id="sleeve-barrel">
              <rect x="340" y="130" width="190" height="40" fill="url(#sleeveSteel)" stroke="#475569" strokeWidth="1" />

              {/* Datum Baseline */}
              <line x1="340" y1="150" x2="530" y2="150" stroke="#0F172A" strokeWidth="1.5" />

              {/* Sleeve Markings: Upper marks (1mm increments) & Lower marks (0.5mm increments) */}
              {Array.from({ length: 26 }).map((_, i) => {
                const x = 350 + i * pxPerMm;
                const isCm = i % 5 === 0;
                return (
                  <g key={`sleeve-${i}`}>
                    {/* Upper 1mm mark */}
                    <line
                      x1={x}
                      y1={135}
                      x2={x}
                      y2={150}
                      stroke="#0F172A"
                      strokeWidth={isCm ? 1.5 : 0.8}
                    />
                    {isCm && (
                      <text
                        x={x}
                        y={130}
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                        fill="#0F172A"
                        textAnchor="middle"
                      >
                        {i}
                      </text>
                    )}

                    {/* Lower half-mm mark (at +0.5mm) */}
                    {i < 25 && (
                      <line
                        x1={x + pxPerMm / 2}
                        y1={150}
                        x2={x + pxPerMm / 2}
                        y2={162}
                        stroke="#0F172A"
                        strokeWidth="0.8"
                      />
                    )}
                  </g>
                );
              })}
            </g>

            {/* Rotating Thimble (Moves linearly with spindle position + rotates) */}
            <g
              id="thimble"
              transform={`translate(${spindleWidthPx}, 0)`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="cursor-ns-resize group"
            >
              {/* Beveled Collar Edge */}
              <path
                d="M350 120 L370 115 L370 185 L350 180 Z"
                fill="url(#thimbleChrome)"
                stroke="#475569"
                strokeWidth="1.2"
              />

              {/* Circular Scale Markings on Bevel */}
              {Array.from({ length: 11 }).map((_, i) => {
                const relativeIndex = (calc.csr - 5 + i + circularDivisions) % circularDivisions;
                const y = 150 + (i - 5) * 5.5;
                const isDatumCoincident = relativeIndex === calc.csr;

                return (
                  <g key={`thimble-mark-${i}`}>
                    <line
                      x1={350}
                      y1={y}
                      x2={365}
                      y2={y}
                      stroke={isDatumCoincident ? '#8064E8' : '#0F172A'}
                      strokeWidth={isDatumCoincident ? 2.5 : 0.8}
                    />
                    {relativeIndex % 5 === 0 && (
                      <text
                        x={368}
                        y={y + 3}
                        fontSize="8"
                        fontFamily="monospace"
                        fontWeight="bold"
                        fill={isDatumCoincident ? '#8064E8' : '#334155'}
                      >
                        {relativeIndex}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Thimble Knurled Body */}
              <rect x="370" y="115" width="130" height="70" rx="2" fill="url(#thimbleChrome)" stroke="#475569" strokeWidth="1.2" />
              {/* Knurl Lines */}
              {Array.from({ length: 22 }).map((_, i) => (
                <line
                  key={`knurl-${i}`}
                  x1={385 + i * 5}
                  y1={118}
                  x2={385 + i * 5}
                  y2={182}
                  stroke="#94A3B8"
                  strokeWidth="1.2"
                  opacity="0.7"
                />
              ))}

              {/* Ratchet Stop Knob */}
              <g onClick={handleRatchetClick} className="cursor-pointer hover:opacity-90 transition-opacity">
                <rect x="500" y="130" width="45" height="40" rx="3" fill="#1E293B" stroke="#0F172A" strokeWidth="1" />
                <line x1="510" y1="130" x2="510" y2="170" stroke="#64748B" strokeWidth="1" />
                <line x1="520" y1="130" x2="520" y2="170" stroke="#64748B" strokeWidth="1" />
                <line x1="530" y1="130" x2="530" y2="170" stroke="#64748B" strokeWidth="1" />
              </g>
            </g>
          </svg>
        </div>

        {/* Digital LCD Mode Display overlay (if mode === 'digital') */}
        {mode === 'digital' && (
          <div className="absolute top-6 left-12 px-6 py-3 rounded-2xl bg-slate-900 border-2 border-slate-700 shadow-2xl flex items-center gap-4 animate-in fade-in">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">DIGITAL MICROMETER LCD</span>
              <span className="font-mono text-3xl font-black text-cyan-400 tracking-wider">
                {calc.finalReading.toFixed(3)} <span className="text-sm font-sans text-cyan-200">mm</span>
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 font-mono">ABS / ZERO</span>
              <span className="text-[9px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">LC: 0.001mm</span>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={handleRatchetClick}
            className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 flex items-center gap-2 shadow-sm transition-all"
          >
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <span>Turn Ratchet (+0.01 mm)</span>
          </button>
          <span className="text-xs text-[#8E9CAE]">
            💡 Drag thimble vertically to rotate and move spindle. Circular reading line glows <span className="font-bold text-[#8064E8]">violet</span>.
          </span>
        </div>
      </div>

      {/* Reading & Analysis Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step-by-Step Breakdown (8 Cols) */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white border border-[#DCE5F2] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#8064E8]" />
              <h3 className="font-bold text-sm text-[#1D2940]">Micrometer Reading Analysis</h3>
            </div>
            <button
              onClick={handleCopy}
              className="text-xs font-semibold text-[#8064E8] hover:text-[#4385E8] flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Reading</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100">
              <span className="text-[10px] text-slate-500 font-semibold">1. Main Scale (MSR)</span>
              <div className="text-lg font-mono font-extrabold text-[#8064E8] mt-0.5">
                {calc.msr.toFixed(2)} <span className="text-xs font-sans">mm</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100">
              <span className="text-[10px] text-slate-500 font-semibold">2. Circular Scale (CSR)</span>
              <div className="text-lg font-mono font-extrabold text-[#4385E8] mt-0.5">
                {calc.csr} <span className="text-xs font-sans">div</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-500 font-semibold">3. Least Count (LC)</span>
              <div className="text-lg font-mono font-bold text-slate-700 mt-0.5">
                {calc.leastCount.toFixed(3)} <span className="text-xs font-sans">mm</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100">
              <span className="text-[10px] text-slate-500 font-semibold">4. Zero Correction</span>
              <div className="text-lg font-mono font-bold text-emerald-600 mt-0.5">
                {calc.zeroCorrection >= 0 ? `+${calc.zeroCorrection.toFixed(3)}` : calc.zeroCorrection.toFixed(3)} mm
              </div>
            </div>
          </div>

          {/* Formula summary */}
          <div className="p-4 rounded-2xl bg-[#F8FAFF] border border-[#DCE5F2] flex items-center justify-between">
            <div className="text-xs text-slate-600 font-mono">
              Final = MSR + (CSR &times; LC) + Zero Correction = {calc.msr} + ({calc.csr} &times; {calc.leastCount}) + ({calc.zeroCorrection})
            </div>
            <div className="text-xl font-mono font-black text-[#1D2940]">
              = {calc.finalReading.toFixed(3)} mm
            </div>
          </div>
        </div>

        {/* Configuration or Quiz (4 Cols) */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white border border-[#DCE5F2] shadow-sm flex flex-col justify-between">
          {mode === 'quiz' ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-xs text-[#8064E8] flex items-center gap-1.5">
                  <Award className="w-4 h-4" /> Screw Gauge Quiz
                </span>
                <span className="text-xs font-mono font-bold text-slate-700">
                  Score: {quizScore.correct}/{quizScore.total}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Inspect sleeve and circular scale above and type reading in mm:
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={userQuizAnswer}
                  onChange={(e) => setUserQuizAnswer(e.target.value)}
                  placeholder="e.g. 7.35"
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
                <Sliders className="w-4 h-4 text-[#8064E8]" />
                <h3 className="font-bold text-xs text-[#1D2940]">Micrometer Configuration</h3>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 font-medium">Thread Pitch:</span>
                <select
                  value={pitchMm}
                  onChange={(e) => setPitchMm(Number(e.target.value))}
                  className="w-full mt-1 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#1D2940] outline-none"
                >
                  <option value={0.5}>0.5 mm Pitch (Standard)</option>
                  <option value={1.0}>1.0 mm Pitch</option>
                </select>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 font-medium">Circular Divisions:</span>
                <select
                  value={circularDivisions}
                  onChange={(e) => setCircularDivisions(Number(e.target.value))}
                  className="w-full mt-1 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#1D2940] outline-none"
                >
                  <option value={50}>50 Divisions (LC = 0.01 mm)</option>
                  <option value={100}>100 Divisions (LC = 0.005 mm)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Zero Error:</span>
                  <span className="font-mono font-bold">{zeroErrorMm.toFixed(3)} mm</span>
                </div>
                <input
                  type="range"
                  min="-0.05"
                  max="0.05"
                  step="0.005"
                  value={zeroErrorMm}
                  onChange={(e) => setZeroErrorMm(Number(e.target.value))}
                  className="w-full mt-1 accent-[#8064E8]"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

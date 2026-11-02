import React, { useState, useRef, useEffect } from 'react';
import { useHistoryStore } from '../../stores/historyStore';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import { soundEffects } from '../../utils/soundEffects';
import {
  Gauge,
  RotateCcw,
  Copy,
  Sliders,
  Tv,
  BookOpen,
  Activity,
  Play,
  Square,
  CheckCircle2,
} from 'lucide-react';

export const DialIndicatorView: React.FC = () => {
  const { addItem } = useHistoryStore();
  const { showToast } = useAppStore();
  const { requireAuth } = useAuthStore();

  const [plungerDisplacementMm, setPlungerDisplacementMm] = useState<number>(2.45); // 0 to 10 mm
  const [bezelZeroOffsetDeg, setBezelZeroOffsetDeg] = useState<number>(0);
  const [inspectionMode, setInspectionMode] = useState<'shaft-runout' | 'surface-flatness' | 'manual'>('shaft-runout');
  const [isRotatingShaft, setIsRotatingShaft] = useState<boolean>(false);
  const [shaftAngleDeg, setShaftAngleDeg] = useState<number>(0);
  const [digitalMode, setDigitalMode] = useState<boolean>(false);

  // Statistics for Total Indicator Reading (TIR)
  const [minReading, setMinReading] = useState<number>(2.45);
  const [maxReading, setMaxReading] = useState<number>(2.45);

  const animFrameRef = useRef<number | null>(null);

  // Dial calculations:
  // 1 full turn (360 deg) = 1.00 mm (100 divisions, 0.01 mm per div)
  const divisionValueMm = 0.01;
  const mmWithinTurn = plungerDisplacementMm % 1.0;
  const fullTurns = Math.floor(plungerDisplacementMm);
  const rawNeedleAngleDeg = (mmWithinTurn / 1.0) * 360;
  const needleAngleDeg = (rawNeedleAngleDeg - bezelZeroOffsetDeg + 360) % 360;
  const smallNeedleAngleDeg = (plungerDisplacementMm / 10.0) * 360;

  // Animate rotating eccentric shaft
  useEffect(() => {
    if (isRotatingShaft && inspectionMode === 'shaft-runout') {
      const step = () => {
        setShaftAngleDeg((prev) => {
          const next = (prev + 3) % 360;
          // Sinusoidal cam eccentricity: base 2.50mm +/- 0.08mm runout
          const rad = (next * Math.PI) / 180;
          const newDisp = 2.50 + Math.sin(rad) * 0.08 + Math.sin(rad * 2) * 0.02;
          const rounded = Number(newDisp.toFixed(3));
          setPlungerDisplacementMm(rounded);

          setMinReading((currMin) => Math.min(currMin, rounded));
          setMaxReading((currMax) => Math.max(currMax, rounded));
          return next;
        });
        animFrameRef.current = requestAnimationFrame(step);
      };
      animFrameRef.current = requestAnimationFrame(step);
    } else {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRotatingShaft, inspectionMode]);

  const handleZeroBezel = () => {
    setBezelZeroOffsetDeg(rawNeedleAngleDeg);
    setMinReading(plungerDisplacementMm);
    setMaxReading(plungerDisplacementMm);
    soundEffects.playRatchetClick();
    showToast('Dial bezel zeroed to current position', 'info');
  };

  const handleCopy = () => {
    const formatted = `${plungerDisplacementMm.toFixed(3)} mm (TIR: ${(maxReading - minReading).toFixed(3)} mm)`;
    navigator.clipboard.writeText(formatted);
    requireAuth('log measurement to history', () => {
      addItem({
        tool: 'Dial Indicator',
        title: 'Runout & Deflection Inspection',
        value: `${plungerDisplacementMm.toFixed(3)} mm`,
        rawNumericValue: plungerDisplacementMm,
        unit: 'mm',
        details: `TIR: ${(maxReading - minReading).toFixed(3)} mm | Mode: ${inspectionMode}`,
      });
      showToast(`Logged ${formatted} to Measurement History!`, 'success');
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 pb-12 select-none">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-white/90 border border-[#DCE5F2] shadow-glass flex flex-wrap items-center justify-between gap-4 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-xl bg-cyan-100 text-[#0284C7] font-bold text-xs">LAB-04</span>
            <h1 className="text-xl font-extrabold text-[#1D2940]">Dial Test Indicator (DTI) Simulator</h1>
          </div>
          <p className="text-xs text-[#66758D]">
            0.01 mm plunger metrology instrument for runout, parallelism, flatness, and cam eccentricity inspection.
          </p>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZeroBezel}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#EEF3FF] text-[#4385E8] hover:bg-[#DCE5F2] border border-[#DCE5F2] transition-all"
          >
            Zero Bezel
          </button>

          <button
            onClick={() => setDigitalMode(!digitalMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              digitalMode ? 'bg-slate-900 text-cyan-400 shadow-sm' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {digitalMode ? 'Digital DTI' : 'Analog Dial'}
          </button>
        </div>
      </div>

      {/* Inspection Mode Tabs */}
      <div className="p-4 rounded-2xl bg-white/80 border border-[#DCE5F2] shadow-sm flex flex-wrap items-center justify-between gap-3 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#4385E8]" />
          <span className="text-xs font-bold text-[#1D2940]">Inspection Test Bench:</span>
        </div>
        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => {
              setInspectionMode('shaft-runout');
              setIsRotatingShaft(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              inspectionMode === 'shaft-runout' ? 'bg-white text-[#4385E8] shadow-sm' : 'text-slate-600'
            }`}
          >
            Shaft Eccentricity Runout (TIR)
          </button>
          <button
            onClick={() => {
              setInspectionMode('surface-flatness');
              setIsRotatingShaft(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              inspectionMode === 'surface-flatness' ? 'bg-white text-[#4385E8] shadow-sm' : 'text-slate-600'
            }`}
          >
            Surface Flatness Profile
          </button>
          <button
            onClick={() => {
              setInspectionMode('manual');
              setIsRotatingShaft(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              inspectionMode === 'manual' ? 'bg-white text-[#4385E8] shadow-sm' : 'text-slate-600'
            }`}
          >
            Manual Plunger Push
          </button>
        </div>
      </div>

      {/* Main Interactive DTI Stage */}
      <div className="relative w-full overflow-x-auto p-8 rounded-3xl bg-gradient-to-b from-white/95 to-[#F1F5FB] border border-white shadow-xl flex flex-col items-center justify-center min-h-[460px]">
        <div className="relative w-[780px] h-[400px]">
          <svg viewBox="0 0 780 400" className="w-full h-full filter drop-shadow-md">
            <defs>
              <linearGradient id="bezelRing" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#CBD5E1" />
                <stop offset="30%" stopColor="#F8FAFC" />
                <stop offset="70%" stopColor="#94A3B8" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>

              <linearGradient id="dialFace" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#F1F5F9" />
              </linearGradient>
            </defs>

            {/* DTI Body Top Lug mount */}
            <rect x="285" y="10" width="30" height="25" rx="3" fill="#64748B" stroke="#334155" strokeWidth="1" />
            <circle cx="300" cy="22" r="6" fill="#0F172A" />

            {/* Plunger Stem Collar & Lower Bushing */}
            <rect x="294" y="240" width="12" height="40" fill="#94A3B8" stroke="#475569" strokeWidth="1" />
            {/* Movable Spring Loaded Stylus Plunger extending downward */}
            {/* Bottom contact at y = 280 + plungerDisplacementMm * 6 */}
            <rect
              x="297"
              y="260"
              width="6"
              height={50 + plungerDisplacementMm * 8}
              fill="#CBD5E1"
              stroke="#334155"
              strokeWidth="1"
            />
            {/* Carbide Ball Contact Tip */}
            <circle cx="300" cy={310 + plungerDisplacementMm * 8} r="5" fill="#1E293B" stroke="#475569" strokeWidth="1" />

            {/* Workpiece Target below stylus */}
            {inspectionMode === 'shaft-runout' && (
              <g transform="translate(300, 375)">
                {/* Rotating Shaft with Eccentric Axis */}
                <ellipse
                  cx="0"
                  cy="0"
                  rx="48"
                  ry="42"
                  transform={`rotate(${shaftAngleDeg} 0 0)`}
                  fill="#475569"
                  stroke="#1E293B"
                  strokeWidth="2"
                />
                <circle cx="0" cy="0" r="14" fill="#0F172A" />
                <circle cx="0" cy="0" r="4" fill="#38BDF8" />
                <text x="0" y="4" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">SHAFT</text>
              </g>
            )}

            {inspectionMode === 'surface-flatness' && (
              <g transform="translate(180, 360)">
                <rect x="0" y="0" width="240" height="30" rx="3" fill="#475569" stroke="#1E293B" strokeWidth="1.5" />
                <path d="M 0 0 Q 60 -4 120 2 T 240 0" stroke="#38BDF8" strokeWidth="2" fill="none" />
                <text x="120" y="20" textAnchor="middle" fill="#CBD5E1" fontSize="10" fontWeight="bold">SURFACE TEST SPECIMEN</text>
              </g>
            )}

            {/* Circular Dial Housing & Bezel */}
            <g transform="translate(300, 130)">
              {/* Outer Bezel Rim with Knurled Teeth */}
              <circle cx="0" cy="0" r="115" fill="url(#bezelRing)" stroke="#334155" strokeWidth="2" />
              {/* Dial Face */}
              <circle cx="0" cy="0" r="102" fill="url(#dialFace)" stroke="#CBD5E1" strokeWidth="1.5" />

              {/* Brand and Graduation text */}
              <text x="0" y="-45" textAnchor="middle" fill="#1E293B" fontSize="10" fontWeight="bold" fontFamily="monospace">
                MEASUREX DTI
              </text>
              <text x="0" y="-32" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="bold" fontFamily="monospace">
                0.01 mm | 0 - 10 mm
              </text>

              {/* 100 Dial Graduation Marks */}
              {Array.from({ length: 100 }).map((_, i) => {
                const angle = (i / 100) * 360;
                const isMajor = i % 10 === 0;
                const isMid = i % 5 === 0;
                const len = isMajor ? 12 : isMid ? 8 : 5;
                const rad = (angle * Math.PI) / 180;
                const x1 = Math.sin(rad) * 98;
                const y1 = -Math.cos(rad) * 98;
                const x2 = Math.sin(rad) * (98 - len);
                const y2 = -Math.cos(rad) * (98 - len);
                const textX = Math.sin(rad) * 76;
                const textY = -Math.cos(rad) * 76 + 3;

                return (
                  <g key={`grad-${i}`}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1E293B" strokeWidth={isMajor ? 1.5 : 0.7} />
                    {isMajor && (
                      <text x={textX} y={textY} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0F172A" fontFamily="monospace">
                        {i}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Small Revolution Counter Sub-Dial (0 to 10 mm) */}
              <g transform="translate(0, 35)">
                <circle cx="0" cy="0" r="24" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1" />
                {Array.from({ length: 10 }).map((_, i) => {
                  const ang = (i / 10) * 360;
                  const rad = (ang * Math.PI) / 180;
                  return (
                    <text
                      key={`rev-${i}`}
                      x={Math.sin(rad) * 16}
                      y={-Math.cos(rad) * 16 + 2.5}
                      textAnchor="middle"
                      fontSize="6"
                      fontWeight="bold"
                      fill="#475569"
                    >
                      {i}
                    </text>
                  );
                })}
                {/* Revolution Sub-Needle */}
                <line
                  x1="0"
                  y1="0"
                  x2={Math.sin((smallNeedleAngleDeg * Math.PI) / 180) * 14}
                  y2={-Math.cos((smallNeedleAngleDeg * Math.PI) / 180) * 14}
                  stroke="#E11D48"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle cx="0" cy="0" r="2" fill="#E11D48" />
              </g>

              {/* Main Needle Pointer (deflecting with plunger displacement) */}
              <g transform={`rotate(${needleAngleDeg} 0 0)`}>
                {/* Needle Blade */}
                <line x1="0" y1="18" x2="0" y2="-94" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" />
                <polygon points="0,-98 -3,-86 3,-86" fill="#DC2626" />
                {/* Counterweight Tail */}
                <circle cx="0" cy="12" r="4" fill="#DC2626" />
                {/* Center Brass Cap */}
                <circle cx="0" cy="0" r="5" fill="#D97706" stroke="#B45309" strokeWidth="1" />
              </g>
            </g>

            {/* TIR Statistics Panel on Right */}
            <g transform="translate(480, 50)">
              <rect x="0" y="0" width="240" height="150" rx="10" fill="#0F172A" stroke="#1E293B" strokeWidth="1.5" />
              <text x="16" y="26" fill="#38BDF8" fontSize="11" fontWeight="bold" fontFamily="monospace">
                METROLOGY TOLERANCE / TIR
              </text>
              <line x1="16" y1="36" x2="224" y2="36" stroke="#334155" strokeWidth="1" />

              <text x="16" y="60" fill="#94A3B8" fontSize="10">Displacement:</text>
              <text x="224" y="60" textAnchor="end" fill="white" fontSize="12" fontWeight="bold" fontFamily="monospace">
                {plungerDisplacementMm.toFixed(3)} mm
              </text>

              <text x="16" y="85" fill="#94A3B8" fontSize="10">Minimum Reading:</text>
              <text x="224" y="85" textAnchor="end" fill="#38BDF8" fontSize="11" fontWeight="bold" fontFamily="monospace">
                {minReading.toFixed(3)} mm
              </text>

              <text x="16" y="110" fill="#94A3B8" fontSize="10">Maximum Reading:</text>
              <text x="224" y="110" textAnchor="end" fill="#F43F5E" fontSize="11" fontWeight="bold" fontFamily="monospace">
                {maxReading.toFixed(3)} mm
              </text>

              <text x="16" y="135" fill="#FBBF24" fontSize="10" fontWeight="bold">Total Indicator Runout (TIR):</text>
              <text x="224" y="135" textAnchor="end" fill="#FBBF24" fontSize="12" fontWeight="extrabold" fontFamily="monospace">
                {(maxReading - minReading).toFixed(3)} mm
              </text>
            </g>
          </svg>
        </div>

        {/* Digital Mode Overlay */}
        {digitalMode && (
          <div className="absolute top-6 left-12 px-6 py-3 rounded-2xl bg-slate-900 border-2 border-slate-700 shadow-2xl flex items-center gap-4 animate-in fade-in">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">DIGITAL DTI LCD</span>
              <span className="font-mono text-3xl font-black text-cyan-400 tracking-wider">
                {plungerDisplacementMm.toFixed(3)} <span className="text-sm font-sans text-cyan-200">mm</span>
              </span>
            </div>
            <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 font-mono">0.001 mm RES</span>
          </div>
        )}

        {/* Action Controls for Shaft Rotation */}
        {inspectionMode === 'shaft-runout' && (
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => {
                setIsRotatingShaft(!isRotatingShaft);
                soundEffects.playRatchetClick();
              }}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                isRotatingShaft
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-gradient-to-r from-[#4385E8] to-[#8064E8] text-white shadow-md'
              }`}
            >
              {isRotatingShaft ? <Square className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white" />}
              <span>{isRotatingShaft ? 'Stop Shaft Rotation' : 'Spin Eccentric Shaft'}</span>
            </button>

            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Log TIR Reading</span>
            </button>
          </div>
        )}

        {inspectionMode === 'manual' && (
          <div className="mt-4 w-72 flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">Plunger:</span>
            <input
              type="range"
              min="0"
              max="10"
              step="0.01"
              value={plungerDisplacementMm}
              onChange={(e) => {
                const val = Number(e.target.value);
                setPlungerDisplacementMm(val);
                setMinReading((m) => Math.min(m, val));
                setMaxReading((m) => Math.max(m, val));
                soundEffects.playSliderTick();
              }}
              className="flex-1 accent-[#4385E8]"
            />
            <span className="font-mono text-xs font-bold text-slate-800 w-16 text-right">
              {plungerDisplacementMm.toFixed(2)} mm
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

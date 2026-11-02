import React, { useState, useRef } from 'react';
import { useHistoryStore } from '../../stores/historyStore';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import { soundEffects } from '../../utils/soundEffects';
import {
  Compass,
  RotateCcw,
  Copy,
  Sliders,
  CheckCircle2,
  Package,
  Layers,
  ArrowRight,
  Plus,
  Minus,
} from 'lucide-react';

const PRESET_ANGLES = [0, 30, 45, 60, 90, 120, 135, 180, 270];

const MITER_SPECIMENS = [
  { id: 'none', name: 'Free Angular Sweep', angleDeg: 0 },
  { id: 'miter45', name: 'Miter Joint Block (45.0°)', angleDeg: 45.0 },
  { id: 'hex60', name: 'Hexagonal Prism Face (60.0°)', angleDeg: 60.0 },
  { id: 'octa22', name: 'Octagonal Bevel (22.5°)', angleDeg: 22.5 },
  { id: 'right90', name: 'Precision Square Block (90.0°)', angleDeg: 90.0 },
];

export const DigitalProtractorView: React.FC = () => {
  const { addItem } = useHistoryStore();
  const { showToast } = useAppStore();
  const { requireAuth } = useAuthStore();

  const [angleDeg, setAngleDeg] = useState<number>(45.0);
  const [selectedSpecimen, setSelectedSpecimen] = useState<string>('none');
  const [isLocked, setIsLocked] = useState<boolean>(false);

  const isDraggingRef = useRef<boolean>(false);
  const centerPoint = { x: 300, y: 220 };

  // Angle conversions
  const rad = (angleDeg * Math.PI) / 180;
  const radians = rad;
  const degrees = Math.floor(angleDeg);
  const minutes = Math.round((angleDeg - degrees) * 60);
  const gradians = (angleDeg * 200) / 180;
  const supplementaryDeg = Math.max(0, 180 - angleDeg);
  const complementaryDeg = angleDeg <= 90 ? 90 - angleDeg : 0;

  // Pointer drag to rotate protractor blade
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isLocked) {
      showToast('Protractor blade locked. Unlock to rotate.', 'warning');
      return;
    }
    isDraggingRef.current = true;
    updateAngleFromPointer(e);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || isLocked) return;
    updateAngleFromPointer(e);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  };

  const updateAngleFromPointer = (e: React.PointerEvent) => {
    const svg = e.currentTarget.closest('svg');
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left - centerPoint.x;
    const y = e.clientY - rect.top - centerPoint.y;

    // Angle relative to positive X-axis (clockwise downwards in screen coordinates)
    let deg = (Math.atan2(y, x) * 180) / Math.PI;
    if (deg < 0) deg += 360;
    // Map counter-clockwise from horizontal right base:
    deg = (360 - deg) % 360;
    setAngleDeg(Number(deg.toFixed(1)));
    soundEffects.playSliderTick();
  };

  const handleSelectSpecimen = (id: string) => {
    setSelectedSpecimen(id);
    const spec = MITER_SPECIMENS.find((s) => s.id === id);
    if (spec && spec.angleDeg > 0) {
      setAngleDeg(spec.angleDeg);
      soundEffects.playRatchetClick();
      showToast(`Specimen clamped: ${spec.name}`, 'success');
    }
  };

  const handleCopy = () => {
    const formatted = `${angleDeg.toFixed(1)}° (${degrees}° ${minutes}', ${radians.toFixed(4)} rad)`;
    navigator.clipboard.writeText(formatted);
    requireAuth('log angle to measurement history', () => {
      addItem({
        tool: 'Digital Protractor',
        title: `Angle Measurement (${angleDeg.toFixed(1)}°)`,
        value: `${angleDeg.toFixed(1)}°`,
        rawNumericValue: angleDeg,
        unit: '°',
        details: `${degrees}° ${minutes}' | ${radians.toFixed(4)} rad | ${gradians.toFixed(2)} grad`,
      });
      showToast(`Logged ${angleDeg.toFixed(1)}° to Measurement History!`, 'success');
    });
  };

  // Blade line endpoints
  const bladeRadius = 180;
  const bladeEndX = centerPoint.x + Math.cos(-rad) * bladeRadius;
  const bladeEndY = centerPoint.y + Math.sin(-rad) * bladeRadius;

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 pb-12 select-none">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-white/90 border border-[#DCE5F2] shadow-glass flex flex-wrap items-center justify-between gap-4 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-xl bg-emerald-100 text-[#16A078] font-bold text-xs">LAB-06</span>
            <h1 className="text-xl font-extrabold text-[#1D2940]">Digital Angle Protractor Lab</h1>
          </div>
          <p className="text-xs text-[#66758D]">
            Precision 360° circular rotary bevel protractor with dual DMS/Radian LCD readout and miter workpiece inspection.
          </p>
        </div>

        {/* Lock & Reset Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsLocked(!isLocked);
              soundEffects.playLockSnap(!isLocked);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              isLocked ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {isLocked ? '🔒 Blade Locked' : '🔓 Blade Unlocked'}
          </button>

          <button
            onClick={() => {
              setAngleDeg(0);
              setSelectedSpecimen('none');
            }}
            title="Reset Angle to 0°"
            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preset Angles Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#DCE5F2] shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#1D2940]">Standard Angle Presets:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {PRESET_ANGLES.map((p) => (
            <button
              key={p}
              onClick={() => {
                setAngleDeg(p);
                soundEffects.playSliderTick();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                Math.round(angleDeg) === p
                  ? 'bg-gradient-to-r from-emerald-500 to-[#16A078] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p}°
            </button>
          ))}
        </div>
      </div>

      {/* Workpiece Specimen Bar */}
      <div className="p-4 rounded-2xl bg-white/80 border border-[#DCE5F2] shadow-sm flex flex-wrap items-center justify-between gap-3 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-[#1D2940]">Inspect Angle Workpieces:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {MITER_SPECIMENS.map((spec) => (
            <button
              key={spec.id}
              onClick={() => handleSelectSpecimen(spec.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedSpecimen === spec.id
                  ? 'bg-gradient-to-r from-[#4385E8] to-[#8064E8] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {spec.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Protractor SVG Canvas */}
      <div className="relative w-full overflow-x-auto p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col items-center justify-center min-h-[480px]">
        <div className="relative w-[780px] h-[440px]">
          <svg
            viewBox="0 0 780 440"
            className="w-full h-full cursor-crosshair"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <defs>
              <linearGradient id="protractorSteel" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#CBD5E1" />
                <stop offset="30%" stopColor="#F8FAFC" />
                <stop offset="70%" stopColor="#94A3B8" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>

              <linearGradient id="acrylicBlade" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#0284C7" stopOpacity="0.6" />
              </linearGradient>
            </defs>

            {/* Background Grid */}
            <rect width="780" height="440" fill="#0B132B" />

            {/* Workpiece Wedge on Base Plate */}
            {selectedSpecimen !== 'none' && (
              <g transform={`translate(${centerPoint.x}, ${centerPoint.y})`}>
                <path
                  d={`M 0 0 L 150 0 L ${Math.cos(-rad) * 150} ${Math.sin(-rad) * 150} Z`}
                  fill="#1E293B"
                  stroke="#38BDF8"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
                <text x="70" y="-12" fill="#38BDF8" fontSize="10" fontWeight="bold" fontFamily="monospace">
                  WORKPIECE WEDGE
                </text>
              </g>
            )}

            {/* Horizontal Fixed Base Reference Line */}
            <line x1="80" y1={centerPoint.y} x2="520" y2={centerPoint.y} stroke="#64748B" strokeWidth="2" />
            <text x="510" y={centerPoint.y + 15} fill="#94A3B8" fontSize="9" fontWeight="bold">0° BASE DATUM</text>

            {/* Circular Protractor Dial Body */}
            <g transform={`translate(${centerPoint.x}, ${centerPoint.y})`}>
              {/* Outer Stainless Steel Bezel */}
              <circle cx="0" cy="0" r="150" fill="url(#protractorSteel)" stroke="#334155" strokeWidth="2" />
              <circle cx="0" cy="0" r="140" fill="#0F172A" />

              {/* Angle Graduation Lines (every 5° and 10°) */}
              {Array.from({ length: 72 }).map((_, i) => {
                const deg = i * 5;
                const isMajor = deg % 30 === 0;
                const isMid = deg % 10 === 0;
                const len = isMajor ? 14 : isMid ? 9 : 5;
                const aRad = (-deg * Math.PI) / 180;
                const x1 = Math.cos(aRad) * 138;
                const y1 = Math.sin(aRad) * 138;
                const x2 = Math.cos(aRad) * (138 - len);
                const y2 = Math.sin(aRad) * (138 - len);
                const tx = Math.cos(aRad) * 112;
                const ty = Math.sin(aRad) * 112 + 3;

                return (
                  <g key={`deg-${deg}`}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#CBD5E1" strokeWidth={isMajor ? 1.5 : 0.8} />
                    {isMajor && (
                      <text x={tx} y={ty} textAnchor="middle" fontSize="8" fontWeight="bold" fill="#38BDF8" fontFamily="monospace">
                        {deg}°
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Shaded Angle Sector Arc */}
              <path
                d={`M 0 0 L 138 0 A 138 138 0 ${angleDeg > 180 ? 1 : 0} 0 ${Math.cos(-rad) * 138} ${Math.sin(-rad) * 138} Z`}
                fill="#10B981"
                fillOpacity="0.15"
              />
            </g>

            {/* Rotating Acrylic Ruler Blade (Draggable) */}
            <g id="protractor-blade">
              {/* Transparent Blade */}
              <line
                x1={centerPoint.x}
                y1={centerPoint.y}
                x2={bladeEndX}
                y2={bladeEndY}
                stroke="#10B981"
                strokeWidth="4"
                strokeLinecap="round"
              />
              {/* Blade Ticks */}
              {Array.from({ length: 18 }).map((_, i) => {
                const dist = i * 10;
                const tx = centerPoint.x + Math.cos(-rad) * dist;
                const ty = centerPoint.y + Math.sin(-rad) * dist;
                return (
                  <circle key={i} cx={tx} cy={ty} r="1" fill="white" opacity="0.6" />
                );
              })}
              {/* Blade Tip Arrow Pointer */}
              <circle cx={bladeEndX} cy={bladeEndY} r="6" fill="#10B981" className="animate-pulse" />
            </g>

            {/* Center Locking Pivot Thumbscrew */}
            <circle cx={centerPoint.x} cy={centerPoint.y} r="16" fill="#D97706" stroke="#78350F" strokeWidth="2" />
            <circle cx={centerPoint.x} cy={centerPoint.y} r="6" fill="#0F172A" />

            {/* Digital Readout Panel on Right */}
            <g transform="translate(520, 50)">
              <rect x="0" y="0" width="230" height="230" rx="14" fill="#0F172A" stroke="#1E293B" strokeWidth="1.5" />
              <text x="16" y="26" fill="#10B981" fontSize="11" fontWeight="bold" fontFamily="monospace">
                DIGITAL ANGLE READOUT
              </text>
              <line x1="16" y1="36" x2="214" y2="36" stroke="#334155" strokeWidth="1" />

              {/* Large Digital Degrees */}
              <text x="16" y="68" fill="#10B981" fontSize="28" fontWeight="extrabold" fontFamily="monospace">
                {angleDeg.toFixed(1)}°
              </text>

              <text x="16" y="100" fill="#94A3B8" fontSize="10">DMS Notation:</text>
              <text x="214" y="100" textAnchor="end" fill="white" fontSize="11" fontWeight="bold" fontFamily="monospace">
                {degrees}° {minutes}' 00"
              </text>

              <text x="16" y="125" fill="#94A3B8" fontSize="10">Radians:</text>
              <text x="214" y="125" textAnchor="end" fill="#38BDF8" fontSize="11" fontWeight="bold" fontFamily="monospace">
                {radians.toFixed(4)} rad
              </text>

              <text x="16" y="150" fill="#94A3B8" fontSize="10">Gradians:</text>
              <text x="214" y="150" textAnchor="end" fill="#FBBF24" fontSize="11" fontWeight="bold" fontFamily="monospace">
                {gradians.toFixed(2)} grad
              </text>

              <text x="16" y="175" fill="#94A3B8" fontSize="10">Supplementary (180°-θ):</text>
              <text x="214" y="175" textAnchor="end" fill="#CBD5E1" fontSize="11" fontWeight="bold" fontFamily="monospace">
                {supplementaryDeg.toFixed(1)}°
              </text>

              <text x="16" y="200" fill="#94A3B8" fontSize="10">Complementary (90°-θ):</text>
              <text x="214" y="200" textAnchor="end" fill="#CBD5E1" fontSize="11" fontWeight="bold" fontFamily="monospace">
                {complementaryDeg.toFixed(1)}°
              </text>
            </g>
          </svg>
        </div>

        {/* Fine Adjustment Controls */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => {
                setAngleDeg((prev) => Math.max(0, Number((prev - 0.1).toFixed(1))));
                soundEffects.playSliderTick();
              }}
              className="p-1.5 rounded-lg bg-slate-700 text-white hover:bg-slate-600"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-xs font-bold text-cyan-400 w-16 text-center">
              ±0.1° Fine
            </span>
            <button
              onClick={() => {
                setAngleDeg((prev) => Math.min(360, Number((prev + 0.1).toFixed(1))));
                soundEffects.playSliderTick();
              }}
              className="p-1.5 rounded-lg bg-slate-700 text-white hover:bg-slate-600"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-[#16A078] text-white text-xs font-bold shadow-md flex items-center gap-1.5 hover:scale-[1.02] transition-all"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Log Angle to History</span>
          </button>
        </div>
      </div>
    </div>
  );
};

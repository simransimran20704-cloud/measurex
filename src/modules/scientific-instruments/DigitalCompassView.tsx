import React, { useState, useRef, useEffect } from 'react';
import { useHistoryStore } from '../../stores/historyStore';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import { soundEffects } from '../../utils/soundEffects';
import { LengthUnit } from '../../types';
import {
  Compass,
  RotateCcw,
  Copy,
  Sliders,
  Play,
  RotateCw,
  Plus,
  Trash2,
  CheckCircle2,
  Disc,
} from 'lucide-react';

interface DrawnCircle {
  id: string;
  cx: number;
  cy: number;
  radiusMm: number;
  startAngleDeg: number;
  endAngleDeg: number;
  color: string;
}

export const DigitalCompassView: React.FC = () => {
  const { addItem } = useHistoryStore();
  const { showToast } = useAppStore();
  const { requireAuth } = useAuthStore();

  const [radiusMm, setRadiusMm] = useState<number>(50); // 50 mm default
  const [unit, setUnit] = useState<LengthUnit>('mm');
  const [drawnCircles, setDrawnCircles] = useState<DrawnCircle[]>([
    { id: 'c-1', cx: 300, cy: 220, radiusMm: 35, startAngleDeg: 0, endAngleDeg: 360, color: '#38BDF8' },
  ]);

  const [compassAngleDeg, setCompassAngleDeg] = useState<number>(45);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [sweepProgressDeg, setSweepProgressDeg] = useState<number>(360);

  const centerPoint = { x: 300, y: 220 };
  const pxPerMm = 1.8;
  const radiusPx = radiusMm * pxPerMm;

  // Real-time geometric formulas
  const diameterMm = radiusMm * 2;
  const circumferenceMm = 2 * Math.PI * radiusMm;
  const areaMm2 = Math.PI * radiusMm * radiusMm;

  // Execute animated circle drawing
  const handleSweepCircle = (targetDeg: number = 360) => {
    setIsDrawing(true);
    let current = 0;
    const interval = setInterval(() => {
      current += 10;
      setCompassAngleDeg(current % 360);
      setSweepProgressDeg(current);
      soundEffects.playSliderTick();

      if (current >= targetDeg) {
        clearInterval(interval);
        setIsDrawing(false);
        const newCircle: DrawnCircle = {
          id: `circ-${Date.now()}`,
          cx: centerPoint.x,
          cy: centerPoint.y,
          radiusMm,
          startAngleDeg: 0,
          endAngleDeg: targetDeg,
          color: '#4385E8',
        };
        setDrawnCircles((prev) => [...prev, newCircle]);
        soundEffects.playRatchetClick();
        showToast(`Drawn ${targetDeg}° circle (R = ${radiusMm} mm, ⌀ = ${diameterMm} mm)`, 'success');
      }
    }, 25);
  };

  const handleCopy = () => {
    const formatted = `Circle: R = ${radiusMm} mm (⌀ ${diameterMm} mm, Area: ${(areaMm2 / 100).toFixed(2)} cm²)`;
    navigator.clipboard.writeText(formatted);
    requireAuth('save circle measurement to history', () => {
      addItem({
        tool: 'Digital Compass',
        title: `Circle Geometry (R = ${radiusMm} mm)`,
        value: `⌀ ${diameterMm} mm`,
        rawNumericValue: diameterMm,
        unit: 'mm',
        details: `Circumference: ${circumferenceMm.toFixed(1)} mm | Area: ${(areaMm2 / 100).toFixed(2)} cm²`,
      });
      showToast('Logged circle dimensions to Measurement History!', 'success');
    });
  };

  // Compass legs geometry calculations
  const needleLeg = { x: centerPoint.x, y: centerPoint.y };
  const rad = (compassAngleDeg * Math.PI) / 180;
  const pencilTip = {
    x: centerPoint.x + Math.cos(rad) * radiusPx,
    y: centerPoint.y + Math.sin(rad) * radiusPx,
  };
  const topHinge = { x: (needleLeg.x + pencilTip.x) / 2, y: centerPoint.y - 140 };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 pb-12 select-none">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-white/90 border border-[#DCE5F2] shadow-glass flex flex-wrap items-center justify-between gap-4 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-xl bg-blue-100 text-[#4385E8] font-bold text-xs">LAB-05</span>
            <h1 className="text-xl font-extrabold text-[#1D2940]">Digital Drafting Compass Simulator</h1>
          </div>
          <p className="text-xs text-[#66758D]">
            Engineering mechanical compass: specify exact radius input, construct concentric pitch circles & calculate geometric areas.
          </p>
        </div>

        {/* Clear & Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDrawnCircles([])}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-1.5 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Paper</span>
          </button>

          <button
            onClick={() => {
              setRadiusMm(50);
              setCompassAngleDeg(45);
            }}
            title="Reset Compass"
            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Direct Numeric Input Bar */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#DCE5F2] shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#1D2940] flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-[#4385E8]" />
            <span>Set Compass Radius:</span>
          </span>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min="5"
              max="150"
              value={radiusMm}
              onChange={(e) => {
                const val = Math.max(5, Math.min(150, Number(e.target.value) || 5));
                setRadiusMm(val);
                soundEffects.playSliderTick();
              }}
              className="w-24 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-[#1D2940] outline-none focus:border-brand-blue"
            />
            <span className="text-xs font-bold text-slate-500">mm</span>
          </div>

          <input
            type="range"
            min="10"
            max="120"
            value={radiusMm}
            onChange={(e) => {
              setRadiusMm(Number(e.target.value));
              soundEffects.playSliderTick();
            }}
            className="w-44 accent-[#4385E8]"
          />
        </div>

        {/* Quick Sweep Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSweepCircle(360)}
            disabled={isDrawing}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#4385E8] to-[#8064E8] text-white text-xs font-bold shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Draw 360° Circle</span>
          </button>

          <button
            onClick={() => handleSweepCircle(180)}
            disabled={isDrawing}
            className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-all"
          >
            180° Semi-Circle
          </button>

          <button
            onClick={() => handleSweepCircle(90)}
            disabled={isDrawing}
            className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-all"
          >
            90° Arc
          </button>
        </div>
      </div>

      {/* Main Drafting Parchment Canvas */}
      <div className="relative w-full overflow-x-auto p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col items-center justify-center min-h-[360px] sm:min-h-[500px]">
        <div className="relative w-[780px] h-[440px]">
          <svg viewBox="0 0 780 440" className="w-full h-full">
            <defs>
              {/* Drafting Grid Pattern */}
              <pattern id="draftGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1E293B" strokeWidth="0.8" />
              </pattern>
              {/* Metallic Compass Gradient */}
              <linearGradient id="compassBrass" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDE68A" />
                <stop offset="50%" stopColor="#D97706" />
                <stop offset="100%" stopColor="#78350F" />
              </linearGradient>
              <linearGradient id="compassSteel" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="30%" stopColor="#E2E8F0" />
                <stop offset="70%" stopColor="#94A3B8" />
                <stop offset="100%" stopColor="#64748B" />
              </linearGradient>
            </defs>

            {/* Grid */}
            <rect width="780" height="440" fill="#0B132B" />
            <rect width="780" height="440" fill="url(#draftGrid)" />

            {/* Previously Committed Drawn Circles */}
            {drawnCircles.map((c) => {
              const r = c.radiusMm * pxPerMm;
              return (
                <g key={c.id}>
                  <circle
                    cx={c.cx}
                    cy={c.cy}
                    r={r}
                    fill="none"
                    stroke={c.color}
                    strokeWidth="2"
                    strokeDasharray={c.endAngleDeg < 360 ? '4 2' : 'none'}
                  />
                  {/* Radius dimension line with callout */}
                  <line x1={c.cx} y1={c.cy} x2={c.cx + r} y2={c.cy} stroke={c.color} strokeWidth="1" strokeDasharray="3 3" />
                  <text
                    x={c.cx + r / 2}
                    y={c.cy - 6}
                    textAnchor="middle"
                    fill={c.color}
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    R = {c.radiusMm}mm
                  </text>
                </g>
              );
            })}

            {/* Active Drawing Circle Arc */}
            {isDrawing && (
              <circle
                cx={centerPoint.x}
                cy={centerPoint.y}
                r={radiusPx}
                fill="none"
                stroke="#38BDF8"
                strokeWidth="2.5"
                strokeDasharray={`${(sweepProgressDeg / 360) * 2 * Math.PI * radiusPx} 1000`}
              />
            )}

            {/* Center Pivot Point Crosshair (+) */}
            <g transform={`translate(${centerPoint.x}, ${centerPoint.y})`}>
              <line x1="-15" y1="0" x2="15" y2="0" stroke="#F59E0B" strokeWidth="1.5" />
              <line x1="0" y1="-15" x2="0" y2="15" stroke="#F59E0B" strokeWidth="1.5" />
              <circle cx="0" cy="0" r="3" fill="#F59E0B" />
            </g>

            {/* 3D Realistic Engineering Compass Model */}
            <g id="compass-instrument">
              {/* Top Knurled Handle Knob */}
              <rect x={topHinge.x - 5} y={topHinge.y - 35} width="10" height="25" rx="2" fill="url(#compassBrass)" stroke="#78350F" strokeWidth="0.8" />
              {/* Main Hinge Joint */}
              <circle cx={topHinge.x} cy={topHinge.y} r="10" fill="url(#compassBrass)" stroke="#78350F" strokeWidth="1.2" />
              <circle cx={topHinge.x} cy={topHinge.y} r="4" fill="#0F172A" />

              {/* Central Adjustment Spindle Screw */}
              <g transform={`translate(${topHinge.x}, ${topHinge.y + 60})`}>
                <line x1="-35" y1="0" x2="35" y2="0" stroke="#94A3B8" strokeWidth="2.5" />
                <circle cx="0" cy="0" r="8" fill="url(#compassBrass)" stroke="#78350F" strokeWidth="1" />
              </g>

              {/* Leg 1: Needle Pivot Leg (leads to centerPoint) */}
              <line
                x1={topHinge.x - 3}
                y1={topHinge.y + 5}
                x2={needleLeg.x}
                y2={needleLeg.y}
                stroke="url(#compassSteel)"
                strokeWidth="5"
                strokeLinecap="round"
              />
              {/* Sharp Hardened Steel Needle Tip */}
              <polygon
                points={`${needleLeg.x},${needleLeg.y} ${needleLeg.x - 2},${needleLeg.y - 12} ${needleLeg.x + 2},${needleLeg.y - 12}`}
                fill="#F59E0B"
              />

              {/* Leg 2: Pencil / Pen Lead Leg (leads to pencilTip) */}
              <line
                x1={topHinge.x + 3}
                y1={topHinge.y + 5}
                x2={pencilTip.x}
                y2={pencilTip.y}
                stroke="url(#compassSteel)"
                strokeWidth="5"
                strokeLinecap="round"
              />
              {/* Pencil Lead Chuck Collar */}
              <rect
                x={pencilTip.x - 3}
                y={pencilTip.y - 14}
                width="6"
                height="10"
                fill="url(#compassBrass)"
                stroke="#78350F"
                strokeWidth="0.8"
              />
              {/* Graphite Core Tip */}
              <polygon
                points={`${pencilTip.x},${pencilTip.y} ${pencilTip.x - 2.5},${pencilTip.y - 6} ${pencilTip.x + 2.5},${pencilTip.y - 6}`}
                fill="#38BDF8"
              />
            </g>

            {/* Geometric Radius Callout Dimension */}
            <g transform="translate(540, 50)">
              <rect x="0" y="0" width="210" height="150" rx="12" fill="#0F172A" stroke="#1E293B" strokeWidth="1.5" />
              <text x="16" y="26" fill="#38BDF8" fontSize="11" fontWeight="bold" fontFamily="monospace">
                CIRCLE METROLOGY
              </text>
              <line x1="16" y1="36" x2="194" y2="36" stroke="#334155" strokeWidth="1" />

              <text x="16" y="60" fill="#94A3B8" fontSize="10">Radius (R):</text>
              <text x="194" y="60" textAnchor="end" fill="white" fontSize="12" fontWeight="bold" fontFamily="monospace">
                {radiusMm.toFixed(1)} mm
              </text>

              <text x="16" y="85" fill="#94A3B8" fontSize="10">Diameter (⌀):</text>
              <text x="194" y="85" textAnchor="end" fill="#38BDF8" fontSize="12" fontWeight="bold" fontFamily="monospace">
                {diameterMm.toFixed(1)} mm
              </text>

              <text x="16" y="110" fill="#94A3B8" fontSize="10">Circumference (C):</text>
              <text x="194" y="110" textAnchor="end" fill="#FBBF24" fontSize="11" fontWeight="bold" fontFamily="monospace">
                {circumferenceMm.toFixed(1)} mm
              </text>

              <text x="16" y="135" fill="#94A3B8" fontSize="10">Enclosed Area (A):</text>
              <text x="194" y="135" textAnchor="end" fill="#34D399" fontSize="11" fontWeight="bold" fontFamily="monospace">
                {(areaMm2 / 100).toFixed(2)} cm²
              </text>
            </g>
          </svg>
        </div>

        {/* Action Row */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#4385E8] to-[#8064E8] text-white text-xs font-bold shadow-md flex items-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Log Circle to History</span>
          </button>
        </div>
      </div>
    </div>
  );
};

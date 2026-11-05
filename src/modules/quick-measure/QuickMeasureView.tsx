import React, { useState, useRef } from 'react';
import { useCalibrationStore } from '../../stores/calibrationStore';
import { useHistoryStore } from '../../stores/historyStore';
import { useAppStore } from '../../stores/appStore';
import { convertValue } from '../../engine/conversion/units';
import { LengthUnit } from '../../types';
import {
  Ruler,
  RotateCw,
  Copy,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Maximize2,
  Sliders,
} from 'lucide-react';

export const QuickMeasureView: React.FC = () => {
  const { profile, openModal } = useCalibrationStore();
  const { addItem } = useHistoryStore();
  const { showToast } = useAppStore();

  const [orientation, setOrientation] = useState<'horizontal' | 'vertical' | 'adjustable'>('horizontal');
  const [unit, setUnit] = useState<LengthUnit>('cm');
  const [rulerLengthMm, setRulerLengthMm] = useState(300); // 30cm default
  const [zoom, setZoom] = useState(1);
  const [markerStartPx, setMarkerStartPx] = useState(40);
  const [markerEndPx, setMarkerEndPx] = useState(240);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Conversion calculations
  const totalPixels = rulerLengthMm * profile.pixelsPerMm * zoom;
  const measuredPx = Math.abs(markerEndPx - markerStartPx);
  const measuredMm = measuredPx / (profile.pixelsPerMm * zoom);
  const measuredVal = convertValue(measuredMm, 'mm', unit, 'length');

  const handlePointerDown = (type: 'start' | 'end') => (e: React.PointerEvent) => {
    setIsDragging(type);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = orientation === 'horizontal' ? e.clientX - rect.left : e.clientY - rect.top;
    const clamped = Math.max(0, Math.min(totalPixels, pos));

    if (isDragging === 'start') {
      setMarkerStartPx(clamped);
    } else {
      setMarkerEndPx(clamped);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      setIsDragging(null);
    }
  };

  const handleCopy = () => {
    const formatted = `${measuredVal.toFixed(2)} ${unit}`;
    navigator.clipboard.writeText(formatted);
    addItem({
      tool: 'Quick Measure',
      title: `${orientation.toUpperCase()} Ruler Measurement`,
      value: formatted,
      rawNumericValue: measuredVal,
      unit,
      details: `Measured ${measuredMm.toFixed(2)} mm with ${profile.name}`,
    });
    showToast(`Copied ${formatted} to clipboard & history!`, 'success');
  };

  // Generate tick marks
  const renderTicks = () => {
    const ticks = [];
    const stepMm = unit === 'in' ? 25.4 / 16 : 1; // 1mm or 1/16th inch
    const totalSteps = Math.floor(rulerLengthMm / (unit === 'in' ? 25.4 / 16 : 1));

    for (let i = 0; i <= totalSteps; i++) {
      const currentMm = i * (unit === 'in' ? 25.4 / 16 : 1);
      const posPx = currentMm * profile.pixelsPerMm * zoom;
      if (posPx > totalPixels) break;

      let isMajor = false;
      let isMedium = false;
      let label = '';

      if (unit === 'cm') {
        isMajor = i % 10 === 0;
        isMedium = i % 5 === 0;
        if (isMajor) label = `${i / 10}`;
      } else if (unit === 'mm') {
        isMajor = i % 10 === 0;
        isMedium = i % 5 === 0;
        if (isMajor) label = `${i}`;
      } else if (unit === 'in') {
        isMajor = i % 16 === 0;
        isMedium = i % 8 === 0;
        if (isMajor) label = `${i / 16}`;
      } else {
        isMajor = i % 10 === 0;
        if (isMajor) label = `${i}`;
      }

      const tickHeight = isMajor ? 28 : isMedium ? 18 : 10;

      ticks.push(
        <g key={i}>
          <line
            x1={posPx}
            y1={0}
            x2={posPx}
            y2={tickHeight}
            stroke="#1D2940"
            strokeWidth={isMajor ? 1.5 : 0.75}
            opacity={isMajor ? 0.9 : 0.5}
          />
          {isMajor && label && (
            <text
              x={posPx}
              y={tickHeight + 14}
              fontSize="11"
              fontFamily="monospace"
              fontWeight="bold"
              fill="#1D2940"
              textAnchor="middle"
            >
              {label}
            </text>
          )}
        </g>
      );
    }
    return ticks;
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 pb-12">
      {/* Calibration Warning if not calibrated */}
      {!profile.isCalibrated && (
        <div className="px-5 py-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="text-xs text-amber-900">
              <span className="font-bold">Display Uncalibrated:</span> Ruler currently estimates at default ~96 DPI. Calibrate your screen with a bank card for physical millimeter precision.
            </div>
          </div>
          <button
            onClick={openModal}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors shadow-sm"
          >
            Calibrate Now
          </button>
        </div>
      )}

      {/* Top Controls Bar */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white/80 border border-[#DCE5F2] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4 backdrop-blur-xl">
        {/* Left: Orientation & Units */}
        <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2.5 sm:gap-3">
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setOrientation('horizontal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                orientation === 'horizontal' ? 'bg-white text-[#4385E8] shadow-sm' : 'text-slate-600'
              }`}
            >
              Horizontal
            </button>
            <button
              onClick={() => setOrientation('vertical')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                orientation === 'vertical' ? 'bg-white text-[#4385E8] shadow-sm' : 'text-slate-600'
              }`}
            >
              Vertical
            </button>
          </div>

          <div className="hidden sm:block h-6 w-px bg-slate-200" />

          {/* Unit Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#8E9CAE] font-medium">Unit:</span>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as LengthUnit)}
              className="text-xs font-bold text-[#1D2940] bg-slate-100 rounded-lg px-2.5 py-1.5 border border-transparent focus:border-brand-blue outline-none"
            >
              <option value="cm">Centimeter (cm)</option>
              <option value="mm">Millimeter (mm)</option>
              <option value="in">Inch (in)</option>
              <option value="pt">Point (pt)</option>
              <option value="pc">Pica (pc)</option>
            </select>
          </div>
        </div>

        {/* Center: Live Measurement Readout */}
        <div className="flex items-center justify-between sm:justify-center gap-2 sm:gap-3 px-3.5 sm:px-4 py-1.5 rounded-xl bg-[#EEF3FF] border border-[#DCE5F2]">
          <span className="text-xs text-[#66758D] font-medium">Measurement:</span>
          <span className="text-base sm:text-lg font-mono font-extrabold text-[#4385E8]">
            {measuredVal.toFixed(2)} <span className="text-xs font-sans">{unit}</span>
          </span>
          <span className="text-[11px] sm:text-xs text-[#8E9CAE] font-mono">({measuredMm.toFixed(1)} mm)</span>
          <button
            onClick={handleCopy}
            title="Copy measurement"
            className="p-1.5 rounded-lg hover:bg-white text-[#4385E8] transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Zoom & Reset */}
        <div className="flex items-center justify-end gap-2">
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.1))}
              className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono font-bold text-slate-700 px-2">
              {(zoom * 100).toFixed(0)}%
            </span>
            <button
              onClick={() => setZoom((prev) => Math.min(2.5, prev + 0.1))}
              className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => {
              setMarkerStartPx(40);
              setMarkerEndPx(240);
              setZoom(1);
            }}
            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
            title="Reset Ruler"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Ruler Board */}
      <div className="relative w-full overflow-x-auto p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white/90 border border-white shadow-glass backdrop-blur-xl flex flex-col items-center justify-center min-h-[340px] sm:min-h-[380px]">
        <div
          ref={containerRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ width: `${totalPixels + 60}px` }}
          className="relative h-44 rounded-2xl bg-gradient-to-b from-[#FBFDFF] to-[#EDF2FA] border-2 border-[#DCE5F2] shadow-lg overflow-hidden select-none touch-none"
        >
          {/* Subtle Acrylic Edge Reflection */}
          <div className="absolute top-0 inset-x-0 h-1 bg-white opacity-80" />

          {/* SVG Scale Marks */}
          <svg width={totalPixels + 60} height="120" className="absolute top-0 left-0">
            {renderTicks()}
          </svg>

          {/* Drag Marker: Start (A) */}
          <div
            style={{ left: `${markerStartPx}px` }}
            onPointerDown={handlePointerDown('start')}
            className="absolute top-0 bottom-0 w-10 -ml-5 flex flex-col items-center justify-between cursor-ew-resize group z-20 touch-none"
          >
            <div className="w-6 h-6 rounded-full bg-[#4385E8] text-white text-[10px] font-bold flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              A
            </div>
            <div className="w-0.5 h-full bg-[#4385E8] shadow-sm" />
            <div className="w-3 h-3 bg-[#4385E8] rotate-45 mb-1" />
          </div>

          {/* Drag Marker: End (B) */}
          <div
            style={{ left: `${markerEndPx}px` }}
            onPointerDown={handlePointerDown('end')}
            className="absolute top-0 bottom-0 w-10 -ml-5 flex flex-col items-center justify-between cursor-ew-resize group z-20 touch-none"
          >
            <div className="w-6 h-6 rounded-full bg-[#8064E8] text-white text-[10px] font-bold flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              B
            </div>
            <div className="w-0.5 h-full bg-[#8064E8] shadow-sm" />
            <div className="w-3 h-3 bg-[#8064E8] rotate-45 mb-1" />
          </div>

          {/* Highlight Span Between Markers */}
          <div
            style={{
              left: `${Math.min(markerStartPx, markerEndPx)}px`,
              width: `${Math.abs(markerEndPx - markerStartPx)}px`,
            }}
            className="absolute top-10 bottom-6 bg-[#4385E8]/10 border-t border-b border-[#4385E8]/30 pointer-events-none flex items-center justify-center"
          >
            <span className="px-2 py-0.5 rounded-full bg-white/90 text-[11px] font-bold text-[#4385E8] shadow-sm">
              {measuredVal.toFixed(2)} {unit}
            </span>
          </div>
        </div>

        <p className="mt-5 text-xs text-[#8E9CAE] font-medium text-center">
          💡 Drag markers <span className="font-bold text-[#4385E8]">A</span> and <span className="font-bold text-[#8064E8]">B</span> to measure any physical object placed directly against your screen.
        </p>
      </div>
    </div>
  );
};

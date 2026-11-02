import React, { useState } from 'react';
import { useHistoryStore } from '../../stores/historyStore';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import { soundEffects } from '../../utils/soundEffects';
import {
  Compass,
  RotateCcw,
  Copy,
  Table,
  Download,
  CheckCircle2,
  Layers,
  Settings,
  Circle,
} from 'lucide-react';

export const PcdGeneratorView: React.FC = () => {
  const { addItem } = useHistoryStore();
  const { showToast } = useAppStore();
  const { requireAuth } = useAuthStore();

  const [pcdMm, setPcdMm] = useState<number>(120);
  const [holeCount, setHoleCount] = useState<number>(6);
  const [holeDiaMm, setHoleDiaMm] = useState<number>(12);
  const [boreDiaMm, setBoreDiaMm] = useState<number>(50);
  const [flangeOuterDiaMm, setFlangeOuterDiaMm] = useState<number>(160);
  const [startAngleDeg, setStartAngleDeg] = useState<number>(0);

  // Geometric Calculations
  const stepAngleDeg = 360 / holeCount;
  const chordalDistanceMm = pcdMm * Math.sin((Math.PI / holeCount));
  const radialLigamentMm = (flangeOuterDiaMm - pcdMm - holeDiaMm) / 2;

  // Generate Hole Coordinates relative to (0,0)
  const holeCoordinates = Array.from({ length: holeCount }).map((_, idx) => {
    const angleDeg = (startAngleDeg + idx * stepAngleDeg) % 360;
    const angleRad = (angleDeg * Math.PI) / 180;
    const x = (pcdMm / 2) * Math.cos(angleRad);
    const y = (pcdMm / 2) * Math.sin(angleRad);
    return {
      index: idx + 1,
      angleDeg: parseFloat(angleDeg.toFixed(2)),
      x: parseFloat(x.toFixed(3)),
      y: parseFloat(y.toFixed(3)),
    };
  });

  const handleExportCsv = () => {
    const headers = 'Hole_No,Angle_Deg,X_Coordinate_mm,Y_Coordinate_mm\n';
    const rows = holeCoordinates
      .map((h) => `${h.index},${h.angleDeg},${h.x},${h.y}`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PCD_${pcdMm}mm_${holeCount}Holes_CNC_Coords.csv`;
    a.click();
    showToast('CNC coordinates exported to CSV', 'success');
  };

  const handleLogMeasurement = () => {
    requireAuth('save PCD bolt pattern', () => {
      addItem({
        tool: 'PCD Generator',
        title: `PCD Bolt Circle: Ø${pcdMm} mm (${holeCount} Holes)`,
        value: `Ø${pcdMm} mm PCD`,
        rawNumericValue: pcdMm,
        unit: 'mm',
        details: `Chord: ${chordalDistanceMm.toFixed(2)} mm, Hole Dia: Ø${holeDiaMm} mm, Pilot Bore: Ø${boreDiaMm} mm, Outer: Ø${flangeOuterDiaMm} mm`,
      });
      showToast('PCD configuration saved to Project History', 'success');
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 select-none pb-12">
      {/* Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-white/90 border border-[#DCE5F2] shadow-glass flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-blue-50 text-[#4385E8] border border-blue-200">
              <Circle className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-[#1D2940]">Bolt Pattern & PCD Generator</h1>
          </div>
          <p className="text-xs md:text-sm text-[#66758D]">
            Pitch Circle Diameter (PCD) calculator, flange hole chordal spacing, and CNC machine coordinates.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CNC CSV</span>
          </button>

          <button
            onClick={handleLogMeasurement}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4385E8] to-[#8064E8] text-white text-xs font-bold shadow-md shadow-brand-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            <span>Save Flange</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Flange Blueprint Viewer */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Blueprint SVG Canvas */}
          <div className="p-6 rounded-3xl bg-slate-900 border-2 border-slate-800 shadow-2xl flex flex-col items-center justify-center relative min-h-[440px]">
            {/* Blueprint Grid Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

            <div className="absolute top-4 left-4 z-10">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                PCD: Ø{pcdMm} mm • {holeCount} × Ø{holeDiaMm} mm
              </span>
            </div>

            {/* SVG Engineering Blueprint */}
            <div className="w-full max-w-md h-72 flex items-center justify-center relative">
              <svg viewBox="-120 -120 240 240" className="w-full h-full drop-shadow-xl overflow-visible">
                {/* 1. Centerlines Crosshair */}
                <line x1="-110" y1="0" x2="110" y2="0" stroke="#334155" strokeDasharray="6,4" strokeWidth="1" />
                <line x1="0" y1="-110" x2="0" y2="110" stroke="#334155" strokeDasharray="6,4" strokeWidth="1" />

                {/* 2. Outer Flange Rim (Scale: 200px = flangeOuterDiaMm) */}
                {(() => {
                  const scale = 180 / flangeOuterDiaMm;
                  const rOuter = (flangeOuterDiaMm / 2) * scale;
                  const rPcd = (pcdMm / 2) * scale;
                  const rBore = (boreDiaMm / 2) * scale;
                  const rHole = (holeDiaMm / 2) * scale;

                  return (
                    <>
                      {/* Flange Disc Body */}
                      <circle
                        cx="0"
                        cy="0"
                        r={rOuter}
                        fill="url(#flangeSteelGrad)"
                        stroke="#64748B"
                        strokeWidth="2"
                      />

                      {/* Pitch Circle Diameter (PCD) Centerline */}
                      <circle
                        cx="0"
                        cy="0"
                        r={rPcd}
                        fill="none"
                        stroke="#38BDF8"
                        strokeDasharray="4,3"
                        strokeWidth="1.2"
                      />

                      {/* Center Pilot Bore (Hole Through) */}
                      <circle
                        cx="0"
                        cy="0"
                        r={rBore}
                        fill="#0F172A"
                        stroke="#94A3B8"
                        strokeWidth="1.5"
                      />
                      <text x="0" y="3" fill="#64748B" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                        BORE Ø{boreDiaMm}
                      </text>

                      {/* Bolt Holes on PCD */}
                      {holeCoordinates.map((hole) => {
                        const hx = hole.x * scale;
                        const hy = hole.y * scale;
                        return (
                          <g key={hole.index}>
                            <circle
                              cx={hx}
                              cy={hy}
                              r={rHole}
                              fill="#0F172A"
                              stroke="#38BDF8"
                              strokeWidth="1.5"
                            />
                            {/* Hole Number Label */}
                            <text
                              x={hx}
                              y={hy - rHole - 3}
                              fill="#38BDF8"
                              fontSize="8"
                              fontWeight="bold"
                              textAnchor="middle"
                              fontFamily="monospace"
                            >
                              H{hole.index}
                            </text>
                          </g>
                        );
                      })}
                    </>
                  );
                })()}

                <defs>
                  <linearGradient id="flangeSteelGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#334155" />
                    <stop offset="50%" stopColor="#1E293B" />
                    <stop offset="100%" stopColor="#0F172A" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Quick Metrics */}
            <div className="w-full mt-3 p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between text-xs">
              <span className="text-slate-300 font-mono">
                Step Angle: <span className="text-cyan-400 font-bold">{stepAngleDeg.toFixed(1)}°</span>
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 font-mono">
                Chordal Spacing: <span className="text-emerald-400 font-bold">{chordalDistanceMm.toFixed(2)} mm</span>
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 font-mono">
                Edge Margin: <span className="text-amber-400 font-bold">{radialLigamentMm.toFixed(2)} mm</span>
              </span>
            </div>
          </div>

          {/* CNC Coordinates Table */}
          <div className="p-5 rounded-3xl bg-white border border-[#DCE5F2] shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1D2940] flex items-center gap-1.5">
                <Table className="w-4 h-4 text-[#4385E8]" />
                <span>CNC Machine Coordinates (Relative to Center 0,0)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{holeCount} Hole Positions</span>
            </div>

            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-100">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Hole</th>
                    <th className="py-2 px-3">Polar Angle</th>
                    <th className="py-2 px-3">X Coordinate (mm)</th>
                    <th className="py-2 px-3">Y Coordinate (mm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {holeCoordinates.map((h) => (
                    <tr key={h.index} className="hover:bg-slate-50/80">
                      <td className="py-1.5 px-3 font-bold text-slate-700">Hole {h.index}</td>
                      <td className="py-1.5 px-3 text-slate-600">{h.angleDeg}°</td>
                      <td className="py-1.5 px-3 text-[#4385E8] font-semibold">{h.x >= 0 ? `+${h.x}` : h.x}</td>
                      <td className="py-1.5 px-3 text-[#8064E8] font-semibold">{h.y >= 0 ? `+${h.y}` : h.y}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Parameters Form */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="p-6 rounded-3xl bg-white border border-[#DCE5F2] shadow-sm flex flex-col gap-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Flange & Bolt Parameters
            </span>

            {/* PCD Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Bolt Circle (PCD):</span>
                <span className="font-mono font-black text-[#4385E8]">{pcdMm} mm</span>
              </div>
              <input
                type="range"
                min="40"
                max="300"
                value={pcdMm}
                onChange={(e) => setPcdMm(Number(e.target.value))}
                className="accent-[#4385E8]"
              />
            </div>

            {/* Hole Count Selector */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Number of Holes:</span>
                <span className="font-mono font-black text-[#8064E8]">{holeCount}</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[3, 4, 5, 6, 8].map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      setHoleCount(n);
                      soundEffects.click();
                    }}
                    className={`py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                      holeCount === n
                        ? 'bg-[#8064E8] text-white border-[#8064E8] shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Hole Diameter */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Hole Diameter (Ø):</span>
                <span className="font-mono font-black text-slate-800">{holeDiaMm} mm</span>
              </div>
              <input
                type="range"
                min="4"
                max="30"
                value={holeDiaMm}
                onChange={(e) => setHoleDiaMm(Number(e.target.value))}
                className="accent-slate-800"
              />
            </div>

            {/* Center Bore Diameter */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Center Pilot Bore (Ø):</span>
                <span className="font-mono font-black text-slate-800">{boreDiaMm} mm</span>
              </div>
              <input
                type="range"
                min="10"
                max="120"
                value={boreDiaMm}
                onChange={(e) => setBoreDiaMm(Number(e.target.value))}
                className="accent-slate-800"
              />
            </div>

            {/* Flange Outer Diameter */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Flange Outer Diameter:</span>
                <span className="font-mono font-black text-slate-800">{flangeOuterDiaMm} mm</span>
              </div>
              <input
                type="range"
                min={pcdMm + 20}
                max="400"
                value={flangeOuterDiaMm}
                onChange={(e) => setFlangeOuterDiaMm(Number(e.target.value))}
                className="accent-slate-800"
              />
            </div>

            {/* Start Angle Offset */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Start Angle Offset:</span>
                <span className="font-mono font-black text-slate-800">{startAngleDeg}°</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[0, 22.5, 30, 45].map((ang) => (
                  <button
                    key={ang}
                    onClick={() => {
                      setStartAngleDeg(ang);
                      soundEffects.click();
                    }}
                    className={`py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                      startAngleDeg === ang
                        ? 'bg-[#4385E8] text-white border-[#4385E8]'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    {ang}°
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

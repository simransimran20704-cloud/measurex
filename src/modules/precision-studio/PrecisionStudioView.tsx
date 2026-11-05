import React, { useRef, useState, useEffect } from 'react';
import { useStudioStore, StudioTool } from '../../stores/studioStore';
import { useCalibrationStore } from '../../stores/calibrationStore';
import { useHistoryStore } from '../../stores/historyStore';
import { useAppStore } from '../../stores/appStore';
import { distanceBetween, angleDegrees, pixelsToLength } from '../../engine/geometry/math';
import { LengthUnit } from '../../types';
import {
  MousePointer,
  Dot,
  Slash,
  Square,
  Circle,
  Compass,
  Grid,
  Magnet,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Undo2,
  Redo2,
  Trash2,
  Copy,
  Layers,
  ChevronRight,
  Target,
} from 'lucide-react';

export const PrecisionStudioView: React.FC = () => {
  const {
    points,
    shapes,
    activeTool,
    selectedId,
    unit,
    zoom,
    pan,
    grid,
    setActiveTool,
    setUnit,
    setZoom,
    setPan,
    setGrid,
    selectItem,
    addPoint,
    updatePoint,
    deletePoint,
    clearAll,
    undo,
    redo,
    resetView,
  } = useStudioStore();

  const { profile } = useCalibrationStore();
  const { addItem } = useHistoryStore();
  const { showToast } = useAppStore();

  const canvasRef = useRef<SVGSVGElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggingPointId, setDraggingPointId] = useState<string | null>(null);
  const [cursorCoord, setCursorCoord] = useState({ x: 0, y: 0 });

  // Canvas Dimensions
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 500 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setCanvasSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Coordinate transforms: Screen (px) <-> World (canvas coordinates)
  const screenToWorld = (screenX: number, screenY: number) => {
    return {
      x: (screenX - pan.x) / zoom,
      y: (screenY - pan.y) / zoom,
    };
  };

  const worldToScreen = (worldX: number, worldY: number) => {
    return {
      x: worldX * zoom + pan.x,
      y: worldY * zoom + pan.y,
    };
  };

  // Canvas Pointer Handlers
  const handleCanvasPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button === 1 || (e.button === 0 && e.altKey) || activeTool === 'select' && e.target === canvasRef.current) {
      // Pan canvas
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      (e.target as Element).setPointerCapture(e.pointerId);
      return;
    }

    if (activeTool === 'point' && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;
      let world = screenToWorld(rawX, rawY);

      if (grid.snap) {
        world.x = Math.round(world.x / grid.size) * grid.size;
        world.y = Math.round(world.y / grid.size) * grid.size;
      }

      const label = String.fromCharCode(65 + (points.length % 26));
      addPoint({
        x: Math.round(world.x),
        y: Math.round(world.y),
        label,
        color: '#4385E8',
      });
      showToast(`Placed Point ${label} at (${Math.round(world.x)}, ${Math.round(world.y)})`, 'info');
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;
      const world = screenToWorld(rawX, rawY);
      setCursorCoord({ x: Math.round(world.x), y: Math.round(world.y) });

      if (draggingPointId) {
        let newX = world.x;
        let newY = world.y;
        if (grid.snap) {
          newX = Math.round(newX / grid.size) * grid.size;
          newY = Math.round(newY / grid.size) * grid.size;
        }
        updatePoint(draggingPointId, { x: Math.round(newX), y: Math.round(newY) });
      }
    }
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isPanning) {
      setIsPanning(false);
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
    if (draggingPointId) {
      setDraggingPointId(null);
    }
  };

  // Zoom with Wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.min(4, Math.max(0.2, prev * zoomFactor)));
  };

  // Selected Points or Point A & Point B calculations
  const ptA = points[0] || null;
  const ptB = points[1] || null;

  const distancePx = ptA && ptB ? distanceBetween(ptA, ptB) : 0;
  const distanceConverted = pixelsToLength(distancePx, unit, profile.pixelsPerMm);
  const dxConverted = ptA && ptB ? pixelsToLength(Math.abs(ptB.x - ptA.x), unit, profile.pixelsPerMm) : 0;
  const dyConverted = ptA && ptB ? pixelsToLength(Math.abs(ptB.y - ptA.y), unit, profile.pixelsPerMm) : 0;
  const angleDeg = ptA && ptB ? angleDegrees(ptA, ptB) : 0;

  // RULER SYNCHRONIZATION: Generate Ruler Ticks for Left, Right, and Bottom
  const renderHorizontalRulerTicks = () => {
    const ticks = [];
    const stepMm = 10; // 1cm markings
    const stepPx = stepMm * profile.pixelsPerMm * zoom;
    if (stepPx < 8) return null;

    // Start tick relative to pan.x
    const minX = -pan.x / zoom;
    const maxX = (canvasSize.width - pan.x) / zoom;
    const startStep = Math.floor(minX / (stepMm * profile.pixelsPerMm));
    const endStep = Math.ceil(maxX / (stepMm * profile.pixelsPerMm));

    for (let i = startStep; i <= endStep; i++) {
      const worldPx = i * stepMm * profile.pixelsPerMm;
      const screenX = worldPx * zoom + pan.x;
      if (screenX < 0 || screenX > canvasSize.width) continue;

      const isMajor = i % 5 === 0;
      const height = isMajor ? 18 : 8;
      const labelValue = ((i * stepMm) / (unit === 'in' ? 25.4 : 10)).toFixed(0);

      ticks.push(
        <g key={`x-${i}`}>
          <line
            x1={screenX}
            y1={0}
            x2={screenX}
            y2={height}
            stroke="#64748B"
            strokeWidth={isMajor ? 1.2 : 0.6}
          />
          {isMajor && (
            <text
              x={screenX + 2}
              y={24}
              fontSize="9"
              fill="#1D2940"
              fontFamily="monospace"
              fontWeight="bold"
            >
              {labelValue}
            </text>
          )}
        </g>
      );
    }
    return ticks;
  };

  const renderVerticalRulerTicks = (isRight: boolean = false) => {
    const ticks = [];
    const stepMm = 10; // 1cm markings
    const stepPx = stepMm * profile.pixelsPerMm * zoom;
    if (stepPx < 8) return null;

    const minY = -pan.y / zoom;
    const maxY = (canvasSize.height - pan.y) / zoom;
    const startStep = Math.floor(minY / (stepMm * profile.pixelsPerMm));
    const endStep = Math.ceil(maxY / (stepMm * profile.pixelsPerMm));

    for (let i = startStep; i <= endStep; i++) {
      const worldPy = i * stepMm * profile.pixelsPerMm;
      const screenY = worldPy * zoom + pan.y;
      if (screenY < 0 || screenY > canvasSize.height) continue;

      const isMajor = i % 5 === 0;
      const width = isMajor ? 18 : 8;
      const labelValue = ((i * stepMm) / (unit === 'in' ? 25.4 : 10)).toFixed(0);

      ticks.push(
        <g key={`y-${i}`}>
          <line
            x1={isRight ? 28 - width : 0}
            y1={screenY}
            x2={isRight ? 28 : width}
            y2={screenY}
            stroke="#64748B"
            strokeWidth={isMajor ? 1.2 : 0.6}
          />
          {isMajor && (
            <text
              x={isRight ? 4 : width + 2}
              y={screenY + 3}
              fontSize="9"
              fill="#1D2940"
              fontFamily="monospace"
              fontWeight="bold"
            >
              {labelValue}
            </text>
          )}
        </g>
      );
    }
    return ticks;
  };

  return (
    <div className="w-full h-auto lg:h-[calc(100vh-130px)] flex flex-col gap-3 max-w-[1600px] mx-auto select-none pb-8 lg:pb-0">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-white/90 border border-[#DCE5F2] shadow-sm backdrop-blur-xl gap-2 sm:gap-3">
        {/* Tool selector */}
        <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl">
          <button
            onClick={() => setActiveTool('select')}
            title="Select & Pan (V)"
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTool === 'select' ? 'bg-white text-[#4385E8] shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Select</span>
          </button>

          <button
            onClick={() => setActiveTool('point')}
            title="Plot Points (P)"
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTool === 'point' ? 'bg-white text-[#4385E8] shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Dot className="w-4 h-4" />
            <span className="hidden sm:inline">Point</span>
          </button>
        </div>

        {/* Snapping & Grid Toggles */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setGrid({ show: !grid.show })}
            title="Toggle Grid"
            className={`p-2 rounded-xl text-xs font-medium border transition-all ${
              grid.show ? 'bg-blue-50 text-[#4385E8] border-blue-200' : 'bg-slate-100 text-slate-500 border-transparent'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>

          <button
            onClick={() => setGrid({ snap: !grid.snap })}
            title="Snap to Grid"
            className={`p-2 rounded-xl text-xs font-medium border transition-all ${
              grid.snap ? 'bg-purple-50 text-[#8064E8] border-purple-200' : 'bg-slate-100 text-slate-500 border-transparent'
            }`}
          >
            <Magnet className="w-4 h-4" />
          </button>

          {/* Unit selector */}
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as LengthUnit)}
            className="text-xs font-bold text-[#1D2940] bg-slate-100 rounded-xl px-3 py-2 border border-transparent focus:border-brand-blue outline-none"
          >
            <option value="cm">Unit: cm</option>
            <option value="mm">Unit: mm</option>
            <option value="in">Unit: in</option>
            <option value="m">Unit: m</option>
          </select>
        </div>

        {/* Zoom, Undo, Redo, Reset */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={undo}
            title="Undo"
            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            title="Redo"
            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-slate-200 mx-1" />

          <button
            onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))}
            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-slate-700 w-12 text-center">
            {(zoom * 100).toFixed(0)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(4, z + 0.1))}
            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={resetView}
            title="Reset Canvas View"
            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={clearAll}
            title="Clear All Points"
            className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 ml-1"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Studio Workspace: Synchronized 3-Sided Rulers + Canvas + Results Panel */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* Studio Canvas Area with 3-Sided Rulers */}
        <div
          ref={containerRef}
          className="flex-1 relative rounded-2xl sm:rounded-3xl bg-white border border-[#DCE5F2] shadow-glass overflow-hidden flex flex-col min-h-[340px] sm:min-h-[440px] lg:min-h-0"
        >
          {/* Top Canvas Row: Left Ruler + Central Canvas + Right Ruler */}
          <div className="flex-1 flex relative overflow-hidden">
            {/* 1. Left Vertical Ruler */}
            <div className="w-7 h-full bg-[#EEF3FF] border-r border-[#DCE5F2] flex-shrink-0 relative overflow-hidden select-none">
              <svg className="w-full h-full absolute inset-0">
                {renderVerticalRulerTicks(false)}
              </svg>
            </div>

            {/* Central Interactive SVG Canvas */}
            <div className="flex-1 h-full relative cursor-crosshair overflow-hidden">
              <svg
                ref={canvasRef}
                onPointerDown={handleCanvasPointerDown}
                onPointerMove={handleCanvasPointerMove}
                onPointerUp={handleCanvasPointerUp}
                onWheel={handleWheel}
                className={`w-full h-full touch-none ${grid.show ? 'bg-grid-pattern' : 'bg-[#FAFCFF]'}`}
                style={{
                  backgroundSize: `${grid.size * zoom}px ${grid.size * zoom}px`,
                  backgroundPosition: `${pan.x}px ${pan.y}px`,
                }}
              >
                <defs>
                  {/* Marker styling */}
                  <filter id="pointGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#4385E8" floodOpacity="0.4" />
                  </filter>
                </defs>

                {/* Origin Marker (0, 0) */}
                <g transform={`translate(${pan.x}, ${pan.y})`}>
                  <circle cx="0" cy="0" r="4" fill="#36C6DA" />
                  <line x1="-10" y1="0" x2="10" y2="0" stroke="#36C6DA" strokeWidth="1" />
                  <line x1="0" y1="-10" x2="0" y2="10" stroke="#36C6DA" strokeWidth="1" />
                  <text x="6" y="-6" fontSize="9" fill="#36C6DA" fontWeight="bold">Origin (0,0)</text>
                </g>

                {/* Geometric Lines connecting Point A to Point B */}
                {points.length >= 2 && (
                  <g>
                    {points.map((pt, idx) => {
                      if (idx === points.length - 1) return null;
                      const next = points[idx + 1];
                      const s1 = worldToScreen(pt.x, pt.y);
                      const s2 = worldToScreen(next.x, next.y);
                      const midX = (s1.x + s2.x) / 2;
                      const midY = (s1.y + s2.y) / 2;
                      const dist = pixelsToLength(distanceBetween(pt, next), unit, profile.pixelsPerMm);

                      return (
                        <g key={`line-${pt.id}-${next.id}`}>
                          <line
                            x1={s1.x}
                            y1={s1.y}
                            x2={s2.x}
                            y2={s2.y}
                            stroke="#4385E8"
                            strokeWidth="2.5"
                            strokeDasharray="4 2"
                          />
                          {/* Distance Label Badge on Line */}
                          <rect
                            x={midX - 35}
                            y={midY - 12}
                            width="70"
                            height="24"
                            rx="12"
                            fill="white"
                            stroke="#4385E8"
                            strokeWidth="1.5"
                            className="filter drop-shadow-sm"
                          />
                          <text
                            x={midX}
                            y={midY + 4}
                            textAnchor="middle"
                            fontSize="10"
                            fontWeight="bold"
                            fill="#1D2940"
                          >
                            {dist.toFixed(2)} {unit}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                )}

                {/* Plotted Points */}
                {points.map((pt) => {
                  const s = worldToScreen(pt.x, pt.y);
                  const isSelected = selectedId === pt.id;

                  return (
                    <g
                      key={pt.id}
                      transform={`translate(${s.x}, ${s.y})`}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        selectItem(pt.id, 'point');
                        setDraggingPointId(pt.id);
                      }}
                      className="cursor-move group"
                    >
                      <circle
                        cx="0"
                        cy="0"
                        r={isSelected ? 10 : 8}
                        fill={pt.color || '#4385E8'}
                        stroke="white"
                        strokeWidth="2.5"
                        filter="url(#pointGlow)"
                        className="transition-all"
                      />
                      <circle
                        cx="0"
                        cy="0"
                        r="3"
                        fill="white"
                      />
                      <text
                        x="12"
                        y="4"
                        fontSize="12"
                        fontWeight="bold"
                        fill="#1D2940"
                        className="pointer-events-none drop-shadow"
                      >
                        {pt.label} ({pt.x}, {pt.y})
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Cursor Coordinate Overlay */}
              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-white/90 border border-slate-200 text-[10px] font-mono text-slate-600 shadow-sm pointer-events-none">
                X: {cursorCoord.x} | Y: {cursorCoord.y}
              </div>
            </div>

            {/* 2. Right Vertical Ruler (Synchronized with same Y-axis!) */}
            <div className="w-7 h-full bg-[#EEF3FF] border-l border-[#DCE5F2] flex-shrink-0 relative overflow-hidden select-none">
              <svg className="w-full h-full absolute inset-0">
                {renderVerticalRulerTicks(true)}
              </svg>
            </div>
          </div>

          {/* 3. Bottom Horizontal Ruler (X-Axis, spans between left & right rulers) */}
          <div className="h-7 w-full bg-[#EEF3FF] border-t border-[#DCE5F2] relative overflow-hidden select-none">
            <svg className="w-full h-full absolute inset-0">
              {renderHorizontalRulerTicks()}
            </svg>
          </div>
        </div>

        {/* Results Panel (Right Side) */}
        <div className="w-full lg:w-80 flex flex-col gap-4 flex-shrink-0">
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-[#DCE5F2] shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#4385E8]" />
                <h3 className="font-bold text-sm text-[#1D2940]">Studio Results</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                Live Engine
              </span>
            </div>

            {/* Point to Point Distance Result */}
            <div className="flex flex-col p-3 rounded-2xl bg-[#EEF3FF] border border-[#DCE5F2]">
              <span className="text-[11px] font-medium text-[#66758D]">Distance (A &rarr; B)</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-mono font-extrabold text-[#4385E8]">
                  {distanceConverted.toFixed(2)}
                </span>
                <span className="font-bold text-xs text-slate-500">{unit}</span>
              </div>
            </div>

            {/* Detailed Displacements: dx, dy, angle */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-500">Horizontal (dx):</span>
                <div className="font-mono font-bold text-xs text-slate-800 mt-0.5">
                  {dxConverted.toFixed(2)} {unit}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-500">Vertical (dy):</span>
                <div className="font-mono font-bold text-xs text-slate-800 mt-0.5">
                  {dyConverted.toFixed(2)} {unit}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 col-span-2 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">Vector Angle:</span>
                <div className="font-mono font-bold text-xs text-[#8064E8]">
                  {angleDeg.toFixed(1)}&deg;
                </div>
              </div>
            </div>

            {/* Plotted Points List */}
            <div className="flex flex-col gap-1.5 mt-1">
              <span className="text-xs font-bold text-[#1D2940]">Plotted Points ({points.length})</span>
              <div className="max-h-40 overflow-y-auto flex flex-col gap-1.5 pr-1">
                {points.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-50 text-xs border border-slate-100"
                  >
                    <span className="font-bold text-[#4385E8]">Point {p.label}</span>
                    <span className="font-mono text-slate-600 text-[11px]">
                      ({p.x}, {p.y})
                    </span>
                    <button
                      onClick={() => deletePoint(p.id)}
                      className="text-slate-400 hover:text-red-500 p-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Copy & Save Action */}
            <button
              onClick={() => {
                if (points.length < 2) {
                  showToast('Plot at least 2 points to log measurement', 'warning');
                  return;
                }
                const formatted = `${distanceConverted.toFixed(2)} ${unit}`;
                navigator.clipboard.writeText(formatted);
                addItem({
                  tool: 'Precision Studio',
                  title: `A → B • Precision Studio`,
                  value: formatted,
                  rawNumericValue: distanceConverted,
                  unit,
                  details: `Point A(${ptA?.x}, ${ptA?.y}) to Point B(${ptB?.x}, ${ptB?.y})`,
                });
                showToast(`Saved ${formatted} to Measurement History!`, 'success');
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#4385E8] to-[#8064E8] text-white text-xs font-bold shadow-md shadow-brand-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Log to History</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

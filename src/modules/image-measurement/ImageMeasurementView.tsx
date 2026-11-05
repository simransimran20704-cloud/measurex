import React, { useState, useRef, useEffect } from 'react';
import { distanceBetween, angleDegrees } from '../../engine/geometry/math';
import { useHistoryStore } from '../../stores/historyStore';
import { useAppStore } from '../../stores/appStore';
import { LengthUnit } from '../../types';
import {
  Upload,
  Ruler,
  Maximize2,
  Download,
  RotateCcw,
  Target,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Layers,
} from 'lucide-react';

interface BlueprintLine {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
  isReference?: boolean;
}

// Built-in sample blueprint for instant zero-friction testing (Base64 encoded to guarantee universal browser rendering)
const RAW_SAMPLE_BLUEPRINT_BASE64 =
  'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNTAwIiB2aWV3Qm94PSIwIDAgODAwIDUwMCI+CiAgPHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI1MDAiIGZpbGw9IiMwRjE3MkEiLz4KICA8ZGVmcz4KICAgIDxwYXR0ZXJuIGlkPSJzYW1wbGUtYmx1ZXByaW50LWdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CiAgICAgIDxwYXRoIGQ9Ik0gMjAgMCBMIDAgMCAwIDIwIiBmaWxsPSJub25lIiBzdHJva2U9IiMxRTI5M0IiIHN0cm9rZS13aWR0aD0iMSIvPgogICAgPC9wYXR0ZXJuPgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0idXJsKCNzYW1wbGUtYmx1ZXByaW50LWdyaWQpIi8+CiAgPGcgc3Ryb2tlPSIjMzhCREY4IiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiPgogICAgPHJlY3QgeD0iMTgwIiB5PSIxNDAiIHdpZHRoPSI0NDAiIGhlaWdodD0iMjIwIiByeD0iMTAiLz4KICAgIDxjaXJjbGUgY3g9IjI2MCIgY3k9IjI1MCIgcj0iNDUiLz4KICAgIDxjaXJjbGUgY3g9IjU0MCIgY3k9IjI1MCIgcj0iNDUiLz4KICAgIDxsaW5lIHgxPSIyNjAiIHkxPSIyNTAiIHgyPSI1NDAiIHkyPSIyNTAiIHN0cm9rZS1kYXNoYXJyYXk9IjYgNCIgc3Ryb2tlPSIjOTRBM0I4Ii8+CiAgPC9nPgogIDxnIGZpbGw9IiM5NEEzQjgiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTIiPgogICAgPHRleHQgeD0iMjAwIiB5PSIxMTAiPkVOR0lORUVSSU5HIFNQRUNJTUVOIEJMVUVQUklOVCAtIE1YLTIwMjY8L3RleHQ+CiAgICA8dGV4dCB4PSIyMDAiIHk9IjM5MCI+U0NBTEUgQkFSOiBbIDEwMCBtbSBSRUZFUkVOQ0UgXTwvdGV4dD4KICAgIDxsaW5lIHgxPSIyMDAiIHkxPSI0MTAiIHgyPSI0MDAiIHkyPSI0MTAiIHN0cm9rZT0iI0Y1OUUwQiIgc3Ryb2tlLXdpZHRoPSI0Ii8+CiAgICA8bGluZSB4MT0iMjAwIiB5MT0iNDAwIiB4Mj0iMjAwIiB5Mj0iNDIwIiBzdHJva2U9IiNGNTlFMEIiIHN0cm9rZS13aWR0aD0iMiIvPgogICAgPGxpbmUgeDE9IjQwMCIgeTE9IjQwMCIgeDI9IjQwMCIgeTI9IjQyMCIgc3Ryb2tlPSIjRjU5RTBCIiBzdHJva2Utd2lkdGg9IjIiLz4KICA8L2c+Cjwvc3ZnPg==';

const SAMPLE_BLUEPRINT = `data:image/svg+xml;base64,${RAW_SAMPLE_BLUEPRINT_BASE64}`;

export const ImageMeasurementView: React.FC = () => {
  const { addItem } = useHistoryStore();
  const { showToast } = useAppStore();

  const [imageSrc, setImageSrc] = useState<string>(SAMPLE_BLUEPRINT);
  const [scalePixelsPerMm, setScalePixelsPerMm] = useState<number | null>(2.0); // 200px = 100mm default on sample
  const [unit, setUnit] = useState<LengthUnit>('mm');
  const [toolMode, setToolMode] = useState<'calibrate' | 'measure'>('measure');

  const [referenceMmInput, setReferenceMmInput] = useState<number>(100);
  const [lines, setLines] = useState<BlueprintLine[]>([
    { id: 'ref-1', x1: 200, y1: 410, x2: 400, y2: 410, label: 'Reference (100.0 mm)', isReference: true },
    { id: 'meas-1', x1: 180, y1: 140, x2: 620, y2: 140, label: 'Length: 220.0 mm' },
  ]);

  const [activeDrawing, setActiveDrawing] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. File Type Whitelist Check
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      showToast('Security Alert: Only PNG, JPEG, WebP, and clean SVG blueprints are permitted.', 'warning');
      e.target.value = '';
      return;
    }

    // 2. File Size Cap (10MB)
    if (file.size > MAX_FILE_SIZE) {
      showToast('File too large: Maximum blueprint upload size is 10 MB.', 'warning');
      e.target.value = '';
      return;
    }

    // 3. For SVG files, inspect text for script injection before loading
    if (file.type === 'image/svg+xml') {
      const textReader = new FileReader();
      textReader.onload = (txtEvt) => {
        const svgContent = String(txtEvt.target?.result || '');
        if (/<script|javascript:|onload=|onerror=/i.test(svgContent)) {
          showToast('Security Alert: Malicious script tags detected in SVG file. Upload rejected.', 'warning');
          return;
        }

        let formattedSrc = svgContent;
        if (!svgContent.startsWith('data:')) {
          try {
            formattedSrc = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgContent)))}`;
          } catch (e) {
            formattedSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
          }
        }
        setImageSrc(formattedSrc);
        setLines([]);
        setScalePixelsPerMm(null);
        setToolMode('calibrate');
        showToast('Blueprint loaded safely. Calibrate scale to begin.', 'info');
      };
      textReader.readAsText(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageSrc(event.target.result as string);
        setLines([]);
        setScalePixelsPerMm(null);
        setToolMode('calibrate');
        showToast('Image loaded. Draw a reference line across a known scale to calibrate.', 'info');
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setActiveDrawing({ x1: x, y1: y, x2: x, y2: y });
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!activeDrawing || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setActiveDrawing((prev) => (prev ? { ...prev, x2: x, y2: y } : null));
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!activeDrawing) return;
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch (err) {}

    const distPx = distanceBetween({ x: activeDrawing.x1, y: activeDrawing.y1 }, { x: activeDrawing.x2, y: activeDrawing.y2 });
    if (distPx < 8) {
      setActiveDrawing(null);
      return;
    }

    if (toolMode === 'calibrate') {
      const computedPpm = distPx / referenceMmInput;
      setScalePixelsPerMm(computedPpm);
      const newRefLine: BlueprintLine = {
        id: `ref-${Date.now()}`,
        ...activeDrawing,
        label: `Reference (${referenceMmInput} mm)`,
        isReference: true,
      };
      setLines((prev) => [...prev.filter((l) => !l.isReference), newRefLine]);
      setToolMode('measure');
      showToast(`Scale calibrated: ${distPx.toFixed(1)} px = ${referenceMmInput} mm (${computedPpm.toFixed(2)} px/mm)`, 'success');
    } else {
      if (!scalePixelsPerMm) {
        showToast('Please calibrate image scale first', 'warning');
        setActiveDrawing(null);
        return;
      }
      const realMm = distPx / scalePixelsPerMm;
      const newLine: BlueprintLine = {
        id: `line-${Date.now()}`,
        ...activeDrawing,
        label: `${realMm.toFixed(1)} mm`,
      };
      setLines((prev) => [...prev, newLine]);
      addItem({
        tool: 'Image Measurement',
        title: 'Blueprint Feature Dimension',
        value: `${realMm.toFixed(1)} mm`,
        rawNumericValue: realMm,
        unit: 'mm',
        details: `Measured on blueprint (${distPx.toFixed(0)}px at ${scalePixelsPerMm.toFixed(2)}px/mm)`,
      });
      showToast(`Measured: ${realMm.toFixed(1)} mm`, 'success');
    }

    setActiveDrawing(null);
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 pb-12 select-none">
      {/* Top Banner */}
      <div className="p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl bg-white/90 border border-[#DCE5F2] shadow-glass flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-blue-100 text-[#4385E8]">
              <ImageIcon className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-extrabold text-[#1D2940]">Image & Blueprint Measurement</h1>
          </div>
          <p className="text-sm text-[#66758D]">
            Upload CAD drawings, blueprints or component photos, calibrate known scale bar, and measure real dimensions.
          </p>
        </div>

        {/* Upload Action */}
        <div className="flex items-center gap-2 flex-wrap">
          {imageSrc !== SAMPLE_BLUEPRINT && (
            <button
              onClick={() => {
                setImageSrc(SAMPLE_BLUEPRINT);
                setLines([
                  { id: 'ref-1', x1: 200, y1: 410, x2: 400, y2: 410, label: 'Reference (100.0 mm)', isReference: true },
                  { id: 'meas-1', x1: 180, y1: 140, x2: 620, y2: 140, label: 'Length: 220.0 mm' },
                ]);
                setScalePixelsPerMm(2.0);
                setToolMode('measure');
                showToast('Sample blueprint restored.', 'info');
              }}
              className="px-3.5 py-2.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Sample Specimen</span>
            </button>
          )}

          <label className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#4385E8] to-[#8064E8] text-white font-bold text-xs shadow-md shadow-brand-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Upload Blueprint / Photo</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#DCE5F2] shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Tool Mode selector */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setToolMode('calibrate')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                toolMode === 'calibrate' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>1. Calibrate Reference Scale</span>
            </button>
            <button
              onClick={() => {
                if (!scalePixelsPerMm) {
                  showToast('Please calibrate reference scale first', 'warning');
                  return;
                }
                setToolMode('measure');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                toolMode === 'measure' ? 'bg-[#4385E8] text-white shadow-sm' : 'text-slate-600'
              }`}
            >
              <Ruler className="w-3.5 h-3.5" />
              <span>2. Measure Features</span>
            </button>
          </div>

          {toolMode === 'calibrate' && (
            <div className="flex items-center gap-2 ml-2">
              <span className="text-xs text-slate-500 font-medium">Known Physical Dimension:</span>
              <input
                type="number"
                value={referenceMmInput}
                onChange={(e) => setReferenceMmInput(Number(e.target.value))}
                className="w-20 px-2.5 py-1 text-xs font-mono font-bold rounded-lg border border-slate-200 outline-none"
              />
              <span className="text-xs font-bold text-slate-600">mm</span>
            </div>
          )}
        </div>

        {/* Current Scale Info & Reset */}
        <div className="flex items-center gap-3">
          {scalePixelsPerMm ? (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Calibrated ({scalePixelsPerMm.toFixed(2)} px/mm)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5" />
              Draw Reference Line to Calibrate
            </span>
          )}

          <button
            onClick={() => setLines([])}
            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900"
            title="Clear All Measurements"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Measurement Canvas with Image Background */}
      <div className="relative w-full rounded-2xl sm:rounded-3xl bg-slate-900 border border-[#DCE5F2] shadow-2xl overflow-hidden flex items-center justify-center min-h-[300px] sm:min-h-[420px] lg:min-h-[500px]">
        {/* Background Image / Blueprint */}
        {imageSrc === SAMPLE_BLUEPRINT ? (
          <svg
            viewBox="0 0 800 500"
            className="w-full h-auto max-h-[700px] object-contain pointer-events-none select-none"
            preserveAspectRatio="xMidYMid meet"
          >
            <rect width="800" height="500" fill="#0F172A" />
            <defs>
              <pattern id="sample-blueprint-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1E293B" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="800" height="500" fill="url(#sample-blueprint-grid)" />
            <g stroke="#38BDF8" strokeWidth="2" fill="none">
              <rect x="180" y="140" width="440" height="220" rx="10" />
              <circle cx="260" cy="250" r="45" />
              <circle cx="540" cy="250" r="45" />
              <line x1="260" y1="250" x2="540" y2="250" strokeDasharray="6 4" stroke="#94A3B8" />
            </g>
            <g fill="#94A3B8" fontFamily="monospace" fontSize="12">
              <text x="200" y="110">ENGINEERING SPECIMEN BLUEPRINT - MX-2026</text>
              <text x="200" y="390">SCALE BAR: [ 100 mm REFERENCE ]</text>
              <line x1="200" y1="410" x2="400" y2="410" stroke="#F59E0B" strokeWidth="4" />
              <line x1="200" y1="400" x2="200" y2="420" stroke="#F59E0B" strokeWidth="2" />
              <line x1="400" y1="400" x2="400" y2="420" stroke="#F59E0B" strokeWidth="2" />
            </g>
          </svg>
        ) : (
          <img
            src={imageSrc}
            alt="Measurement target"
            className="w-full h-auto max-h-[700px] object-contain pointer-events-none select-none"
            onError={() => {
              setImageSrc(SAMPLE_BLUEPRINT);
              showToast('Image could not be rendered. Restored standard blueprint specimen.', 'warning');
            }}
          />
        )}

        {/* Interactive Measurement SVG Overlay */}
        <svg
          ref={svgRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
        >
          {/* Committed Lines */}
          {lines.map((line) => {
            const midX = (line.x1 + line.x2) / 2;
            const midY = (line.y1 + line.y2) / 2;
            const strokeColor = line.isReference ? '#F59E0B' : '#38BDF8';

            return (
              <g key={line.id}>
                {/* Line */}
                <line
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke={strokeColor}
                  strokeWidth="2.5"
                  strokeDasharray={line.isReference ? '4 3' : 'none'}
                />
                {/* End Point Dots */}
                <circle cx={line.x1} cy={line.y1} r="4" fill={strokeColor} />
                <circle cx={line.x2} cy={line.y2} r="4" fill={strokeColor} />

                {/* Measurement Tag */}
                {line.label && (
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x="-45"
                      y="-12"
                      width="90"
                      height="24"
                      rx="12"
                      fill="#0F172A"
                      stroke={strokeColor}
                      strokeWidth="1.5"
                      opacity="0.95"
                    />
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                      fill="white"
                    >
                      {line.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Active Drawing Line */}
          {activeDrawing && (
            <g>
              <line
                x1={activeDrawing.x1}
                y1={activeDrawing.y1}
                x2={activeDrawing.x2}
                y2={activeDrawing.y2}
                stroke={toolMode === 'calibrate' ? '#F59E0B' : '#38BDF8'}
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <circle cx={activeDrawing.x1} cy={activeDrawing.y1} r="5" fill="#38BDF8" />
              <circle cx={activeDrawing.x2} cy={activeDrawing.y2} r="5" fill="#38BDF8" />
            </g>
          )}
        </svg>

        {/* Disclaimer Overlay */}
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] text-slate-300 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700 pointer-events-none">
          <span>
            ⚠️ <strong>Measurement Notice:</strong> Dimensional measurements assume planar geometry without lens perspective distortion.
          </span>
          <span className="font-mono">Lines Plotted: {lines.length}</span>
        </div>
      </div>
    </div>
  );
};

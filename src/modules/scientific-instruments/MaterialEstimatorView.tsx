import React, { useState } from 'react';
import { useHistoryStore } from '../../stores/historyStore';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import { soundEffects } from '../../utils/soundEffects';
import {
  Scale,
  DollarSign,
  Copy,
  Layers,
  Box,
  Coins,
  CheckCircle2,
  Package,
} from 'lucide-react';

interface Material {
  id: string;
  name: string;
  densityGPerCm3: number;
  category: string;
  defaultCostPerKg: number;
  color: string;
}

const MATERIALS: Material[] = [
  { id: 'ms', name: 'Mild Steel (A36 / 1018)', densityGPerCm3: 7.85, category: 'Ferrous', defaultCostPerKg: 1.25, color: '#64748B' },
  { id: 'ss304', name: 'Stainless Steel 304', densityGPerCm3: 7.93, category: 'Ferrous', defaultCostPerKg: 4.80, color: '#94A3B8' },
  { id: 'al6061', name: 'Aluminium 6061-T6', densityGPerCm3: 2.70, category: 'Non-Ferrous', defaultCostPerKg: 3.90, color: '#CBD5E1' },
  { id: 'brass', name: 'Brass C360 (Free Cutting)', densityGPerCm3: 8.50, category: 'Non-Ferrous', defaultCostPerKg: 7.50, color: '#EAB308' },
  { id: 'copper', name: 'Copper C110 (Electrolytic)', densityGPerCm3: 8.96, category: 'Non-Ferrous', defaultCostPerKg: 9.80, color: '#F97316' },
  { id: 'titanium', name: 'Titanium Grade 5 (Ti-6Al-4V)', densityGPerCm3: 4.43, category: 'Exotic', defaultCostPerKg: 28.50, color: '#94A3B8' },
  { id: 'acrylic', name: 'Acrylic PMMA Plexiglass', densityGPerCm3: 1.18, category: 'Polymer', defaultCostPerKg: 3.40, color: '#38BDF8' },
];

export const MaterialEstimatorView: React.FC = () => {
  const { addItem } = useHistoryStore();
  const { showToast } = useAppStore();
  const { requireAuth } = useAuthStore();

  const [shape, setShape] = useState<'plate' | 'round' | 'tube'>('plate');
  const [selectedMaterial, setSelectedMaterial] = useState<Material>(MATERIALS[0]);

  // Dimensions in millimeters
  const [lengthMm, setLengthMm] = useState<number>(300);
  const [widthMm, setWidthMm] = useState<number>(150);
  const [thicknessMm, setThicknessMm] = useState<number>(10);
  const [outerDiaMm, setOuterDiaMm] = useState<number>(50);
  const [innerDiaMm, setInnerDiaMm] = useState<number>(30);

  const [quantity, setQuantity] = useState<number>(10);
  const [costPerKg, setCostPerKg] = useState<number>(selectedMaterial.defaultCostPerKg);
  const [scrapPercent, setScrapPercent] = useState<number>(5);

  // Volume in cm3 calculation
  let singleVolumeCm3 = 0;
  if (shape === 'plate') {
    singleVolumeCm3 = (lengthMm * widthMm * thicknessMm) / 1000;
  } else if (shape === 'round') {
    const rCm = outerDiaMm / 20;
    const lCm = lengthMm / 10;
    singleVolumeCm3 = Math.PI * rCm * rCm * lCm;
  } else if (shape === 'tube') {
    const roCm = outerDiaMm / 20;
    const riCm = innerDiaMm / 20;
    const lCm = lengthMm / 10;
    singleVolumeCm3 = Math.PI * (roCm * roCm - riCm * riCm) * lCm;
  }

  // Mass calculations
  const singleMassKg = (singleVolumeCm3 * selectedMaterial.densityGPerCm3) / 1000;
  const singleMassLbs = singleMassKg * 2.20462;
  const batchMassKg = singleMassKg * quantity * (1 + scrapPercent / 100);
  const totalCostUsd = batchMassKg * costPerKg;

  const handleSelectMaterial = (mat: Material) => {
    setSelectedMaterial(mat);
    setCostPerKg(mat.defaultCostPerKg);
    soundEffects.click();
  };

  const handleLogMeasurement = () => {
    requireAuth('save material estimation', () => {
      addItem({
        tool: 'Material Estimator',
        title: `${quantity}× ${selectedMaterial.name}`,
        value: `${batchMassKg.toFixed(2)} kg`,
        rawNumericValue: parseFloat(batchMassKg.toFixed(2)),
        unit: 'kg',
        details: `Cost: $${totalCostUsd.toFixed(2)} USD, Shape: ${shape.toUpperCase()}, Density: ${selectedMaterial.densityGPerCm3} g/cm³, Unit Mass: ${singleMassKg.toFixed(3)} kg`,
      });
      showToast('Material estimation saved to Project History', 'success');
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 select-none pb-12">
      {/* Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-white/90 border border-[#DCE5F2] shadow-glass flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <Coins className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-[#1D2940]">Material Weight & Cost Estimator</h1>
          </div>
          <p className="text-xs md:text-sm text-[#66758D]">
            Calculate accurate raw stock volume, physical weight (kg / lbs), and manufacturing material cost.
          </p>
        </div>

        <button
          onClick={handleLogMeasurement}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4385E8] to-[#8064E8] text-white text-xs font-bold shadow-md shadow-brand-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
        >
          <Copy className="w-4 h-4" />
          <span>Save Estimate</span>
        </button>
      </div>

      {/* Main Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 3D Visualization & Calculation Cards */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {/* Visual Display */}
          <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border-2 border-slate-800 shadow-2xl flex flex-col items-center justify-center relative min-h-[380px]">
            <div className="absolute top-4 left-4 z-10">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {selectedMaterial.name} ({selectedMaterial.densityGPerCm3} g/cm³)
              </span>
            </div>

            <div className="absolute top-4 right-4 z-10 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Total Batch Cost
              </span>
              <span className="text-3xl font-mono font-black text-emerald-400">
                ${totalCostUsd.toFixed(2)}
              </span>
            </div>

            {/* Isometric SVG Representation of Shape */}
            <div className="w-full max-w-md h-60 flex items-center justify-center relative mt-6">
              <svg viewBox="0 0 320 200" className="w-full h-full drop-shadow-2xl overflow-visible">
                {shape === 'plate' && (
                  <g transform="translate(60, 40)">
                    {/* Isometric Rectangular Plate */}
                    <polygon points="0,50 140,10 240,40 100,80" fill={selectedMaterial.color} opacity="0.9" stroke="#E2E8F0" strokeWidth="1" />
                    <polygon points="0,50 100,80 100,105 0,75" fill={selectedMaterial.color} opacity="0.75" stroke="#E2E8F0" strokeWidth="1" />
                    <polygon points="100,80 240,40 240,65 100,105" fill={selectedMaterial.color} opacity="0.6" stroke="#E2E8F0" strokeWidth="1" />
                    <text x="50" y="70" fill="#0F172A" fontSize="10" fontWeight="bold" fontFamily="monospace">
                      {lengthMm} × {widthMm} × {thicknessMm} mm
                    </text>
                  </g>
                )}

                {shape === 'round' && (
                  <g transform="translate(80, 50)">
                    {/* Cylindrical Round Bar */}
                    <rect x="30" y="30" width="160" height="50" fill={selectedMaterial.color} opacity="0.8" stroke="#E2E8F0" strokeWidth="1" />
                    <ellipse cx="190" cy="55" rx="15" ry="25" fill={selectedMaterial.color} opacity="0.6" stroke="#E2E8F0" strokeWidth="1" />
                    <ellipse cx="30" cy="55" rx="15" ry="25" fill={selectedMaterial.color} opacity="0.95" stroke="#E2E8F0" strokeWidth="1" />
                    <text x="60" y="60" fill="#0F172A" fontSize="10" fontWeight="bold" fontFamily="monospace">
                      Ø{outerDiaMm} × {lengthMm} mm
                    </text>
                  </g>
                )}

                {shape === 'tube' && (
                  <g transform="translate(80, 50)">
                    {/* Hollow Tube */}
                    <rect x="30" y="30" width="160" height="50" fill={selectedMaterial.color} opacity="0.8" stroke="#E2E8F0" strokeWidth="1" />
                    <ellipse cx="190" cy="55" rx="15" ry="25" fill={selectedMaterial.color} opacity="0.6" stroke="#E2E8F0" strokeWidth="1" />
                    <ellipse cx="30" cy="55" rx="15" ry="25" fill={selectedMaterial.color} opacity="0.95" stroke="#E2E8F0" strokeWidth="1" />
                    <ellipse cx="30" cy="55" rx="8" ry="14" fill="#0F172A" stroke="#E2E8F0" strokeWidth="1" />
                    <text x="60" y="60" fill="#0F172A" fontSize="10" fontWeight="bold" fontFamily="monospace">
                      Ø{outerDiaMm}/Ø{innerDiaMm} × {lengthMm} mm
                    </text>
                  </g>
                )}
              </svg>
            </div>

            {/* Quick Metrics Bar */}
            <div className="w-full mt-2 p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between text-xs">
              <span className="text-slate-300 font-mono">
                Single Mass: <span className="text-cyan-400 font-bold">{singleMassKg.toFixed(3)} kg</span>
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 font-mono">
                Batch Mass: <span className="text-emerald-400 font-bold">{batchMassKg.toFixed(2)} kg</span>
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 font-mono">
                Volume: <span className="text-amber-400 font-bold">{singleVolumeCm3.toFixed(1)} cm³</span>
              </span>
            </div>
          </div>

          {/* Mass & Quantity Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-[#DCE5F2] shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Unit Weight (Metric)</span>
              <span className="text-lg font-mono font-black text-[#1D2940]">{singleMassKg.toFixed(3)} kg</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#DCE5F2] shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Unit Weight (Imperial)</span>
              <span className="text-lg font-mono font-black text-[#1D2940]">{singleMassLbs.toFixed(2)} lbs</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#DCE5F2] shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Batch Qty</span>
              <span className="text-lg font-mono font-black text-[#4385E8]">{quantity} Pcs</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#DCE5F2] shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Material Rate</span>
              <span className="text-lg font-mono font-black text-emerald-600">${costPerKg.toFixed(2)} /kg</span>
            </div>
          </div>
        </div>

        {/* Right Column: Dimensions Form & Materials List */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Shape Selector */}
          <div className="p-6 rounded-3xl bg-white border border-[#DCE5F2] shadow-sm flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              1. Geometry Shape
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setShape('plate')}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  shape === 'plate' ? 'bg-[#4385E8] text-white border-[#4385E8]' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                Plate / Bar
              </button>
              <button
                onClick={() => setShape('round')}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  shape === 'round' ? 'bg-[#4385E8] text-white border-[#4385E8]' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                Round Rod
              </button>
              <button
                onClick={() => setShape('tube')}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  shape === 'tube' ? 'bg-[#4385E8] text-white border-[#4385E8]' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                Hollow Tube
              </button>
            </div>

            {/* Inputs based on shape */}
            <div className="flex flex-col gap-3 mt-2">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 font-bold">Length:</span>
                  <span className="font-mono font-bold text-[#1D2940]">{lengthMm} mm</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="2000"
                  step="10"
                  value={lengthMm}
                  onChange={(e) => setLengthMm(Number(e.target.value))}
                  className="accent-[#4385E8]"
                />
              </div>

              {shape === 'plate' && (
                <>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 font-bold">Width:</span>
                      <span className="font-mono font-bold text-[#1D2940]">{widthMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="1000"
                      step="5"
                      value={widthMm}
                      onChange={(e) => setWidthMm(Number(e.target.value))}
                      className="accent-[#4385E8]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 font-bold">Thickness:</span>
                      <span className="font-mono font-bold text-[#1D2940]">{thicknessMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={thicknessMm}
                      onChange={(e) => setThicknessMm(Number(e.target.value))}
                      className="accent-[#4385E8]"
                    />
                  </div>
                </>
              )}

              {(shape === 'round' || shape === 'tube') && (
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-bold">Outer Diameter (Ø):</span>
                    <span className="font-mono font-bold text-[#1D2940]">{outerDiaMm} mm</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={outerDiaMm}
                    onChange={(e) => setOuterDiaMm(Number(e.target.value))}
                    className="accent-[#4385E8]"
                  />
                </div>
              )}

              {shape === 'tube' && (
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-bold">Inner Bore (Ø):</span>
                    <span className="font-mono font-bold text-[#1D2940]">{innerDiaMm} mm</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max={outerDiaMm - 2}
                    value={innerDiaMm}
                    onChange={(e) => setInnerDiaMm(Number(e.target.value))}
                    className="accent-[#4385E8]"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-600">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-xl border border-slate-200 outline-none focus:border-[#4385E8]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-600">Rate ($/kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={costPerKg}
                    onChange={(e) => setCostPerKg(Math.max(0.1, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-xl border border-slate-200 outline-none focus:border-[#4385E8]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Materials List */}
          <div className="p-6 rounded-3xl bg-white border border-[#DCE5F2] shadow-sm flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              2. Material Alloy Selection
            </span>

            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
              {MATERIALS.map((mat) => {
                const isSelected = selectedMaterial.id === mat.id;
                return (
                  <button
                    key={mat.id}
                    onClick={() => handleSelectMaterial(mat)}
                    className={`p-2.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50/70 border-brand-blue text-[#1D2940] shadow-xs font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                    }`}
                  >
                    <div>
                      <span className="text-xs block">{mat.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {mat.densityGPerCm3} g/cm³ • ${mat.defaultCostPerKg}/kg
                      </span>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-[#4385E8]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

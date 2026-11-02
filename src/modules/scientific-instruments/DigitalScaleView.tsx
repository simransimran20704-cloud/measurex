import React, { useState, useEffect } from 'react';
import { useHistoryStore } from '../../stores/historyStore';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import { soundEffects } from '../../utils/soundEffects';
import {
  Scale,
  RotateCcw,
  Copy,
  Sliders,
  Package,
  Layers,
  CheckCircle2,
  Cpu,
  Hash,
} from 'lucide-react';

type MassUnit = 'g' | 'mg' | 'kg' | 'ct' | 'oz';

const SPECIMENS = [
  { id: 'empty', name: 'Empty Pan (0.000 g)', weightG: 0 },
  { id: 'weighBoat', name: 'Plastic Weigh Boat (4.250 g)', weightG: 4.25 },
  { id: 'beaker', name: 'Glass Beaker 100mL (112.400 g)', weightG: 112.4 },
  { id: 'calWeight', name: 'Brass Weight Standard (50.000 g)', weightG: 50.0 },
  { id: 'diamond', name: 'Gemstone Specimen (0.200 g = 1.0 ct)', weightG: 0.2 },
  { id: 'powder', name: 'Chemical Reagent Powder (14.850 g)', weightG: 14.85 },
];

export const DigitalScaleView: React.FC = () => {
  const { addItem } = useHistoryStore();
  const { showToast } = useAppStore();
  const { requireAuth } = useAuthStore();

  const [grossWeightG, setGrossWeightG] = useState<number>(50.0);
  const [tareWeightG, setTareWeightG] = useState<number>(0.0);
  const [selectedUnit, setSelectedUnit] = useState<MassUnit>('g');
  const [countMode, setCountMode] = useState<boolean>(false);
  const [pieceWeightG, setPieceWeightG] = useState<number>(0.25); // 250mg per piece
  const [selectedSpecimen, setSelectedSpecimen] = useState<string>('calWeight');
  const [isStable, setIsStable] = useState<boolean>(true);

  // Net Weight calculation
  const netWeightG = Math.max(0, grossWeightG - tareWeightG);

  // Convert Net Weight to selected unit
  const formatNetWeight = (valG: number, unit: MassUnit) => {
    switch (unit) {
      case 'g':
        return valG.toFixed(3);
      case 'mg':
        return (valG * 1000).toFixed(1);
      case 'kg':
        return (valG / 1000).toFixed(5);
      case 'ct':
        return (valG * 5).toFixed(3); // 1g = 5 carats
      case 'oz':
        return (valG * 0.035274).toFixed(4);
    }
  };

  // Pieces count
  const piecesCount = Math.round(netWeightG / pieceWeightG);

  // Trigger settling stabilization effect on weight change
  useEffect(() => {
    setIsStable(false);
    const timer = setTimeout(() => setIsStable(true), 350);
    return () => clearTimeout(timer);
  }, [grossWeightG, tareWeightG, selectedUnit]);

  const handleTare = () => {
    setTareWeightG(grossWeightG);
    soundEffects.playRatchetClick();
    showToast(`Tared at ${grossWeightG.toFixed(3)} g. Display set to zero.`, 'info');
  };

  const handleZeroAll = () => {
    setGrossWeightG(0);
    setTareWeightG(0);
    setSelectedSpecimen('empty');
    soundEffects.playLockSnap(false);
    showToast('Pan cleared & zeroed', 'info');
  };

  const handleSelectSpecimen = (id: string) => {
    setSelectedSpecimen(id);
    const spec = SPECIMENS.find((s) => s.id === id);
    if (spec) {
      setGrossWeightG(spec.weightG);
      soundEffects.playRatchetClick();
      showToast(`Placed on pan: ${spec.name}`, 'success');
    }
  };

  const handleCopy = () => {
    const formatted = `${formatNetWeight(netWeightG, selectedUnit)} ${selectedUnit}`;
    navigator.clipboard.writeText(formatted);
    requireAuth('log mass measurement to history', () => {
      addItem({
        tool: 'Digital Precision Scale',
        title: `Analytical Mass (${formatted})`,
        value: formatted,
        rawNumericValue: netWeightG,
        unit: selectedUnit,
        details: `Gross: ${grossWeightG.toFixed(3)}g | Tare: ${tareWeightG.toFixed(3)}g | Count: ${piecesCount} pcs`,
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
            <span className="p-1.5 rounded-xl bg-cyan-100 text-[#0891B2] font-bold text-xs">LAB-07</span>
            <h1 className="text-xl font-extrabold text-[#1D2940]">Digital Precision Scale Lab</h1>
          </div>
          <p className="text-xs text-[#66758D]">
            0.001 g high-resolution analytical laboratory balance with tare subtraction, unit switching, and parts counting.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCountMode(!countMode)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              countMode ? 'bg-[#4385E8] text-white shadow-sm' : 'bg-slate-100 text-slate-600'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>{countMode ? 'Counting (PCS)' : 'Weighing Mode'}</span>
          </button>

          <button
            onClick={handleZeroAll}
            title="Clear & Reset Scale"
            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lab Specimen Selection Bar */}
      <div className="p-4 rounded-2xl bg-white/80 border border-[#DCE5F2] shadow-sm flex flex-wrap items-center justify-between gap-3 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-cyan-600" />
          <span className="text-xs font-bold text-[#1D2940]">Laboratory Standard Specimens:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {SPECIMENS.map((spec) => (
            <button
              key={spec.id}
              onClick={() => handleSelectSpecimen(spec.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedSpecimen === spec.id
                  ? 'bg-gradient-to-r from-cyan-500 to-[#4385E8] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {spec.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Analytical Scale SVG Stage */}
      <div className="relative w-full overflow-x-auto p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col items-center justify-center min-h-[480px]">
        <div className="relative w-[780px] h-[400px]">
          <svg viewBox="0 0 780 400" className="w-full h-full filter drop-shadow-md">
            <defs>
              <linearGradient id="scalePan" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#CBD5E1" />
                <stop offset="30%" stopColor="#F8FAFC" />
                <stop offset="70%" stopColor="#94A3B8" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>

              <linearGradient id="scaleHousing" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1E293B" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>
            </defs>

            {/* Background Grid */}
            <rect width="780" height="400" fill="#0B132B" />

            {/* Scale Housing Base */}
            <rect x="180" y="240" width="420" height="130" rx="16" fill="url(#scaleHousing)" stroke="#334155" strokeWidth="2" />
            <circle cx="210" cy="355" r="8" fill="#475569" />
            <circle cx="570" cy="355" r="8" fill="#475569" />

            {/* Glass Draft Shield Enclosure (translucent rectangle) */}
            <rect x="230" y="40" width="320" height="180" rx="8" fill="#38BDF8" fillOpacity="0.05" stroke="#38BDF8" strokeWidth="1.2" strokeDasharray="4 2" />
            <line x1="230" y1="55" x2="550" y2="55" stroke="#38BDF8" strokeWidth="0.8" opacity="0.6" />
            <text x="390" y="32" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">
              ANALYTICAL GLASS DRAFT SHIELD
            </text>

            {/* Weighing Pan Pillar */}
            <rect x="375" y="190" width="30" height="50" fill="#64748B" stroke="#475569" strokeWidth="1" />
            {/* Polished Stainless Steel Weighing Pan (120mm) */}
            <ellipse cx="390" cy="190" rx="110" ry="22" fill="url(#scalePan)" stroke="#475569" strokeWidth="1.5" />
            <ellipse cx="390" cy="190" rx="90" ry="16" fill="none" stroke="#94A3B8" strokeWidth="0.8" />

            {/* Specimen Rendered on the Pan */}
            {selectedSpecimen === 'calWeight' && (
              <g transform="translate(390, 155)">
                <rect x="-20" y="0" width="40" height="30" rx="2" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
                <circle cx="0" cy="-4" r="8" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
                <text x="0" y="18" textAnchor="middle" fill="#78350F" fontSize="9" fontWeight="bold" fontFamily="monospace">50g</text>
              </g>
            )}

            {selectedSpecimen === 'beaker' && (
              <g transform="translate(390, 115)">
                <rect x="-35" y="0" width="70" height="70" rx="3" fill="#38BDF8" fillOpacity="0.18" stroke="#38BDF8" strokeWidth="1.5" />
                <line x1="-35" y1="20" x2="-20" y2="20" stroke="#38BDF8" strokeWidth="1" />
                <line x1="-35" y1="35" x2="-15" y2="35" stroke="#38BDF8" strokeWidth="1" />
                <line x1="-35" y1="50" x2="-20" y2="50" stroke="#38BDF8" strokeWidth="1" />
              </g>
            )}

            {selectedSpecimen === 'weighBoat' && (
              <polygon points="330,185 450,185 430,175 350,175" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
            )}

            {selectedSpecimen === 'diamond' && (
              <polygon points="390,170 405,182 390,188 375,182" fill="#38BDF8" stroke="white" strokeWidth="1" />
            )}

            {selectedSpecimen === 'powder' && (
              <ellipse cx="390" cy="186" rx="35" ry="8" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="0.8" />
            )}

            {/* Glowing High-Contrast Digital Blue LCD Screen */}
            <g transform="translate(230, 260)">
              <rect x="0" y="0" width="320" height="90" rx="10" fill="#020617" stroke="#38BDF8" strokeWidth="1.5" />

              {/* Status Flags */}
              <g transform="translate(16, 22)">
                <circle cx="0" cy="0" r="4" fill={isStable ? '#10B981' : '#F59E0B'} />
                <text x="8" y="3" fill={isStable ? '#10B981' : '#F59E0B'} fontSize="9" fontWeight="bold" fontFamily="monospace">
                  {isStable ? 'STABLE' : 'SETTLING...'}
                </text>
                {tareWeightG > 0 && (
                  <text x="80" y="3" fill="#38BDF8" fontSize="9" fontWeight="bold" fontFamily="monospace">
                    [TARED -{tareWeightG.toFixed(3)}g]
                  </text>
                )}
              </g>

              {/* Large Digital Numbers */}
              <text x="240" y="65" textAnchor="end" fill="#38BDF8" fontSize="38" fontWeight="extrabold" fontFamily="monospace" letterSpacing="1">
                {countMode ? piecesCount : formatNetWeight(netWeightG, selectedUnit)}
              </text>

              {/* Selected Unit Badge */}
              <text x="252" y="62" fill="#38BDF8" fontSize="18" fontWeight="bold" fontFamily="monospace">
                {countMode ? 'PCS' : selectedUnit}
              </text>
            </g>
          </svg>
        </div>

        {/* Physical Front Panel Buttons */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={handleTare}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold text-xs shadow-md transition-all active:scale-95"
          >
            TARE / ZERO
          </button>

          <button
            onClick={() => {
              const units: MassUnit[] = ['g', 'mg', 'kg', 'ct', 'oz'];
              const nextIdx = (units.indexOf(selectedUnit) + 1) % units.length;
              setSelectedUnit(units[nextIdx]);
              soundEffects.playSliderTick();
            }}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95 border border-slate-700"
          >
            UNIT ({selectedUnit.toUpperCase()})
          </button>

          <button
            onClick={() => {
              setCountMode(!countMode);
              soundEffects.playSliderTick();
            }}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95 border border-slate-700"
          >
            PCS (COUNT)
          </button>

          <button
            onClick={handleCopy}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-[#4385E8] text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Log Mass</span>
          </button>
        </div>
      </div>

      {/* Manual Mass Slider & Reading Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-white border border-[#DCE5F2] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#1D2940]">Continuous Pan Load Adjustment:</span>
            <span className="font-mono text-xs font-bold text-cyan-600">{grossWeightG.toFixed(3)} g</span>
          </div>
          <input
            type="range"
            min="0"
            max="300"
            step="0.05"
            value={grossWeightG}
            onChange={(e) => {
              setGrossWeightG(Number(e.target.value));
              setSelectedSpecimen('custom');
            }}
            className="w-full accent-cyan-500"
          />
          <p className="text-[11px] text-[#8E9CAE] mt-3">
            💡 Analytical scale damping settling time: ~350ms. Press <strong>TARE</strong> to subtract container mass.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#DCE5F2] shadow-sm flex items-center justify-around text-center">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold">Gross Load</span>
            <div className="text-lg font-mono font-extrabold text-slate-800 mt-1">{grossWeightG.toFixed(3)} g</div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold">Tare Container</span>
            <div className="text-lg font-mono font-extrabold text-amber-600 mt-1">-{tareWeightG.toFixed(3)} g</div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold">Net Mass</span>
            <div className="text-xl font-mono font-black text-cyan-600 mt-1">{netWeightG.toFixed(3)} g</div>
          </div>
        </div>
      </div>
    </div>
  );
};

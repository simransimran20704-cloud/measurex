import React, { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { MagneticCard } from '../../components/common/MagneticCard';
import {
  FlaskConical,
  Compass,
  Ruler,
  Scale,
  Gauge,
  ArrowRight,
  Sparkles,
  Lock,
  Layers,
  RotateCw,
} from 'lucide-react';

export const ScientificInstrumentsView: React.FC = () => {
  const { setActiveTab, showToast } = useAppStore();

  // Interactive Digital Protractor State
  const [protractorAngle, setProtractorAngle] = useState(45);
  // Interactive Digital Weighing Scale State
  const [scaleWeight, setScaleWeight] = useState(148.5);
  const [tareWeight, setTareWeight] = useState(0);

  const instruments = [
    {
      id: 'vernier',
      name: 'Vernier Caliper',
      status: 'Ready',
      category: 'Dimensional',
      description: 'Dual-scale sliding caliper with external, internal and depth measurement.',
      icon: Ruler,
      color: 'text-[#4385E8] bg-blue-50 border-blue-200',
      action: () => setActiveTab('vernier-caliper'),
    },
    {
      id: 'micrometer',
      name: 'Screw Gauge (Micrometer)',
      status: 'Ready',
      category: 'Dimensional',
      description: 'Ultra-high precision 0.01 mm spindle instrument with ratchet mechanism.',
      icon: Compass,
      color: 'text-[#8064E8] bg-purple-50 border-purple-200',
      action: () => setActiveTab('screw-gauge'),
    },
    {
      id: 'protractor',
      name: 'Digital Angle Protractor',
      status: 'Interactive',
      category: 'Angular',
      description: '360° rotary measurement arm with real-time digital degree readout.',
      icon: Compass,
      color: 'text-[#16A078] bg-emerald-50 border-emerald-200',
      action: null,
    },
    {
      id: 'scale',
      name: 'Digital Precision Scale',
      status: 'Interactive',
      category: 'Mass',
      description: 'High-precision lab balance with Tare function and instant unit switching.',
      icon: Scale,
      color: 'text-[#36C6DA] bg-cyan-50 border-cyan-200',
      action: null,
    },
    {
      id: 'height-gauge',
      name: 'Vernier Height Gauge',
      status: 'Upcoming',
      category: 'Metrology',
      description: 'Surface plate granite-mounted vertical scriber and height measurement standard.',
      icon: Layers,
      color: 'text-slate-500 bg-slate-50 border-slate-200',
      action: () => showToast('Vernier Height Gauge is scheduled for Phase 9 release.', 'info'),
    },
    {
      id: 'dial-indicator',
      name: 'Dial Test Indicator',
      status: 'Upcoming',
      category: 'Deflection',
      description: 'Plunger rack-and-pinion indicator for runout, flatness, and parallelism.',
      icon: Gauge,
      color: 'text-slate-500 bg-slate-50 border-slate-200',
      action: () => showToast('Dial Indicator simulator is scheduled for Phase 9 release.', 'info'),
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 pb-12 select-none">
      {/* Header */}
      <div className="p-8 rounded-3xl bg-white/90 border border-[#DCE5F2] shadow-glass flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-purple-100 text-[#8064E8]">
              <FlaskConical className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-extrabold text-[#1D2940]">Scientific Instruments Laboratory</h1>
          </div>
          <p className="text-sm text-[#66758D]">
            Explore digital simulators for dimensional metrology, angular geometry, and scientific measurement.
          </p>
        </div>
      </div>

      {/* Interactive Mini-Instruments Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Digital Protractor Simulator */}
        <div className="p-6 rounded-3xl bg-white border border-[#DCE5F2] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Compass className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-sm text-[#1D2940]">Digital 360° Protractor</h3>
                <span className="text-[11px] text-slate-500">Rotate arm or adjust angle</span>
              </div>
            </div>
            <span className="text-xs font-mono font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {protractorAngle}&deg;
            </span>
          </div>

          {/* SVG Protractor */}
          <div className="relative w-full h-44 flex items-center justify-center bg-slate-50/70 rounded-2xl border border-slate-100 overflow-hidden">
            <svg viewBox="0 0 200 120" className="w-48 h-32">
              {/* Semi-circle base */}
              <path d="M 20 100 A 80 80 0 0 1 180 100 Z" fill="#EEF4FF" stroke="#4385E8" strokeWidth="1.5" />
              {/* Center point */}
              <circle cx="100" cy="100" r="4" fill="#1D2940" />

              {/* Angle arm */}
              {(() => {
                const rad = (protractorAngle * Math.PI) / 180;
                const armX = 100 + 75 * Math.cos(Math.PI - rad);
                const armY = 100 - 75 * Math.sin(Math.PI - rad);
                return (
                  <g>
                    <line x1="100" y1="100" x2={armX} y2={armY} stroke="#16A078" strokeWidth="3" strokeLinecap="round" />
                    <circle cx={armX} cy={armY} r="5" fill="#16A078" />
                  </g>
                );
              })()}
            </svg>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <span className="text-xs text-slate-500">Angle:</span>
            <input
              type="range"
              min="0"
              max="180"
              value={protractorAngle}
              onChange={(e) => setProtractorAngle(Number(e.target.value))}
              className="flex-1 accent-[#16A078]"
            />
            <span className="font-mono text-xs font-bold text-slate-800 w-12 text-right">
              {protractorAngle}&deg;
            </span>
          </div>
        </div>

        {/* 2. Digital Precision Weighing Scale */}
        <div className="p-6 rounded-3xl bg-white border border-[#DCE5F2] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
                <Scale className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-sm text-[#1D2940]">Digital Precision Scale</h3>
                <span className="text-[11px] text-slate-500">Laboratory analytical balance</span>
              </div>
            </div>
            <button
              onClick={() => {
                setTareWeight(scaleWeight);
                showToast('Scale tared to 0.00 g', 'info');
              }}
              className="px-3 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            >
              Tare (Zero)
            </button>
          </div>

          {/* Scale LCD */}
          <div className="p-6 rounded-2xl bg-slate-900 border-2 border-slate-800 flex flex-col items-center justify-center text-cyan-400 font-mono shadow-inner">
            <span className="text-4xl font-extrabold tracking-wider">
              {Math.max(0, scaleWeight - tareWeight).toFixed(2)}
            </span>
            <span className="text-xs text-cyan-200 mt-1">GRAMS (g)</span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <span className="text-xs text-slate-500">Simulate Mass:</span>
            <input
              type="range"
              min="0"
              max="500"
              step="0.5"
              value={scaleWeight}
              onChange={(e) => setScaleWeight(Number(e.target.value))}
              className="flex-1 accent-[#36C6DA]"
            />
            <span className="font-mono text-xs font-bold text-slate-800 w-16 text-right">
              {scaleWeight.toFixed(1)} g
            </span>
          </div>
        </div>
      </div>

      {/* Main Instruments Grid */}
      <h2 className="text-lg font-bold text-[#1D2940] mt-4">Instrument Library</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {instruments.map((inst) => {
          const Icon = inst.icon;
          const isUpcoming = inst.status === 'Upcoming';

          return (
            <MagneticCard
              key={inst.id}
              onClick={inst.action || undefined}
              className={`p-6 flex flex-col justify-between ${
                isUpcoming ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-2xl border ${inst.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      inst.status === 'Ready'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : inst.status === 'Interactive'
                        ? 'bg-blue-50 text-[#4385E8] border-blue-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {inst.status}
                  </span>
                </div>

                <h3 className="font-bold text-base text-[#1D2940] mb-1">{inst.name}</h3>
                <p className="text-xs text-[#66758D] leading-relaxed mb-4">{inst.description}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-semibold">
                <span className="text-slate-400">{inst.category}</span>
                {isUpcoming ? (
                  <span className="flex items-center gap-1 text-slate-400">
                    <Lock className="w-3.5 h-3.5" /> Upcoming
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[#4385E8] group-hover:translate-x-1 transition-transform">
                    Launch <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </MagneticCard>
          );
        })}
      </div>
    </div>
  );
};

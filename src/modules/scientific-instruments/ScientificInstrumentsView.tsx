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
  Award,
  Target,
  Circle,
  Settings2,
  Coins,
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
      id: 'height-gauge',
      name: 'Vernier Height Gauge',
      status: 'Ready',
      category: 'Metrology',
      description: 'Surface plate granite-mounted vertical scriber and height measurement standard.',
      icon: Layers,
      color: 'text-[#8064E8] bg-purple-50 border-purple-200',
      action: () => setActiveTab('vernier-height-gauge'),
    },
    {
      id: 'dial-indicator',
      name: 'Dial Test Indicator',
      status: 'Ready',
      category: 'Deflection',
      description: 'Plunger rack-and-pinion 0.01 mm indicator for runout, flatness, and cam TIR.',
      icon: Gauge,
      color: 'text-[#0284C7] bg-cyan-50 border-cyan-200',
      action: () => setActiveTab('dial-indicator'),
    },
    {
      id: 'digital-compass',
      name: 'Digital Drafting Compass',
      status: 'Ready',
      category: 'Geometric',
      description: 'Direct radius input compass for concentric circles, pitch diameters, and arc sweeps.',
      icon: Compass,
      color: 'text-[#4385E8] bg-blue-50 border-blue-200',
      action: () => setActiveTab('digital-compass'),
    },
    {
      id: 'protractor',
      name: 'Digital Angle Protractor',
      status: 'Ready',
      category: 'Angular',
      description: '360° rotary measurement arm with real-time digital degree readout.',
      icon: Compass,
      color: 'text-[#16A078] bg-emerald-50 border-emerald-200',
      action: () => setActiveTab('digital-protractor'),
    },
    {
      id: 'scale',
      name: 'Digital Precision Scale',
      status: 'Ready',
      category: 'Mass',
      description: 'High-precision lab balance with Tare function and instant unit switching.',
      icon: Scale,
      color: 'text-[#36C6DA] bg-cyan-50 border-cyan-200',
      action: () => setActiveTab('digital-scale'),
    },
    {
      id: 'thread-pitch-gauge',
      name: 'Screw Thread Pitch Gauge',
      status: 'Ready',
      category: 'Workshop',
      description: 'Metric and Imperial leaf blades with light gap inspection over screw threads.',
      icon: Layers,
      color: 'text-[#8064E8] bg-purple-50 border-purple-200',
      action: () => setActiveTab('thread-pitch-gauge'),
    },
    {
      id: 'feeler-gauge',
      name: 'Precision Feeler Gauge',
      status: 'Ready',
      category: 'Clearance',
      description: 'Hardened steel leaves (0.02mm to 1.00mm) for spark plug and valve tappet gap checks.',
      icon: Layers,
      color: 'text-[#0284C7] bg-cyan-50 border-cyan-200',
      action: () => setActiveTab('feeler-gauge'),
    },
    {
      id: 'spirit-level',
      name: 'Digital Spirit Level',
      status: 'Ready',
      category: 'Inclinometer',
      description: 'Dual-axis bullseye surface bubble level, tubular beam vial, and pitch/roll readout.',
      icon: Target,
      color: 'text-[#16A078] bg-emerald-50 border-emerald-200',
      action: () => setActiveTab('spirit-level'),
    },
    {
      id: 'pcd-generator',
      name: 'Bolt Pattern & PCD Generator',
      status: 'Ready',
      category: 'CAD / Flanges',
      description: 'Pitch Circle Diameter calculator, chordal hole spacing, and CNC machine coordinates.',
      icon: Circle,
      color: 'text-[#4385E8] bg-blue-50 border-blue-200',
      action: () => setActiveTab('pcd-generator'),
    },
    {
      id: 'limits-fits',
      name: 'ISO Limits & Fits Calculator',
      status: 'Ready',
      category: 'Tolerancing',
      description: 'ISO 286 hole-shaft tolerance zones, Clearance/Interference fits, and Go/No-Go gauges.',
      icon: Settings2,
      color: 'text-[#8064E8] bg-purple-50 border-purple-200',
      action: () => setActiveTab('limits-fits'),
    },
    {
      id: 'material-estimator',
      name: 'Material Weight & Cost Estimator',
      status: 'Ready',
      category: 'Commercial',
      description: 'Raw stock volume, physical mass (kg/lbs), and batch manufacturing material cost.',
      icon: Coins,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      action: () => setActiveTab('material-estimator'),
    },
    {
      id: 'spherometer',
      name: 'Spherometer Curvature Lab',
      status: 'Ready',
      category: 'Optical',
      description: '3-legged physics instrument for radius of curvature (R) and focal power of lenses.',
      icon: Compass,
      color: 'text-[#0284C7] bg-cyan-50 border-cyan-200',
      action: () => setActiveTab('spherometer'),
    },
    {
      id: 'metrology-quiz',
      name: 'Practice & Certification Exam',
      status: 'Ready',
      category: 'Certification',
      description: 'Interactive test simulator for Caliper and Micrometer with certificate generator.',
      icon: Award,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      action: () => setActiveTab('metrology-quiz'),
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
          <button
            onClick={() => setActiveTab('digital-protractor')}
            className="mt-3 w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-emerald-200"
          >
            <span>Launch Full 360° Laboratory Protractor</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
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
          <button
            onClick={() => setActiveTab('digital-scale')}
            className="mt-3 w-full py-2 px-3 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-cyan-200"
          >
            <span>Launch Full 0.001g Analytical Balance</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
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

import React, { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { X, Play, ArrowRight, CheckCircle2, Ruler, Crosshair, Compass, Sparkles } from 'lucide-react';

export const DemoModal: React.FC = () => {
  const { isDemoModalOpen, setIsDemoModalOpen, setActiveTab } = useAppStore();
  const [activeStep, setActiveStep] = useState(0);

  if (!isDemoModalOpen) return null;

  const steps = [
    {
      title: 'Precision Studio & 3-Sided Rulers',
      desc: 'The left vertical, right vertical, and bottom horizontal rulers stay synchronized in real time as you pan, zoom, place points and measure geometric distances.',
      icon: Crosshair,
      tag: 'Precision Engine',
    },
    {
      title: 'Authentic Vernier Caliper Simulator',
      desc: 'Accurately simulates main scale markings, sliding vernier divisions with automatic coincidence detection, least count configuration (0.02mm, 0.1mm), and zero error adjustment.',
      icon: Compass,
      tag: 'Scientific Lab',
    },
    {
      title: 'Digital Micrometer Screw Gauge',
      desc: 'Rotating thimble moves spindle with physically authentic pitch (0.5mm/turn) and 50 circular divisions. Toggle instant high-precision digital LCD readout.',
      icon: Ruler,
      tag: 'Micro Precision',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-white/90 shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-purple-50/50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4385E8] animate-ping" />
            <span className="font-bold text-sm text-[#1D2940]">MeasureX Interactive Tour</span>
          </div>
          <button
            onClick={() => setIsDemoModalOpen(false)}
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video / Interactive Visual Simulation */}
        <div className="p-6">
          <div className="relative w-full h-56 rounded-2xl bg-gradient-to-br from-[#1D2940] to-[#0F172A] p-5 flex flex-col justify-between text-white overflow-hidden shadow-inner">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-60 h-60 bg-[#4385E8]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-[#8064E8]/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-semibold text-blue-300 border border-white/10">
                {steps[activeStep].tag}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Step {activeStep + 1} of {steps.length}
              </span>
            </div>

            <div className="relative z-10 my-auto text-center px-4">
              <h3 className="text-xl font-bold mb-2 text-white">
                {steps[activeStep].title}
              </h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                {steps[activeStep].desc}
              </p>
            </div>

            {/* Step Indicators */}
            <div className="relative z-10 flex items-center justify-center gap-2">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStep(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    activeStep === i ? 'w-8 bg-[#4385E8]' : 'w-2 bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => setActiveStep((prev) => (prev > 0 ? prev - 1 : steps.length - 1))}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Previous
            </button>

            <div className="flex items-center gap-3">
              {activeStep < steps.length - 1 ? (
                <button
                  onClick={() => setActiveStep((prev) => prev + 1)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4385E8] to-[#8064E8] text-white text-xs font-bold hover:shadow-lg transition-all flex items-center gap-1.5"
                >
                  <span>Next Feature</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsDemoModalOpen(false);
                    setActiveTab('precision-studio');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-[#16A078] text-white text-xs font-bold hover:shadow-lg transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Launch Precision Studio</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

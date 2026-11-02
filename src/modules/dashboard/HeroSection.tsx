import React from 'react';
import { useAppStore } from '../../stores/appStore';
import { HeroVisual } from './HeroVisual';
import { ArrowRight, Play } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const { setActiveTab, setIsDemoModalOpen } = useAppStore();

  return (
    <section className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-white/90 via-[#F3F7FF]/90 to-[#EBF1FF]/80 border border-white/90 shadow-glass p-8 lg:p-10 mb-8 backdrop-blur-xl">
      {/* Background Soft Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-gradient-to-b from-[#36C6DA]/15 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 right-10 w-80 h-80 rounded-full bg-[#8064E8]/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Heading, Subtitle & Action Buttons */}
        <div className="lg:col-span-6 flex flex-col justify-center">
          <h1 className="text-4xl sm:text-5xl lg:text-[46px] font-extrabold tracking-tight text-[#1D2940] leading-[1.15] mb-4">
            Precision Measurement,{' '}
            <span className="gradient-text-aurora block sm:inline">
              Reimagined.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#66758D] font-medium leading-relaxed max-w-lg mb-8">
            One intelligent workspace for everyday measurements, technical precision and scientific instruments.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            {/* Primary Action Button */}
            <button
              onClick={() => setActiveTab('precision-studio')}
              className="group px-7 py-3 rounded-full bg-gradient-to-r from-[#4385E8] to-[#8064E8] text-white font-bold text-sm shadow-lg shadow-brand-blue/30 hover:shadow-xl hover:shadow-brand-blue/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2.5"
            >
              <span>Explore Tools</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            {/* Watch Demo Button */}
            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="px-6 py-3 rounded-full bg-white/80 hover:bg-white border border-[#DCE5F2] hover:border-brand-blue/40 text-[#1D2940] font-semibold text-sm shadow-sm hover:shadow-md transition-all flex items-center gap-2.5"
            >
              <div className="w-6 h-6 rounded-full bg-[#EEF3FF] flex items-center justify-center text-[#4385E8]">
                <Play className="w-3.5 h-3.5 fill-[#4385E8]" />
              </div>
              <span>Watch Demo</span>
            </button>
          </div>
        </div>

        {/* Right Column: High Fidelity 3D Measurement Visual */}
        <div className="lg:col-span-6 flex items-center justify-center">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
};

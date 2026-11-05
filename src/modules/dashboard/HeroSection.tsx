import React from 'react';
import { useAppStore } from '../../stores/appStore';
import { HeroVisual } from './HeroVisual';
import { ArrowRight, Play } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const { setActiveTab, setIsDemoModalOpen } = useAppStore();

  return (
    <section className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-white/90 via-[#F3F7FF]/90 to-[#EBF1FF]/80 border border-white/90 shadow-glass p-5 sm:p-7 lg:p-10 mb-6 sm:mb-8 backdrop-blur-xl">
      {/* Background Soft Glows */}
      <div className="absolute top-0 right-1/4 w-96 max-w-full h-96 rounded-full bg-gradient-to-b from-[#36C6DA]/15 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 right-10 w-80 max-w-full h-80 rounded-full bg-[#8064E8]/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
        {/* Left Column: Heading, Subtitle & Action Buttons */}
        <div className="lg:col-span-6 flex flex-col justify-center text-center lg:text-left items-center lg:items-start">
          <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold tracking-tight text-[#1D2940] leading-[1.18] mb-3 sm:mb-4">
            Precision Measurement,{' '}
            <span className="gradient-text-aurora block sm:inline">
              Reimagined.
            </span>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-[#66758D] font-medium leading-relaxed max-w-lg mb-6 sm:mb-8">
            One intelligent workspace for everyday measurements, technical precision and scientific instruments.
          </p>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 w-full sm:w-auto">
            {/* Primary Action Button */}
            <button
              onClick={() => setActiveTab('precision-studio')}
              className="group px-6 sm:px-7 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-[#4385E8] to-[#8064E8] text-white font-bold text-xs sm:text-sm shadow-lg shadow-brand-blue/30 hover:shadow-xl hover:shadow-brand-blue/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 sm:gap-2.5 w-full sm:w-auto"
            >
              <span>Explore Tools</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            {/* Watch Demo Button */}
            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-white/80 hover:bg-white border border-[#DCE5F2] hover:border-brand-blue/40 text-[#1D2940] font-semibold text-xs sm:text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 sm:gap-2.5 w-full sm:w-auto"
            >
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#EEF3FF] flex items-center justify-center text-[#4385E8]">
                <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-[#4385E8]" />
              </div>
              <span>Watch Demo</span>
            </button>
          </div>
        </div>

        {/* Right Column: High Fidelity 3D Measurement Visual */}
        <div className="lg:col-span-6 flex items-center justify-center w-full">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
};

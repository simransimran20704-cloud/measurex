import React from 'react';
import { useCalibrationStore } from '../../stores/calibrationStore';
import { CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';

export const FooterStatus: React.FC = () => {
  const { profile, openModal } = useCalibrationStore();

  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date());

  return (
    <footer className="w-full px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 bg-[#EEF3FF]/70 backdrop-blur-md border-t border-[#DCE5F2] flex flex-col md:flex-row items-center justify-between text-[11px] sm:text-xs text-[#66758D] select-none gap-2 sm:gap-3 z-10 text-center md:text-left">
      {/* Left: System Status & Time */}
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
        <span className="flex items-center gap-1.5 font-semibold text-[#1D2940]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          System Ready
        </span>
        <span className="text-[#8E9CAE] hidden xs:inline">|</span>
        <span className="text-[#66758D]">Last Updated: {formattedDate}</span>
      </div>

      {/* Center: Calibration Badge */}
      <div
        onClick={openModal}
        className="cursor-pointer group flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-[#DCE5F2] hover:border-emerald-300 hover:bg-emerald-50/50 transition-all shadow-sm max-w-full truncate"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
        <span className="font-semibold text-[#1D2940] text-[10.5px] sm:text-[11px] group-hover:text-emerald-700 truncate">
          {profile.isCalibrated ? 'Accurate • Calibrated • Reliable' : 'Standard Scale • Click to Calibrate'}
        </span>
      </div>

      {/* Right: Tagline */}
      <div className="flex items-center justify-center gap-1.5 font-medium italic text-[#66758D]">
        <span className="truncate">Measure Smarter. Achieve More.</span>
        <Sparkles className="w-3.5 h-3.5 text-brand-violet inline flex-shrink-0" />
      </div>
    </footer>
  );
};

import React from 'react';
import { useAppStore, NavTab } from '../../stores/appStore';
import { MagneticCard } from '../../components/common/MagneticCard';
import { ArrowRight, Ruler, Crosshair, ArrowRightLeft, FlaskConical } from 'lucide-react';

interface FeatureCardItem {
  id: string;
  tab: NavTab;
  title: string;
  subtitle: string;
  buttonBg: string;
  spotlightColor: string;
  renderIllustration: () => React.ReactNode;
}

export const FeatureCards: React.FC = () => {
  const { setActiveTab } = useAppStore();

  const cards: FeatureCardItem[] = [
    {
      id: 'quick-measure',
      tab: 'quick-measure',
      title: 'Quick Measure',
      subtitle: 'Online ruler & instant conversion',
      buttonBg: 'bg-[#36C6DA]',
      spotlightColor: 'rgba(54, 198, 218, 0.18)',
      renderIllustration: () => (
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#36C6DA]/15 to-[#4385E8]/15 flex items-center justify-center border border-[#36C6DA]/20 shadow-sm">
          <svg viewBox="0 0 40 40" className="w-8 h-8 text-[#4385E8]" fill="none" stroke="currentColor">
            <rect x="6" y="10" width="28" height="20" rx="3" strokeWidth="2.2" fill="#EBF4FF" />
            <line x1="12" y1="10" x2="12" y2="18" strokeWidth="2" strokeLinecap="round" />
            <line x1="16" y1="10" x2="16" y2="15" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="20" y1="10" x2="20" y2="18" strokeWidth="2" strokeLinecap="round" />
            <line x1="24" y1="10" x2="24" y2="15" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="28" y1="10" x2="28" y2="18" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      ),
    },
    {
      id: 'precision-studio',
      tab: 'precision-studio',
      title: 'Precision Studio',
      subtitle: '3-Sided ruler & advanced tools',
      buttonBg: 'bg-[#8064E8]',
      spotlightColor: 'rgba(128, 100, 232, 0.18)',
      renderIllustration: () => (
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#8064E8]/15 to-[#A855F7]/15 flex items-center justify-center border border-[#8064E8]/20 shadow-sm">
          <svg viewBox="0 0 40 40" className="w-8 h-8 text-[#8064E8]" fill="none" stroke="currentColor">
            <circle cx="20" cy="20" r="13" strokeWidth="2" strokeDasharray="3 3" />
            <circle cx="20" cy="20" r="6" strokeWidth="2.2" />
            <line x1="20" y1="4" x2="20" y2="36" strokeWidth="2" strokeLinecap="round" />
            <line x1="4" y1="20" x2="36" y2="20" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      ),
    },
    {
      id: 'unit-converter',
      tab: 'unit-converter',
      title: 'Unit Converter',
      subtitle: 'Convert all units instantly',
      buttonBg: 'bg-[#16A078]',
      spotlightColor: 'rgba(22, 160, 120, 0.18)',
      renderIllustration: () => (
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#16A078]/15 to-emerald-100 flex items-center justify-center border border-emerald-200 shadow-sm">
          <ArrowRightLeft className="w-7 h-7 text-[#16A078]" />
        </div>
      ),
    },
    {
      id: 'vernier-caliper',
      tab: 'vernier-caliper',
      title: 'Vernier Caliper',
      subtitle: 'Measure with precision',
      buttonBg: 'bg-[#4385E8]',
      spotlightColor: 'rgba(67, 133, 232, 0.18)',
      renderIllustration: () => (
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-100 to-blue-50 flex items-center justify-center border border-slate-200 shadow-sm overflow-hidden">
          <svg viewBox="0 0 50 36" className="w-11 h-8" fill="none">
            <rect x="2" y="10" width="46" height="8" rx="1" fill="#94A3B8" />
            <path d="M2 10 L2 30 C2 30 6 28 8 22 L10 10 Z" fill="#64748B" />
            <rect x="16" y="8" width="16" height="12" rx="1.5" fill="#E2E8F0" stroke="#475569" strokeWidth="0.8" />
            <line x1="20" y1="10" x2="20" y2="18" stroke="#0F172A" strokeWidth="1" />
            <line x1="24" y1="10" x2="24" y2="18" stroke="#0F172A" strokeWidth="1" />
            <line x1="28" y1="10" x2="28" y2="18" stroke="#0F172A" strokeWidth="1" />
          </svg>
        </div>
      ),
    },
    {
      id: 'screw-gauge',
      tab: 'screw-gauge',
      title: 'Screw Gauge',
      subtitle: 'Ultra-precise measurements',
      buttonBg: 'bg-[#8064E8]',
      spotlightColor: 'rgba(128, 100, 232, 0.18)',
      renderIllustration: () => (
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-100 to-purple-50 flex items-center justify-center border border-slate-200 shadow-sm overflow-hidden">
          <svg viewBox="0 0 50 36" className="w-11 h-8" fill="none">
            <path d="M4 14 C4 28 26 28 26 14 L20 14 C20 23 10 23 10 14 Z" fill="#475569" />
            <rect x="22" y="11" width="16" height="8" rx="1.5" fill="#38BDF8" stroke="#0F172A" strokeWidth="0.8" />
            <rect x="36" y="12" width="10" height="6" fill="#94A3B8" />
          </svg>
        </div>
      ),
    },
    {
      id: 'scientific-instruments',
      tab: 'scientific-instruments',
      title: 'Scientific Instruments',
      subtitle: 'Explore more tools',
      buttonBg: 'bg-[#6D28D9]',
      spotlightColor: 'rgba(109, 40, 217, 0.18)',
      renderIllustration: () => (
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-100 to-purple-100 flex items-center justify-center border border-violet-200 shadow-sm">
          <FlaskConical className="w-7 h-7 text-[#6D28D9]" />
        </div>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      {cards.map((card) => (
        <MagneticCard
          key={card.id}
          spotlightColor={card.spotlightColor}
          onClick={() => setActiveTab(card.tab)}
          className="cursor-pointer p-4 flex flex-col justify-between h-[180px] hover:border-brand-blue/40 group transition-all"
        >
          {/* Top: Icon Illustration */}
          <div className="mb-3">{card.renderIllustration()}</div>

          {/* Bottom Info & Arrow */}
          <div className="flex items-end justify-between gap-2 mt-auto">
            <div className="flex flex-col">
              <h3 className="font-bold text-[13.5px] text-[#1D2940] leading-snug group-hover:text-[#4385E8] transition-colors">
                {card.title}
              </h3>
              <p className="text-[11px] text-[#66758D] font-medium leading-tight mt-0.5 line-clamp-2">
                {card.subtitle}
              </p>
            </div>

            {/* Circular Arrow Button */}
            <div
              className={`w-6 h-6 rounded-full ${card.buttonBg} text-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all`}
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </MagneticCard>
      ))}
    </div>
  );
};

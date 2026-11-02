import React, { useState } from 'react';
import { useAppStore, NavTab } from '../../stores/appStore';
import { Logo } from '../common/Logo';
import {
  Home,
  Ruler,
  Crosshair,
  FlaskConical,
  ArrowRightLeft,
  Target,
  FolderKanban,
  Clock,
  Download,
  HelpCircle,
  ChevronDown,
  Crown,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, showToast } = useAppStore();
  const [instrumentsOpen, setInstrumentsOpen] = useState(true);

  const navItems = [
    { id: 'home' as NavTab, label: 'Home', icon: Home },
    { id: 'quick-measure' as NavTab, label: 'Quick Measure', icon: Ruler },
    { id: 'precision-studio' as NavTab, label: 'Precision Studio', icon: Crosshair },
    { id: 'image-measurement' as NavTab, label: 'Image Measure', icon: ImageIcon },
    {
      id: 'scientific-instruments' as NavTab,
      label: 'Instruments Lab',
      icon: FlaskConical,
      hasSubmenu: true,
      subItems: [
        { id: 'vernier-caliper' as NavTab, label: 'Vernier Caliper' },
        { id: 'screw-gauge' as NavTab, label: 'Screw Gauge' },
        { id: 'scientific-instruments' as NavTab, label: 'All Instruments' },
      ],
    },
    { id: 'unit-converter' as NavTab, label: 'Unit Converter', icon: ArrowRightLeft },
    { id: 'calibration' as NavTab, label: 'Calibration', icon: Target },
    { id: 'projects' as NavTab, label: 'Projects', icon: FolderKanban },
    { id: 'history' as NavTab, label: 'History', icon: Clock },
    { id: 'export' as NavTab, label: 'Export Center', icon: Download },
    { id: 'help' as NavTab, label: 'Help & Guide', icon: HelpCircle },
  ];

  return (
    <aside className="w-64 h-screen sticky top-0 flex flex-col justify-between bg-white/70 backdrop-blur-2xl border-r border-[#E2E8F0]/80 p-4 select-none z-30 transition-all duration-300">
      {/* Top Header & Logo */}
      <div className="flex flex-col gap-6">
        <div className="pt-2 px-1 cursor-pointer" onClick={() => setActiveTab('home')}>
          <Logo size="md" showTagline={true} />
        </div>

        {/* Navigation List */}
        <nav className="flex flex-col gap-1.5 overflow-y-auto max-h-[calc(100vh-320px)] pr-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id ||
              (item.hasSubmenu && item.subItems?.some((sub) => sub.id === activeTab));

            return (
              <div key={item.id} className="flex flex-col">
                <button
                  onClick={() => {
                    if (item.hasSubmenu) {
                      setInstrumentsOpen(!instrumentsOpen);
                      setActiveTab(item.id);
                    } else {
                      setActiveTab(item.id);
                    }
                  }}
                  className={`group relative flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl font-medium text-[13.5px] transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#4385E8] to-[#8064E8] text-white shadow-md shadow-brand-blue/25 font-semibold'
                      : 'text-[#66758D] hover:text-[#1D2940] hover:bg-white/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-[18px] h-[18px] transition-transform duration-200 group-hover:scale-110 ${
                        isActive ? 'text-white' : 'text-[#66758D] group-hover:text-[#4385E8]'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.hasSubmenu && (
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        instrumentsOpen ? 'rotate-180' : ''
                      } ${isActive ? 'text-white' : 'text-[#8E9CAE]'}`}
                    />
                  )}
                </button>

                {/* Submenu for Instruments Lab */}
                {item.hasSubmenu && instrumentsOpen && (
                  <div className="ml-7 pl-3 my-1 border-l-2 border-[#E2E8F0] flex flex-col gap-1">
                    {item.subItems?.map((sub) => (
                      <button
                        key={sub.id + sub.label}
                        onClick={() => setActiveTab(sub.id)}
                        className={`text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                          activeTab === sub.id && activeTab !== 'scientific-instruments'
                            ? 'text-[#4385E8] font-bold bg-[#EEF3FF]'
                            : 'text-[#66758D] hover:text-[#1D2940] hover:bg-slate-100/60'
                        }`}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Premium Pro Card & Planet Graphic */}
      <div className="relative pt-2">
        {/* Luminous Planet Background Orb */}
        <div className="absolute -left-6 -bottom-6 w-28 h-28 pointer-events-none opacity-40">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="30" fill="url(#planetG)" />
            <ellipse cx="50" cy="50" rx="46" ry="14" transform="rotate(-25 50 50)" stroke="url(#ringG)" strokeWidth="3" opacity="0.8" />
            <defs>
              <linearGradient id="planetG" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4385E8" />
                <stop offset="1" stopColor="#8064E8" />
              </linearGradient>
              <linearGradient id="ringG" x1="10" y1="50" x2="90" y2="50" gradientUnits="userSpaceOnUse">
                <stop stopColor="#36C6DA" />
                <stop offset="0.5" stopColor="#8064E8" />
                <stop offset="1" stopColor="#A855F7" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Premium Card */}
        <div className="relative overflow-hidden rounded-2xl p-3.5 bg-gradient-to-br from-[#F5F3FF]/90 via-white/80 to-[#EEF2FF]/90 border border-violet-200/70 shadow-lg shadow-purple-500/5 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-amber-500 shadow-sm">
              <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            </div>
            <span className="font-bold text-xs text-[#1D2940]">Premium Pro</span>
          </div>
          <p className="text-[11px] text-[#66758D] mb-2.5 font-medium leading-snug">
            Unlock Advanced Features & Unlimited Cloud Sync
          </p>
          <button
            onClick={() => showToast('MeasureX Pro features unlocked in trial mode!', 'success')}
            className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-[#4385E8] to-[#8064E8] text-white text-[11px] font-semibold hover:shadow-md hover:shadow-purple-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
          >
            <span>Upgrade Now</span>
            <span>&rarr;</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

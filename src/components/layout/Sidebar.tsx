import React, { useState } from 'react';
import { useAppStore, NavTab } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
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
    Sparkles,
  Image as ImageIcon,
  X,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, isMobileMenuOpen, setIsMobileMenuOpen } = useAppStore();
  const { user } = useAuthStore();
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
        { id: 'vernier-height-gauge' as NavTab, label: 'Height Gauge' },
        { id: 'dial-indicator' as NavTab, label: 'Dial Indicator' },
        { id: 'digital-compass' as NavTab, label: 'Digital Compass' },
        { id: 'digital-protractor' as NavTab, label: 'Digital Protractor' },
        { id: 'digital-scale' as NavTab, label: 'Precision Scale' },
        { id: 'thread-pitch-gauge' as NavTab, label: 'Thread Pitch Gauge' },
        { id: 'feeler-gauge' as NavTab, label: 'Feeler Gauge' },
        { id: 'spirit-level' as NavTab, label: 'Digital Spirit Level' },
        { id: 'pcd-generator' as NavTab, label: 'Bolt PCD Generator' },
        { id: 'limits-fits' as NavTab, label: 'ISO Limits & Fits' },
        { id: 'material-estimator' as NavTab, label: 'Material Estimator' },
        { id: 'spherometer' as NavTab, label: 'Spherometer' },
        { id: 'metrology-quiz' as NavTab, label: 'Practice & Exam Quiz' },
        { id: 'scientific-instruments' as NavTab, label: 'All Instruments Lab' },
      ],
    },
    { id: 'unit-converter' as NavTab, label: 'Unit Converter', icon: ArrowRightLeft },
    { id: 'calibration' as NavTab, label: 'Calibration', icon: Target },
    { id: 'projects' as NavTab, label: 'Projects', icon: FolderKanban },
    { id: 'history' as NavTab, label: 'History', icon: Clock },
    { id: 'export' as NavTab, label: 'Export Center', icon: Download },
    { id: 'help' as NavTab, label: 'Help & Guide', icon: HelpCircle },
  ];

  const renderNavList = () => (
    <nav className="flex flex-col gap-1.5 overflow-y-auto max-h-[calc(100vh-210px)] pr-1 custom-scrollbar">
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
  );

  const renderSidebarFooter = () => (
    <div className="pt-3 border-t border-[#E2E8F0]/80 flex flex-col gap-1.5 px-2">
      <div className="flex items-center justify-between text-[11px] text-[#66758D] font-medium">
        <span>MeasureX Metrology</span>
        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 text-[9px] uppercase tracking-wider">
          Free & Open
        </span>
      </div>
      <p className="text-[10px] text-[#8E9CAE] leading-relaxed">
        19 precision engineering instruments with zero subscriptions.
      </p>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (visible lg and up) */}
      <aside className="hidden lg:flex w-64 h-screen sticky top-0 flex-col justify-between bg-white/70 backdrop-blur-2xl border-r border-[#E2E8F0]/80 p-4 select-none z-30 transition-all duration-300">
        <div className="flex flex-col gap-6">
          <div className="pt-2 px-1 cursor-pointer" onClick={() => setActiveTab('home')}>
            <Logo size="md" showTagline={true} />
          </div>
          {renderNavList()}
        </div>
        {renderSidebarFooter()}
      </aside>

      {/* Mobile Drawer Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Off-canvas Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white/95 backdrop-blur-2xl border-r border-[#E2E8F0] z-50 p-4 flex flex-col justify-between lg:hidden shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Mobile Navigation"
      >
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between pt-1 px-1">
            <div className="cursor-pointer" onClick={() => setActiveTab('home')}>
              <Logo size="sm" showTagline={false} />
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {renderNavList()}
        </div>
        {renderSidebarFooter()}
      </aside>
    </>
  );
};

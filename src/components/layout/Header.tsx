import React from 'react';
import { useAppStore } from '../../stores/appStore';
import {
  Search,
  Zap,
  Crosshair,
  FlaskConical,
  FolderKanban,
  Clock,
  Settings,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { activeTab, setActiveTab, searchQuery, setSearchQuery, showToast } = useAppStore();

  return (
    <header className="sticky top-0 z-20 w-full px-8 py-3.5 flex items-center justify-between bg-[#F8FAFF]/80 backdrop-blur-xl border-b border-[#E2E8F0]/60">
      {/* Left: Search Bar */}
      <div className="relative w-72 sm:w-80">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8E9CAE]">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tools, units..."
          className="w-full pl-10 pr-4 py-2 rounded-full text-xs font-medium bg-white/80 border border-[#E2E8F0] placeholder-[#8E9CAE] text-[#1D2940] shadow-sm hover:border-brand-blue/40 focus:outline-none focus:ring-2 focus:ring-[#4385E8]/20 focus:border-[#4385E8] transition-all"
        />
      </div>

      {/* Center: Quick Action Nav Pills */}
      <div className="hidden md:flex items-center gap-2">
        <button
          onClick={() => setActiveTab('quick-measure')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${
            activeTab === 'quick-measure'
              ? 'bg-[#EEF3FF] text-[#4385E8] border-[#DCE5F2] shadow-sm'
              : 'bg-white/70 text-[#66758D] border-transparent hover:bg-white hover:text-[#1D2940]'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-[#4385E8]" />
          <span>Quick Measure</span>
        </button>

        <button
          onClick={() => setActiveTab('precision-studio')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${
            activeTab === 'precision-studio'
              ? 'bg-[#F0EDFF] text-[#8064E8] border-[#E0D8FF] shadow-sm'
              : 'bg-white/70 text-[#66758D] border-transparent hover:bg-white hover:text-[#1D2940]'
          }`}
        >
          <Crosshair className="w-3.5 h-3.5 text-[#8064E8]" />
          <span>Precision Studio</span>
        </button>

        <button
          onClick={() => setActiveTab('scientific-instruments')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${
            activeTab === 'scientific-instruments'
              ? 'bg-[#EEF3FF] text-[#4385E8] border-[#DCE5F2] shadow-sm'
              : 'bg-white/70 text-[#66758D] border-transparent hover:bg-white hover:text-[#1D2940]'
          }`}
        >
          <FlaskConical className="w-3.5 h-3.5 text-[#4385E8]" />
          <span>Instruments Lab</span>
        </button>
      </div>

      {/* Right: Projects, History, Settings, Avatar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveTab('projects')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/80 border border-[#E2E8F0] text-[#1D2940] hover:bg-white hover:border-[#4385E8]/30 shadow-sm transition-all"
        >
          <FolderKanban className="w-3.5 h-3.5 text-[#4385E8]" />
          <span>Projects</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/80 border border-[#E2E8F0] text-[#1D2940] hover:bg-white hover:border-[#8064E8]/30 shadow-sm transition-all"
        >
          <Clock className="w-3.5 h-3.5 text-[#8064E8]" />
          <span>History</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={() => showToast('Settings: All measurement modules configured.', 'info')}
          className="w-8 h-8 rounded-full bg-white/80 border border-[#E2E8F0] flex items-center justify-center text-[#66758D] hover:text-[#1D2940] hover:bg-white transition-all shadow-sm"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User Profile Avatar with Aurora Ring */}
        <div className="relative group cursor-pointer" onClick={() => showToast('Simran - Lead Instrumentation Engineer', 'info')}>
          <div className="w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-[#36C6DA] via-[#4385E8] to-[#8064E8] shadow-sm">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120"
              alt="User profile"
              className="w-full h-full rounded-full object-cover border border-white"
            />
          </div>
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
        </div>
      </div>
    </header>
  );
};

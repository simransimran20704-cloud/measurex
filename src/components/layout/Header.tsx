import React, { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import {
  Search,
  Zap,
  Crosshair,
  FlaskConical,
  FolderKanban,
  Clock,
  Settings,
    LogOut,
  User,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { activeTab, setActiveTab, searchQuery, setSearchQuery, showToast, isMobileMenuOpen, toggleMobileMenu } = useAppStore();
  const { user, isAuthenticated, openAuthModal, logout } = useAuthStore();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 w-full px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4 bg-[#F8FAFF]/80 backdrop-blur-xl border-b border-[#E2E8F0]/60">
      {/* Left: Hamburger Button (mobile/tablet) & Search Bar */}
      <div className="flex items-center gap-2 flex-1 min-w-0 max-w-sm">
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden p-2 rounded-xl text-[#1D2940] hover:bg-[#EEF3FF] transition-colors focus:outline-none focus:ring-2 focus:ring-[#4385E8]/30 flex-shrink-0"
          aria-label={isMobileMenuOpen ? 'Close navigation drawer' : 'Open navigation drawer'}
        >
          {isMobileMenuOpen ? <X className="w-5 h-5 text-[#4385E8]" /> : <Menu className="w-5 h-5 text-[#1D2940]" />}
        </button>

        <div className="relative flex-1 min-w-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8E9CAE]">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools..."
            className="w-full pl-8 sm:pl-10 pr-3 py-1.5 sm:py-2 rounded-full text-xs font-medium bg-white/80 border border-[#E2E8F0] placeholder-[#8E9CAE] text-[#1D2940] shadow-sm hover:border-brand-blue/40 focus:outline-none focus:ring-2 focus:ring-[#4385E8]/20 focus:border-[#4385E8] transition-all"
          />
        </div>
      </div>

      {/* Center: Quick Action Nav Pills (hidden on mobile and tablet) */}
      <div className="hidden xl:flex items-center gap-2">
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
      <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
        <button
          onClick={() => setActiveTab('projects')}
          title="Projects"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold bg-white/80 border border-[#E2E8F0] text-[#1D2940] hover:bg-white hover:border-[#4385E8]/30 shadow-sm transition-all"
        >
          <FolderKanban className="w-3.5 h-3.5 text-[#4385E8]" />
          <span className="hidden sm:inline">Projects</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          title="Measurement History"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold bg-white/80 border border-[#E2E8F0] text-[#1D2940] hover:bg-white hover:border-[#8064E8]/30 shadow-sm transition-all"
        >
          <Clock className="w-3.5 h-3.5 text-[#8064E8]" />
          <span className="hidden sm:inline">History</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={() => setActiveTab('calibration')}
          title="Screen Calibration Settings"
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/80 border border-[#E2E8F0] flex items-center justify-center text-[#66758D] hover:text-[#1D2940] hover:bg-white transition-all shadow-sm flex-shrink-0"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User Profile Avatar with Dropdown */}
        {isAuthenticated && user ? (
          <div className="relative">
            {(() => {
              const emailInitial = (
                user.email ? user.email.trim()[0] : user.name ? user.name.trim()[0] : 'U'
              ).toUpperCase();

              return (
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-white/80 transition-all"
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4385E8] to-[#8064E8] text-white flex items-center justify-center font-extrabold text-xs shadow-sm uppercase border border-white">
                      {emailInitial}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                  </div>
                  <span className="hidden lg:inline text-xs font-bold text-[#1D2940] max-w-[100px] truncate">
                    {user.name}
                  </span>
                </button>
              );
            })()}

            {/* Dropdown Menu */}
            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-[#DCE5F2] shadow-xl p-3 flex flex-col gap-2 z-50 animate-in fade-in">
                <div className="flex items-center gap-3 p-2 bg-[#F8FAFF] rounded-xl border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#4385E8] to-[#8064E8] text-white flex items-center justify-center font-black text-sm shadow-sm uppercase border border-white flex-shrink-0">
                    {(user.email ? user.email.trim()[0] : user.name ? user.name.trim()[0] : 'U').toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-xs text-[#1D2940] truncate">{user.name}</span>
                    <span className="text-[10px] text-slate-500 truncate">{user.email}</span>
                    <span className="mt-1 inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#4385E8] uppercase tracking-wider w-fit border border-blue-200/50">
                      {user.role || 'Verified Metrologist'}
                    </span>
                  </div>
                </div>

                

                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    logout();
                    showToast('Logged out of session', 'info');
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => openAuthModal('login')}
            className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#4385E8] to-[#8064E8] text-white text-xs font-bold shadow-sm hover:scale-[1.02] transition-all flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};

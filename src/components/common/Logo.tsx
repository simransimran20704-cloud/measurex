import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showTagline = true,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* 3D Stylized Aurora 'M' Icon */}
      <div className={`relative ${iconSizes[size]} flex items-center justify-center`}>
        {/* Ambient Glow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#36C6DA] via-[#4385E8] to-[#8064E8] opacity-75 blur-md" />
        
        {/* Shiny Glass Badge Container */}
        <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-white/90 via-white/70 to-white/40 p-[1.5px] shadow-lg shadow-brand-blue/20">
          <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-[#F8FAFF] to-[#EEF3FF] flex items-center justify-center overflow-hidden border border-white">
            <svg viewBox="0 0 40 40" className="w-[82%] h-[82%]" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="mGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#36C6DA" />
                  <stop offset="50%" stopColor="#4385E8" />
                  <stop offset="100%" stopColor="#8064E8" />
                </linearGradient>
                <linearGradient id="mGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#4385E8" />
                  <stop offset="100%" stopColor="#A855F7" />
                </linearGradient>
                <filter id="mShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#4385E8" floodOpacity="0.35" />
                </filter>
              </defs>

              {/* Futuristic Interlocking M Strokes */}
              <path
                d="M8 31V12.5C8 10.5 9.8 9 11.7 9.8L20 16.5L28.3 9.8C30.2 9 32 10.5 32 12.5V31"
                stroke="url(#mGrad1)"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#mShadow)"
              />
              <path
                d="M13 31V16L20 22L27 16V31"
                stroke="url(#mGrad2)"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Highlight Point */}
              <circle cx="20" cy="22" r="2" fill="#36C6DA" />
            </svg>
          </div>
        </div>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col">
        <div className={`font-extrabold tracking-tight text-[#1D2940] flex items-center ${textSizes[size]}`}>
          <span>Measure</span>
          <span className="text-[#4385E8] ml-[1px]">X</span>
        </div>
        {showTagline && (
          <span className="text-[11px] font-medium text-[#66758D] tracking-tight leading-tight -mt-0.5">
            Measure Anything. Convert Everything.
          </span>
        )}
      </div>
    </div>
  );
};

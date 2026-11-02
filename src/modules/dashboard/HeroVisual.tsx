import React from 'react';

export const HeroVisual: React.FC = () => {
  return (
    <div className="relative w-full h-[360px] lg:h-[390px] flex items-center justify-center select-none overflow-visible">
      {/* Background Aurora Glows & Rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Soft Radial Ambient Lights */}
        <div className="absolute w-80 h-80 rounded-full bg-gradient-to-tr from-[#36C6DA]/20 via-[#4385E8]/20 to-[#8064E8]/20 blur-3xl animate-pulse-slow" />
        <div className="absolute w-64 h-64 rounded-full bg-[#8064E8]/15 blur-2xl translate-x-12 -translate-y-8" />
        
        {/* Luminous Orbital Rings */}
        <svg className="absolute w-[460px] h-[340px] opacity-70" viewBox="0 0 460 340" fill="none">
          <ellipse
            cx="230"
            cy="170"
            rx="210"
            ry="90"
            transform="rotate(-15 230 170)"
            stroke="url(#orbitGradient)"
            strokeWidth="1.8"
            strokeDasharray="8 6"
          />
          <ellipse
            cx="230"
            cy="170"
            rx="180"
            ry="75"
            transform="rotate(22 230 170)"
            stroke="url(#orbitGradient2)"
            strokeWidth="1.4"
            opacity="0.6"
          />
          <defs>
            <linearGradient id="orbitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#36C6DA" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#4385E8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#8064E8" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="orbitGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8064E8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#36C6DA" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Floating Translucent Measurement Badges */}
      {/* mm Badge */}
      <div className="absolute top-10 left-6 z-20 px-3.5 py-1.5 rounded-full bg-white/70 backdrop-blur-xl border border-white/90 shadow-glass text-xs font-bold text-[#4385E8] flex items-center gap-1 animate-float-slow">
        <span className="w-2 h-2 rounded-full bg-[#4385E8]" />
        mm
      </div>

      {/* cm Badge */}
      <div className="absolute top-4 right-16 z-20 w-11 h-11 rounded-full bg-white/70 backdrop-blur-xl border border-white/90 shadow-glass text-xs font-bold text-[#4385E8] flex items-center justify-center animate-float-slow [animation-delay:1.5s]">
        cm
      </div>

      {/* in Badge */}
      <div className="absolute bottom-10 left-24 z-20 px-3 py-1 rounded-full bg-white/70 backdrop-blur-xl border border-white/90 shadow-glass text-xs font-bold text-[#8064E8] flex items-center gap-1 animate-float-slow [animation-delay:2.5s]">
        in
      </div>

      {/* um Badge */}
      <div className="absolute bottom-16 right-4 z-20 px-3 py-1 rounded-full bg-white/70 backdrop-blur-xl border border-white/90 shadow-glass text-xs font-bold text-[#8064E8] flex items-center gap-1 animate-float-slow [animation-delay:3.2s]">
        µm
      </div>

      {/* Main 3D Composition SVG */}
      <div className="relative z-10 w-full h-full max-w-[500px] flex items-center justify-center">
        <svg viewBox="0 0 520 380" className="w-full h-full filter drop-shadow-xl" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* Acrylic Ruler Gradient */}
            <linearGradient id="rulerGlass" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
              <stop offset="40%" stopColor="#EEF4FF" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#D9E6FF" stopOpacity="0.6" />
            </linearGradient>

            {/* Stainless Steel Metallic Gradient */}
            <linearGradient id="metalCaliper" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="25%" stopColor="#E2E8F0" />
              <stop offset="50%" stopColor="#CBD5E1" />
              <stop offset="75%" stopColor="#94A3B8" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>

            {/* Screw Gauge Frame Cast Finish */}
            <linearGradient id="gaugeCast" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#64748B" />
              <stop offset="50%" stopColor="#475569" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>

            {/* Thimble Chrome Gradient */}
            <linearGradient id="chromeGrip" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E2E8F0" />
              <stop offset="30%" stopColor="#F8FAFC" />
              <stop offset="60%" stopColor="#CBD5E1" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>

            {/* LCD Screen Glow */}
            <linearGradient id="lcdScreen" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0B132B" />
              <stop offset="100%" stopColor="#1C2541" />
            </linearGradient>

            {/* Drop Shadows */}
            <filter id="caliperShadow" x="-10%" y="-10%" width="120%" height="130%">
              <feDropShadow dx="3" dy="8" stdDeviation="6" floodColor="#1D2940" floodOpacity="0.18" />
            </filter>
            <filter id="gaugeShadow" x="-10%" y="-10%" width="120%" height="130%">
              <feDropShadow dx="2" dy="10" stdDeviation="8" floodColor="#4385E8" floodOpacity="0.22" />
            </filter>
          </defs>

          {/* 1. Translucent Floating 30cm Engineering Ruler (diagonal left) */}
          <g transform="translate(130, 210) rotate(-35) translate(-130, -210)" opacity="0.92">
            {/* Acrylic Body */}
            <rect
              x="50"
              y="120"
              width="60"
              height="240"
              rx="6"
              fill="url(#rulerGlass)"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth="1.5"
            />
            {/* Beveled Edge Highlight */}
            <line x1="53" y1="125" x2="53" y2="355" stroke="rgba(255,255,255,0.8)" strokeWidth="1" />
            <line x1="107" y1="125" x2="107" y2="355" stroke="rgba(67, 133, 232, 0.2)" strokeWidth="1" />

            {/* Tick Mark Lines (Metric cm/mm) */}
            {Array.from({ length: 24 }).map((_, i) => {
              const y = 135 + i * 9;
              const isMajor = i % 5 === 0;
              const isMedium = i % 5 === 2;
              const len = isMajor ? 18 : isMedium ? 12 : 7;
              return (
                <g key={i}>
                  <line
                    x1="50"
                    y1={y}
                    x2={50 + len}
                    y2={y}
                    stroke="#4385E8"
                    strokeWidth={isMajor ? 1.5 : 0.8}
                    opacity={isMajor ? 0.9 : 0.6}
                  />
                  {isMajor && (
                    <text
                      x={50 + len + 3}
                      y={y + 3}
                      fontSize="7"
                      fontWeight="bold"
                      fill="#1D2940"
                      fontFamily="sans-serif"
                    >
                      {i / 5}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* 2. Realistic Stainless Steel Vernier Caliper (Top-Right Angle) */}
          <g transform="translate(260, 40) rotate(-8)" filter="url(#caliperShadow)">
            {/* Main Beam */}
            <rect x="0" y="40" width="230" height="20" rx="2" fill="url(#metalCaliper)" stroke="#94A3B8" strokeWidth="0.8" />
            
            {/* Beam Markings */}
            {Array.from({ length: 22 }).map((_, i) => {
              const x = 20 + i * 9;
              const isCm = i % 5 === 0;
              return (
                <line
                  key={i}
                  x1={x}
                  y1={54}
                  x2={x}
                  y2={isCm ? 42 : 47}
                  stroke="#475569"
                  strokeWidth={isCm ? 1 : 0.6}
                />
              );
            })}

            {/* Fixed External Lower Jaw */}
            <path
              d="M0 40 L0 115 C0 118 6 112 12 95 L18 60 L18 40 Z"
              fill="url(#metalCaliper)"
              stroke="#94A3B8"
              strokeWidth="0.8"
            />
            {/* Fixed Internal Upper Jaw */}
            <path
              d="M0 40 L0 10 C0 8 4 12 10 24 L16 40 Z"
              fill="url(#metalCaliper)"
              stroke="#94A3B8"
              strokeWidth="0.8"
            />

            {/* Slider with Vernier Scale */}
            <g transform="translate(68, 0)">
              {/* Slider Body */}
              <rect x="0" y="32" width="55" height="36" rx="3" fill="url(#metalCaliper)" stroke="#64748B" strokeWidth="0.8" />
              {/* Thumb Screw Knob */}
              <rect x="18" y="24" width="18" height="8" rx="2" fill="#64748B" />
              <line x1="22" y1="24" x2="22" y2="32" stroke="#CBD5E1" strokeWidth="1" />
              <line x1="27" y1="24" x2="27" y2="32" stroke="#CBD5E1" strokeWidth="1" />
              <line x1="32" y1="24" x2="32" y2="32" stroke="#CBD5E1" strokeWidth="1" />

              {/* Movable Lower External Jaw */}
              <path
                d="M0 68 L0 115 C0 118 6 112 12 95 L14 68 Z"
                fill="url(#metalCaliper)"
                stroke="#94A3B8"
                strokeWidth="0.8"
              />
              {/* Movable Upper Internal Jaw */}
              <path
                d="M0 32 L0 10 C0 8 4 12 10 24 L12 32 Z"
                fill="url(#metalCaliper)"
                stroke="#94A3B8"
                strokeWidth="0.8"
              />

              {/* Vernier Window Cutout & Divisions */}
              <rect x="6" y="44" width="42" height="12" fill="#F8FAFC" rx="1.5" />
              {Array.from({ length: 11 }).map((_, i) => (
                <line
                  key={i}
                  x1={8 + i * 3.8}
                  y1={44}
                  x2={8 + i * 3.8}
                  y2={i % 5 === 0 ? 53 : 49}
                  stroke="#1E293B"
                  strokeWidth="0.8"
                />
              ))}
            </g>

            {/* Depth Rod protruding slightly */}
            <rect x="228" y="48" width="22" height="3" fill="#CBD5E1" />
          </g>

          {/* 3. High-Precision Digital Micrometer Screw Gauge (Center-Bottom) */}
          <g transform="translate(290, 205)" filter="url(#gaugeShadow)">
            {/* C-Frame */}
            <path
              d="M-40 45 C-40 105 70 105 70 45 L52 45 C52 86 -22 86 -22 45 Z"
              fill="url(#gaugeCast)"
              stroke="#334155"
              strokeWidth="1.5"
            />
            {/* Satin Chrome Anvil (Left) */}
            <rect x="-42" y="36" width="12" height="14" rx="1.5" fill="url(#metalCaliper)" stroke="#64748B" strokeWidth="0.8" />
            <rect x="-30" y="40" width="8" height="6" fill="#94A3B8" />

            {/* Movable Spindle (Right to Left) */}
            <rect x="3" y="40" width="46" height="6" fill="url(#metalCaliper)" stroke="#64748B" strokeWidth="0.6" />

            {/* Lock Lever */}
            <path d="M42 34 L36 24" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />

            {/* Digital Display Box Housing on C-Frame */}
            <rect x="30" y="24" width="70" height="36" rx="5" fill="#1E293B" stroke="#475569" strokeWidth="1" />
            
            {/* Glowing Blue Digital LCD Screen */}
            <rect x="36" y="29" width="48" height="22" rx="3" fill="url(#lcdScreen)" stroke="#38BDF8" strokeWidth="0.8" />
            {/* LCD Digits */}
            <text
              x="80"
              y="45"
              textAnchor="end"
              fill="#38BDF8"
              fontSize="12.5"
              fontWeight="bold"
              fontFamily="monospace"
              letterSpacing="0.8"
            >
              0.000
            </text>
            <text x="74" y="48" fontSize="5" fill="#94A3B8" fontFamily="sans-serif">mm</text>

            {/* Zero/ABS Button */}
            <circle cx="92" cy="35" r="3.2" fill="#38BDF8" opacity="0.9" />
            <circle cx="92" cy="45" r="3.2" fill="#E2E8F0" opacity="0.9" />

            {/* Sleeve with Datum Line */}
            <rect x="100" y="34" width="35" height="18" fill="url(#metalCaliper)" stroke="#64748B" strokeWidth="0.8" />
            <line x1="100" y1="43" x2="135" y2="43" stroke="#0F172A" strokeWidth="1" />
            {/* Sleeve Ticks */}
            {Array.from({ length: 6 }).map((_, i) => (
              <g key={i}>
                <line x1={103 + i * 5} y1={37} x2={103 + i * 5} y2={43} stroke="#0F172A" strokeWidth="0.8" />
                <line x1={105.5 + i * 5} y1={43} x2={105.5 + i * 5} y2={47} stroke="#0F172A" strokeWidth="0.6" />
              </g>
            ))}

            {/* Beveled Thimble */}
            <path
              d="M135 30 L144 34 L175 34 L175 52 L144 52 L135 56 Z"
              fill="url(#chromeGrip)"
              stroke="#64748B"
              strokeWidth="0.8"
            />
            {/* Knurled Grip on Thimble */}
            {Array.from({ length: 8 }).map((_, i) => (
              <line
                key={i}
                x1={148 + i * 3}
                y1={35}
                x2={148 + i * 3}
                y2={51}
                stroke="#94A3B8"
                strokeWidth="1"
              />
            ))}

            {/* Ratchet Stop Knob */}
            <rect x="175" y="38" width="16" height="10" rx="2" fill="#334155" />
            <line x1="180" y1="38" x2="180" y2="48" stroke="#64748B" strokeWidth="0.8" />
            <line x1="185" y1="38" x2="185" y2="48" stroke="#64748B" strokeWidth="0.8" />
          </g>
        </svg>
      </div>
    </div>
  );
};

import React from 'react';
import { BookOpen, Compass, Ruler, Target, CheckCircle2, Lightbulb } from 'lucide-react';

export const HelpGuideView: React.FC = () => {
  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 pb-12 select-none">
      {/* Header */}
      <div className="p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl bg-white/90 border border-[#DCE5F2] shadow-glass flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-purple-100 text-[#8064E8]">
              <BookOpen className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-extrabold text-[#1D2940]">Metrology & Usage Guide</h1>
          </div>
          <p className="text-sm text-[#66758D]">
            Comprehensive manual on dimensional precision instruments, reading principles, and calibration physics.
          </p>
        </div>
      </div>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Vernier Caliper Guide */}
        <div className="p-6 rounded-3xl bg-white border border-[#DCE5F2] shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[#4385E8] font-bold text-sm">
            <Ruler className="w-4 h-4" />
            <span>How to Read a Vernier Caliper</span>
          </div>
          <div className="text-xs text-[#66758D] space-y-2 leading-relaxed">
            <p>
              <strong>1. Main Scale Reading (MSR):</strong> Locate the highest whole millimeter division on the main stationary beam situated immediately to the left of the Vernier zero mark.
            </p>
            <p>
              <strong>2. Vernier Coincidence (VSR):</strong> Scan the sliding vernier division marks from left to right. Locate the single line that coincides (forms one unbroken straight vertical line) with any line on the main scale.
            </p>
            <p>
              <strong>3. Formula:</strong> Total Reading = MSR + (VSR &times; Least Count) + Zero Correction.
            </p>
          </div>
        </div>

        {/* Screw Gauge Guide */}
        <div className="p-6 rounded-3xl bg-white border border-[#DCE5F2] shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[#8064E8] font-bold text-sm">
            <Compass className="w-4 h-4" />
            <span>How to Read a Micrometer Screw Gauge</span>
          </div>
          <div className="text-xs text-[#66758D] space-y-2 leading-relaxed">
            <p>
              <strong>1. Sleeve Reading (MSR):</strong> Note the exposed millimeter or half-millimeter (0.5mm) marks uncovered by the rotating thimble collar.
            </p>
            <p>
              <strong>2. Circular Reading (CSR):</strong> Identify which division on the beveled circular thimble scale aligns with the horizontal reference datum line.
            </p>
            <p>
              <strong>3. Formula:</strong> Total Reading = MSR + (CSR &times; Least Count) + Zero Correction.
            </p>
          </div>
        </div>

        {/* Screen Calibration Best Practice */}
        <div className="p-6 rounded-3xl bg-white border border-[#DCE5F2] shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
            <Target className="w-4 h-4" />
            <span>Physical Calibration Principles</span>
          </div>
          <div className="text-xs text-[#66758D] space-y-2 leading-relaxed">
            <p>
              Screens do not possess native awareness of their own physical dimensions in millimeters. Standard browser pixels assume 96 DPI, which is inaccurate on modern Retina displays and mobile devices.
            </p>
            <p>
              MeasureX utilizes known standard physical reference dimensions (such as standard ISO 7810 credit card width of 85.60 mm) to compute your monitor's true physical Pixels-Per-Millimeter ratio.
            </p>
          </div>
        </div>

        {/* Precision Studio Shortcuts */}
        <div className="p-6 rounded-3xl bg-white border border-[#DCE5F2] shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[#36C6DA] font-bold text-sm">
            <Lightbulb className="w-4 h-4" />
            <span>Studio Shortcuts & Navigation</span>
          </div>
          <div className="text-xs text-[#66758D] space-y-2 leading-relaxed">
            <p><strong>Click & Drag:</strong> Move plotted points and drag measurement markers.</p>
            <p><strong>Mouse Wheel:</strong> Zoom in and out smoothly from 20% to 400% scale.</p>
            <p><strong>Alt + Drag or Middle Click:</strong> Pan the infinite measurement canvas.</p>
            <p><strong>Snap Toggle:</strong> Force coordinates to lock directly onto the nearest grid lines.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

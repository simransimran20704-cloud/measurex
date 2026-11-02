import React from 'react';
import { useCalibrationStore } from '../../stores/calibrationStore';
import { Target, CheckCircle2, AlertTriangle, Monitor, ShieldCheck, RefreshCw } from 'lucide-react';

export const CalibrationView: React.FC = () => {
  const { profile, openModal, resetCalibration } = useCalibrationStore();

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
      {/* Header Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-blue-50/80 via-white to-purple-50/80 border border-white shadow-glass flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-blue-100 text-[#4385E8]">
              <Target className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-extrabold text-[#1D2940]">Screen Calibration Studio</h1>
          </div>
          <p className="text-sm text-[#66758D]">
            Calibrate your display using physical references to ensure 100% real-world physical accuracy.
          </p>
        </div>

        <button
          onClick={openModal}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-[#4385E8] to-[#8064E8] text-white font-bold text-xs shadow-md shadow-brand-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
        >
          <Target className="w-4 h-4" />
          <span>Launch Calibration Tool</span>
        </button>
      </div>

      {/* Calibration Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white/80 border border-[#DCE5F2] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-[#8E9CAE]">Status</span>
            {profile.isCalibrated ? (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Calibrated
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5" /> Uncalibrated
              </span>
            )}
          </div>
          <div>
            <span className="text-2xl font-mono font-extrabold text-[#1D2940]">
              {(profile.pixelsPerMm * 25.4).toFixed(1)} <span className="text-xs font-normal text-slate-500">DPI</span>
            </span>
            <p className="text-xs text-[#66758D] mt-1">{profile.name}</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white/80 border border-[#DCE5F2] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-[#8E9CAE]">Pixel Density</span>
            <Monitor className="w-4 h-4 text-[#4385E8]" />
          </div>
          <div>
            <span className="text-2xl font-mono font-extrabold text-[#1D2940]">
              {profile.pixelsPerMm.toFixed(4)} <span className="text-xs font-normal text-slate-500">px/mm</span>
            </span>
            <p className="text-xs text-[#66758D] mt-1">Device Pixel Ratio: {profile.dpr}x</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white/80 border border-[#DCE5F2] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-[#8E9CAE]">Calibration Mode</span>
            <ShieldCheck className="w-4 h-4 text-[#8064E8]" />
          </div>
          <div>
            <span className="text-base font-bold text-[#1D2940] capitalize">
              {profile.method.replace('-', ' ')}
            </span>
            <p className="text-xs text-[#66758D] mt-1">
              Last Verified: {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Educational Notice */}
      <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-4">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <span className="font-bold">Important Notice regarding Screen Measurement Accuracy:</span> Web browsers render standard CSS pixels at an assumed 96 DPI, which rarely matches the true physical pixel density of high-resolution laptop screens, 4K monitors, or tablets. Never rely on on-screen rulers for medical, structural, or legal measurements without executing a physical card or ruler calibration first.
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useCalibrationStore } from '../../stores/calibrationStore';
import { useAppStore } from '../../stores/appStore';
import { STANDARD_OBJECTS, calculatePpm } from '../../engine/calibration/screenCalibration';
import { Target, CreditCard, Disc, Ruler, CheckCircle2, RotateCcw, X, AlertTriangle } from 'lucide-react';

export const CalibrationModal: React.FC = () => {
  const { isModalOpen, closeModal, profile, updatePixelsPerMm, resetCalibration } = useCalibrationStore();
  const { showToast } = useAppStore();

  const [method, setMethod] = useState<'credit-card' | 'coin' | 'manual-ruler'>('credit-card');
  const [sliderPixels, setSliderPixels] = useState(profile.pixelsPerMm * STANDARD_OBJECTS.creditCard.widthMm);
  const [manualKnownMm, setManualKnownMm] = useState(100);

  if (!isModalOpen) return null;

  const handleSaveCalibration = () => {
    let ppm = profile.pixelsPerMm;
    let name = 'Custom Calibration';

    if (method === 'credit-card') {
      ppm = calculatePpm(sliderPixels, STANDARD_OBJECTS.creditCard.widthMm);
      name = 'Standard Bank Card (85.60mm)';
    } else if (method === 'coin') {
      ppm = calculatePpm(sliderPixels, STANDARD_OBJECTS.quarterCoin.diameterMm);
      name = 'US Quarter (24.26mm)';
    } else {
      ppm = calculatePpm(sliderPixels, manualKnownMm);
      name = `Physical Ruler (${manualKnownMm}mm)`;
    }

    updatePixelsPerMm(ppm, method, name);
    showToast(`Display calibrated! Resolution: ${(ppm * 25.4).toFixed(1)} DPI`, 'success');
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-3xl bg-white border border-white/90 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/60 to-purple-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#4385E8] flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1D2940]">Display Screen Calibration</h3>
              <p className="text-[11px] text-[#8E9CAE]">Calibrate physical pixels to actual millimeters</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5">
          {/* Method Selector Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-slate-100/80">
            <button
              onClick={() => {
                setMethod('credit-card');
                setSliderPixels(profile.pixelsPerMm * STANDARD_OBJECTS.creditCard.widthMm);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                method === 'credit-card'
                  ? 'bg-white text-[#4385E8] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Credit Card</span>
            </button>

            <button
              onClick={() => {
                setMethod('coin');
                setSliderPixels(profile.pixelsPerMm * STANDARD_OBJECTS.quarterCoin.diameterMm);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                method === 'coin'
                  ? 'bg-white text-[#8064E8] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Disc className="w-3.5 h-3.5" />
              <span>Coin ($0.25)</span>
            </button>

            <button
              onClick={() => {
                setMethod('manual-ruler');
                setSliderPixels(profile.pixelsPerMm * 100);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                method === 'manual-ruler'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Ruler className="w-3.5 h-3.5" />
              <span>Physical Ruler</span>
            </button>
          </div>

          {/* Interactive Calibration Guide & Target Resizer */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#F8FAFF] border border-[#DCE5F2] relative min-h-[190px]">
            <p className="text-xs text-slate-500 mb-4 text-center">
              Hold your physical {method === 'credit-card' ? 'card' : method === 'coin' ? 'coin' : 'ruler'} against the screen and adjust the slider until the outline matches exactly:
            </p>

            {method === 'credit-card' && (
              <div
                style={{ width: `${sliderPixels}px`, height: `${(sliderPixels * 53.98) / 85.6}px` }}
                className="rounded-xl border-2 border-dashed border-[#4385E8] bg-blue-50/50 flex flex-col items-center justify-center transition-all shadow-inner relative max-w-full"
              >
                <CreditCard className="w-6 h-6 text-[#4385E8] opacity-60 mb-1" />
                <span className="text-[10px] font-mono font-bold text-[#4385E8]">85.60 mm</span>
              </div>
            )}

            {method === 'coin' && (
              <div
                style={{ width: `${sliderPixels}px`, height: `${sliderPixels}px` }}
                className="rounded-full border-2 border-dashed border-[#8064E8] bg-purple-50/50 flex items-center justify-center transition-all shadow-inner relative"
              >
                <Disc className="w-6 h-6 text-[#8064E8] opacity-60" />
                <span className="absolute bottom-1 text-[9px] font-mono font-bold text-[#8064E8]">24.26 mm</span>
              </div>
            )}

            {method === 'manual-ruler' && (
              <div className="w-full flex flex-col items-center">
                <div
                  style={{ width: `${sliderPixels}px` }}
                  className="h-8 border-x-4 border-[#16A078] bg-emerald-50 relative flex items-center justify-center"
                >
                  <div className="w-full h-0.5 bg-[#16A078]" />
                  <span className="absolute -top-5 text-[11px] font-bold text-[#16A078] font-mono">
                    {manualKnownMm} mm
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Controls: Slider & Numbers */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>Adjust Dimension:</span>
              <span className="font-mono font-bold text-[#1D2940]">{sliderPixels.toFixed(0)} CSS px</span>
            </div>
            <input
              type="range"
              min="80"
              max="500"
              value={sliderPixels}
              onChange={(e) => setSliderPixels(Number(e.target.value))}
              className="w-full accent-[#4385E8] cursor-pointer"
            />
          </div>

          {/* Current DPI Stats */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-500">Calculated Screen DPI:</span>
            <span className="font-mono font-bold text-slate-800">
              {((sliderPixels / (method === 'credit-card' ? 85.6 : method === 'coin' ? 24.26 : manualKnownMm)) * 25.4).toFixed(1)} DPI
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => {
              resetCalibration();
              showToast('Reset to default screen calibration', 'info');
              closeModal();
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
          </button>

          <button
            onClick={handleSaveCalibration}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#4385E8] to-[#8064E8] text-white font-bold text-xs shadow-md shadow-brand-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm & Apply</span>
          </button>
        </div>
      </div>
    </div>
  );
};

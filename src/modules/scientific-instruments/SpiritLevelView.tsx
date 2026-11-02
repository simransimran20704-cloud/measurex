import React, { useState, useEffect, useRef } from 'react';
import { useHistoryStore } from '../../stores/historyStore';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import { soundEffects } from '../../utils/soundEffects';
import {
  Compass,
  RotateCcw,
  Copy,
  Target,
  Maximize2,
  CheckCircle2,
  Smartphone,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const SpiritLevelView: React.FC = () => {
  const { addItem } = useHistoryStore();
  const { showToast } = useAppStore();
  const { requireAuth } = useAuthStore();

  // Pitch (X tilt) and Roll (Y tilt) in degrees (-45° to +45°)
  const [pitchDeg, setPitchDeg] = useState<number>(0.0);
  const [rollDeg, setRollDeg] = useState<number>(0.0);
  const [zeroOffsetPitch, setZeroOffsetPitch] = useState<number>(0.0);
  const [zeroOffsetRoll, setZeroOffsetRoll] = useState<number>(0.0);
  const [sensorActive, setSensorActive] = useState<boolean>(false);

  const padRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Calibrated values
  const effPitch = pitchDeg - zeroOffsetPitch;
  const effRoll = rollDeg - zeroOffsetRoll;

  // Composite 2D tilt magnitude
  const totalTiltDeg = Math.sqrt(effPitch * effPitch + effRoll * effRoll);
  const slopePercent = Math.tan((totalTiltDeg * Math.PI) / 180) * 100;
  const mmPerMeter = Math.tan((totalTiltDeg * Math.PI) / 180) * 1000;
  const inPerFoot = (mmPerMeter / 1000) * 12;

  const isLevel = totalTiltDeg < 0.2;

  // Real device orientation listener
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (sensorActive && e.beta !== null && e.gamma !== null) {
        setPitchDeg(Math.max(-45, Math.min(45, e.beta)));
        setRollDeg(Math.max(-45, Math.min(45, e.gamma)));
      }
    };

    if (sensorActive && window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    }
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [sensorActive]);

  const toggleSensor = () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && (DeviceOrientationEvent as any).requestPermission) {
      (DeviceOrientationEvent as any)
        .requestPermission()
        .then((response: string) => {
          if (response === 'granted') {
            setSensorActive(!sensorActive);
            showToast('Device orientation sensor enabled', 'success');
          } else {
            showToast('Sensor permission denied', 'warning');
          }
        })
        .catch(() => {
          setSensorActive(!sensorActive);
        });
    } else {
      setSensorActive(!sensorActive);
      showToast(sensorActive ? 'Sensor paused' : 'Hardware gyro active (if supported)', 'info');
    }
  };

  // Interactive 2D drag pad
  const updateTiltFromPointer = (e: React.PointerEvent) => {
    if (!padRef.current) return;
    const rect = padRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = (e.clientX - centerX) / (rect.width / 2);
    const dy = (e.clientY - centerY) / (rect.height / 2);

    const clampedX = Math.max(-1, Math.min(1, dx));
    const clampedY = Math.max(-1, Math.min(1, dy));

    setRollDeg(parseFloat((clampedX * 30).toFixed(2)));
    setPitchDeg(parseFloat((clampedY * 30).toFixed(2)));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    (e.target as Element).setPointerCapture(e.pointerId);
    updateTiltFromPointer(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    updateTiltFromPointer(e);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
  };

  const handleZeroCalibrate = () => {
    setZeroOffsetPitch(pitchDeg);
    setZeroOffsetRoll(rollDeg);
    soundEffects.snap();
    showToast('Current plane calibrated as 0.00° level reference', 'success');
  };

  const handleResetZero = () => {
    setZeroOffsetPitch(0);
    setZeroOffsetRoll(0);
    setPitchDeg(0);
    setRollDeg(0);
    soundEffects.click();
    showToast('Zero offset reset to absolute earth horizontal', 'info');
  };

  const handleLogMeasurement = () => {
    requireAuth('save spirit level measurement', () => {
      addItem({
        tool: 'Digital Spirit Level',
        title: 'Surface Inclinometer Reading',
        value: `${totalTiltDeg.toFixed(2)}°`,
        rawNumericValue: parseFloat(totalTiltDeg.toFixed(2)),
        unit: '°',
        details: `Pitch: ${effPitch.toFixed(2)}°, Roll: ${effRoll.toFixed(2)}°, Slope: ${slopePercent.toFixed(2)}%, Fall: ${mmPerMeter.toFixed(1)} mm/m`,
      });
      showToast('Level reading saved to Project History', 'success');
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 select-none pb-12">
      {/* Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-white/90 border border-[#DCE5F2] shadow-glass flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Target className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-[#1D2940]">Digital Spirit Level & Inclinometer</h1>
          </div>
          <p className="text-xs md:text-sm text-[#66758D]">
            Dual-axis bullseye surface bubble level, tubular beam vial, and pitch/roll digital inclinometer.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleSensor}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              sensorActive
                ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>{sensorActive ? 'Hardware Gyro Active' : 'Use Device Gyro'}</span>
          </button>

          <button
            onClick={handleLogMeasurement}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4385E8] to-[#8064E8] text-white text-xs font-bold shadow-md shadow-brand-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            <span>Save Level</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Bullseye Level & Tubular Vial */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Main Visualizer Container */}
          <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border-2 border-slate-800 shadow-2xl flex flex-col items-center justify-center relative min-h-[420px]">
            {/* Level Pill */}
            <div className="absolute top-4 left-4 z-10">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  isLevel
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-lg shadow-emerald-500/20'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                }`}
              >
                {isLevel ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>SURFACE LEVEL (0.00° ±0.1°)</span>
                  </>
                ) : (
                  <>
                    <Target className="w-3.5 h-3.5 text-amber-400" />
                    <span>SURFACE TILTED ({totalTiltDeg.toFixed(2)}°)</span>
                  </>
                )}
              </span>
            </div>

            {/* Readout Top Right */}
            <div className="absolute top-4 right-4 z-10 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Total Angle Tilt
              </span>
              <span className="text-2xl font-mono font-black text-cyan-400">
                {totalTiltDeg.toFixed(2)}°
              </span>
            </div>

            {/* Circular Bullseye Bubble Vial */}
            <div className="relative w-64 h-64 my-4 flex items-center justify-center">
              {/* Outer Metallic Bezel */}
              <div className="w-full h-full rounded-full p-2.5 bg-gradient-to-tr from-slate-700 via-slate-600 to-slate-800 shadow-2xl border border-slate-600 flex items-center justify-center">
                {/* Fluid Chamber */}
                <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 relative overflow-hidden border-2 border-emerald-500/30 shadow-inner flex items-center justify-center">
                  {/* Concentric Tolerance Rings */}
                  <div className="absolute w-44 h-44 rounded-full border border-emerald-500/20" />
                  <div className="absolute w-28 h-28 rounded-full border border-emerald-500/40" />
                  {/* Center Bullseye Target Ring (0° level) */}
                  <div className="absolute w-12 h-12 rounded-full border-2 border-emerald-400/80 bg-emerald-500/10" />

                  {/* Crosshairs */}
                  <div className="absolute w-full h-[1px] bg-emerald-500/30" />
                  <div className="absolute h-full w-[1px] bg-emerald-500/30" />

                  {/* Physics Floating Fluorescent Bubble */}
                  {(() => {
                    // Maximum displacement radius = 80px
                    const maxR = 80;
                    const bx = Math.max(-maxR, Math.min(maxR, effRoll * 3.5));
                    const by = Math.max(-maxR, Math.min(maxR, effPitch * 3.5));

                    return (
                      <div
                        style={{
                          transform: `translate(${bx}px, ${by}px)`,
                          transition: sensorActive ? 'none' : 'transform 0.08s ease-out',
                        }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center border shadow-xl ${
                          isLevel
                            ? 'bg-emerald-400/90 border-white shadow-emerald-400/80'
                            : 'bg-lime-400/90 border-white/80 shadow-lime-400/60'
                        }`}
                      >
                        <div className="w-2.5 h-2.5 rounded-full bg-white/70" />
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Horizontal Tubular Beam Vial (X Roll) */}
            <div className="w-full max-w-md h-9 mt-2 rounded-full bg-slate-800/90 border-2 border-slate-700 relative overflow-hidden flex items-center justify-center px-4 shadow-inner">
              <div className="absolute inset-y-0 w-12 border-x-2 border-emerald-400/70 bg-emerald-500/10 pointer-events-none" />
              <div className="w-full h-[1px] bg-slate-700" />
              {/* Tubular Bubble */}
              {(() => {
                const maxTubularX = 140;
                const tx = Math.max(-maxTubularX, Math.min(maxTubularX, effRoll * 6));
                return (
                  <div
                    style={{
                      transform: `translateX(${tx}px)`,
                      transition: sensorActive ? 'none' : 'transform 0.08s ease-out',
                    }}
                    className={`absolute w-10 h-6 rounded-full flex items-center justify-center border shadow-md ${
                      Math.abs(effRoll) < 0.2
                        ? 'bg-emerald-400 border-white shadow-emerald-400/80'
                        : 'bg-lime-400 border-white/80'
                    }`}
                  >
                    <div className="w-1.5 h-3 rounded-full bg-white/70" />
                  </div>
                );
              })()}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 font-mono">
              Horizontal Beam Vial (Roll: {effRoll.toFixed(2)}°)
            </span>
          </div>

          {/* Real-Time Metrology Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-[#DCE5F2] shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Pitch (Y Tilt)</span>
              <span className="text-lg font-mono font-black text-[#1D2940]">{effPitch.toFixed(2)}°</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#DCE5F2] shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Roll (X Tilt)</span>
              <span className="text-lg font-mono font-black text-[#1D2940]">{effRoll.toFixed(2)}°</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#DCE5F2] shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Grade Slope (%)</span>
              <span className="text-lg font-mono font-black text-[#4385E8]">{slopePercent.toFixed(2)} %</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#DCE5F2] shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Fall / Run</span>
              <span className="text-lg font-mono font-black text-emerald-600">{mmPerMeter.toFixed(1)} mm/m</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Tilt Pad & Presets */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Interactive Drag Pad */}
          <div className="p-6 rounded-3xl bg-white border border-[#DCE5F2] shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Simulate Surface Tilt
              </span>
              <span className="text-[10px] text-slate-400">Drag cursor</span>
            </div>

            {/* 2D Drag Pad */}
            <div
              ref={padRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="w-full h-48 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 relative flex items-center justify-center cursor-crosshair touch-none overflow-hidden"
            >
              {/* Grid axes */}
              <div className="absolute w-full h-[1px] bg-slate-300" />
              <div className="absolute h-full w-[1px] bg-slate-300" />
              <div className="w-16 h-16 rounded-full border border-slate-300 pointer-events-none" />

              {/* Cursor indicator */}
              <div
                style={{
                  transform: `translate(${(effRoll / 30) * 85}px, ${(effPitch / 30) * 85}px)`,
                }}
                className="w-5 h-5 rounded-full bg-[#4385E8] border-2 border-white shadow-md pointer-events-none"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 font-mono pt-1">
              <span>X: {effRoll.toFixed(1)}°</span>
              <span>Y: {effPitch.toFixed(1)}°</span>
            </div>
          </div>

          {/* Quick Level Presets */}
          <div className="p-6 rounded-3xl bg-white border border-[#DCE5F2] shadow-sm flex flex-col gap-2.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Standard Metrology Angles
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setPitchDeg(0);
                  setRollDeg(0);
                  soundEffects.snap();
                }}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50/50 text-slate-800 text-xs font-bold transition-all text-left"
              >
                <span className="block text-emerald-600">0.00° Level</span>
                <span className="text-[10px] text-slate-400 font-normal">Table & Surface</span>
              </button>

              <button
                onClick={() => {
                  setPitchDeg(1.5);
                  setRollDeg(0);
                  soundEffects.click();
                }}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 text-slate-800 text-xs font-bold transition-all text-left"
              >
                <span className="block text-blue-600">1.50° Grade</span>
                <span className="text-[10px] text-slate-400 font-normal">Pipe Drainage</span>
              </button>

              <button
                onClick={() => {
                  setPitchDeg(45.0);
                  setRollDeg(0);
                  soundEffects.click();
                }}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-purple-400 bg-slate-50 hover:bg-purple-50/50 text-slate-800 text-xs font-bold transition-all text-left"
              >
                <span className="block text-purple-600">45.00° Miter</span>
                <span className="text-[10px] text-slate-400 font-normal">Bevel Chamfer</span>
              </button>

              <button
                onClick={() => {
                  setPitchDeg(0);
                  setRollDeg(90.0);
                  soundEffects.click();
                }}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-cyan-400 bg-slate-50 hover:bg-cyan-50/50 text-slate-800 text-xs font-bold transition-all text-left"
              >
                <span className="block text-cyan-600">90.00° Plumb</span>
                <span className="text-[10px] text-slate-400 font-normal">Vertical Post</span>
              </button>
            </div>

            {/* Zero Tare Calibration */}
            <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
              <button
                onClick={handleZeroCalibrate}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
              >
                Tare Relative Zero
              </button>
              <button
                onClick={handleResetZero}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                title="Reset to absolute"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

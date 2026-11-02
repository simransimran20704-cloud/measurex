import React, { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import { soundEffects } from '../../utils/soundEffects';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Clock,
  ArrowRight,
  BookOpen,
  Printer,
  Sparkles,
} from 'lucide-react';

interface Question {
  id: number;
  type: 'vernier' | 'micrometer';
  instrumentName: string;
  msr: number;
  vsr: number;
  lc: number;
  correctAnswer: number;
  unit: string;
}

const GENERATE_QUESTIONS = (): Question[] => [
  { id: 1, type: 'vernier', instrumentName: 'Vernier Caliper', msr: 14, vsr: 6, lc: 0.02, correctAnswer: 14.12, unit: 'mm' },
  { id: 2, type: 'micrometer', instrumentName: 'Screw Gauge Micrometer', msr: 7.5, vsr: 32, lc: 0.01, correctAnswer: 7.82, unit: 'mm' },
  { id: 3, type: 'vernier', instrumentName: 'Vernier Caliper', msr: 28, vsr: 14, lc: 0.02, correctAnswer: 28.28, unit: 'mm' },
  { id: 4, type: 'micrometer', instrumentName: 'Screw Gauge Micrometer', msr: 12.0, vsr: 18, lc: 0.01, correctAnswer: 12.18, unit: 'mm' },
  { id: 5, type: 'vernier', instrumentName: 'Vernier Caliper', msr: 5, vsr: 22, lc: 0.02, correctAnswer: 5.44, unit: 'mm' },
];

export const MetrologyQuizView: React.FC = () => {
  const { showToast } = useAppStore();
  const { user } = useAuthStore();

  const [questions, setQuestions] = useState<Question[]>(GENERATE_QUESTIONS());
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [score, setScore] = useState<number>(0);
  const [answered, setAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);

  const currentQ = questions[currentIndex];

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim()) return;

    const val = parseFloat(userAnswer);
    const correct = Math.abs(val - currentQ.correctAnswer) < 0.005;

    setIsCorrect(correct);
    setAnswered(true);

    if (correct) {
      setScore((prev) => prev + 1);
      soundEffects.snap();
      showToast('Correct reading! +1 point', 'success');
    } else {
      soundEffects.click();
      showToast(`Incorrect. The reading is ${currentQ.correctAnswer} mm`, 'warning');
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setUserAnswer('');
      setAnswered(false);
      setIsCorrect(false);
    } else {
      setQuizCompleted(true);
      if (score >= 3 && typeof window !== 'undefined' && typeof document !== 'undefined') {
        try {
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
        } catch (e) {}
      }
    }
  };

  const handleRestart = () => {
    setQuestions(GENERATE_QUESTIONS());
    setCurrentIndex(0);
    setUserAnswer('');
    setScore(0);
    setAnswered(false);
    setIsCorrect(false);
    setQuizCompleted(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 select-none pb-12">
      {/* Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-white/90 border border-[#DCE5F2] shadow-glass flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-purple-50 text-[#8064E8] border border-purple-200">
              <Award className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-[#1D2940]">Metrology Practice & Exam Mode</h1>
          </div>
          <p className="text-xs md:text-sm text-[#66758D]">
            Test your precision reading skills on authentic Vernier Caliper and Micrometer simulations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-bold border border-slate-200">
            Score: {score} / {questions.length}
          </span>
        </div>
      </div>

      {!quizCompleted ? (
        <div className="p-6 md:p-8 rounded-3xl bg-white border border-[#DCE5F2] shadow-sm flex flex-col gap-6">
          {/* Question Index Progress */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Question {currentIndex + 1} of {questions.length} • {currentQ.instrumentName}
            </span>
            <span className="text-xs font-mono text-brand-blue font-bold">
              Least Count (LC): {currentQ.lc} mm
            </span>
          </div>

          {/* Scale Display Canvas */}
          <div className="p-6 rounded-2xl bg-slate-900 border-2 border-slate-800 flex flex-col items-center justify-center min-h-[220px]">
            {/* SVG Visualizer of Scale */}
            <svg viewBox="0 0 360 140" className="w-full max-w-md drop-shadow-xl">
              {currentQ.type === 'vernier' ? (
                <>
                  {/* Vernier Caliper Scale */}
                  <rect x="20" y="20" width="320" height="40" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1.5" />
                  {/* Main scale tick marks */}
                  {[0, 5, 10, 15, 20, 25, 30].map((num) => {
                    const x = 30 + num * 9;
                    return (
                      <g key={num}>
                        <line x1={x} y1="20" x2={x} y2="40" stroke="#1E293B" strokeWidth="1.5" />
                        <text x={x} y="54" fill="#1E293B" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                          {num}
                        </text>
                      </g>
                    );
                  })}

                  {/* Vernier Slider (Bottom Scale) */}
                  {(() => {
                    const sliderX = 30 + currentQ.correctAnswer * 9;
                    return (
                      <g transform={`translate(${sliderX}, 60)`}>
                        <rect x="0" y="0" width="180" height="35" fill="#EEF4FF" stroke="#4385E8" strokeWidth="1.5" />
                        <polygon points="0,0 4,-6 -4,-6" fill="#4385E8" />
                        {/* Vernier scale divisions */}
                        {[0, 5, 10, 15, 20, 25].map((div) => {
                          const vx = div * 6.5;
                          return (
                            <line key={div} x1={vx} y1="0" x2={vx} y2="12" stroke="#4385E8" strokeWidth="1.2" />
                          );
                        })}
                        <text x="5" y="24" fill="#4385E8" fontSize="8" fontWeight="bold" fontFamily="monospace">
                          0.02 mm
                        </text>
                      </g>
                    );
                  })()}
                </>
              ) : (
                <>
                  {/* Micrometer Barrel & Thimble Scale */}
                  {/* Sleeve */}
                  <rect x="30" y="35" width="160" height="50" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1.5" />
                  <line x1="30" y1="60" x2="190" y2="60" stroke="#1E293B" strokeWidth="1.5" />
                  {[0, 5, 10, 15].map((num) => {
                    const x = 40 + num * 9;
                    return (
                      <g key={num}>
                        <line x1={x} y1="45" x2={x} y2="60" stroke="#1E293B" strokeWidth="1.5" />
                        <text x={x} y="42" fill="#1E293B" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                          {num}
                        </text>
                      </g>
                    );
                  })}
                  {/* Thimble */}
                  <rect x="170" y="20" width="120" height="80" rx="3" fill="#EEF4FF" stroke="#8064E8" strokeWidth="1.5" />
                  <line x1="170" y1="60" x2="290" y2="60" stroke="#8064E8" strokeWidth="1" strokeDasharray="3,3" />
                  <text x="210" y="64" fill="#8064E8" fontSize="12" fontWeight="bold" fontFamily="monospace">
                    {currentQ.vsr}
                  </text>
                </>
              )}
            </svg>

            <span className="text-[11px] text-slate-400 mt-2 font-mono">
              Inspect the scale alignment above and determine the reading.
            </span>
          </div>

          {/* Answer Form */}
          <form onSubmit={handleSubmitAnswer} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Enter Scale Reading (in mm):</label>
              <div className="flex gap-3">
                <input
                  type="number"
                  step="0.01"
                  required
                  disabled={answered}
                  placeholder="e.g. 14.12"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-sm font-mono font-bold rounded-2xl border border-slate-200 outline-none focus:border-brand-blue"
                />
                {!answered ? (
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#4385E8] to-[#8064E8] text-white text-xs font-bold shadow-md shadow-brand-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Submit Answer
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="px-6 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-md hover:bg-slate-800 transition-all flex items-center gap-1.5"
                  >
                    <span>{currentIndex + 1 < questions.length ? 'Next Question' : 'View Results'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Step-by-Step Explanation Banner When Answered */}
            {answered && (
              <div
                className={`p-4 rounded-2xl border flex flex-col gap-2 animate-in fade-in ${
                  isCorrect
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50/70 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-amber-600" />
                  )}
                  <span className="font-bold text-sm">
                    {isCorrect ? 'Correct!' : `Incorrect (Your answer: ${userAnswer} mm)`}
                  </span>
                </div>

                <div className="text-xs font-mono pl-7 flex flex-col gap-0.5 text-slate-700">
                  <span>Main Scale Reading (MSR) = {currentQ.msr} mm</span>
                  <span>Coincidence Division (VSR) = {currentQ.vsr}</span>
                  <span>Least Count (LC) = {currentQ.lc} mm</span>
                  <span className="font-bold mt-1 text-[#1D2940]">
                    Total = MSR + (VSR × LC) = {currentQ.msr} + ({currentQ.vsr} × {currentQ.lc}) ={' '}
                    {currentQ.correctAnswer} mm
                  </span>
                </div>
              </div>
            )}
          </form>
        </div>
      ) : (
        /* Quiz Completed & Certificate Card */
        <div className="p-8 rounded-3xl bg-white border border-[#DCE5F2] shadow-sm flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <Award className="w-9 h-9" />
          </div>

          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Exam Complete
          </span>

          <h2 className="text-2xl font-black text-[#1D2940]">
            Final Score: {score} / {questions.length} ({Math.round((score / questions.length) * 100)}%)
          </h2>

          <p className="text-xs text-slate-500 max-w-md">
            {score >= 4
              ? 'Outstanding performance! You have demonstrated verified proficiency in dimensional metrology scales.'
              : 'Good effort! Review the vernier coincidence and micrometer pitch principles and try again.'}
          </p>

          {/* Certificate Badge */}
          {score >= 3 && (
            <div className="w-full max-w-lg my-4 p-6 rounded-2xl bg-gradient-to-br from-[#EEF4FF] via-white to-[#F0EDFF] border border-[#DCE5F2] text-center flex flex-col items-center gap-2 shadow-xs">
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#4385E8] uppercase">
                MEASUREX METROLOGY INSTITUTE
              </span>
              <h3 className="text-lg font-black text-[#1D2940]">Certificate of Metrology Competency</h3>
              <p className="text-xs text-slate-600">
                Awarded to <span className="font-bold text-[#1D2940]">{user?.name || 'Simran Sharma'}</span> for successfully passing the Dimensional Calibration & Metrology Reading Evaluation.
              </p>
              <span className="text-[10px] font-mono text-slate-400 mt-2">
                Verification ID: MX-CERT-{(Date.now() % 1000000).toString(16).toUpperCase()}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleRestart}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry Practice Exam</span>
            </button>

            {score >= 3 && (
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4385E8] to-[#8064E8] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-brand-blue/20 hover:scale-[1.02] transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Print Certificate</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

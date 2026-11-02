import React, { useState } from 'react';
import { useAuthStore, SubscriptionPlan } from '../../stores/authStore';
import { useAppStore } from '../../stores/appStore';
import { X, Check, Crown, Sparkles, ShieldCheck, Zap, ArrowRight } from 'lucide-react';

export const SubscriptionModal: React.FC = () => {
  const {
    isSubscriptionModalOpen,
    closeSubscriptionModal,
    user,
    upgradePlan,
    openAuthModal,
    isAuthenticated,
    openBillingModal,
  } = useAuthStore();
  const { showToast } = useAppStore();

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  if (!isSubscriptionModalOpen) return null;

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (!isAuthenticated) {
      closeSubscriptionModal();
      openAuthModal('signup', 'Create an account to activate your subscription plan.');
      return;
    }

    if (user?.plan === plan) {
      showToast(`You are currently on the ${plan.toUpperCase()} plan.`, 'info');
      return;
    }

    if (plan === 'free') {
      upgradePlan('free');
      showToast('Switched to Starter Basic plan.', 'info');
      return;
    }

    // Open Checkout Billing Form
    openBillingModal(plan);
  };

  const plans = [
    {
      id: 'free' as SubscriptionPlan,
      name: 'Starter Basic',
      priceMonthly: 0,
      priceAnnual: 0,
      description: 'Fundamental everyday digital ruler and unit conversion for students.',
      features: [
        'Quick Measure horizontal & vertical ruler',
        'Universal Unit Converter (8 categories)',
        'Basic Vernier Caliper simulation',
        'Standard screen calibration (96 DPI)',
        'Max 5 project saves (local-only)',
      ],
      popular: false,
      badge: 'Free Forever',
      buttonBg: 'bg-slate-100 text-slate-800 hover:bg-slate-200',
    },
    {
      id: 'pro' as SubscriptionPlan,
      name: 'Engineering Pro',
      priceMonthly: 19,
      priceAnnual: 12, // $144 billed annually
      description: 'Complete technical precision studio and metrology instrument laboratory.',
      features: [
        'All 7 Instruments (Vernier, Micrometer, Height Gauge, DTI, Compass, Scale, Protractor)',
        'Three-Sided Synchronized Precision Studio',
        'Image & Blueprint Measurement Studio',
        'Specimen Test Bench & Audio-Haptic Feedback',
        'Unlimited Project Workspaces & Cloud Sync',
        'Official PDF Engineering Reports & CSV Data Export',
        'Custom Least Count & Zero Error Configuration',
      ],
      popular: true,
      badge: 'Most Popular',
      buttonBg: 'bg-gradient-to-r from-[#4385E8] to-[#8064E8] text-white shadow-lg shadow-brand-blue/30 hover:scale-[1.02]',
    },
    {
      id: 'enterprise' as SubscriptionPlan,
      name: 'Enterprise Lab',
      priceMonthly: 49,
      priceAnnual: 34, // $408 billed annually
      description: 'Industrial quality control, GD&T tolerance analysis and team multi-seat licensing.',
      features: [
        'Everything in Engineering Pro',
        'Industrial GD&T Go/No-Go Tolerance Evaluation',
        'CAD DXF & Vector Drawing Exporter',
        'Calibration Certification Tracking & Audit Logs',
        'Unlimited Lab Seats & Team Synchronization',
        '24/7 Dedicated Metrology Support',
      ],
      popular: false,
      badge: 'Industrial',
      buttonBg: 'bg-gradient-to-r from-purple-600 to-[#6D28D9] text-white shadow-md hover:scale-[1.02]',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-3xl bg-white border border-white/90 shadow-2xl overflow-hidden my-8 flex flex-col">
        {/* Top Header */}
        <div className="px-8 pt-8 pb-6 bg-gradient-to-r from-blue-50/70 via-white to-purple-50/70 border-b border-slate-100 flex flex-col items-center text-center relative">
          <button
            onClick={closeSubscriptionModal}
            className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold mb-3 border border-amber-200">
            <Crown className="w-3.5 h-3.5 fill-amber-500" />
            <span>MeasureX Pro Subscriptions</span>
          </div>

          <h2 className="text-3xl font-extrabold text-[#1D2940] tracking-tight">
            Unlock Full Precision Metrology Powers
          </h2>
          <p className="text-sm text-[#66758D] mt-2 max-w-xl">
            Choose the ideal plan for educational coursework, professional technical drawings, or certified industrial quality inspection.
          </p>

          {/* Billing Switch */}
          <div className="mt-6 flex items-center gap-3 p-1 rounded-2xl bg-slate-100 border border-slate-200">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                billingCycle === 'monthly' ? 'bg-white text-[#1D2940] shadow-sm' : 'text-slate-500'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                billingCycle === 'annual' ? 'bg-white text-[#4385E8] shadow-sm' : 'text-slate-500'
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-extrabold">
                Save 35%
              </span>
            </button>
          </div>
        </div>

        {/* 3 Pricing Cards */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isCurrent = user?.plan === p.id;
            const price = billingCycle === 'annual' ? p.priceAnnual : p.priceMonthly;

            return (
              <div
                key={p.id}
                className={`relative rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 ${
                  p.popular
                    ? 'bg-gradient-to-b from-[#F8FAFF] to-[#EEF3FF] border-2 border-[#4385E8] shadow-xl'
                    : 'bg-white border border-slate-200 shadow-sm hover:border-slate-300'
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-[#4385E8] to-[#8064E8] text-white text-[10px] font-bold tracking-wider uppercase shadow-md">
                    Recommended
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg text-[#1D2940]">{p.name}</h3>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {p.badge}
                    </span>
                  </div>
                  <p className="text-xs text-[#66758D] mb-4 min-h-[36px]">{p.description}</p>

                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl font-extrabold text-[#1D2940]">${price}</span>
                    <span className="text-xs text-slate-500 font-medium">
                      / month {billingCycle === 'annual' && price > 0 && '(billed annually)'}
                    </span>
                  </div>

                  {/* Feature Checklist */}
                  <div className="flex flex-col gap-2.5 pt-4 border-t border-slate-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Features Included</span>
                    {p.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="leading-tight">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleSelectPlan(p.id)}
                  disabled={isCurrent}
                  className={`w-full mt-8 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    isCurrent
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 cursor-default'
                      : p.buttonBg
                  }`}
                >
                  {isCurrent ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Current Plan</span>
                    </>
                  ) : (
                    <>
                      <span>{price === 0 ? 'Start Free' : 'Upgrade to ' + p.name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

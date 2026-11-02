import React, { useState } from 'react';
import { useAuthStore, SubscriptionPlan, InvoiceRecord } from '../../stores/authStore';
import { useAppStore } from '../../stores/appStore';
import {
  X,
  CreditCard,
  QrCode,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Sparkles,
  Crown,
  Tag,
  ArrowRight,
  Download,
  Building,
  Check,
  FileText,
  Printer,
  ChevronRight,
} from 'lucide-react';

interface PlanDetails {
  name: string;
  monthlyPrice: number;
  annualMonthlyPrice: number;
  features: string[];
}

const PLAN_META: Record<SubscriptionPlan, PlanDetails> = {
  free: {
    name: 'Starter Basic',
    monthlyPrice: 0,
    annualMonthlyPrice: 0,
    features: ['Quick Measure digital ruler', 'Basic unit converter', 'Vernier caliper simulator'],
  },
  pro: {
    name: 'Engineering Pro',
    monthlyPrice: 19,
    annualMonthlyPrice: 12,
    features: [
      'All 7 Instruments (Vernier, Micrometer, Height Gauge, DTI, Compass, Scale, Protractor)',
      'Three-Sided Synchronized Precision Studio',
      'Image & Blueprint Metrology Studio',
      'Audio-Haptic Click Feedback & Zero Calibration',
      'Unlimited Project Workspaces & Cloud Sync',
      'Official PDF Metrology Reports & CSV Data Export',
    ],
  },
  enterprise: {
    name: 'Enterprise Lab',
    monthlyPrice: 49,
    annualMonthlyPrice: 34,
    features: [
      'All Engineering Pro features included',
      'Industrial GD&T Go/No-Go Tolerance Evaluation',
      'CAD DXF & Vector Drawing Exporter',
      'Calibration Certification Tracking & Audit Logs',
      'Multi-Seat Team Synchronization & SSO Support',
      '24/7 Dedicated Metrology Support',
    ],
  },
};

export const BillingCheckoutModal: React.FC = () => {
  const {
    isBillingModalOpen,
    closeBillingModal,
    billingPlan,
    user,
    upgradePlan,
  } = useAuthStore();
  const { showToast } = useAppStore();

  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card');

  // Customer form state
  const [fullName, setFullName] = useState(user?.name || 'Simran Sharma');
  const [email, setEmail] = useState(user?.email || 'simran.sharma@measurex.io');
  const [address, setAddress] = useState('108 Science & Technology Park');
  const [city, setCity] = useState('Bengaluru');
  const [stateName, setStateName] = useState('Karnataka');
  const [postalCode, setPostalCode] = useState('560100');
  const [country, setCountry] = useState('India');
  const [gstNumber, setGstNumber] = useState('');

  // Card payment state
  const [cardName, setCardName] = useState(user?.name || 'Simran Sharma');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8824');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('742');

  // UPI payment state
  const [upiId, setUpiId] = useState('simran@okhdfcbank');

  // Promo code
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [couponStatus, setCouponStatus] = useState<string | null>(null);

  // Checkout states: 'form' | 'processing' | 'success'
  const [checkoutStep, setCheckoutStep] = useState<'form' | 'processing' | 'success'>('form');
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [generatedInvoice, setGeneratedInvoice] = useState<InvoiceRecord | null>(null);

  if (!isBillingModalOpen) return null;

  const planInfo = PLAN_META[billingPlan] || PLAN_META.pro;
  const ratePerMonth = billingCycle === 'annual' ? planInfo.annualMonthlyPrice : planInfo.monthlyPrice;
  const rawSubtotal = billingCycle === 'annual' ? ratePerMonth * 12 : ratePerMonth;
  const discountAmount = (rawSubtotal * appliedDiscount) / 100;
  const discountedSubtotal = Math.max(0, rawSubtotal - discountAmount);
  const taxRate = 0.18; // 18% standard GST/VAT
  const taxAmount = discountedSubtotal * taxRate;
  const totalAmount = discountedSubtotal + taxAmount;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = promoCode.trim().toUpperCase();
    if (clean === 'AURORA20') {
      setAppliedDiscount(20);
      setCouponStatus('AURORA20 applied! 20% instant discount.');
      showToast('20% coupon discount applied!', 'success');
    } else if (clean === 'MEASUREX50') {
      setAppliedDiscount(50);
      setCouponStatus('MEASUREX50 applied! 50% metrology discount.');
      showToast('50% coupon discount applied!', 'success');
    } else if (clean === 'FREE100') {
      setAppliedDiscount(100);
      setCouponStatus('FREE100 applied! 100% full waiver.');
      showToast('100% full fee waiver applied!', 'success');
    } else {
      setCouponStatus('Invalid coupon code. Try AURORA20 or MEASUREX50.');
      showToast('Invalid coupon code', 'warning');
    }
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !address.trim()) {
      showToast('Please enter billing address details', 'warning');
      return;
    }

    setCheckoutStep('processing');
    setProcessingStatus('Initiating 256-bit SSL encrypted connection...');

    setTimeout(() => {
      setProcessingStatus(
        paymentMethod === 'card'
          ? 'Authorizing 3D Secure transaction with card network...'
          : `Sending UPI intent collect request to ${upiId}...`
      );
    }, 900);

    setTimeout(() => {
      setProcessingStatus('Payment verified & authorized! Generating tax invoice...');
    }, 1900);

    setTimeout(() => {
      const invId = `MX-INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const inv: InvoiceRecord = {
        id: invId,
        plan: billingPlan,
        amount: parseFloat(totalAmount.toFixed(2)),
        billingCycle,
        customerName: fullName,
        customerEmail: email,
        customerAddress: `${address}, ${city}, ${stateName} - ${postalCode}`,
        customerCountry: country,
        gstNumber: gstNumber || undefined,
        paymentMethod: paymentMethod === 'card' ? 'card' : 'upi',
        paymentRef: `TXN-${Date.now().toString(36).toUpperCase()}`,
        date: Date.now(),
      };

      setGeneratedInvoice(inv);
      upgradePlan(billingPlan, inv);
      setCheckoutStep('success');
      showToast(`🎉 Upgraded successfully to MeasureX ${planInfo.name}!`, 'success');
    }, 2800);
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl bg-white border border-[#DCE5F2] shadow-2xl overflow-hidden my-6 flex flex-col">
        {/* Top Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 via-white to-purple-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-[#4385E8] to-[#8064E8] text-white shadow-sm">
              <Crown className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-extrabold text-base text-[#1D2940]">
                {checkoutStep === 'success' ? 'Subscription Order Confirmed' : `Upgrade to ${planInfo.name}`}
              </h2>
              <span className="text-xs text-[#66758D] flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" /> 256-Bit SSL Encrypted & PCI-DSS Level 1 Compliant
              </span>
            </div>
          </div>

          <button
            onClick={closeBillingModal}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: FORM */}
        {checkoutStep === 'form' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Order Summary & Plan Details */}
            <div className="lg:col-span-5 flex flex-col gap-5 border-b lg:border-b-0 lg:border-r border-slate-100 pb-6 lg:pb-0 lg:pr-6">
              {/* Plan Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#EEF4FF] via-white to-[#F0EDFF] border border-[#DCE5F2] shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#4385E8] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    Selected Tier
                  </span>
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-slate-200 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setBillingCycle('annual')}
                      className={`px-2 py-0.5 rounded-lg transition-all ${
                        billingCycle === 'annual' ? 'bg-[#4385E8] text-white shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      Annual (-35%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingCycle('monthly')}
                      className={`px-2 py-0.5 rounded-lg transition-all ${
                        billingCycle === 'monthly' ? 'bg-[#4385E8] text-white shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      Monthly
                    </button>
                  </div>
                </div>

                <div className="flex items-baseline justify-between mt-1">
                  <div>
                    <h3 className="text-xl font-black text-[#1D2940]">{planInfo.name}</h3>
                    <p className="text-xs text-[#66758D]">
                      {billingCycle === 'annual' ? 'Billed annually with instant savings' : 'Billed monthly, cancel anytime'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#4385E8]">${ratePerMonth}</span>
                    <span className="text-xs text-slate-500 font-medium">/mo</span>
                  </div>
                </div>

                {/* Features included */}
                <div className="pt-3 border-t border-slate-200/60 flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold text-slate-600">Included in this license:</span>
                  {planInfo.features.slice(0, 4).map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                      <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Promo Coupon Form */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
                  Promo / Referral Coupon
                </span>
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. AURORA20"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 outline-none uppercase tracking-wider focus:border-[#4385E8]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                  >
                    Apply
                  </button>
                </form>
                {couponStatus && (
                  <p
                    className={`text-[11px] font-semibold mt-2 ${
                      appliedDiscount > 0 ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {couponStatus}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">Try demo codes:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPromoCode('AURORA20');
                      setAppliedDiscount(20);
                      setCouponStatus('AURORA20 applied! 20% instant discount.');
                    }}
                    className="text-[10px] font-bold text-brand-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-100"
                  >
                    AURORA20 (-20%)
                  </button>
                </div>
              </div>

              {/* Price Calculation Summary */}
              <div className="p-4 rounded-2xl bg-white border border-[#DCE5F2] flex flex-col gap-2 shadow-xs">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>
                    Subtotal ({billingCycle === 'annual' ? '12 Months' : '1 Month'})
                  </span>
                  <span className="font-mono font-semibold">${rawSubtotal.toFixed(2)}</span>
                </div>

                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                    <span>Discount Coupon ({appliedDiscount}%)</span>
                    <span className="font-mono">-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-xs text-slate-600">
                  <span>Standard Metrology Tax (18% GST/VAT)</span>
                  <span className="font-mono font-semibold">${taxAmount.toFixed(2)}</span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                  <span className="font-bold text-sm text-[#1D2940]">Total Due Today</span>
                  <div className="text-right">
                    <span className="text-xl font-extrabold text-[#4385E8] font-mono">
                      ${totalAmount.toFixed(2)}
                    </span>
                    <span className="block text-[10px] text-slate-400">USD</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Customer Details & Payment Method */}
            <form onSubmit={handleProcessPayment} className="lg:col-span-7 flex flex-col gap-5">
              {/* Customer Billing Details */}
              <div className="flex flex-col gap-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  1. Customer & Billing Address
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-600">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 outline-none focus:border-[#4385E8]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-600">Billing Email *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 outline-none focus:border-[#4385E8]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-600">Street Address *</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 outline-none focus:border-[#4385E8]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-600">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 outline-none focus:border-[#4385E8]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-600">State / Region</label>
                    <input
                      type="text"
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 outline-none focus:border-[#4385E8]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-600">Postal / ZIP</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 outline-none focus:border-[#4385E8]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-600">Country</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 outline-none focus:border-[#4385E8] bg-white"
                    >
                      <option value="India">India</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Germany">Germany</option>
                      <option value="Japan">Japan</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-600">Tax ID / GSTIN (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 29AABCU9603R1ZX"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 outline-none focus:border-[#4385E8]"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                    2. Payment Method
                  </h3>
                  <div className="flex items-center gap-1.5 p-0.5 rounded-xl bg-slate-100 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        paymentMethod === 'card' ? 'bg-white text-[#4385E8] shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Credit / Debit Card</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        paymentMethod === 'upi' ? 'bg-white text-[#8064E8] shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>UPI & QR</span>
                    </button>
                  </div>
                </div>

                {paymentMethod === 'card' ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-slate-600">Cardholder Name</label>
                      <input
                        type="text"
                        required
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 outline-none focus:border-[#4385E8] bg-white"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-slate-600">Card Number</label>
                      <div className="relative">
                        <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="4532 8920 1194 8824"
                          className="w-full pl-9 pr-14 py-2 text-xs font-mono font-medium rounded-xl border border-slate-200 outline-none focus:border-[#4385E8] bg-white"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#4385E8] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          VISA
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold text-slate-600">Expires (MM/YY)</label>
                        <input
                          type="text"
                          required
                          placeholder="12/28"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-mono font-medium rounded-xl border border-slate-200 outline-none focus:border-[#4385E8] bg-white"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold text-slate-600">CVV / CVC</label>
                        <input
                          type="password"
                          required
                          maxLength={4}
                          placeholder="•••"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-mono font-medium rounded-xl border border-slate-200 outline-none focus:border-[#4385E8] bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200 flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-slate-600">Virtual Payment Address (VPA / UPI ID)</label>
                      <input
                        type="text"
                        required
                        placeholder="yourname@okhdfcbank"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono font-medium rounded-xl border border-slate-200 outline-none focus:border-[#8064E8] bg-white"
                      />
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-purple-100">
                      {/* Simulated QR Code */}
                      <div className="w-16 h-16 bg-slate-900 rounded-lg p-1.5 flex items-center justify-center flex-shrink-0">
                        <QrCode className="w-full h-full text-white" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">
                          Instant Scan & Pay via any UPI App
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Compatible with Google Pay, PhonePe, Paytm, BHIM & Apple Pay
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-[#4385E8] via-[#6576E8] to-[#8064E8] text-white font-extrabold text-sm shadow-lg shadow-brand-blue/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Authorize & Pay ${totalAmount.toFixed(2)} USD</span>
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: PROCESSING SIMULATION */}
        {checkoutStep === 'processing' && (
          <div className="py-20 px-8 flex flex-col items-center justify-center text-center">
            <div className="relative w-20 h-20 mb-6">
              <div className="w-full h-full border-4 border-blue-100 border-t-[#4385E8] rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-[#8064E8]">
                <ShieldCheck className="w-8 h-8" />
              </div>
            </div>

            <h3 className="text-xl font-extrabold text-[#1D2940] mb-2">Processing Secure Authorization</h3>
            <p className="text-sm font-medium text-[#4385E8] animate-pulse max-w-md">{processingStatus}</p>

            <span className="text-[11px] text-slate-400 mt-6 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Do not close this browser window or refresh the page
            </span>
          </div>
        )}

        {/* STEP 3: POST-PAYMENT SUCCESS & OFFICIAL TAX INVOICE */}
        {checkoutStep === 'success' && generatedInvoice && (
          <div className="p-8 flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 mb-2">
              Payment Confirmed
            </span>

            <h2 className="text-2xl font-black text-[#1D2940]">
              Welcome to MeasureX {planInfo.name}!
            </h2>
            <p className="text-xs text-[#66758D] mt-1 text-center max-w-md">
              Your license is active immediately. All 7 metrology instruments, 3-sided precision studio, and cloud project sync are unlocked.
            </p>

            {/* Printable Tax Invoice Card */}
            <div
              id="measurex-tax-invoice"
              className="w-full max-w-xl my-6 p-6 rounded-2xl bg-slate-50 border border-slate-200 text-left flex flex-col gap-4 text-xs font-sans shadow-xs"
            >
              <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                <div>
                  <h4 className="font-extrabold text-sm text-[#1D2940]">MEASUREX METROLOGY SYSTEMS INC.</h4>
                  <p className="text-[10px] text-slate-500">Tax Invoice & Official License Receipt</p>
                  <p className="text-[10px] text-slate-500">GSTIN / EIN: US-8829104-MX</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-xs text-[#4385E8]">{generatedInvoice.id}</span>
                  <p className="text-[10px] text-slate-400">
                    {new Date(generatedInvoice.date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Billed To</span>
                  <p className="font-bold text-[#1D2940]">{generatedInvoice.customerName}</p>
                  <p className="text-slate-600 text-[11px]">{generatedInvoice.customerEmail}</p>
                  <p className="text-slate-500 text-[10px]">{generatedInvoice.customerAddress}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Payment Reference</span>
                  <p className="font-mono text-slate-700 font-semibold">{generatedInvoice.paymentRef}</p>
                  <p className="text-[11px] text-slate-600 capitalize">Method: {generatedInvoice.paymentMethod}</p>
                  <span className="inline-block mt-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    PAID IN FULL
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3 flex flex-col gap-1.5">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>MeasureX {planInfo.name} ({generatedInvoice.billingCycle})</span>
                  <span>${generatedInvoice.amount.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Authorized Metrology Simulation License</span>
                  <span>1 Seat (Active)</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrintInvoice}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>Print / Save PDF Receipt</span>
              </button>

              <button
                onClick={closeBillingModal}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#4385E8] to-[#8064E8] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-brand-blue/20 hover:scale-[1.02] transition-all"
              >
                <span>Enter MeasureX Metrology Studio</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

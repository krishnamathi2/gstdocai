"use client";

import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, Suspense, useRef } from "react";
import Link from "next/link";

const PLANS: Record<string, { name: string; price: number; credits: number; buttonId: string }> = {
  pro: { name: "Professional", price: 499, credits: 100, buttonId: "pl_SBFWJaueKzocnm" },
  firm: { name: "CA Firm", price: 1499, credits: 500, buttonId: "pl_SBFb29wBhLmBCN" },
};

function PaymentContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentFormRef = useRef<HTMLFormElement>(null);

  const planId = searchParams.get("plan") || "pro";
  const plan = PLANS[planId];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Load Razorpay Payment Button script
  useEffect(() => {
    if (!plan || !paymentFormRef.current) return;

    // Clear any existing content
    paymentFormRef.current.innerHTML = '';

    // Create and append the script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/payment-button.js';
    script.setAttribute('data-payment_button_id', plan.buttonId);
    script.async = true;
    
    paymentFormRef.current.appendChild(script);

    return () => {
      if (paymentFormRef.current) {
        paymentFormRef.current.innerHTML = '';
      }
    };
  }, [plan]);

  if (!plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Invalid Plan</h2>
          <Link href="/pricing" className="text-emerald-400 hover:underline">
            ← Back to Pricing
          </Link>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">GST Doc AI</h1>
              </div>
            </Link>
            <Link href="/pricing" className="text-sm text-slate-400 hover:text-white transition-colors">
              ← Back to Pricing
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">Complete Your Purchase</h2>
          <p className="text-slate-400">You're upgrading to the {plan.name} plan</p>
        </div>

        {/* Payment Card */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-8">
          {/* Plan Summary */}
          <div className="border-b border-slate-700/50 pb-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-400">Plan</span>
              <span className="text-white font-medium">{plan.name}</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-400">Credits</span>
              <span className="text-white font-medium">{plan.credits} letters/month</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Billing</span>
              <span className="text-white font-medium">Monthly</span>
            </div>
          </div>

          {/* Amount */}
          <div className="border-b border-slate-700/50 pb-6 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-lg text-white font-medium">Total Amount</span>
              <span className="text-3xl font-bold text-emerald-400">₹{plan.price}</span>
            </div>
            <p className="text-xs text-slate-500 mt-2 text-right">Inclusive of all taxes</p>
          </div>

          {/* Features */}
          <div className="mb-8">
            <h4 className="text-sm font-medium text-slate-400 mb-3">What you'll get:</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {plan.credits} letters per month
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                All 10 Indian languages
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                PDF export with digital signature
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Letter history & priority support
              </li>
            </ul>
          </div>

          {/* Razorpay Payment Button */}
          <div className="flex justify-center">
            <form ref={paymentFormRef} className="razorpay-payment-button-form">
              {/* Razorpay button will be injected here */}
            </form>
          </div>

          {/* Security Badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Secured by Razorpay • 256-bit SSL encryption
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}

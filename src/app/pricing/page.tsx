"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    credits: 5,
    period: "month",
    features: [
      "5 letters per month",
      "All 10 Indian languages",
      "Copy to clipboard",
      "WhatsApp sharing",
      "Basic support",
    ],
    popular: false,
  },
  {
    id: "pro",
    name: "Professional",
    price: 499,
    credits: 100,
    period: "month",
    features: [
      "100 letters per month",
      "All 10 Indian languages",
      "PDF export",
      "Digital signature",
      "Letter history",
      "Priority support",
    ],
    popular: true,
  },
  {
    id: "firm",
    name: "CA Firm",
    price: 1499,
    credits: 500,
    period: "month",
    features: [
      "500 letters per month",
      "All 10 Indian languages",
      "PDF export",
      "Digital signature",
      "Letter history",
      "Bulk generation",
      "Multiple users (coming soon)",
      "Dedicated support",
    ],
    popular: false,
  },
];

export default function PricingPage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleUpgrade = (planId: string) => {
    if (!session) {
      window.location.href = "/auth/signin";
      return;
    }

    if (planId === "free") return;

    setIsLoading(planId);

    // Navigate to payments page with plan details
    router.push(`/payments?plan=${planId}`);
  };

  const currentPlan = session?.user?.plan || "free";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">GST Doc AI</h1>
              </div>
            </Link>
            <Link
              href="/"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              ← Back to Generator
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Choose Your Plan
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Upgrade to unlock more features and generate unlimited GST compliance letters
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-8 ${
                plan.popular
                  ? "border-emerald-500 bg-slate-800/80"
                  : "border-slate-700/50 bg-slate-800/50"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-1 text-xs font-medium text-white">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-bold text-white">
                    ₹{plan.price}
                  </span>
                  <span className="ml-2 text-slate-400">/{plan.period}</span>
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  {plan.credits} letters per month
                </p>
              </div>

              <ul className="mb-8 space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <svg
                      className="h-5 w-5 text-emerald-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isLoading !== null || currentPlan === plan.id}
                className={`w-full rounded-lg px-4 py-3 font-medium transition-all ${
                  currentPlan === plan.id
                    ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                    : plan.popular
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
                    : "border border-slate-600 text-white hover:bg-slate-700"
                } disabled:opacity-50`}
              >
                {isLoading === plan.id
                  ? "Opening Payment..."
                  : currentPlan === plan.id
                  ? "Current Plan"
                  : plan.price === 0
                  ? "Get Started"
                  : "Upgrade Now"}
              </button>
            </div>
          ))}
        </div>

        {/* Payment Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-400">
            Secure payments powered by{" "}
            <a 
              href="https://razorpay.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline"
            >
              Razorpay
            </a>
          </p>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h3 className="text-xl font-semibold text-white text-center mb-8">
            Frequently Asked Questions
          </h3>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
              <h4 className="font-medium text-white mb-2">
                How do credits work?
              </h4>
              <p className="text-sm text-slate-400">
                Each letter generation uses 1 credit. Credits reset monthly on your billing date.
              </p>
            </div>
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
              <h4 className="font-medium text-white mb-2">
                Can I cancel anytime?
              </h4>
              <p className="text-sm text-slate-400">
                Yes! You can cancel your subscription at any time. You&apos;ll keep access until the end of your billing period.
              </p>
            </div>
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
              <h4 className="font-medium text-white mb-2">
                What payment methods do you accept?
              </h4>
              <p className="text-sm text-slate-400">
                We accept all major cards, UPI, net banking, and wallets through Razorpay.
              </p>
            </div>
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
              <h4 className="font-medium text-white mb-2">
                Do you offer refunds?
              </h4>
              <p className="text-sm text-slate-400">
                We offer a 7-day money-back guarantee if you&apos;re not satisfied with the service.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

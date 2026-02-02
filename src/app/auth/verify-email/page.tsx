"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
          // Redirect to signin after 3 seconds
          setTimeout(() => {
            router.push("/auth/signin");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(data.error || "Failed to verify email.");
        }
      } catch (error) {
        setStatus("error");
        setMessage("An error occurred while verifying your email.");
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-8 backdrop-blur-sm text-center">
          {/* Logo */}
          <div className="mb-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
              <svg
                className="h-8 w-8 text-white"
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
            <h1 className="mt-4 text-2xl font-bold text-white">GST Doc AI</h1>
          </div>

          {status === "loading" && (
            <>
              <div className="mb-4">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-600 border-t-emerald-500"></div>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Verifying Email</h2>
              <p className="text-slate-400">Please wait while we verify your email address...</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mb-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                  <svg
                    className="h-8 w-8 text-emerald-500"
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
                </div>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Email Verified!</h2>
              <p className="text-slate-400 mb-6">{message}</p>
              <p className="text-sm text-slate-500 mb-4">Redirecting to sign in...</p>
              <Link
                href="/auth/signin"
                className="inline-block rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 font-medium text-white transition-all hover:from-emerald-600 hover:to-teal-700"
              >
                Sign In Now
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mb-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                  <svg
                    className="h-8 w-8 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Verification Failed</h2>
              <p className="text-slate-400 mb-6">{message}</p>
              <div className="space-y-3">
                <Link
                  href="/auth/register"
                  className="block rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 font-medium text-white transition-all hover:from-emerald-600 hover:to-teal-700"
                >
                  Register Again
                </Link>
                <Link
                  href="/auth/signin"
                  className="block rounded-lg border border-slate-600 px-6 py-3 font-medium text-slate-300 transition-colors hover:bg-slate-700"
                >
                  Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { generatePDF } from "@/lib/pdf";

interface Letter {
  id: string;
  clientName: string;
  gstin: string | null;
  complianceType: string;
  language: string;
  content: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (status === "authenticated") {
      fetchLetters(currentPage);
    } else if (status === "unauthenticated") {
      setIsLoading(false);
    }
  }, [status, currentPage]);

  const fetchLetters = async (page: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/letters?page=${page}&limit=10`);
      const data = await res.json();

      if (res.ok) {
        setLetters(data.letters);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch letters:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (content: string) => {
    await navigator.clipboard.writeText(content);
    alert("Copied to clipboard!");
  };

  const handleDownloadPDF = (letter: Letter) => {
    generatePDF({
      clientName: letter.clientName,
      gstNumber: letter.gstin || undefined,
      content: letter.content,
      date: new Date(letter.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    });
  };

  const complianceTypeLabels: Record<string, string> = {
    "GSTR-1 (Outward Supplies)": "GSTR-1",
    "GSTR-3B (Summary Return)": "GSTR-3B",
    "GSTR-4 (Composition Scheme)": "GSTR-4",
    "GSTR-9 (Annual Return)": "GSTR-9",
    "GSTR-9C (Reconciliation Statement)": "GSTR-9C",
    "ITC-04 (Job Work)": "ITC-04",
    "GST Payment": "Payment",
    "E-Way Bill Compliance": "E-Way Bill",
  };

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-4">
            Sign in to view your letter history
          </h2>
          <Link
            href="/auth/signin"
            className="inline-block rounded-lg bg-emerald-600 px-6 py-3 text-white hover:bg-emerald-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
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

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">Letter History</h2>
          <p className="text-slate-400 mt-1">
            View and manage all your generated letters
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading letters...</p>
          </div>
        ) : letters.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="h-16 w-16 text-slate-600 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-white mb-2">
              No letters yet
            </h3>
            <p className="text-slate-400 mb-6">
              Generate your first letter to see it here
            </p>
            <Link
              href="/"
              className="inline-block rounded-lg bg-emerald-600 px-6 py-3 text-white hover:bg-emerald-700 transition-colors"
            >
              Generate Letter
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {letters.map((letter) => (
                <div
                  key={letter.id}
                  className="rounded-xl border border-slate-700/50 bg-slate-800/50 overflow-hidden"
                >
                  {/* Letter header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-slate-700/30 transition-colors"
                    onClick={() =>
                      setExpandedId(expandedId === letter.id ? null : letter.id)
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium text-white">
                            {letter.clientName}
                          </h3>
                          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                            {complianceTypeLabels[letter.complianceType] || letter.complianceType}
                          </span>
                          <span className="rounded-full bg-slate-600/50 px-2 py-0.5 text-xs text-slate-300">
                            {letter.language === "Tamil" ? "Tamil" : "English"}
                          </span>
                        </div>
                        {letter.gstin && (
                          <p className="text-sm text-slate-400 mt-1">
                            GSTIN: {letter.gstin}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(letter.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <svg
                        className={`h-5 w-5 text-slate-400 transition-transform ${
                          expandedId === letter.id ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {expandedId === letter.id && (
                    <div className="border-t border-slate-700/50">
                      <div className="p-4 bg-slate-900/50">
                        <pre className="whitespace-pre-wrap text-sm text-slate-300 font-sans">
                          {letter.content}
                        </pre>
                      </div>
                      <div className="p-4 border-t border-slate-700/50 flex gap-3">
                        <button
                          onClick={() => handleCopy(letter.content)}
                          className="flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm text-white hover:bg-slate-700 transition-colors"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                          Copy
                        </button>
                        {(session?.user?.plan === "pro" ||
                          session?.user?.plan === "firm") && (
                          <button
                            onClick={() => handleDownloadPDF(letter)}
                            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 transition-colors"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            Download PDF
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-400">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))
                  }
                  disabled={currentPage === pagination.totalPages}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

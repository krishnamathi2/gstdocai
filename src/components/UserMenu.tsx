"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status === "loading") {
    return (
      <div className="h-10 w-10 animate-pulse rounded-full bg-slate-700"></div>
    );
  }

  if (!session) {
    return (
      <Link
        href="/auth/signin"
        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-sm font-medium text-white transition-all hover:from-emerald-600 hover:to-teal-700"
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
            d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
          />
        </svg>
        Sign In
      </Link>
    );
  }

  const getPlanBadge = () => {
    const plan = session.user.plan || "free";
    const colors: Record<string, string> = {
      free: "bg-slate-600 text-slate-200",
      pro: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
      firm: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    };
    return colors[plan] || colors.free;
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 transition-colors hover:bg-slate-700/50"
      >
        {/* Avatar */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-medium text-white">
          {session.user.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || "User"}
              className="h-8 w-8 rounded-full"
            />
          ) : (
            session.user.name?.charAt(0).toUpperCase() || "U"
          )}
        </div>

        {/* Info */}
        <div className="hidden text-left sm:block">
          <p className="text-sm font-medium text-white">
            {session.user.name || "User"}
          </p>
          <p className="text-xs text-slate-400">
            {session.user.credits ?? 0} credits left
          </p>
        </div>

        {/* Dropdown Arrow */}
        <svg
          className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
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
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-64 max-h-[calc(100vh-100px)] overflow-y-auto rounded-xl border border-slate-700 bg-slate-800 py-2 shadow-xl">
          {/* User Info */}
          <div className="border-b border-slate-700 px-4 pb-3 pt-1">
            <p className="text-sm font-medium text-white">
              {session.user.name}
            </p>
            <p className="text-xs text-slate-400">{session.user.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${getPlanBadge()}`}
              >
                {session.user.plan || "Free"} Plan
              </span>
            </div>
          </div>

          {/* Credits */}
          <div className="border-b border-slate-700 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Credits</span>
              <span className="text-sm font-medium text-white">
                {session.user.credits ?? 0} remaining
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-700">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                style={{
                  width: `${Math.min(((session.user.credits ?? 0) / 5) * 100, 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <Link
              href="/pricing"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50"
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
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              Upgrade Plan
            </Link>
            <Link
              href="/history"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50"
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Letter History
            </Link>
          </div>

          {/* Sign Out */}
          <div className="border-t border-slate-700 pt-1">
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-slate-700/50"
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

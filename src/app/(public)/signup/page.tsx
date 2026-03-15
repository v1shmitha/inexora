"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, GraduationCap, BookOpen, Briefcase, Building2, ChevronRight,
} from "lucide-react";
import { createClient } from "~/lib/supabase/client";

type UserRole = "STUDENT" | "LECTURER" | "EMPLOYER" ;

const roles: {
  value: UserRole;
  label: string;
  description: string;
  icon: typeof GraduationCap;
  color: string;
  bg: string;
  border: string;
  selectedBg: string;
  selectedBorder: string;
  selectedText: string;
}[] = [
  {
    value: "STUDENT",
    label: "Student",
    description: "Access programs, pathways and credentials",
    icon: GraduationCap,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-slate-200",
    selectedBg: "bg-blue-50",
    selectedBorder: "border-blue-500",
    selectedText: "text-blue-700",
  },
  {
    value: "LECTURER",
    label: "Lecturer",
    description: "Create and share educational content",
    icon: BookOpen,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-slate-200",
    selectedBg: "bg-violet-50",
    selectedBorder: "border-violet-500",
    selectedText: "text-violet-700",
  },
  {
    value: "EMPLOYER",
    label: "Employer",
    description: "Post jobs and discover top talent",
    icon: Briefcase,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-slate-200",
    selectedBg: "bg-orange-50",
    selectedBorder: "border-orange-500",
    selectedText: "text-orange-700",
  },
];

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("STUDENT");
  const [otp, setOtp] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role } },
      });
      if (error) throw error;
      if (data.session) {
        router.push("/profile-setup");
        router.refresh();
      } else {
        setOtpStep(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: "signup" });
      if (error) throw error;
      router.push("/profile-setup");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* ── Left panel ── */}
      <div className="hidden w-[420px] flex-shrink-0 flex-col justify-between bg-slate-900 p-10 lg:flex">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
            <GraduationCap className="h-5 w-5 text-white" />
            {/* <img src="/favicon.ico" alt="iNEXORA" className="h-10 w-36" /> */}
          </div>
          <div>
            <p className="text-sm font-bold tracking-wide text-white">iNEXORA</p>
            <p className="text-xs text-slate-400">Digital Education Hub</p>
          </div>
        </div>

        {/* Role preview cards */}
        <div className="space-y-3">
          <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Who's joining today?
          </p>
          {roles.map((r) => {
            const Icon = r.icon;
            const isSelected = role === r.value;
            return (
              <div
                key={r.value}
                onClick={() => setRole(r.value)}
                className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all ${
                  isSelected
                    ? "border-slate-600 bg-slate-800"
                    : "border-transparent hover:border-slate-700 hover:bg-slate-800/50"
                }`}
              >
                <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                  isSelected ? r.bg : "bg-slate-700"
                }`}>
                  <Icon className={`h-4 w-4 ${isSelected ? r.color : "text-slate-400"}`} />
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${isSelected ? "text-white" : "text-slate-400"}`}>
                    {r.label}
                  </p>
                  <p className="truncate text-xs text-slate-500">{r.description}</p>
                </div>
                {isSelected && <ChevronRight className="ml-auto h-4 w-4 flex-shrink-0 text-slate-400" />}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-600">
          Sri Lanka's national platform for digital education and career development.
        </p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-wide text-slate-900">iNEXORA</p>
              <p className="text-xs text-slate-500">Digital Education Hub</p>
            </div>
          </div>

          {/* Back button */}
          <button
            type="button"
            onClick={() => otpStep ? setOtpStep(false) : router.push("/")}
            className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            {otpStep ? "Back to signup" : "Back to home"}
          </button>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">
              {otpStep ? "Check your email" : "Create your account"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {otpStep
                ? `We sent a 6-digit code to ${email}`
                : "Join Sri Lanka's Digital Education Hub"}
            </p>
          </div>

          {/* ── Signup form ── */}
          {!otpStep ? (
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Name + Email */}
              <div className="space-y-3">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Full name"
                  className={inputCls}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Email address"
                  className={inputCls}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Password (min. 6 characters)"
                  className={inputCls}
                />
              </div>

              {/* Role selection — mobile only (desktop uses left panel) */}
              <div className="lg:hidden">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  I am joining as
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {roles.map((r) => {
                    const Icon = r.icon;
                    const isSelected = role === r.value;
                    return (
                      <label
                        key={r.value}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${
                          isSelected
                            ? `${r.selectedBg} ${r.selectedBorder}`
                            : `bg-white ${r.border} hover:border-slate-300`
                        }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={r.value}
                          checked={isSelected}
                          onChange={(e) => setRole(e.target.value as UserRole)}
                          className="sr-only"
                        />
                        <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${
                          isSelected ? r.bg : "bg-slate-100"
                        }`}>
                          <Icon className={`h-3.5 w-3.5 ${isSelected ? r.color : "text-slate-400"}`} />
                        </div>
                        <span className={`text-xs font-semibold ${
                          isSelected ? r.selectedText : "text-slate-600"
                        }`}>
                          {r.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Selected role summary — desktop */}
              <div className="hidden items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 lg:flex">
                {(() => {
                  const r = roles.find((r) => r.value === role)!;
                  const Icon = r.icon;
                  return (
                    <>
                      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${r.bg}`}>
                        <Icon className={`h-4 w-4 ${r.color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-700">Joining as {r.label}</p>
                        <p className="truncate text-xs text-slate-400">{r.description}</p>
                      </div>
                      <span className="ml-auto text-xs text-slate-400">← change on left</span>
                    </>
                  );
                })()}
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Creating account…
                  </span>
                ) : (
                  <>Create account<ChevronRight className="h-4 w-4" /></>
                )}
              </button>

              <p className="text-center text-sm text-slate-500">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-blue-600 hover:underline">
                  Sign in
                </Link>
              </p>
            </form>

          ) : (
            /* ── OTP form ── */
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                placeholder="000000"
                maxLength={6}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Verifying…
                  </span>
                ) : (
                  <>Verify email<ChevronRight className="h-4 w-4" /></>
                )}
              </button>

              <p className="text-center text-sm text-slate-500">
                Didn't receive a code?{" "}
                <button
                  type="button"
                  onClick={() => setOtpStep(false)}
                  className="font-semibold text-blue-600 hover:underline"
                >
                  Go back
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
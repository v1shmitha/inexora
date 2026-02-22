"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "~/lib/supabase/client";

type UserRole = "student" | "provider" | "lecturer" | "employer";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [otp, setOtp] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const roles: { value: UserRole; label: string; description: string }[] = [
    { value: "student", label: "Student", description: "Access programs and pathways" },
    { value: "provider", label: "Education Provider", description: "Offer programs and manage students" },
    { value: "lecturer", label: "Lecturer", description: "Create and share educational content" },
    { value: "employer", label: "Employer", description: "Post jobs and find talent" },
  ];

  // ── Signup ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
          },
        },
      });

      if (error) throw error;
      setOtpStep(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  // ── OTP Verify ─────────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "signup",
      });

      if (error) throw error;

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 px-4 py-12">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-8 shadow-xl">

        {/* Back Button */}
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="absolute left-4 top-4 flex items-center gap-2 text-sm text-gray-500 transition hover:text-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-3xl font-bold text-gray-900">
            {otpStep ? "Verify Your Email" : "Create Your Account"}
          </h2>
          <p className="text-gray-600">
            {otpStep
              ? "Enter the verification code sent to your email"
              : "Join Sri Lanka's Digital Education Hub"}
          </p>
        </div>

        {/* ── Signup Form ── */}
        {!otpStep ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Full Name"
              className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email"
              className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Password (min 6 characters)"
              className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Role Selection */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {roles.map((r) => (
                <label
                  key={r.value}
                  className={`relative flex cursor-pointer rounded-lg border p-4 transition ${
                    role === r.value
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-300 hover:border-blue-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={role === r.value}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="sr-only"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900">
                      {r.label}
                    </span>
                    <span className="mt-1 text-xs text-gray-600">
                      {r.description}
                    </span>
                  </div>
                </label>
              ))}
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>
        ) : (
          /* ── OTP Form ── */
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <p className="text-center text-sm text-gray-600">
              We sent a code to <span className="font-semibold">{email}</span>
            </p>

            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              placeholder="Enter OTP"
              className="w-full rounded-lg border px-4 py-3 text-center text-xl tracking-widest outline-none focus:ring-2 focus:ring-blue-500"
            />

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              type="button"
              onClick={() => setOtpStep(false)}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              ← Go back and edit details
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-blue-600 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
"use client";
import { useState, useMemo } from "react";
import { Loader2, Lock, Eye, EyeOff, CheckCircle, XCircle, ShieldCheck } from "lucide-react";
import { createClient } from "~/lib/supabase/client";

function getStrength(password: string): {
  score: number;
  label: string;
  color: string;
  bg: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Very Weak", color: "text-red-600", bg: "bg-red-500" };
  if (score === 2) return { score, label: "Weak", color: "text-orange-600", bg: "bg-orange-500" };
  if (score === 3) return { score, label: "Fair", color: "text-yellow-600", bg: "bg-yellow-500" };
  if (score === 4) return { score, label: "Strong", color: "text-blue-600", bg: "bg-blue-500" };
  return { score, label: "Very Strong", color: "text-emerald-600", bg: "bg-emerald-500" };
}

const requirements = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "At least one uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "At least one number", test: (p: string) => /[0-9]/.test(p) },
  { label: "At least one special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function ChangePasswordSection() {
  const supabase = createClient();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const strength = useMemo(() => getStrength(newPassword), [newPassword]);
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const allRequirementsMet = requirements.every((r) => r.test(newPassword));

  const handleSave = async () => {
    setError("");
    setSuccess(false);

    if (!currentPassword) {
      setError("Please enter your current password.");
      return;
    }
    if (!allRequirementsMet) {
      setError("Password does not meet all requirements.");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      // Re-authenticate with current password first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("User not found.");

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInError) throw new Error("Current password is incorrect.");

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = (hasError?: boolean, hasSuccess?: boolean) =>
    `w-full rounded-xl border px-4 py-3 text-sm outline-none transition pr-11 ${
      hasError
        ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
        : hasSuccess
          ? "border-emerald-300 bg-emerald-50 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          : "border-gray-200 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
    }`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
          <ShieldCheck className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
          <p className="text-sm text-gray-500">Keep your account secure with a strong password</p>
        </div>
      </div>

      <div className="space-y-4">

        {/* Current Password */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className={inputCls()}
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            New Password
          </label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className={inputCls()}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Strength bar */}
          {newPassword.length > 0 && (
            <div className="mt-2 space-y-1.5">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      i <= strength.score ? strength.bg : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              <p className={`text-xs font-medium ${strength.color}`}>
                {strength.label}
              </p>
            </div>
          )}
        </div>

        {/* Requirements checklist */}
        {newPassword.length > 0 && (
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Password Requirements
            </p>
            {requirements.map(({ label, test }) => {
              const passed = test(newPassword);
              return (
                <div key={label} className="flex items-center gap-2">
                  {passed
                    ? <CheckCircle className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                    : <XCircle className="h-4 w-4 flex-shrink-0 text-gray-300" />
                  }
                  <span className={`text-xs ${passed ? "text-emerald-700" : "text-gray-500"}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Confirm Password */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              className={inputCls(passwordsMismatch, passwordsMatch)}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {passwordsMismatch && (
            <p className="mt-1 text-xs text-red-600">Passwords do not match.</p>
          )}
          {passwordsMatch && (
            <p className="mt-1 text-xs text-emerald-600">Passwords match!</p>
          )}
        </div>
      </div>

      {/* Error / Success */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <XCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          Password updated successfully!
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSave}
        disabled={saving || !allRequirementsMet || !passwordsMatch || !currentPassword}
        className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
        {saving ? "Updating..." : "Update Password"}
      </button>
    </div>
  );
}
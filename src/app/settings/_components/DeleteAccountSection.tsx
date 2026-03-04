"use client";

import { useState } from "react";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import { createClient } from "~/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function DeleteAccountSection() {
  const supabase = createClient();
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (confirmText !== "DELETE") {
      setError('Please type "DELETE" to confirm');
      return;
    }
    setError("");
    setDeleting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Deactivate account instead of hard delete
      const { error } = await supabase
        .from("Profile")
        .update({ isActive: false, updatedAt: new Date().toISOString() })
        .eq("id", user.id);

      if (error) throw error;

      await supabase.auth.signOut();
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Delete Account</h2>
        <p className="mt-1 text-sm text-gray-500">Permanently deactivate your account</p>
      </div>

      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">This action cannot be undone</p>
            <p className="mt-1 text-sm text-red-700">
              Deleting your account will deactivate your profile and remove access to all your data including enrollments, applications, and credentials.
            </p>
          </div>
        </div>
      </div>

      {!confirmed ? (
        <button
          onClick={() => setConfirmed(true)}
          className="flex items-center gap-2 rounded-xl border border-red-200 px-6 py-3 font-semibold text-red-600 transition hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
          I want to delete my account
        </button>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Type <span className="font-bold text-red-600">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full rounded-lg border border-red-200 px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setConfirmed(false); setConfirmText(""); }}
              className="flex-1 rounded-xl border border-gray-200 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-3 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {deleting ? "Deleting..." : "Delete Account"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
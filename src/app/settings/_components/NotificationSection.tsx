"use client";

import { useState } from "react";
import { Loader2, Bell } from "lucide-react";

interface NotifPref {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export default function NotificationSection() {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [prefs, setPrefs] = useState<NotifPref[]>([
    { id: "email_updates", label: "Email Updates", description: "Receive important updates via email", enabled: true },
    { id: "new_programs", label: "New Programs", description: "Get notified about new programs and courses", enabled: true },
    { id: "application_status", label: "Application Status", description: "Updates on your enrollment and job applications", enabled: true },
    { id: "job_alerts", label: "Job Alerts", description: "New job and internship opportunities", enabled: false },
    { id: "promotional", label: "Promotional", description: "Special offers and platform announcements", enabled: false },
  ]);

  const toggle = (id: string) => {
    setPrefs((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    // TODO: Save to NotificationSetting table when implemented
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Notification Preferences</h2>
        <p className="mt-1 text-sm text-gray-500">Choose what you want to be notified about</p>
      </div>

      <div className="space-y-3">
        {prefs.map((pref) => (
          <div
            key={pref.id}
            className="flex items-center justify-between rounded-xl border border-gray-100 p-4"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">{pref.label}</p>
              <p className="text-xs text-gray-500">{pref.description}</p>
            </div>
            <button
              type="button"
              onClick={() => toggle(pref.id)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                pref.enabled ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                pref.enabled ? "left-5" : "left-0.5"
              }`} />
            </button>
          </div>
        ))}
      </div>

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Preferences saved!
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
        {saving ? "Saving..." : "Save Preferences"}
      </button>
    </div>
  );
}
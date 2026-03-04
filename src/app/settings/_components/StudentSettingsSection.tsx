"use client";

import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { createClient } from "~/lib/supabase/client";

const EDUCATION_LEVELS = [
  { value: "O/L", label: "O/L Completed" },
  { value: "A/L", label: "A/L Completed" },
  { value: "DIPLOMA", label: "Diploma" },
  { value: "DEGREE", label: "Undergraduate Degree" },
  { value: "POSTGRAD", label: "Postgraduate" },
];

const EMPLOYMENT_STATUSES = [
  { value: "STUDENT", label: "Full-time Student" },
  { value: "EMPLOYED", label: "Employed" },
  { value: "SELF_EMPLOYED", label: "Self Employed" },
  { value: "UNEMPLOYED", label: "Unemployed" },
];

export default function StudentSettingsSection() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [studentId, setStudentId] = useState<string | null>(null);
  const [educationLevel, setEducationLevel] = useState("");
  const [employmentStatus, setEmploymentStatus] = useState("");
  const [targetCareer, setTargetCareer] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("Student")
        .select("id, previousEducation, employmentStatus, targetCareer")
        .eq("profileId", user.id)
        .single();

      if (data) {
        setStudentId(data.id);
        setEducationLevel(data.previousEducation ?? "");
        setEmploymentStatus(data.employmentStatus ?? "");
        setTargetCareer(data.targetCareer ?? "");
      }
      setLoading(false);
    };
    void load();
  }, []);

  const handleSave = async () => {
    if (!studentId) return;
    setError("");
    setSuccess(false);
    setSaving(true);

    try {
      const { error } = await supabase
        .from("Student")
        .update({
          previousEducation: educationLevel || null,
          employmentStatus: employmentStatus || null,
          targetCareer: targetCareer || null,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", studentId);

      if (error) throw error;
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Academic Information</h2>
        <p className="mt-1 text-sm text-gray-500">Update your education and career details</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Highest Education Level</label>
          <div className="space-y-2">
            {EDUCATION_LEVELS.map((e) => (
              <button
                key={e.value}
                type="button"
                onClick={() => setEducationLevel(e.value)}
                className={`flex w-full items-center rounded-lg border px-4 py-3 text-sm font-medium transition ${
                  educationLevel === e.value
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:border-blue-300"
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Employment Status</label>
          <div className="grid grid-cols-2 gap-2">
            {EMPLOYMENT_STATUSES.map((e) => (
              <button
                key={e.value}
                type="button"
                onClick={() => setEmploymentStatus(e.value)}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                  employmentStatus === e.value
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:border-blue-300"
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Target Career</label>
          <input
            type="text"
            value={targetCareer}
            onChange={(e) => setTargetCareer(e.target.value)}
            placeholder="e.g. Software Engineer, Data Scientist"
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">Saved successfully!</div>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
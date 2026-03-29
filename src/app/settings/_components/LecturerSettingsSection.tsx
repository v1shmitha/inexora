"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, X } from "lucide-react";
import { createClient } from "~/lib/supabase/client";

const SUBJECT_AREAS = [
  "Business & Management", "IT & Computer Science", "AI & Data Science",
  "Engineering", "Education & Psychology", "Law", "Arts & Humanities",
  "Healthcare", "Mathematics", "Languages",
];

const TITLES = ["Dr.", "Prof.", "Mr.", "Mrs.", "Ms.", "Eng."];

export default function LecturerSettingsSection() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [lecturerId, setLecturerId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [qualifications, setQualifications] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [bio, setBio] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [isVisiting, setIsVisiting] = useState(false);
  const [hourlyRate, setHourlyRate] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("Lecturer")
        .select("id, title, specialization, qualifications, experienceYears, bio, linkedinUrl, isVisiting, hourlyRate")
        .eq("profileId", user.id)
        .single();

      if (data) {
        setLecturerId(data.id);
        setTitle(data.title ?? "");
        setSpecializations(data.specialization ?? []);
        setQualifications(data.qualifications ?? "");
        setExperienceYears(data.experienceYears?.toString() ?? "");
        setBio(data.bio ?? "");
        setLinkedinUrl(data.linkedinUrl ?? "");
        setIsVisiting(data.isVisiting ?? false);
        setHourlyRate(data.hourlyRate?.toString() ?? "");
      }
      setLoading(false);
    };
    void load();
  }, []);

  const toggleSpecialization = (s: string) => {
    setSpecializations((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleSave = async () => {
    if (!lecturerId) return;
    setError("");
    setSuccess(false);
    setSaving(true);

    try {
      const { error } = await supabase
        .from("Lecturer")
        .update({
          title: title || null,
          specialization: specializations,
          qualifications: qualifications || null,
          experienceYears: experienceYears ? parseInt(experienceYears) : null,
          bio: bio || null,
          linkedinUrl: linkedinUrl || null,
          isVisiting,
          hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", lecturerId);

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
        <h2 className="text-xl font-bold text-gray-900">Expertise & Profile</h2>
        <p className="mt-1 text-sm text-gray-500">Update your academic credentials and teaching info</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Title</label>
          <div className="flex flex-wrap gap-2">
            {TITLES.map((t) => (
              <button key={t} type="button" onClick={() => setTitle(t)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  title === t ? "border-violet-600 bg-violet-50 text-violet-700" : "border-gray-200 text-gray-600 hover:border-violet-300"
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Subject Areas</label>
          <div className="flex flex-wrap gap-2">
            {SUBJECT_AREAS.map((s) => (
              <button key={s} type="button" onClick={() => toggleSpecialization(s)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  specializations.includes(s) ? "border-violet-600 bg-violet-50 text-violet-700" : "border-gray-200 text-gray-600 hover:border-violet-300"
                }`}>
                {s}
                {specializations.includes(s) && <X className="h-3 w-3" />}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Qualifications</label>
          <textarea value={qualifications} onChange={(e) => setQualifications(e.target.value)}
            rows={3} placeholder="e.g. PhD Computer Science - University of Colombo"
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Years of Experience</label>
            <input type="number" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)}
              placeholder="5" min="0"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Hourly Rate (LKR)</label>
            <input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="2500" min="0"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)}
            rows={4} placeholder="Tell students about yourself..."
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">LinkedIn URL</label>
          <input type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="https://linkedin.com/in/yourprofile"
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-900">Visiting Lecturer</p>
            <p className="text-xs text-gray-500">Available for guest lectures</p>
          </div>
          <button type="button" onClick={() => setIsVisiting(!isVisiting)}
            className={`relative h-6 w-11 rounded-full transition ${isVisiting ? "bg-violet-600" : "bg-gray-200"}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${isVisiting ? "left-5" : "left-0.5"}`} />
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">Saved successfully!</div>}

      <button onClick={handleSave} disabled={saving}
        className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
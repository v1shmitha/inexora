"use client";

import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { createClient } from "~/lib/supabase/client";

const INDUSTRIES = [
  "Information Technology", "Finance & Banking", "Healthcare", "Education",
  "Manufacturing", "Retail & E-commerce", "Hospitality & Tourism",
  "Construction & Engineering", "Media & Marketing", "Logistics & Supply Chain",
  "Telecommunications", "Other",
];

const COMPANY_SIZES = [
  { value: "1-10", label: "1–10 employees" },
  { value: "11-50", label: "11–50 employees" },
  { value: "51-200", label: "51–200 employees" },
  { value: "201-500", label: "201–500 employees" },
  { value: "500+", label: "500+ employees" },
];

export default function EmployerSettingsSection() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [employerId, setEmployerId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("Employer")
        .select("id, companyName, industry, companySize, website, description")
        .eq("profileId", user.id)
        .single();

      if (data) {
        setEmployerId(data.id);
        setCompanyName(data.companyName ?? "");
        setIndustry(data.industry ?? "");
        setCompanySize(data.companySize ?? "");
        setWebsite(data.website ?? "");
        setDescription(data.description ?? "");
      }
      setLoading(false);
    };
    void load();
  }, []);

  const handleSave = async () => {
    if (!employerId) return;
    setError("");
    setSuccess(false);
    setSaving(true);

    try {
      const { error } = await supabase
        .from("Employer")
        .update({
          companyName,
          industry: industry || null,
          companySize: companySize || null,
          website: website || null,
          description: description || null,
        })
        .eq("id", employerId);

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
        <h2 className="text-xl font-bold text-gray-900">Company Details</h2>
        <p className="mt-1 text-sm text-gray-500">Update your company's public profile</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Company Name</label>
          <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Acme Corporation"
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Industry</label>
          <div className="grid grid-cols-2 gap-2">
            {INDUSTRIES.map((ind) => (
              <button key={ind} type="button" onClick={() => setIndustry(ind)}
                className={`rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition ${
                  industry === ind ? "border-orange-500 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-600 hover:border-orange-300"
                }`}>
                {ind}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Company Size</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {COMPANY_SIZES.map((s) => (
              <button key={s.value} type="button" onClick={() => setCompanySize(s.value)}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                  companySize === s.value ? "border-orange-500 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-600 hover:border-orange-300"
                }`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Website</label>
          <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://company.com"
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Company Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            rows={4} placeholder="Tell students about your company and culture..."
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" />
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">Saved successfully!</div>}

      <button onClick={handleSave} disabled={saving}
        className="flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
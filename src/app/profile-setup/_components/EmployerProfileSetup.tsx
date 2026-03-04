"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, ChevronRight, Loader2 } from "lucide-react";
import { createClient } from "~/lib/supabase/client";

const INDUSTRIES = [
  "Information Technology",
  "Finance & Banking",
  "Healthcare",
  "Education",
  "Manufacturing",
  "Retail & E-commerce",
  "Hospitality & Tourism",
  "Construction & Engineering",
  "Media & Marketing",
  "Logistics & Supply Chain",
  "Telecommunications",
  "Other",
];

const COMPANY_SIZES = [
  { value: "1-10", label: "1–10 employees" },
  { value: "11-50", label: "11–50 employees" },
  { value: "51-200", label: "51–200 employees" },
  { value: "201-500", label: "201–500 employees" },
  { value: "500+", label: "500+ employees" },
];

export default function EmployerProfileSetup() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);

  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: profileError } = await supabase
        .from("Profile")
        .update({
          phone: phone || null,
          city: city || null,
          isVerified: true,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      const { error: employerError } = await supabase
        .from("Employer")
        .insert({
          id: crypto.randomUUID(),
          profileId: user.id,
          companyName,
          industry: industry || null,
          companySize: companySize || null,
          website: website || null,
          description: description || null,
          isVerified: false,
          // updatedAt: new Date().toISOString(),
        });

      if (employerError) throw employerError;

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-12">

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500">
            <Briefcase className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Employer Profile Setup</h1>
          <p className="mt-2 text-gray-500">Find the best talent from Sri Lanka's top graduates</p>
        </div>

        {/* Progress */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition ${
                step >= s ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-500"
              }`}>
                {s}
              </div>
              {s < 2 && <div className={`h-0.5 w-16 transition ${step > s ? "bg-orange-500" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">

          {/* Step 1 — Company Info */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900">Company Information</h2>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Company Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  placeholder="Acme Corporation"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Industry <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind}
                      type="button"
                      onClick={() => setIndustry(ind)}
                      className={`rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition ${
                        industry === ind
                          ? "border-orange-500 bg-orange-50 text-orange-700"
                          : "border-gray-200 text-gray-600 hover:border-orange-300"
                      }`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Company Size</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {COMPANY_SIZES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setCompanySize(s.value)}
                      className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                        companySize === s.value
                          ? "border-orange-500 bg-orange-50 text-orange-700"
                          : "border-gray-200 text-gray-600 hover:border-orange-300"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                onClick={() => {
                  if (!companyName || !industry) {
                    setError("Please fill in company name and industry");
                    return;
                  }
                  setError("");
                  setStep(2);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 font-semibold text-white transition hover:bg-orange-600"
              >
                Continue <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Step 2 — Contact Info */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900">Contact Details</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+94 11 234 5678"
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Colombo"
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Website <span className="text-gray-400">(optional)</span></label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://company.com"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Company Description <span className="text-gray-400">(optional)</span></label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell students about your company and culture..."
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-xl border border-gray-200 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {loading ? "Saving..." : "Complete Setup"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
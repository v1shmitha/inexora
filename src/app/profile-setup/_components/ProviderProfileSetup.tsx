"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, ChevronRight, Loader2 } from "lucide-react";
import { createClient } from "~/lib/supabase/client";

const INSTITUTION_TYPES = [
  { value: "PUBLIC_UNIVERSITY", label: "Public University" },
  { value: "PRIVATE_UNIVERSITY", label: "Private University" },
  { value: "FOREIGN_UNIVERSITY", label: "Foreign University" },
  { value: "TRAINING_INSTITUTE", label: "Training Institute" },
  { value: "PROFESSIONAL_BODY", label: "Professional Body" },
  { value: "CORPORATE_ACADEMY", label: "Corporate Academy" },
];

export default function ProviderProfileSetup() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [institutionName, setInstitutionName] = useState("");
  const [institutionType, setInstitutionType] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("Sri Lanka");
  const [accreditationBody, setAccreditationBody] = useState("");
  const [accreditationNumber, setAccreditationNumber] = useState("");

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: profileError } = await supabase
        .from("Profile")
        .update({ isVerified: true })
        .eq("id", user.id);

      if (profileError) throw profileError;

      const { error: institutionError } = await supabase
        .from("Institution")
        .insert({
          id: crypto.randomUUID(),
          name: institutionName,
          slug: generateSlug(institutionName),
          type: institutionType,
          description: description || null,
          website: website || null,
          email: email || null,
          phone: phone || null,
          address: address || null,
          country,
          accreditationBody: accreditationBody || null,
          accreditationNumber: accreditationNumber || null,
          adminId: user.id,
          isVerified: false,
          isActive: true,
          updatedAt: new Date().toISOString(),
        });

      if (institutionError) throw institutionError;

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-12">

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Institution Setup</h1>
          <p className="mt-2 text-gray-500">Register your institution on DEH-SL</p>
        </div>

        {/* Progress */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition ${
                step >= s ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-500"
              }`}>
                {s}
              </div>
              {s < 2 && <div className={`h-0.5 w-16 transition ${step > s ? "bg-emerald-600" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">

          {/* Step 1 — Institution Info */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900">Institution Information</h2>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Institution Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  required
                  placeholder="University of Colombo"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Institution Type <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {INSTITUTION_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setInstitutionType(t.value)}
                      className={`rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition ${
                        institutionType === t.value
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 text-gray-600 hover:border-emerald-300"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Description <span className="text-gray-400">(optional)</span></label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of your institution..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <button
                onClick={() => {
                  if (!institutionName || !institutionType) {
                    setError("Please fill in institution name and type");
                    return;
                  }
                  setError("");
                  setStep(2);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-700"
              >
                Continue <ChevronRight className="h-4 w-4" />
              </button>
              {error && <p className="text-center text-sm text-red-600">{error}</p>}
            </div>
          )}

          {/* Step 2 — Contact & Accreditation */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900">Contact & Accreditation</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Institution Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="info@university.lk"
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+94 11 234 5678"
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Website</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://university.lk"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="94 Cumaratunga Munidasa Mawatha, Colombo 03"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Accreditation Body <span className="text-gray-400">(optional)</span></label>
                  <input
                    type="text"
                    value={accreditationBody}
                    onChange={(e) => setAccreditationBody(e.target.value)}
                    placeholder="UGC Sri Lanka"
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Accreditation Number <span className="text-gray-400">(optional)</span></label>
                  <input
                    type="text"
                    value={accreditationNumber}
                    onChange={(e) => setAccreditationNumber(e.target.value)}
                    placeholder="ACC-2024-001"
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Your institution will be reviewed by our team before being listed publicly.
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
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
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
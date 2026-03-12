"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronRight, Loader2, X, Building2 } from "lucide-react";
import { createClient } from "~/lib/supabase/client";

const SUBJECT_AREAS = [
  "Business & Management", "IT & Computer Science", "AI & Data Science",
  "Engineering", "Education & Psychology", "Law", "Arts & Humanities",
  "Healthcare", "Mathematics", "Languages",
];

const TITLES = ["Dr.", "Prof.", "Mr.", "Mrs.", "Ms.", "Eng."];

interface Institution {
  id: string;
  name: string;
  type: string;
  city: string | null;
}

export default function LecturerProfileSetup() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1 — Personal
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [title, setTitle] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [isVisiting, setIsVisiting] = useState(false);

  // Step 2 — Institution
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [institutionsLoading, setInstitutionsLoading] = useState(false);
  const [institutionId, setInstitutionId] = useState<string>("");
  const [institutionSearch, setInstitutionSearch] = useState("");

  // Step 3 — Expertise
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [qualifications, setQualifications] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [bio, setBio] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");

  // Fetch institutions when entering step 2
  useEffect(() => {
    if (step !== 2) return;
    const fetchInstitutions = async () => {
      setInstitutionsLoading(true);
      try {
        const res = await fetch("/api/institutions/list");
        const data = await res.json() as { institutions: Institution[] };
        setInstitutions(data.institutions ?? []);
      } catch {
        // silently fail — user can still proceed as independent
      } finally {
        setInstitutionsLoading(false);
      }
    };
    void fetchInstitutions();
  }, [step]);

  const toggleSpecialization = (s: string) => {
    setSpecializations((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const filteredInstitutions = institutions.filter((i) =>
    i.name.toLowerCase().includes(institutionSearch.toLowerCase()) ||
    i.city?.toLowerCase().includes(institutionSearch.toLowerCase())
  );

  const selectedInstitution = institutions.find((i) => i.id === institutionId);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const res = await fetch("/api/profile-setup/lecturer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          phone: phone || null,
          city: city || null,
          title: title || null,
          institutionId: institutionId || null,
          specialization: specializations,
          qualifications: qualifications || null,
          experienceYears: experienceYears ? parseInt(experienceYears) : null,
          bio: bio || null,
          linkedinUrl: linkedinUrl || null,
          isVisiting,
          hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        }),
      });

      const result = await res.json() as { error?: string };
      if (!res.ok) throw new Error(result.error ?? "Something went wrong");

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const STEPS = ["Personal Details", "Institution", "Your Expertise"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-12">

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600">
            <BookOpen className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Lecturer Profile Setup</h1>
          <p className="mt-2 text-gray-500">Share your expertise with students across Sri Lanka</p>
        </div>

        {/* Progress */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition ${
                  step >= s ? "bg-violet-600 text-white" : "bg-gray-200 text-gray-500"
                }`}>{s}</div>
                <span className="hidden text-xs text-gray-400 sm:block">{STEPS[s - 1]}</span>
              </div>
              {s < 3 && <div className={`mb-4 h-0.5 w-12 transition ${step > s ? "bg-violet-600" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">

          {/* ── Step 1: Personal Details ── */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900">Personal Details</h2>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Title</label>
                <div className="flex flex-wrap gap-2">
                  {TITLES.map((t) => (
                    <button key={t} type="button" onClick={() => setTitle(t)}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                        title === t ? "border-violet-600 bg-violet-50 text-violet-700" : "border-gray-200 text-gray-600 hover:border-violet-300"
                      }`}
                    >{t}</button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Phone Number</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="+94 77 123 4567"
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">City</label>
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
                    placeholder="Colombo"
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  LinkedIn URL <span className="text-gray-400">(optional)</span>
                </label>
                <input type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Visiting Lecturer</p>
                  <p className="text-xs text-gray-500">Available for guest lectures</p>
                </div>
                <button type="button" onClick={() => setIsVisiting(!isVisiting)}
                  className={`relative h-6 w-11 rounded-full transition ${isVisiting ? "bg-violet-600" : "bg-gray-200"}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${isVisiting ? "left-5" : "left-0.5"}`} />
                </button>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Your lecturer profile will be reviewed by our team before you can access full features.
              </div>

              <button onClick={() => setStep(2)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 font-semibold text-white transition hover:bg-violet-700"
              >
                Continue <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ── Step 2: Institution Affiliation ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Institution Affiliation</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Select the institution you're affiliated with, or continue as independent.
                </p>
              </div>

              {/* Selected institution badge */}
              {selectedInstitution && (
                <div className="flex items-center justify-between rounded-lg border border-violet-200 bg-violet-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-violet-600" />
                    <div>
                      <p className="text-sm font-semibold text-violet-900">{selectedInstitution.name}</p>
                      <p className="text-xs text-violet-600">{selectedInstitution.type}{selectedInstitution.city ? ` · ${selectedInstitution.city}` : ""}</p>
                    </div>
                  </div>
                  <button onClick={() => setInstitutionId("")} className="text-violet-400 hover:text-violet-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Independent option */}
              <button
                type="button"
                onClick={() => setInstitutionId("")}
                className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition ${
                  institutionId === ""
                    ? "border-violet-600 bg-violet-50"
                    : "border-gray-200 hover:border-violet-300"
                }`}
              >
                <p className={`font-medium ${institutionId === "" ? "text-violet-700" : "text-gray-700"}`}>
                  Independent / Freelance
                </p>
                <p className="text-xs text-gray-400">Not affiliated with any institution</p>
              </button>

              {/* Search */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Search Institutions
                </label>
                <input
                  type="text"
                  value={institutionSearch}
                  onChange={(e) => setInstitutionSearch(e.target.value)}
                  placeholder="Search by name or city..."
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              {/* Institution list */}
              <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-100">
                {institutionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                  </div>
                ) : filteredInstitutions.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-400">
                    {institutionSearch ? "No institutions match your search" : "No institutions available"}
                  </div>
                ) : (
                  filteredInstitutions.map((inst) => (
                    <button
                      key={inst.id}
                      type="button"
                      onClick={() => setInstitutionId(inst.id)}
                      className={`flex w-full items-center gap-3 border-b border-gray-50 px-4 py-3 text-left transition last:border-0 hover:bg-gray-50 ${
                        institutionId === inst.id ? "bg-violet-50" : ""
                      }`}
                    >
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-violet-100">
                        <Building2 className="h-4 w-4 text-violet-600" />
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${institutionId === inst.id ? "text-violet-700" : "text-gray-900"}`}>
                          {inst.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {inst.type}{inst.city ? ` · ${inst.city}` : ""}
                        </p>
                      </div>
                      {institutionId === inst.id && (
                        <div className="ml-auto h-2 w-2 rounded-full bg-violet-600" />
                      )}
                    </button>
                  ))
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="flex-1 rounded-xl border border-gray-200 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
                >Back</button>
                <button onClick={() => setStep(3)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 font-semibold text-white transition hover:bg-violet-700"
                >
                  Continue <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Expertise ── */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900">Your Expertise</h2>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Subject Areas</label>
                <div className="flex flex-wrap gap-2">
                  {SUBJECT_AREAS.map((s) => (
                    <button key={s} type="button" onClick={() => toggleSpecialization(s)}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                        specializations.includes(s) ? "border-violet-600 bg-violet-50 text-violet-700" : "border-gray-200 text-gray-600 hover:border-violet-300"
                      }`}
                    >
                      {s}
                      {specializations.includes(s) && <X className="h-3 w-3" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Qualifications</label>
                <textarea value={qualifications} onChange={(e) => setQualifications(e.target.value)}
                  placeholder="e.g. PhD Computer Science - University of Colombo"
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Years of Experience</label>
                  <input type="number" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)}
                    placeholder="5" min="0"
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Hourly Rate (LKR) <span className="text-gray-400">(optional)</span>
                  </label>
                  <input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="2500" min="0"
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Bio <span className="text-gray-400">(optional)</span>
                </label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell students about your background and teaching philosophy..."
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(2)}
                  className="flex-1 rounded-xl border border-gray-200 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
                >Back</button>
                <button onClick={handleSubmit} disabled={loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
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
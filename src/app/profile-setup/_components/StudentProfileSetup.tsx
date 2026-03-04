"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, ChevronRight, Loader2 } from "lucide-react";
import { createClient } from "~/lib/supabase/client";

const FIELDS_OF_STUDY = [
  "Business & Management",
  "IT, AI & Data Science",
  "Education & Psychology",
  "Engineering",
  "Law",
  "Arts & Humanities",
  "Logistics, Tourism & Healthcare",
  "Other",
];

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

export default function StudentProfileSetup() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [employmentStatus, setEmploymentStatus] = useState("STUDENT");
  const [targetCareer, setTargetCareer] = useState("");

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update Profile
      const { error: profileError } = await supabase
        .from("Profile")
        .update({
          phone: phone || null,
          city: city || null,
          district: district || null,
          dateOfBirth: dateOfBirth || null,
          gender: gender || null,
          isVerified: true,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Create Student record
      const { error: studentError } = await supabase
        .from("Student")
        .insert({
          id: crypto.randomUUID(),
          profileId: user.id,
          previousEducation: educationLevel || null,
          employmentStatus: employmentStatus || null,
          targetCareer: targetCareer || null,
          updatedAt: new Date().toISOString(),
        });

      if (studentError) throw studentError;

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-12">

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Set Up Your Profile</h1>
          <p className="mt-2 text-gray-500">Help us personalize your learning experience</p>
        </div>

        {/* Progress */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition ${
                step >= s ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
              }`}>
                {s}
              </div>
              {s < 2 && <div className={`h-0.5 w-16 transition ${step > s ? "bg-blue-600" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">

          {/* Step 1 — Personal Info */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+94 77 123 4567"
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Date of Birth</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Gender</label>
                <div className="flex gap-3">
                  {["MALE", "FEMALE", "OTHER"].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition ${
                        gender === g
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-600 hover:border-blue-300"
                      }`}
                    >
                      {g.charAt(0) + g.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Colombo"
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">District</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Colombo"
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                Continue <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Step 2 — Academic Info */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900">Academic Background</h2>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Field of Interest</label>
                <div className="grid grid-cols-2 gap-2">
                  {FIELDS_OF_STUDY.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFieldOfStudy(f)}
                      className={`rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition ${
                        fieldOfStudy === f
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-600 hover:border-blue-300"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

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
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Target Career <span className="text-gray-400">(optional)</span></label>
                <input
                  type="text"
                  value={targetCareer}
                  onChange={(e) => setTargetCareer(e.target.value)}
                  placeholder="e.g. Software Engineer, Data Scientist"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
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
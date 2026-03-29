"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Clock, Globe, BookOpen, CheckCircle2,
  ArrowLeft, Loader2, Award, Briefcase,
} from "lucide-react";
import { api } from "~/trpc/react";
import { createClient } from "~/lib/supabase/client";

const DELIVERY_LABELS: Record<string, string> = {
  ONLINE: "Online", ON_CAMPUS: "On Campus", HYBRID: "Hybrid", BLENDED: "Blended",
};
const DELIVERY_COLORS: Record<string, string> = {
  ONLINE: "bg-emerald-50 text-emerald-700",
  ON_CAMPUS: "bg-blue-50 text-blue-700",
  HYBRID: "bg-violet-50 text-violet-700",
  BLENDED: "bg-amber-50 text-amber-700",
};
const TYPE_LABELS: Record<string, string> = {
  BACHELOR: "Bachelor's", MASTER: "Master's", PHD: "PhD",
  DIPLOMA: "Diploma", CERTIFICATE: "Certificate", FOUNDATION: "Foundation",
  PROFESSIONAL: "Professional", MICROCREDENTIAL: "Microcredential", SHORT_COURSE: "Short Course",
};

export default function PublicProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();

  // Redirect logged-in students to their scoped version
  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("Profile")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile?.role === "STUDENT") {
        router.replace(`/dashboard/student/programs/${id}`);
      }
    };
    void check();
  }, [id]);

  const { data: program, isLoading } = api.program.getPublicById.useQuery(
    { id },
    { staleTime: 60_000 }
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50">
        <p className="text-slate-600 font-medium">Program not found.</p>
        <button onClick={() => router.push("/programs")}
          className="text-sm text-blue-600 hover:underline">
          Back to Programs
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Back */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.push("/programs")}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Programs
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Header card */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {TYPE_LABELS[program.type] ?? program.type}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${DELIVERY_COLORS[program.deliveryMode] ?? "bg-slate-100 text-slate-600"}`}>
                  {DELIVERY_LABELS[program.deliveryMode] ?? program.deliveryMode}
                </span>
                {program.scholarshipAvailable && (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    Scholarship Available
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-bold text-slate-900">{program.title}</h1>

              <div className="mt-3 flex items-center gap-2 text-slate-500">
                <Building2 className="h-4 w-4" />
                <span className="font-medium">{program.institution.name}</span>
              </div>

              {program.description && (
                <p className="mt-4 text-sm leading-relaxed text-slate-600">{program.description}</p>
              )}

              {/* Quick stats */}
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {program.durationMonths && (
                  <div className="rounded-lg bg-slate-50 p-3 text-center">
                    <Clock className="mx-auto mb-1 h-4 w-4 text-slate-400" />
                    <p className="text-xs font-semibold text-slate-900">
                      {program.durationMonths >= 12
                        ? `${Math.round(program.durationMonths / 12)} Year${program.durationMonths >= 24 ? "s" : ""}`
                        : `${program.durationMonths} Months`}
                    </p>
                    <p className="text-xs text-slate-400">Duration</p>
                  </div>
                )}
                {program.creditPoints && (
                  <div className="rounded-lg bg-slate-50 p-3 text-center">
                    <Award className="mx-auto mb-1 h-4 w-4 text-slate-400" />
                    <p className="text-xs font-semibold text-slate-900">{program.creditPoints}</p>
                    <p className="text-xs text-slate-400">Credits</p>
                  </div>
                )}
                {program.language?.length > 0 && (
                  <div className="rounded-lg bg-slate-50 p-3 text-center">
                    <Globe className="mx-auto mb-1 h-4 w-4 text-slate-400" />
                    <p className="text-xs font-semibold text-slate-900">{program.language.join(", ")}</p>
                    <p className="text-xs text-slate-400">Language</p>
                  </div>
                )}
                <div className="rounded-lg bg-slate-50 p-3 text-center">
                  <BookOpen className="mx-auto mb-1 h-4 w-4 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-900">{program.courses?.length ?? 0}</p>
                  <p className="text-xs text-slate-400">Modules</p>
                </div>
              </div>
            </div>

            {/* Entry Requirements */}
            {program.entryRequirements && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-3 font-bold text-slate-900">Entry Requirements</h2>
                <p className="text-sm leading-relaxed text-slate-600">{program.entryRequirements}</p>
              </div>
            )}

            {/* Career Outcomes */}
            {program.careerOutcomes && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-blue-600" />
                  <h2 className="font-bold text-slate-900">Career Outcomes</h2>
                </div>
                <p className="text-sm leading-relaxed text-slate-600">{program.careerOutcomes}</p>
              </div>
            )}

            {/* Modules preview */}
            {program.courses && program.courses.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 font-bold text-slate-900">
                  Program Modules ({program.courses.length})
                </h2>
                <div className="space-y-2">
                  {program.courses.slice(0, 5).map((course, i) => (
                    <div key={course.id} className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-slate-800">{course.title}</span>
                      {course.isMandatory && (
                        <span className="ml-auto rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">Core</span>
                      )}
                    </div>
                  ))}
                  {program.courses.length > 5 && (
                    <p className="pt-1 text-center text-xs text-slate-400">
                      +{program.courses.length - 5} more modules — enroll to see all
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="sticky top-24 rounded-xl border border-blue-200 bg-white p-6 shadow-md">
              {program.localPrice ? (
                <div className="mb-4">
                  <p className="text-2xl font-bold text-slate-900">
                    LKR {Number(program.localPrice).toLocaleString()}
                  </p>
                  {program.foreignPrice && (
                    <p className="text-sm text-slate-400">
                      USD {Number(program.foreignPrice).toLocaleString()} for international students
                    </p>
                  )}
                </div>
              ) : (
                <p className="mb-4 text-sm text-slate-500">Contact institution for pricing</p>
              )}

              <button
                onClick={() => router.push("/login")}
                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-700 shadow-sm"
              >
                Login to Enroll
              </button>
              <button
                onClick={() => router.push("/signup")}
                className="mt-2 w-full rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Create Free Account
              </button>

              <div className="mt-4 space-y-2">
                {[
                  "Full program access",
                  "Progress tracking",
                  "Certificate on completion",
                  program.scholarshipAvailable ? "Scholarship eligible" : null,
                ].filter(Boolean).map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                  <Building2 className="h-5 w-5 text-slate-500" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-900">{program.institution.name}</p>
                  {program.institution.city && (
                    <p className="text-xs text-slate-400">{program.institution.city}, {program.institution.country}</p>
                  )}
                </div>
              </div>
              {program.institution.isVerified && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Verified Institution
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
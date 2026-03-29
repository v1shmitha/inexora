"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Building2, Clock, Globe,
  GraduationCap, CheckCircle2, Layers, Loader2,
  ChevronDown, ChevronUp, Award, AlertCircle,
} from "lucide-react";
import { createClient } from "~/lib/supabase/client";
import { api } from "~/trpc/react";

interface Program {
  id: string;
  title: string;
  type: string;
  level: string;
  field: string;
  deliveryMode: string;
  durationMonths: number | null;
  localPrice: number | null;
  foreignPrice: number | null;
  scholarshipAvailable: boolean;
  description: string | null;
  entryRequirements: string | null;
  careerOutcomes: string | null;
  language: string[];
  creditPoints: number | null;
  institution: { name: string; logoUrl: string | null; type: string; description: string | null } | null;
  courses: {
    id: string; title: string; code: string | null;
    isMandatory: boolean; orderIndex: number; description: string | null;
    _count: { sections: number };
  }[];
}

export default function ProgramDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const utils = api.useUtils();

  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const { data: existingEnrollment, isLoading: enrollmentLoading } =
    api.enrollment.checkProgramEnrollment.useQuery(
      { programId: id ?? "" },
      { enabled: !!id && !!user, staleTime: 0 },
    );

  const enrollMutation = api.enrollment.enrollInProgram.useMutation({
    onSuccess: async (data) => {
      if (data.type === "enrolled") {
        // Invalidate so the query re-fetches and reflects enrollment immediately
        await utils.enrollment.checkProgramEnrollment.invalidate({ programId: id });
        setEnrolling(false);
      } else if (data.type === "payment_required") {
        router.push(`/payment?enrollmentId=${data.enrollmentId}&paymentId=${data.paymentId}&amount=${data.amount}&title=${encodeURIComponent(data.programTitle ?? "")}`);
      }
    },
    onError: (e) => { setEnrollError(e.message); setEnrolling(false); },
  });

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    void init();
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchProgram = async () => {
      const { data } = await supabase
        .from("Program")
        .select(`
          id, title, type, level, field, deliveryMode,
          durationMonths, localPrice, foreignPrice,
          scholarshipAvailable, description, entryRequirements,
          careerOutcomes, language, creditPoints,
          institution:Institution(name, logoUrl, type, description),
          courses:Course(id, title, code, isMandatory, orderIndex, description)
        `)
        .eq("id", id)
        .eq("isPublished", true)
        .eq("approvalStatus", "APPROVED")
        .single();

      if (data) {
        setProgram({
          ...data,
          institution: Array.isArray(data.institution) ? data.institution[0] ?? null : data.institution,
          localPrice: data.localPrice ? Number(data.localPrice) : null,
          foreignPrice: data.foreignPrice ? Number(data.foreignPrice) : null,
          courses: ((data.courses as any[]) ?? [])
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((c) => ({ ...c, _count: { sections: 0 } })),
        } as Program);
      }
      setLoading(false);
    };
    void fetchProgram();
  }, [id]);

  const handleEnroll = () => {
    if (!user) { router.push(`/login?redirect=/programs/${id}`); return; }
    setEnrolling(true);
    setEnrollError(null);
    enrollMutation.mutate({ programId: id! });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="font-medium text-slate-600">Program not found.</p>
          <button onClick={() => router.push("/dashboard/student/programs")} className="mt-3 text-sm text-blue-600 hover:underline">
            Back to Programs
          </button>
        </div>
      </div>
    );
  }

  const isFree = !program.localPrice || program.localPrice === 0;
  const isEnrolled = !!existingEnrollment;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <button
            onClick={() => router.push("/dashboard/student/programs")}
            className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Programs
          </button>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                  {program.type.replace(/_/g, " ")}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                  {program.level}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-500">
                  {program.field.replace(/_/g, " ")}
                </span>
                {program.scholarshipAvailable && (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                    🎓 Scholarship Available
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-slate-900">{program.title}</h1>
              {program.institution && (
                <div className="mt-3 flex items-center gap-2 text-slate-600">
                  <Building2 className="h-4 w-4" />
                  <span className="font-medium">{program.institution.name}</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-sm text-slate-400">{program.institution.type.replace(/_/g, " ")}</span>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                {program.durationMonths && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />{program.durationMonths} months
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Globe className="h-4 w-4" />{program.deliveryMode.replace(/_/g, " ")}
                </span>
                <span className="flex items-center gap-1.5">
                  <Layers className="h-4 w-4" />{program.courses.length} modules
                </span>
                {program.language.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    📘 {program.language.join(", ")}
                  </span>
                )}
              </div>
            </div>

            {/* Enrollment card */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4">
                {isFree ? (
                  <p className="text-2xl font-bold text-green-700">Free</p>
                ) : (
                  <div>
                    <p className="text-2xl font-bold text-slate-900">
                      LKR {program.localPrice?.toLocaleString()}
                    </p>
                    {program.foreignPrice && (
                      <p className="text-sm text-slate-400">USD {program.foreignPrice.toLocaleString()}</p>
                    )}
                  </div>
                )}
              </div>

              {enrollmentLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : isEnrolled ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> You are enrolled in this program
                  </div>
                  <button
                    onClick={() => router.push("/dashboard/student")}
                    className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Go to My Learning
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    {enrolling ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Enrolling…</>
                    ) : isFree ? "Enroll for Free" : "Enroll Now"}
                  </button>
                  {enrollError && (
                    <p className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                      <AlertCircle className="h-3.5 w-3.5" />{enrollError}
                    </p>
                  )}
                  {!user && (
                    <p className="text-center text-xs text-slate-400">You'll be asked to sign in first</p>
                  )}
                </div>
              )}

              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
                {[
                  { icon: <Layers className="h-3.5 w-3.5" />, label: `${program.courses.length} modules included` },
                  { icon: <Globe className="h-3.5 w-3.5" />, label: program.deliveryMode.replace(/_/g, " ") },
                  ...(program.creditPoints ? [{ icon: <Award className="h-3.5 w-3.5" />, label: `${program.creditPoints} credit points` }] : []),
                  ...(program.scholarshipAvailable ? [{ icon: <GraduationCap className="h-3.5 w-3.5" />, label: "Scholarship available" }] : []),
                ].map(({ icon, label }, i) => (
                  <div key={i} className="flex items-center gap-2">{icon}{label}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">

            {program.description && (
              <section>
                <h2 className="mb-3 text-xl font-bold text-slate-900">About This Program</h2>
                <p className="leading-relaxed text-slate-600">{program.description}</p>
              </section>
            )}

            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Program Modules ({program.courses.length})
              </h2>
              <div className="space-y-2">
                {program.courses.map((course, idx) => (
                  <div key={course.id} className="rounded-xl border border-slate-200 bg-white">
                    <button
                      onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
                      className="flex w-full items-center gap-3 px-5 py-4 text-left"
                    >
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-700">
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900">{course.title}</p>
                        {course.code && (
                          <span className="font-mono text-xs text-slate-400">{course.code}</span>
                        )}
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        {!course.isMandatory && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Elective</span>
                        )}
                        {expandedCourse === course.id
                          ? <ChevronUp className="h-4 w-4 text-slate-400" />
                          : <ChevronDown className="h-4 w-4 text-slate-400" />
                        }
                      </div>
                    </button>
                    {expandedCourse === course.id && course.description && (
                      <div className="border-t border-slate-100 px-5 pb-4 pt-3">
                        <p className="text-sm text-slate-500">{course.description}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {program.entryRequirements && (
              <section>
                <h2 className="mb-3 text-xl font-bold text-slate-900">Entry Requirements</h2>
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
                  <p className="text-sm leading-relaxed text-amber-900">{program.entryRequirements}</p>
                </div>
              </section>
            )}

            {program.careerOutcomes && (
              <section>
                <h2 className="mb-3 text-xl font-bold text-slate-900">Career Outcomes</h2>
                <p className="leading-relaxed text-slate-600">{program.careerOutcomes}</p>
              </section>
            )}
          </div>

          <div className="space-y-4">
            {program.institution?.description && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-2 font-bold text-slate-900">About the Institution</h3>
                <p className="text-sm text-slate-500">{program.institution.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
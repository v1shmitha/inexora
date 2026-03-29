"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Clock, Loader2,
  ChevronDown, ChevronUp, CheckCircle2, AlertCircle,
  FileText, Video, Link2, AlignLeft,
} from "lucide-react";
import { createClient } from "~/lib/supabase/client";
import { api } from "~/trpc/react";

interface CourseDetail {
  id: string;
  title: string;
  code: string | null;
  description: string | null;
  localPrice: number | null;
  foreignPrice: number | null;
  createdAt: string;
  createdBy: { title: string | null; bio: string | null; profile: { fullName: string | null } | null } | null;
  sections: {
    id: string; title: string; description: string | null;
    instructions: string | null; orderIndex: number;
    resources: { id: string; title: string; type: string; durationMins: number | null; description: string | null }[];
  }[];
  _count: { assessments: number };
}

const RESOURCE_ICONS: Record<string, React.ReactNode> = {
  PDF:           <FileText className="h-3.5 w-3.5 text-red-500" />,
  VIDEO_UPLOAD:  <Video className="h-3.5 w-3.5 text-blue-500" />,
  VIDEO_LINK:    <Video className="h-3.5 w-3.5 text-purple-500" />,
  IMAGE:         <FileText className="h-3.5 w-3.5 text-green-500" />,
  PRESENTATION:  <FileText className="h-3.5 w-3.5 text-orange-500" />,
  EXTERNAL_LINK: <Link2 className="h-3.5 w-3.5 text-slate-500" />,
};

function formatDuration(mins: number | null | undefined): string | null {
  if (!mins) return null;
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const utils = api.useUtils();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const { data: existingEnrollment, isLoading: enrollmentLoading } =
    api.enrollment.checkCourseEnrollment.useQuery(
      { courseId: id ?? "" },
      { enabled: !!id && !!user, staleTime: 0 },
    );

  const enrollMutation = api.enrollment.enrollInCourse.useMutation({
    onSuccess: async (data) => {
      if (data.type === "enrolled") {
        // Invalidate so the query re-fetches and reflects enrollment immediately
        await utils.enrollment.checkCourseEnrollment.invalidate({ courseId: id });
        setEnrolling(false);
      } else if (data.type === "payment_required") {
        router.push(`/payment?paymentId=${data.paymentId}&amount=${data.amount}&title=${encodeURIComponent(data.courseTitle ?? "")}`);
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
    const fetchCourse = async () => {
      const { data } = await supabase
        .from("Course")
        .select(`
          id, title, code, description, localPrice, foreignPrice, createdAt,
          createdBy:Lecturer!Course_createdById_fkey(title, bio, profile:Profile(fullName)),
          sections:CourseSection(
            id, title, description, instructions, orderIndex,
            resources:CourseResource(id, title, type, durationMins, description)
          )
        `)
        .eq("id", id)
        .eq("isStandalone", true)
        .eq("isPublished", true)
        .single();

      if (data) {
        setCourse({
          ...data,
          localPrice: data.localPrice ? Number(data.localPrice) : null,
          foreignPrice: data.foreignPrice ? Number(data.foreignPrice) : null,
          createdBy: Array.isArray(data.createdBy) ? data.createdBy[0] ?? null : data.createdBy,
          sections: ((data.sections as any[]) ?? []).sort((a, b) => a.orderIndex - b.orderIndex),
          _count: { assessments: 0 },
        } as CourseDetail);
        const first = ((data.sections as any[]) ?? []).sort((a, b) => a.orderIndex - b.orderIndex)[0];
        if (first) setExpandedSection(first.id);
      }
      setLoading(false);
    };
    void fetchCourse();
  }, [id]);

  const handleEnroll = () => {
    if (!user) { router.push(`/login?redirect=/courses/${id}`); return; }
    setEnrolling(true);
    setEnrollError(null);
    enrollMutation.mutate({ courseId: id! });
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  }
  if (!course) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Course not found.</p>
          <button onClick={() => router.push("/dashboard/student/courses")} className="mt-3 text-sm text-blue-600 hover:underline">Back to Courses</button>
        </div>
      </div>
    );
  }

  const isFree = !course.localPrice || course.localPrice === 0;
  const isEnrolled = !!existingEnrollment;
  const totalResources = course.sections.reduce((s, sec) => s + sec.resources.length, 0);
  const totalMins = course.sections.reduce(
    (s, sec) => s + sec.resources.reduce((rs, r) => rs + (r.durationMins ?? 0), 0), 0,
  );
  const instructor = course.createdBy;
  const instructorName = instructor?.profile?.fullName
    ? `${instructor.title ? `${instructor.title} ` : ""}${instructor.profile.fullName}`
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <button onClick={() => router.push("/dashboard/student/courses")}
            className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Courses
          </button>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <span className="mb-2 inline-block rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                Standalone Course
              </span>
              <h1 className="text-3xl font-bold text-slate-900">{course.title}</h1>
              {course.code && (
                <span className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-500">
                  {course.code}
                </span>
              )}
              {instructorName && (
                <p className="mt-3 text-slate-600">
                  Taught by <span className="font-semibold">{instructorName}</span>
                </p>
              )}
              {course.description && (
                <p className="mt-3 leading-relaxed text-slate-500">{course.description}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />{totalResources} resources
                </span>
                {totalMins > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />{formatDuration(totalMins)} total
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  📚 {course.sections.length} sections
                </span>
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
                      LKR {course.localPrice?.toLocaleString()}
                    </p>
                    {course.foreignPrice && (
                      <p className="text-sm text-slate-400">USD {course.foreignPrice.toLocaleString()}</p>
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
                    <CheckCircle2 className="h-4 w-4" /> You are enrolled
                  </div>
                  <button
                    onClick={() => router.push(`/dashboard/student/courses/${course.id}`)}
                    className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Go to Course
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {enrolling
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Enrolling…</>
                      : isFree ? "Enroll for Free" : "Enroll Now"
                    }
                  </button>
                  {enrollError && (
                    <p className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                      <AlertCircle className="h-3.5 w-3.5" />{enrollError}
                    </p>
                  )}
                  {!user && (
                    <p className="text-center text-xs text-slate-400">You'll be asked to sign in</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="mb-4 text-xl font-bold text-slate-900">
              What You'll Learn ({course.sections.length} sections)
            </h2>
            <div className="space-y-2">
              {course.sections.map((section, idx) => (
                <div key={section.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <button
                    onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                    className="flex w-full items-center gap-3 px-5 py-4 text-left"
                  >
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-700">
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{section.title}</p>
                      {section.description && (
                        <p className="truncate text-xs text-slate-400">{section.description}</p>
                      )}
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-3 text-xs text-slate-400">
                      <span>{section.resources.length} resources</span>
                      {expandedSection === section.id
                        ? <ChevronUp className="h-4 w-4" />
                        : <ChevronDown className="h-4 w-4" />
                      }
                    </div>
                  </button>

                  {expandedSection === section.id && (
                    <div className="border-t border-slate-100 px-5 pb-4 pt-2">
                      {section.instructions && (
                        <div className="mb-3 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
                          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                            <AlignLeft className="h-3 w-3" /> Instructions
                          </p>
                          <p className="line-clamp-3 text-xs leading-relaxed text-amber-800">
                            {section.instructions}
                          </p>
                        </div>
                      )}
                      <div className="space-y-2">
                        {section.resources.map((r) => (
                          <div key={r.id} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
                            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded bg-white shadow-sm">
                              {RESOURCE_ICONS[r.type]}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-700">{r.title}</p>
                              {r.description && (
                                <p className="truncate text-xs text-slate-400">{r.description}</p>
                              )}
                            </div>
                            {r.durationMins && (
                              <span className="flex-shrink-0 text-xs text-slate-400">
                                {formatDuration(r.durationMins)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {instructor && instructorName && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 font-bold text-slate-900">Your Instructor</h3>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700">
                  {instructorName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{instructorName}</p>
                </div>
              </div>
              {instructor.bio && (
                <p className="mt-3 text-sm text-slate-500">{instructor.bio}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
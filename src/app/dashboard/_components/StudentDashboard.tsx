"use client";

import { useState, useEffect } from "react";
import {
  BookOpen, Award, Briefcase, TrendingUp, FileText,
  Loader2, AlertCircle, GraduationCap, Layers,
  ArrowRight, CheckCircle2, BarChart3,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "~/lib/supabase/client";
import { api } from "~/trpc/react";
import SetupIncompleteBanner from "./SetupIncompleteBanner";

interface Enrollment {
  id: string;
  status: string;
  program: { title: string; institution: { name: string }[] }[] | null;
}

interface JobApplication {
  id: string;
  status: string;
  appliedAt: string;
  job: { title: string; employer: { companyName: string }[] }[] | null;
}

interface Credential {
  id: string;
  title: string;
  credentialType: string;
  issueDate: string | null;
}

// ── Progress bar ──────────────────────────────────────────────────────────

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-slate-100">
      <div
        className={`h-1.5 rounded-full transition-all ${percent === 100 ? "bg-emerald-500" : "bg-blue-500"}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────

export default function StudentDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState<string | null>(null);
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStudent, setIsStudent] = useState(false);

  // tRPC — enrolled courses with progress (only when student setup is complete)
  const { data: courseEnrollments = [] } =
    api.studentCourse.getMyEnrollments.useQuery(undefined, {
      enabled: isStudent,
      staleTime: 0,
    });

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("Profile")
        .select("fullName")
        .eq("id", user.id)
        .single();
      setFullName(profile?.fullName ?? null);

      const { data: student } = await supabase
        .from("Student")
        .select("id")
        .eq("profileId", user.id)
        .single();

      setSetupComplete(!!student);

      if (student) {
        setIsStudent(true);
        await fetchDashboardData(student.id);
      } else {
        setLoading(false);
      }
    };
    void init();
  }, []);

  const fetchDashboardData = async (sId: string) => {
    try {
      setLoading(true);
      const [enrollmentsRes, jobAppsRes, credentialsRes] = await Promise.all([
        supabase
          .from("Enrollment")
          .select("id, status, program:Program(title, institution:Institution(name))")
          .eq("studentId", sId)
          .eq("status", "ACTIVE"),
        supabase
          .from("JobApplication")
          .select("id, status, appliedAt, job:JobListing(title, employer:Employer(companyName))")
          .eq("studentId", sId)
          .order("appliedAt", { ascending: false })
          .limit(5),
        supabase
          .from("Credential")
          .select("id, title, credentialType, issueDate")
          .eq("studentId", sId)
          .order("issueDate", { ascending: false }),
      ]);
      if (enrollmentsRes.data) setEnrollments(enrollmentsRes.data as Enrollment[]);
      if (jobAppsRes.data) setJobApplications(jobAppsRes.data as JobApplication[]);
      if (credentialsRes.data) setCredentials(credentialsRes.data as Credential[]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCareerMapClick = () => {
    if (!setupComplete) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
      return;
    }
    router.push("/career-map");
  };

  const statusColors: Record<string, string> = {
    APPLIED:     "bg-yellow-100 text-yellow-800",
    SHORTLISTED: "bg-blue-100 text-blue-800",
    INTERVIEW:   "bg-purple-100 text-purple-800",
    OFFERED:     "bg-green-100 text-green-800",
    REJECTED:    "bg-red-100 text-red-800",
    WITHDRAWN:   "bg-gray-100 text-gray-800",
  };

  const getFirst = <T,>(arr: T[] | null | undefined): T | null =>
    Array.isArray(arr) && arr.length > 0 ? arr[0]! : null;

  if (loading || setupComplete === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const inProgress = courseEnrollments.filter(
    (e) => e.progressPercent < 100 && e.status === "ACTIVE",
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {!setupComplete && <SetupIncompleteBanner role="STUDENT" />}

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mb-1 text-3xl font-bold text-gray-900">Student Dashboard</h1>
            <p className="font-medium text-gray-600">
              Welcome back <span className="text-blue-600">{fullName ?? "Student"}</span>
            </p>
          </div>
          <button
            onClick={() => router.push("/programs")}
            className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
          >
            + Browse New Programs
          </button>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<BookOpen className="text-blue-600" />}     count={courseEnrollments.length} label="Courses Enrolled" />
          <StatCard icon={<BarChart3 className="text-emerald-600" />} count={inProgress}               label="In Progress" />
          <StatCard icon={<Award className="text-orange-600" />}      count={credentials.length}       label="Credentials" />
          <StatCard icon={<Briefcase className="text-purple-600" />}  count={jobApplications.length}   label="Job Applications" />
        </div>

        {/* ── My Learning preview ─────────────────────────────────────── */}
        {setupComplete && (
          <div className="mb-8">
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-50 px-6 py-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">My Learning</h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {courseEnrollments.length} enrolled · {inProgress} in progress
                  </p>
                </div>
                <button
                  onClick={() => router.push("/dashboard/student")}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
                >
                  View All <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {courseEnrollments.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <GraduationCap className="mx-auto mb-3 h-10 w-10 text-gray-200" />
                  <p className="font-medium text-gray-600">No courses yet</p>
                  <p className="mt-1 text-sm text-gray-400">
                    Courses you enroll in will appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {courseEnrollments.slice(0, 4).map((e) => {
                    const isModule = !e.course.isStandalone;
                    const lecturer = e.course.courseLecturers[0]?.lecturer;
                    const lecturerName = lecturer?.profile?.fullName ?? null;

                    return (
                      <div
                        key={e.id}
                        className="flex items-center gap-4 px-6 py-4 transition hover:bg-slate-50"
                      >
                        {/* Icon */}
                        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                          isModule ? "bg-blue-50" : "bg-emerald-50"
                        }`}>
                          {isModule
                            ? <Layers className="h-5 w-5 text-blue-600" />
                            : <GraduationCap className="h-5 w-5 text-emerald-600" />
                          }
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 truncate">{e.course.title}</p>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                            {e.course.code && (
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">{e.course.code}</span>
                            )}
                            {lecturerName && <span>{lecturerName}</span>}
                          </div>
                          {/* Progress bar */}
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1">
                              <ProgressBar percent={e.progressPercent} />
                            </div>
                            <span className={`flex-shrink-0 text-xs font-bold ${
                              e.progressPercent === 100 ? "text-emerald-600" : "text-blue-600"
                            }`}>
                              {e.progressPercent}%
                            </span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="hidden flex-shrink-0 flex-col items-end gap-1 text-xs text-slate-400 sm:flex">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            {e.completedResources}/{e.totalResources}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 font-semibold ${
                            e.status === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-blue-100 text-blue-700"
                          }`}>
                            {e.status === "COMPLETED" ? "Completed" : "Active"}
                          </span>
                        </div>

                        {/* CTA */}
                        <button
                          onClick={() => router.push(`/dashboard/student/courses/${e.courseId}`)}
                          className="flex-shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700"
                        >
                          {e.progressPercent === 0 ? "Start" : e.progressPercent === 100 ? "Review" : "Continue"}
                        </button>
                      </div>
                    );
                  })}

                  {courseEnrollments.length > 4 && (
                    <div className="px-6 py-3 text-center">
                      <button
                        onClick={() => router.push("/dashboard/student")}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        + {courseEnrollments.length - 4} more courses →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Enrollments + Job Applications ──────────────────────────── */}
        <div className="mb-8 grid gap-8 lg:grid-cols-2">
          <SectionWrapper title="My Program Enrollments">
            {enrollments.length === 0 ? (
              <EmptyState icon={<BookOpen />} message="No active enrollments" sub="Apply to programs to get started" />
            ) : (
              <div className="space-y-4">
                {enrollments.map((enrollment) => {
                  const program = getFirst(enrollment.program);
                  const institution = getFirst(program?.institution ?? null);
                  return (
                    <div key={enrollment.id} className="rounded-xl border border-gray-100 p-4 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/30">
                      <h3 className="font-bold text-gray-900">{program?.title}</h3>
                      <p className="mb-3 text-sm text-gray-500">{institution?.name}</p>
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        {enrollment.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionWrapper>

          <SectionWrapper title="Recent Job Applications">
            {jobApplications.length === 0 ? (
              <EmptyState icon={<Briefcase />} message="No job applications yet" sub="Browse careers to apply" />
            ) : (
              <div className="divide-y divide-gray-100">
                {jobApplications.map((app) => {
                  const job = getFirst(app.job);
                  const employer = getFirst(job?.employer ?? null);
                  return (
                    <div key={app.id} className="py-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{job?.title}</h3>
                          <p className="mt-1 text-xs text-gray-500">
                            {employer?.companyName} · {new Date(app.appliedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase ${statusColors[app.status] ?? "bg-gray-100 text-gray-700"}`}>
                          {app.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionWrapper>
        </div>

        {/* Credentials */}
        {credentials.length > 0 && (
          <div className="mb-8">
            <SectionWrapper title="My Credentials">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {credentials.map((cred) => (
                  <div key={cred.id} className="rounded-xl border border-gray-100 p-4 shadow-sm">
                    <Award className="mb-2 h-8 w-8 text-orange-500" />
                    <h3 className="font-bold text-gray-900">{cred.title}</h3>
                    <p className="text-xs text-gray-500">
                      {cred.credentialType}
                      {cred.issueDate && ` · ${new Date(cred.issueDate).toLocaleDateString()}`}
                    </p>
                  </div>
                ))}
              </div>
            </SectionWrapper>
          </div>
        )}

        {/* Career CTA */}
        <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-blue-100 bg-white p-8 shadow-sm md:flex-row">
          <div className="flex items-center space-x-6">
            <div className="rounded-2xl bg-blue-600 p-4">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Career Recommendations</h3>
              <p className="text-gray-500">Explore career paths based on your credentials</p>
            </div>
          </div>
          <button
            onClick={handleCareerMapClick}
            className="rounded-xl bg-gray-900 px-8 py-3 font-bold text-white transition hover:bg-gray-800"
          >
            View Career Map
          </button>
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-orange-200 bg-white px-5 py-4 shadow-xl animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100">
            <AlertCircle className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Profile setup incomplete</p>
            <p className="text-sm text-gray-500">Complete your profile to access the Career Map.</p>
          </div>
          <button
            onClick={() => router.push("/profile-setup")}
            className="ml-2 shrink-0 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-orange-600"
          >
            Setup Now
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, count, label }: { icon: React.ReactNode; count: number; label: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50">{icon}</div>
      <div className="mb-1 text-3xl font-black text-gray-900">{count}</div>
      <div className="text-xs font-bold uppercase tracking-widest text-gray-400">{label}</div>
    </div>
  );
}

function SectionWrapper({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-50 px-6 py-5">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function EmptyState({ icon, message, sub }: { icon: React.ReactNode; message: string; sub: string }) {
  return (
    <div className="py-10 text-center">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-400">{icon}</div>
      <p className="font-bold text-gray-900">{message}</p>
      <p className="text-sm text-gray-500">{sub}</p>
    </div>
  );
}
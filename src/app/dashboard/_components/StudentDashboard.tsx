"use client";

import { useState, useEffect } from "react";
import {
  BookOpen,
  Award,
  Briefcase,
  TrendingUp,
  FileText,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "~/lib/supabase/client";

// Supabase returns nested relations as arrays
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

export default function StudentDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);

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

      if (student) {
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

  const statusColors: Record<string, string> = {
    APPLIED: "bg-yellow-100 text-yellow-800",
    SHORTLISTED: "bg-blue-100 text-blue-800",
    INTERVIEW: "bg-purple-100 text-purple-800",
    OFFERED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    WITHDRAWN: "bg-gray-100 text-gray-800",
  };

  // Helper to safely get nested relation value
  const getFirst = <T,>(arr: T[] | null | undefined): T | null =>
    Array.isArray(arr) && arr.length > 0 ? arr[0]! : null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-blue-600" />
            <p className="font-medium text-gray-500">Syncing your progress...</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="mb-1 text-3xl font-bold text-gray-900">Student Dashboard</h1>
                <p className="font-medium text-gray-600">
                  Welcome back{" "}
                  <span className="text-blue-600">{fullName ?? "Student"}</span>
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
              <StatCard icon={<BookOpen className="text-blue-600" />} count={enrollments.length} label="Active Enrollments" />
              <StatCard icon={<FileText className="text-emerald-600" />} count={jobApplications.length} label="Job Applications" />
              <StatCard icon={<Award className="text-orange-600" />} count={credentials.length} label="Credentials" />
              <StatCard icon={<Briefcase className="text-purple-600" />} count={0} label="Opportunities" />
            </div>

            <div className="mb-8 grid gap-8 lg:grid-cols-2">

              {/* Enrollments */}
              <SectionWrapper title="My Enrollments">
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

              {/* Job Applications */}
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
                onClick={() => router.push("/career-map")}
                className="rounded-xl bg-gray-900 px-8 py-3 font-bold text-white transition hover:bg-gray-800"
              >
                View Career Map
              </button>
            </div>
          </>
        )}
      </div>
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
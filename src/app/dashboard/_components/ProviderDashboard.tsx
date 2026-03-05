"use client";

import { useState, useEffect } from "react";
import { BookOpen, Users, TrendingUp, DollarSign, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "~/lib/supabase/client";
import SetupIncompleteBanner from "./SetupIncompleteBanner";

interface Program {
  id: string;
  title: string;
  durationMonths: number | null;
  creditPoints: number | null;
  isPublished: boolean;
}

interface Enrollment {
  id: string;
  status: string;
  createdAt: string;
  program: { title: string }[] | null;
}

export default function ProviderDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState<string | null>(null);
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null);
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
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

      const { data: institution } = await supabase
        .from("Institution")
        .select("id")
        .eq("adminId", user.id)
        .maybeSingle();

      setSetupComplete(!!institution);

      if (institution) {
        setInstitutionId(institution.id);
        await fetchDashboardData(institution.id);
      } else {
        setLoading(false);
      }
    };

    void init();
  }, []);

  const fetchDashboardData = async (instId: string) => {
    try {
      setLoading(true);

      const [programsRes, enrollmentsRes] = await Promise.all([
        supabase
          .from("Program")
          .select("id, title, durationMonths, creditPoints, isPublished")
          .eq("institutionId", instId),

        supabase
          .from("Enrollment")
          .select("id, status, createdAt, program:Program(title)")
          .eq("program.institutionId", instId)
          .order("createdAt", { ascending: false })
          .limit(10),
      ]);

      if (programsRes.data) setPrograms(programsRes.data as Program[]);
      if (enrollmentsRes.data) setEnrollments(enrollmentsRes.data as Enrollment[]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const publishedPrograms = programs.filter((p) => p.isPublished).length;
  const pendingEnrollments = enrollments.filter((e) => e.status === "PENDING").length;

  const enrollmentStatusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-blue-100 text-blue-800",
    ACTIVE: "bg-green-100 text-green-800",
    COMPLETED: "bg-gray-100 text-gray-800",
    SUSPENDED: "bg-red-100 text-red-800",
    WITHDRAWN: "bg-gray-100 text-gray-800",
  };

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Setup incomplete banner */}
        {!setupComplete && <SetupIncompleteBanner role="INSTITUTION_ADMIN" />}

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">Provider Dashboard</h1>
            <p className="text-gray-600">
              Welcome back,{" "}
              <span className="font-semibold text-blue-600">{fullName ?? "Provider"}</span>
            </p>
          </div>
          <button
            onClick={() => router.push("/programs")}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            + Add Program
          </button>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-6 md:grid-cols-4">
          {[
            { icon: BookOpen, color: "text-blue-600", value: programs.length, label: "Total Programs" },
            { icon: TrendingUp, color: "text-green-600", value: publishedPrograms, label: "Published Programs" },
            { icon: Users, color: "text-orange-600", value: enrollments.length, label: "Enrollments" },
            { icon: DollarSign, color: "text-purple-600", value: pendingEnrollments, label: "Pending Review" },
          ].map(({ icon: Icon, color, value, label }) => (
            <div key={label} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <Icon className={`mb-2 h-8 w-8 ${color}`} />
              <div className="mb-1 text-3xl font-bold text-gray-900">{value}</div>
              <div className="text-sm text-gray-600">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-8 md:grid-cols-2">

          {/* Programs */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900">Programs</h2>
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-700">
                Add Program
              </button>
            </div>
            <div className="p-6">
              {programs.length === 0 ? (
                <div className="py-8 text-center">
                  <BookOpen className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                  <p className="text-gray-600">No programs created yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {programs.slice(0, 5).map((program) => (
                    <div key={program.id} className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="mb-1 font-semibold text-gray-900">{program.title}</h3>
                          <p className="mb-2 text-sm text-gray-600">
                            {program.durationMonths} months
                            {program.creditPoints && ` · ${program.creditPoints} credits`}
                          </p>
                          <span className={`rounded-full px-2 py-1 text-xs ${
                            program.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                          }`}>
                            {program.isPublished ? "Published" : "Draft"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Enrollments */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900">Recent Enrollments</h2>
            </div>
            <div className="p-6">
              {enrollments.length === 0 ? (
                <div className="py-8 text-center">
                  <Users className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                  <p className="text-gray-600">No enrollments received yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {enrollments.slice(0, 5).map((enrollment) => {
                    const program = Array.isArray(enrollment.program) ? enrollment.program[0] : null;
                    return (
                      <div key={enrollment.id} className="rounded-lg border border-gray-200 p-4">
                        <div className="mb-2 flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="mb-1 font-semibold text-gray-900">
                              {program?.title ?? "Unknown Program"}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {new Date(enrollment.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                            enrollmentStatusColors[enrollment.status] ?? "bg-gray-100 text-gray-800"
                          }`}>
                            {enrollment.status}
                          </span>
                        </div>
                        {enrollment.status === "PENDING" && (
                          <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                            Review Enrollment
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
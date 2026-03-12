"use client";

import { useState, useEffect } from "react";
import {
  Video, FileText, Users, TrendingUp, Loader2, BookOpen,
  Building2, BarChart3, Megaphone, Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "~/lib/supabase/client";
import SetupIncompleteBanner from "./SetupIncompleteBanner";
import ApprovalStatusBanner from "./ApprovalStatusBanner";

// ── Types ──────────────────────────────────────────────────────────────────

interface CourseLecturer {
  id: string;
  role: string;
  course: {
    id: string;
    title: string;
    code: string | null;
    program: { title: string }[] | null;
  }[] | null;
}

interface LibraryResource {
  id: string;
  title: string;
  type: string;
  views: number;
  downloads: number;
  isFree: boolean;
  createdAt: string;
}

interface ManagerInfo {
  id: string;
  canEditProfile: boolean;
  canManagePrograms: boolean;
  canViewAnalytics: boolean;
  canPostAnnouncements: boolean;
  institution: {
    id: string;
    name: string;
    type: string;
    city: string | null;
    logoUrl: string | null;
    isActive: boolean;
  } | null;
}

interface InstitutionStats {
  totalPrograms: number;
  publishedPrograms: number;
  totalEnrollments: number;
  totalLecturers: number;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function LecturerDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState<string | null>(null);
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<"PENDING" | "APPROVED" | "REJECTED" | null>(null);
  const [courseLecturers, setCourseLecturers] = useState<CourseLecturer[]>([]);
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [managerInfo, setManagerInfo] = useState<ManagerInfo | null>(null);
  const [institutionStats, setInstitutionStats] = useState<InstitutionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"lecturer" | "institution">("lecturer");

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

      const { data: lecturer } = await supabase
        .from("Lecturer")
        .select("id, approvalStatus")
        .eq("profileId", user.id)
        .single();

      setSetupComplete(!!lecturer);
      setApprovalStatus((lecturer?.approvalStatus as "PENDING" | "APPROVED" | "REJECTED") ?? null);

      if (lecturer?.approvalStatus === "APPROVED") {
        await Promise.all([
          fetchDashboardData(lecturer.id, user.id),
          fetchManagerInfo(),
        ]);
      } else {
        setLoading(false);
      }
    };
    void init();
  }, []);

  const fetchDashboardData = async (lId: string, userId: string) => {
    try {
      setLoading(true);
      const [coursesRes, resourcesRes] = await Promise.all([
        supabase
          .from("CourseLecturer")
          .select("id, role, course:Course(id, title, code, program:Program(title))")
          .eq("lecturerId", lId),
        supabase
          .from("LibraryResource")
          .select("id, title, type, views, downloads, isFree, createdAt")
          .eq("uploadedBy", userId)
          .order("createdAt", { ascending: false })
          .limit(10),
      ]);
      if (coursesRes.data) setCourseLecturers(coursesRes.data as CourseLecturer[]);
      if (resourcesRes.data) setResources(resourcesRes.data as LibraryResource[]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchManagerInfo = async () => {
    try {
      const res = await fetch("/api/institutions/manager");
      const data = await res.json() as { manager: ManagerInfo | null };
      setManagerInfo(data.manager);

      // If manager with analytics access, fetch institution stats
      if (data.manager?.canViewAnalytics && data.manager.institution?.id) {
        await fetchInstitutionStats(data.manager.institution.id);
      }
    } catch {
      // silently fail — manager info is optional
    }
  };

  const fetchInstitutionStats = async (institutionId: string) => {
    const adminSupabase = createClient();
    const [programsRes, enrollmentsRes, lecturersRes] = await Promise.all([
      adminSupabase.from("Program").select("id, isPublished").eq("institutionId", institutionId),
      adminSupabase.from("Enrollment").select("id", { count: "exact", head: true })
        .eq("program.institutionId", institutionId),
      adminSupabase.from("Lecturer").select("id", { count: "exact", head: true })
        .eq("institutionId", institutionId),
    ]);

    const programs = programsRes.data ?? [];
    setInstitutionStats({
      totalPrograms: programs.length,
      publishedPrograms: programs.filter((p) => p.isPublished).length,
      totalEnrollments: enrollmentsRes.count ?? 0,
      totalLecturers: lecturersRes.count ?? 0,
    });
  };

  const totalViews = resources.reduce((sum, r) => sum + (r.views ?? 0), 0);
  const totalDownloads = resources.reduce((sum, r) => sum + (r.downloads ?? 0), 0);

  const resourceTypeColors: Record<string, string> = {
    EBOOK: "bg-blue-100 text-blue-700",
    JOURNAL: "bg-purple-100 text-purple-700",
    VIDEO_LECTURE: "bg-red-100 text-red-700",
    RESEARCH_PAPER: "bg-orange-100 text-orange-700",
    SIMULATION: "bg-green-100 text-green-700",
    PAST_PAPER: "bg-gray-100 text-gray-700",
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

        {!setupComplete && <SetupIncompleteBanner role="LECTURER" />}

        {setupComplete && approvalStatus && approvalStatus !== "APPROVED" && (
          <ApprovalStatusBanner status={approvalStatus} role="LECTURER" />
        )}

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">Lecturer Dashboard</h1>
            <p className="text-gray-600">
              Welcome back, <span className="font-semibold text-blue-600">{fullName ?? "Lecturer"}</span>
            </p>
            {/* Institution badge */}
            {managerInfo?.institution && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1">
                <Building2 className="h-3.5 w-3.5 text-violet-600" />
                <span className="text-xs font-medium text-violet-700">{managerInfo.institution.name}</span>
                <span className="rounded-full bg-violet-200 px-1.5 py-0.5 text-xs font-bold text-violet-700">Manager</span>
              </div>
            )}
          </div>
          {approvalStatus === "APPROVED" && (
            <button
              onClick={() => router.push("/resources")}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              + Upload Resource
            </button>
          )}
        </div>

        {/* Pending/Rejected — limited view */}
        {approvalStatus !== "APPROVED" ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="font-medium text-slate-600">Full dashboard available after approval</p>
            <p className="mt-1 text-sm text-slate-400">
              You'll be able to manage courses and resources once your account is approved.
            </p>
          </div>
        ) : (
          <>
            {/* Tab switcher — only show if lecturer is a manager */}
            {managerInfo && (
              <div className="mb-6 flex gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm w-fit">
                <button
                  onClick={() => setActiveTab("lecturer")}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                    activeTab === "lecturer"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <BookOpen className="h-4 w-4" /> My Work
                </button>
                <button
                  onClick={() => setActiveTab("institution")}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                    activeTab === "institution"
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Building2 className="h-4 w-4" /> {managerInfo.institution?.name ?? "Institution"}
                </button>
              </div>
            )}

            {/* ── Lecturer Tab ── */}
            {activeTab === "lecturer" && (
              <>
                <div className="mb-8 grid gap-6 md:grid-cols-4">
                  {[
                    { icon: Video, color: "text-blue-600", value: courseLecturers.length, label: "Assigned Courses" },
                    { icon: FileText, color: "text-green-600", value: resources.length, label: "Resources" },
                    { icon: Users, color: "text-orange-600", value: totalViews, label: "Total Views" },
                    { icon: TrendingUp, color: "text-purple-600", value: totalDownloads, label: "Downloads" },
                  ].map(({ icon: Icon, color, value, label }) => (
                    <div key={label} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                      <Icon className={`mb-2 h-8 w-8 ${color}`} />
                      <div className="mb-1 text-3xl font-bold text-gray-900">{value}</div>
                      <div className="text-sm text-gray-600">{label}</div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                  {/* Courses */}
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                      <h2 className="text-xl font-bold text-gray-900">My Courses</h2>
                    </div>
                    <div className="p-6">
                      {courseLecturers.length === 0 ? (
                        <div className="py-8 text-center">
                          <BookOpen className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                          <p className="text-gray-600">Not assigned to any courses yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {courseLecturers.slice(0, 5).map((cl) => {
                            const course = Array.isArray(cl.course) ? cl.course[0] : null;
                            const program = Array.isArray(course?.program) ? course?.program[0] : null;
                            return (
                              <div key={cl.id} className="rounded-lg border border-gray-200 p-4">
                                <h3 className="mb-1 font-semibold text-gray-900">{course?.title ?? "Unknown Course"}</h3>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                  {course?.code && <span className="font-mono text-xs">{course.code}</span>}
                                  {program?.title && <span className="text-gray-500">{program.title}</span>}
                                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                    cl.role === "LECTURER" ? "bg-blue-100 text-blue-700"
                                    : cl.role === "CO_LECTURER" ? "bg-purple-100 text-purple-700"
                                    : "bg-orange-100 text-orange-700"
                                  }`}>{cl.role.replace("_", " ")}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Resources */}
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
                      <h2 className="text-xl font-bold text-gray-900">My Resources</h2>
                      <button onClick={() => router.push("/resources")}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-700"
                      >Add Resource</button>
                    </div>
                    <div className="p-6">
                      {resources.length === 0 ? (
                        <div className="py-8 text-center">
                          <FileText className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                          <p className="text-gray-600">No resources uploaded yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {resources.slice(0, 5).map((resource) => (
                            <div key={resource.id} className="rounded-lg border border-gray-200 p-4">
                              <h3 className="mb-2 font-semibold text-gray-900">{resource.title}</h3>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                  resourceTypeColors[resource.type] ?? "bg-gray-100 text-gray-700"
                                }`}>{resource.type.replace("_", " ")}</span>
                                <span>{resource.views} views</span>
                                <span>{resource.downloads} downloads</span>
                                <span className={`rounded-full px-2 py-0.5 text-xs ${
                                  resource.isFree ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                                }`}>{resource.isFree ? "Free" : "Premium"}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── Institution Tab ── */}
            {activeTab === "institution" && managerInfo && (
              <div className="space-y-6">

                {/* Institution header card */}
                <div className="rounded-xl border border-violet-100 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-violet-100">
                      <Building2 className="h-7 w-7 text-violet-600" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-900">{managerInfo.institution?.name}</h2>
                      <p className="text-sm text-gray-500">
                        {managerInfo.institution?.type?.replace("_", " ")}
                        {managerInfo.institution?.city ? ` · ${managerInfo.institution.city}` : ""}
                      </p>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      managerInfo.institution?.isActive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {managerInfo.institution?.isActive ? "Active" : "Suspended"}
                    </div>
                  </div>

                  {/* Permissions */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {managerInfo.canManagePrograms && (
                      <span className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                        <BookOpen className="h-3 w-3" /> Manage Programs
                      </span>
                    )}
                    {managerInfo.canViewAnalytics && (
                      <span className="flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                        <BarChart3 className="h-3 w-3" /> View Analytics
                      </span>
                    )}
                    {managerInfo.canPostAnnouncements && (
                      <span className="flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
                        <Megaphone className="h-3 w-3" /> Post Announcements
                      </span>
                    )}
                    {managerInfo.canEditProfile && (
                      <span className="flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
                        <Settings className="h-3 w-3" /> Edit Profile
                      </span>
                    )}
                  </div>
                </div>

                {/* Analytics */}
                {managerInfo.canViewAnalytics && institutionStats && (
                  <div className="grid gap-4 sm:grid-cols-4">
                    {[
                      { label: "Total Programs", value: institutionStats.totalPrograms, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
                      { label: "Published", value: institutionStats.publishedPrograms, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
                      { label: "Enrollments", value: institutionStats.totalEnrollments, icon: Users, color: "text-orange-600", bg: "bg-orange-50" },
                      { label: "Lecturers", value: institutionStats.totalLecturers, icon: Video, color: "text-violet-600", bg: "bg-violet-50" },
                    ].map(({ label, value, icon: Icon, color, bg }) => (
                      <div key={label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">{label}</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
                          </div>
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}>
                            <Icon className={`h-5 w-5 ${color}`} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Programs management */}
                {managerInfo.canManagePrograms && (
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
                      <h2 className="text-xl font-bold text-gray-900">Programs</h2>
                      <button
                        onClick={() => router.push("/programs/create")}
                        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
                      >
                        + New Program
                      </button>
                    </div>
                    <div className="p-6">
                      <div className="py-8 text-center">
                        <BookOpen className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                        <p className="text-gray-500">Program management coming soon</p>
                        <p className="mt-1 text-sm text-gray-400">You'll be able to create and manage programs here.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Announcements */}
                {managerInfo.canPostAnnouncements && (
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
                      <h2 className="text-xl font-bold text-gray-900">Announcements</h2>
                      <button className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600">
                        + Post Announcement
                      </button>
                    </div>
                    <div className="p-6">
                      <div className="py-8 text-center">
                        <Megaphone className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                        <p className="text-gray-500">No announcements posted yet</p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
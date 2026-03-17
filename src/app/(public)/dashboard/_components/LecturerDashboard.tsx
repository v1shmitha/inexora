"use client";

import { useState, useEffect } from "react";
import {
  Video,
  FileText,
  Users,
  TrendingUp,
  Loader2,
  BookOpen,
  Building2,
  BarChart3,
  Megaphone,
  Settings,
  X,
  ChevronDown,
  Globe,
  DollarSign,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "~/lib/supabase/client";
import SetupIncompleteBanner from "./SetupIncompleteBanner";
import ApprovalStatusBanner from "./ApprovalStatusBanner";

// ── Enums ──────────────────────────────────────────────────────────────────

const PROGRAM_TYPES = [
  "FOUNDATION",
  "DIPLOMA",
  "CERTIFICATE",
  "BACHELOR",
  "MASTER",
  "PHD",
  "PROFESSIONAL",
  "MICROCREDENTIAL",
  "SHORT_COURSE",
] as const;
const PROGRAM_LEVELS = [
  "ENTRY",
  "UNDERGRADUATE",
  "POSTGRADUATE",
  "RESEARCH",
] as const;
const PROGRAM_FIELDS = [
  "ENGINEERING",
  "INFORMATION_TECHNOLOGY",
  "BUSINESS_MANAGEMENT",
  "ACCOUNTING_FINANCE",
  "MEDICINE",
  "HEALTHCARE",
  "NURSING",
  "PHARMACY",
  "BIO_TECHNOLOGY",
  "AGRICULTURE",
  "ENVIRONMENTAL_SCIENCE",
  "LAW",
  "PSYCHOLOGY",
  "SOCIAL_SCIENCE",
  "EDUCATION",
  "ARTS",
  "ARCHITECTURE",
  "MEDIA_COMMUNICATION",
  "JOURNALISM",
  "LOGISTICS",
  "TOURISM_HOSPITALITY",
  "MARITIME",
  "FASHION_DESIGN",
  "INTERIOR_DESIGN",
  "GRAPHIC_DESIGN",
  "MUSIC",
  "PERFORMING_ARTS",
  "SPORTS_SCIENCE",
  "POLITICAL_SCIENCE",
  "ECONOMICS",
  "MATHEMATICS",
  "PHYSICS",
  "CHEMISTRY",
  "DATA_SCIENCE",
  "ARTIFICIAL_INTELLIGENCE",
  "CYBER_SECURITY",
  "OTHER",
] as const;
const DELIVERY_MODES = ["ONLINE", "ON_CAMPUS", "HYBRID", "BLENDED"] as const;
const LANGUAGES = [
  "English",
  "Sinhala",
  "Tamil",
  "French",
  "German",
  "Japanese",
  "Chinese",
  "Arabic",
];

// ── Types ──────────────────────────────────────────────────────────────────

interface ProgramForm {
  title: string;
  slug: string;
  type: string;
  level: string;
  field: string;
  durationMonths: string;
  deliveryMode: string;
  language: string[];
  description: string;
  entryRequirements: string;
  careerOutcomes: string;
  creditPoints: string;
  creditFramework: string;
  localPrice: string;
  foreignPrice: string;
  scholarshipAvailable: boolean;
  isPublished: boolean;
}

const BLANK_PROGRAM: ProgramForm = {
  title: "",
  slug: "",
  type: "",
  level: "",
  field: "",
  durationMonths: "",
  deliveryMode: "",
  language: [],
  description: "",
  entryRequirements: "",
  careerOutcomes: "",
  creditPoints: "",
  creditFramework: "",
  localPrice: "",
  foreignPrice: "",
  scholarshipAvailable: false,
  isPublished: false,
};

interface CourseLecturer {
  id: string;
  role: string;
  course:
    | {
        id: string;
        title: string;
        code: string | null;
        program: { title: string }[] | null;
      }[]
    | null;
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

interface InstitutionProgram {
  id: string;
  title: string;
  type: string;
  level: string;
  field: string;
  deliveryMode: string;
  isPublished: boolean;
  createdAt: string;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function LecturerDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState<string | null>(null);
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<
    "PENDING" | "APPROVED" | "REJECTED" | null
  >(null);
  const [courseLecturers, setCourseLecturers] = useState<CourseLecturer[]>([]);
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [managerInfo, setManagerInfo] = useState<ManagerInfo | null>(null);
  const [institutionStats, setInstitutionStats] =
    useState<InstitutionStats | null>(null);
  const [institutionPrograms, setInstitutionPrograms] = useState<
    InstitutionProgram[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"lecturer" | "institution">(
    "lecturer",
  );

  const [programModal, setProgramModal] = useState<
    "closed" | "create" | "edit"
  >("closed");
  const [editingProgram, setEditingProgram] =
    useState<InstitutionProgram | null>(null);
  const [programForm, setProgramForm] = useState<ProgramForm>(BLANK_PROGRAM);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [programLoading, setProgramLoading] = useState(false);
  const [programError, setProgramError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

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
      setApprovalStatus(
        (lecturer?.approvalStatus as "PENDING" | "APPROVED" | "REJECTED") ??
          null,
      );

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
          .select(
            "id, role, course:Course(id, title, code, program:Program(title))",
          )
          .eq("lecturerId", lId),
        supabase
          .from("LibraryResource")
          .select("id, title, type, views, downloads, isFree, createdAt")
          .eq("uploadedBy", userId)
          .order("createdAt", { ascending: false })
          .limit(10),
      ]);
      if (coursesRes.data)
        setCourseLecturers(coursesRes.data as CourseLecturer[]);
      if (resourcesRes.data)
        setResources(resourcesRes.data as LibraryResource[]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchManagerInfo = async () => {
    try {
      const res = await fetch("/api/institutions/manager");
      const data = (await res.json()) as { manager: ManagerInfo | null };
      setManagerInfo(data.manager);
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
      adminSupabase
        .from("Program")
        .select(
          "id, title, type, level, field, deliveryMode, isPublished, createdAt",
        )
        .eq("institutionId", institutionId)
        .eq("isActive", true)
        .order("createdAt", { ascending: false }),
      adminSupabase
        .from("Enrollment")
        .select("id", { count: "exact", head: true })
        .eq("program.institutionId", institutionId),
      adminSupabase
        .from("Lecturer")
        .select("id", { count: "exact", head: true })
        .eq("institutionId", institutionId),
    ]);

    const programs = programsRes.data ?? [];
    setInstitutionPrograms(programs as InstitutionProgram[]);
    setInstitutionStats({
      totalPrograms: programs.length,
      publishedPrograms: programs.filter((p) => p.isPublished).length,
      totalEnrollments: enrollmentsRes.count ?? 0,
      totalLecturers: lecturersRes.count ?? 0,
    });
  };

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managerInfo?.institution?.id) return;
    if (
      !programForm.title.trim() ||
      !programForm.type ||
      !programForm.level ||
      !programForm.field ||
      !programForm.deliveryMode
    ) {
      setProgramError("Please fill in all required fields.");
      return;
    }

    setProgramLoading(true);
    setProgramError(null);

    try {
      const slug =
        programForm.slug.trim() ||
        programForm.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

      const { error } = await supabase.from("Program").insert({
        id: crypto.randomUUID(),
        updatedAt: new Date().toISOString(),
        institutionId: managerInfo.institution.id,
        title: programForm.title.trim(),
        slug,
        type: programForm.type,
        level: programForm.level,
        field: programForm.field,
        durationMonths: programForm.durationMonths
          ? parseInt(programForm.durationMonths)
          : null,
        deliveryMode: programForm.deliveryMode,
        language:
          programForm.language.length > 0 ? programForm.language : ["English"],
        description: programForm.description || null,
        entryRequirements: programForm.entryRequirements || null,
        careerOutcomes: programForm.careerOutcomes || null,
        creditPoints: programForm.creditPoints
          ? parseInt(programForm.creditPoints)
          : null,
        creditFramework: programForm.creditFramework || null,
        localPrice: programForm.localPrice
          ? parseFloat(programForm.localPrice)
          : null,
        foreignPrice: programForm.foreignPrice
          ? parseFloat(programForm.foreignPrice)
          : null,
        scholarshipAvailable: programForm.scholarshipAvailable,
        isPublished: programForm.isPublished,
      });

      if (error) throw error;

      const newProgram: InstitutionProgram = {
        id: crypto.randomUUID(),
        title: programForm.title.trim(),
        type: programForm.type,
        level: programForm.level,
        field: programForm.field,
        deliveryMode: programForm.deliveryMode,
        isPublished: programForm.isPublished,
        createdAt: new Date().toISOString(),
      };

      setInstitutionPrograms((prev) => [newProgram, ...prev]);
      setInstitutionStats((prev) =>
        prev
          ? {
              ...prev,
              totalPrograms: prev.totalPrograms + 1,
              publishedPrograms: programForm.isPublished
                ? prev.publishedPrograms + 1
                : prev.publishedPrograms,
            }
          : prev,
      );
      setProgramModal("closed");
      setProgramForm(BLANK_PROGRAM);
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      console.error("Program creation error:", err);
      setProgramError(msg);
    } finally {
      setProgramLoading(false);
    }
  };

  const handleEditProgram = async (program: InstitutionProgram) => {
    setActionLoadingId(program.id);
    try {
      const { data, error } = await supabase
        .from("Program")
        .select("*")
        .eq("id", program.id)
        .single();

      if (error) throw error;

      setEditingProgram(program);
      setProgramForm({
        title: data.title ?? "",
        slug: data.slug ?? "",
        type: data.type ?? "",
        level: data.level ?? "",
        field: data.field ?? "",
        durationMonths: data.durationMonths?.toString() ?? "",
        deliveryMode: data.deliveryMode ?? "",
        language: data.language ?? [],
        description: data.description ?? "",
        entryRequirements: data.entryRequirements ?? "",
        careerOutcomes: data.careerOutcomes ?? "",
        creditPoints: data.creditPoints?.toString() ?? "",
        creditFramework: data.creditFramework ?? "",
        localPrice: data.localPrice?.toString() ?? "",
        foreignPrice: data.foreignPrice?.toString() ?? "",
        scholarshipAvailable: data.scholarshipAvailable ?? false,
        isPublished: data.isPublished ?? false,
      });
      setProgramError(null);
      setProgramModal("edit");
    } catch (err) {
      console.error("Failed to load program:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProgram) return;
    if (
      !programForm.title.trim() ||
      !programForm.type ||
      !programForm.level ||
      !programForm.field ||
      !programForm.deliveryMode
    ) {
      setProgramError("Please fill in all required fields.");
      return;
    }
    setProgramLoading(true);
    setProgramError(null);
    try {
      const { error } = await supabase
        .from("Program")
        .update({
          title: programForm.title.trim(),
          type: programForm.type,
          level: programForm.level,
          field: programForm.field,
          durationMonths: programForm.durationMonths
            ? parseInt(programForm.durationMonths)
            : null,
          deliveryMode: programForm.deliveryMode,
          language:
            programForm.language.length > 0
              ? programForm.language
              : ["English"],
          description: programForm.description || null,
          entryRequirements: programForm.entryRequirements || null,
          careerOutcomes: programForm.careerOutcomes || null,
          creditPoints: programForm.creditPoints
            ? parseInt(programForm.creditPoints)
            : null,
          creditFramework: programForm.creditFramework || null,
          localPrice: programForm.localPrice
            ? parseFloat(programForm.localPrice)
            : null,
          foreignPrice: programForm.foreignPrice
            ? parseFloat(programForm.foreignPrice)
            : null,
          scholarshipAvailable: programForm.scholarshipAvailable,
          isPublished: programForm.isPublished,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", editingProgram.id);
      if (error) throw error;
      setInstitutionPrograms((prev) =>
        prev.map((p) =>
          p.id === editingProgram.id
            ? {
                ...p,
                title: programForm.title.trim(),
                type: programForm.type,
                field: programForm.field,
                isPublished: programForm.isPublished,
              }
            : p,
        ),
      );
      setProgramModal("closed");
      setEditingProgram(null);
    } catch (err) {
      setProgramError(err instanceof Error ? err.message : JSON.stringify(err));
    } finally {
      setProgramLoading(false);
    }
  };

  const handleDeleteProgram = async (id: string) => {
    if (!confirm("Delete this program? This cannot be undone.")) return;
    setActionLoadingId(id);
    try {
      const { error } = await supabase.from("Program").delete().eq("id", id);
      if (error) throw error;
      setInstitutionPrograms((prev) => prev.filter((p) => p.id !== id));
      setInstitutionStats((prev) =>
        prev ? { ...prev, totalPrograms: prev.totalPrograms - 1 } : prev,
      );
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleTogglePublish = async (program: InstitutionProgram) => {
    setActionLoadingId(program.id);
    try {
      const { error } = await supabase
        .from("Program")
        .update({
          isPublished: !program.isPublished,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", program.id);
      if (error) throw error;
      setInstitutionPrograms((prev) =>
        prev.map((p) =>
          p.id === program.id ? { ...p, isPublished: !program.isPublished } : p,
        ),
      );
      setInstitutionStats((prev) =>
        prev
          ? {
              ...prev,
              publishedPrograms: program.isPublished
                ? prev.publishedPrograms - 1
                : prev.publishedPrograms + 1,
            }
          : prev,
      );
    } catch (err) {
      console.error("Toggle error:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const totalViews = resources.reduce((sum, r) => sum + (r.views ?? 0), 0);
  const totalDownloads = resources.reduce(
    (sum, r) => sum + (r.downloads ?? 0),
    0,
  );

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
            <h1 className="mb-2 text-3xl font-bold text-gray-900">
              Lecturer Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back,{" "}
              <span className="font-semibold text-blue-600">
                {fullName ?? "Lecturer"}
              </span>
            </p>
            {managerInfo?.institution && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1">
                <Building2 className="h-3.5 w-3.5 text-violet-600" />
                <span className="text-xs font-medium text-violet-700">
                  {managerInfo.institution.name}
                </span>
                <span className="rounded-full bg-violet-200 px-1.5 py-0.5 text-xs font-bold text-violet-700">
                  Manager
                </span>
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
            <p className="font-medium text-slate-600">
              Full dashboard available after approval
            </p>
            <p className="mt-1 text-sm text-slate-400">
              You'll be able to manage courses and resources once your account
              is approved.
            </p>
          </div>
        ) : (
          <>
            {/* Tab switcher */}
            {managerInfo && (
              <div className="mb-6 flex w-fit gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
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
                  <Building2 className="h-4 w-4" />{" "}
                  {managerInfo.institution?.name ?? "Institution"}
                </button>
              </div>
            )}

            {/* ── Lecturer Tab ── */}
            {activeTab === "lecturer" && (
              <>
                <div className="mb-8 grid gap-6 md:grid-cols-4">
                  {[
                    {
                      icon: Video,
                      color: "text-blue-600",
                      value: courseLecturers.length,
                      label: "Assigned Courses",
                    },
                    {
                      icon: FileText,
                      color: "text-green-600",
                      value: resources.length,
                      label: "Resources",
                    },
                    {
                      icon: Users,
                      color: "text-orange-600",
                      value: totalViews,
                      label: "Total Views",
                    },
                    {
                      icon: TrendingUp,
                      color: "text-purple-600",
                      value: totalDownloads,
                      label: "Downloads",
                    },
                  ].map(({ icon: Icon, color, value, label }) => (
                    <div
                      key={label}
                      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                    >
                      <Icon className={`mb-2 h-8 w-8 ${color}`} />
                      <div className="mb-1 text-3xl font-bold text-gray-900">
                        {value}
                      </div>
                      <div className="text-sm text-gray-600">{label}</div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                  {/* Courses */}
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                      <h2 className="text-xl font-bold text-gray-900">
                        My Courses
                      </h2>
                    </div>
                    <div className="p-6">
                      {courseLecturers.length === 0 ? (
                        <div className="py-8 text-center">
                          <BookOpen className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                          <p className="text-gray-600">
                            Not assigned to any courses yet
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {courseLecturers.slice(0, 5).map((cl) => {
                            const course = Array.isArray(cl.course)
                              ? cl.course[0]
                              : null;
                            const program = Array.isArray(course?.program)
                              ? course?.program[0]
                              : null;
                            return (
                              <div
                                key={cl.id}
                                className="rounded-lg border border-gray-200 p-4"
                              >
                                <h3 className="mb-1 font-semibold text-gray-900">
                                  {course?.title ?? "Unknown Course"}
                                </h3>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                  {course?.code && (
                                    <span className="font-mono text-xs">
                                      {course.code}
                                    </span>
                                  )}
                                  {program?.title && (
                                    <span className="text-gray-500">
                                      {program.title}
                                    </span>
                                  )}
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                      cl.role === "LECTURER"
                                        ? "bg-blue-100 text-blue-700"
                                        : cl.role === "CO_LECTURER"
                                          ? "bg-purple-100 text-purple-700"
                                          : "bg-orange-100 text-orange-700"
                                    }`}
                                  >
                                    {cl.role.replace("_", " ")}
                                  </span>
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
                      <h2 className="text-xl font-bold text-gray-900">
                        My Resources
                      </h2>
                      <button
                        onClick={() => router.push("/resources")}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-700"
                      >
                        Add Resource
                      </button>
                    </div>
                    <div className="p-6">
                      {resources.length === 0 ? (
                        <div className="py-8 text-center">
                          <FileText className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                          <p className="text-gray-600">
                            No resources uploaded yet
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {resources.slice(0, 5).map((resource) => (
                            <div
                              key={resource.id}
                              className="rounded-lg border border-gray-200 p-4"
                            >
                              <h3 className="mb-2 font-semibold text-gray-900">
                                {resource.title}
                              </h3>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                    resourceTypeColors[resource.type] ??
                                    "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {resource.type.replace("_", " ")}
                                </span>
                                <span>{resource.views} views</span>
                                <span>{resource.downloads} downloads</span>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-xs ${
                                    resource.isFree
                                      ? "bg-green-100 text-green-700"
                                      : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {resource.isFree ? "Free" : "Premium"}
                                </span>
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
                      <h2 className="text-xl font-bold text-gray-900">
                        {managerInfo.institution?.name}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {managerInfo.institution?.type?.replace("_", " ")}
                        {managerInfo.institution?.city
                          ? ` · ${managerInfo.institution.city}`
                          : ""}
                      </p>
                    </div>
                    <div
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        managerInfo.institution?.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {managerInfo.institution?.isActive
                        ? "Active"
                        : "Suspended"}
                    </div>
                  </div>
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
                      {
                        label: "Total Programs",
                        value: institutionStats.totalPrograms,
                        icon: BookOpen,
                        color: "text-blue-600",
                        bg: "bg-blue-50",
                      },
                      {
                        label: "Published",
                        value: institutionStats.publishedPrograms,
                        icon: TrendingUp,
                        color: "text-green-600",
                        bg: "bg-green-50",
                      },
                      {
                        label: "Enrollments",
                        value: institutionStats.totalEnrollments,
                        icon: Users,
                        color: "text-orange-600",
                        bg: "bg-orange-50",
                      },
                      {
                        label: "Lecturers",
                        value: institutionStats.totalLecturers,
                        icon: Video,
                        color: "text-violet-600",
                        bg: "bg-violet-50",
                      },
                    ].map(({ label, value, icon: Icon, color, bg }) => (
                      <div
                        key={label}
                        className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">{label}</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">
                              {value}
                            </p>
                          </div>
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}
                          >
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
                      <h2 className="text-base font-bold text-slate-900">
                        {programModal === "edit"
                          ? `Edit — ${editingProgram?.title}`
                          : "New Program"}
                      </h2>
                      <button
                        onClick={() => {
                          setEditingProgram(null);
                          setProgramForm(BLANK_PROGRAM);
                          setProgramError(null);
                          setProgramModal("create");
                        }}
                        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
                      >
                        + New Program
                      </button>
                    </div>
                    <div className="p-6">
                      {institutionPrograms.length === 0 ? (
                        <div className="py-8 text-center">
                          <BookOpen className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                          <p className="text-gray-500">No programs yet</p>
                          <p className="mt-1 text-sm text-gray-400">
                            Click + New Program to get started.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {institutionPrograms.map((program) => (
                            <div
                              key={program.id}
                              className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50">
                                  <BookOpen className="h-4 w-4 text-violet-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {program.title}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {program.type.replace(/_/g, " ")} ·{" "}
                                    {program.field.replace(/_/g, " ")}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                    program.isPublished
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {program.isPublished ? "Published" : "Draft"}
                                </span>
                                <button
                                  onClick={() => handleTogglePublish(program)}
                                  disabled={actionLoadingId === program.id}
                                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:opacity-50"
                                >
                                  {actionLoadingId === program.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : program.isPublished ? (
                                    <EyeOff className="h-3 w-3" />
                                  ) : (
                                    <Eye className="h-3 w-3" />
                                  )}
                                  {program.isPublished
                                    ? "Unpublish"
                                    : "Publish"}
                                </button>
                                <button
                                  onClick={() => handleEditProgram(program)}
                                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                                >
                                  <Pencil className="h-3 w-3" />
                                  Edit
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteProgram(program.id)
                                  }
                                  disabled={actionLoadingId === program.id}
                                  className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                                >
                                  {actionLoadingId === program.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3 w-3" />
                                  )}
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Announcements */}
                {managerInfo.canPostAnnouncements && (
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
                      <h2 className="text-xl font-bold text-gray-900">
                        Announcements
                      </h2>
                      <button className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600">
                        + Post Announcement
                      </button>
                    </div>
                    <div className="p-6">
                      <div className="py-8 text-center">
                        <Megaphone className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                        <p className="text-gray-500">
                          No announcements posted yet
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ══════ ADD PROGRAM MODAL ══════════════════════════════════════ */}
      {programModal !== "closed" && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100">
                  <BookOpen className="h-5 w-5 text-violet-600" />
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  New Program
                </h2>
              </div>
              <button
                onClick={() => {
                  setProgramModal("closed");
                  setEditingProgram(null);
                }}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={
                programModal === "edit"
                  ? handleUpdateProgram
                  : handleCreateProgram
              }
              className="space-y-5 p-6"
            >
              {/* Title + Slug */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BSc Computer Science"
                    value={programForm.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      const autoSlug = title
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/(^-|-$)/g, "");
                      setProgramForm((f) => ({ ...f, title, slug: autoSlug }));
                    }}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                </div>
                {/* <div className="space-y-1.5">
                  <label className="block text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    Slug
                  </label>
                  <input
                    type="text"
                    placeholder="auto-generated"
                    value={programForm.slug}
                    onChange={(e) =>
                      setProgramForm((f) => ({ ...f, slug: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 font-mono text-sm transition outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                </div> */}
              </div>

              {/* Type + Level + Field */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Type", key: "type", options: PROGRAM_TYPES },
                  { label: "Level", key: "level", options: PROGRAM_LEVELS },
                  { label: "Field", key: "field", options: PROGRAM_FIELDS },
                ].map(({ label, key, options }) => (
                  <div key={key} className="space-y-1.5">
                    <label className="block text-xs font-semibold tracking-wide text-slate-500 uppercase">
                      {label} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={programForm[key as keyof ProgramForm] as string}
                        onChange={(e) =>
                          setProgramForm((f) => ({
                            ...f,
                            [key]: e.target.value,
                          }))
                        }
                        className="w-full appearance-none rounded-lg border border-slate-200 px-3 py-2.5 pr-8 text-sm transition outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                      >
                        <option value="">Select…</option>
                        {options.map((o) => (
                          <option key={o} value={o}>
                            {o.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Mode + Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    Delivery Mode <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={programForm.deliveryMode}
                      onChange={(e) =>
                        setProgramForm((f) => ({
                          ...f,
                          deliveryMode: e.target.value,
                        }))
                      }
                      className="w-full appearance-none rounded-lg border border-slate-200 px-3 py-2.5 pr-8 text-sm transition outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                    >
                      <option value="">Select…</option>
                      {DELIVERY_MODES.map((m) => (
                        <option key={m} value={m}>
                          {m.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    Duration (months)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 36"
                    value={programForm.durationMonths}
                    onChange={(e) =>
                      setProgramForm((f) => ({
                        ...f,
                        durationMonths: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                </div>
              </div>

              {/* Languages */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Languages
                </label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => {
                    const selected = programForm.language.includes(lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() =>
                          setProgramForm((f) => ({
                            ...f,
                            language: selected
                              ? f.language.filter((l) => l !== lang)
                              : [...f.language, lang],
                          }))
                        }
                        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                          selected
                            ? "bg-violet-600 text-white"
                            : "border border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50"
                        }`}
                      >
                        {lang}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief overview of the program…"
                  value={programForm.description}
                  onChange={(e) =>
                    setProgramForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              {/* Entry Requirements + Career Outcomes */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    Entry Requirements
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. A/L passes in relevant subjects…"
                    value={programForm.entryRequirements}
                    onChange={(e) =>
                      setProgramForm((f) => ({
                        ...f,
                        entryRequirements: e.target.value,
                      }))
                    }
                    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    Career Outcomes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Software Engineer, Data Analyst…"
                    value={programForm.careerOutcomes}
                    onChange={(e) =>
                      setProgramForm((f) => ({
                        ...f,
                        careerOutcomes: e.target.value,
                      }))
                    }
                    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                </div>
              </div>

              {/* Credits */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    Credit Points
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 120"
                    value={programForm.creditPoints}
                    onChange={(e) =>
                      setProgramForm((f) => ({
                        ...f,
                        creditPoints: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    Credit Framework
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SLQF, NVQ"
                    value={programForm.creditFramework}
                    onChange={(e) =>
                      setProgramForm((f) => ({
                        ...f,
                        creditFramework: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    Local Price (LKR)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={programForm.localPrice}
                      onChange={(e) =>
                        setProgramForm((f) => ({
                          ...f,
                          localPrice: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-slate-200 py-2.5 pr-3 pl-9 text-sm transition outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    Foreign Price (USD)
                  </label>
                  <div className="relative">
                    <Globe className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={programForm.foreignPrice}
                      onChange={(e) =>
                        setProgramForm((f) => ({
                          ...f,
                          foreignPrice: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-slate-200 py-2.5 pr-3 pl-9 text-sm transition outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                    />
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-4">
                {[
                  {
                    key: "scholarshipAvailable",
                    label: "Scholarship Available",
                  },
                  { key: "isPublished", label: "Publish Immediately" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      setProgramForm((f) => ({
                        ...f,
                        [key]: !f[key as keyof ProgramForm],
                      }))
                    }
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                      programForm[key as keyof ProgramForm]
                        ? "border-violet-200 bg-violet-50 text-violet-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded-full border-2 transition ${
                        programForm[key as keyof ProgramForm]
                          ? "border-violet-600 bg-violet-600"
                          : "border-slate-300"
                      }`}
                    />
                    {label}
                  </button>
                ))}
              </div>

              {programError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                  {programError}
                </p>
              )}

              {/* Footer */}
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setProgramModal("closed");
                    setEditingProgram(null);
                  }}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={programLoading}
                  className="flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
                >
                  {programLoading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {programModal === "edit"
                    ? "Save Changes"
                    : programForm.isPublished
                      ? "Create & Publish"
                      : "Create as Draft"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

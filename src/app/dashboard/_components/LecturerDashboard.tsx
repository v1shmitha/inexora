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
  UserPlus,
  UserX,
  Search,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Clock,
  Plus,
  GraduationCap,
  Layers,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "~/lib/supabase/client";
import { api } from "~/trpc/react";
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
const LECTURER_ROLES = ["LECTURER", "CO_LECTURER", "SUPERVISOR"] as const;

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

interface ModuleForm {
  title: string;
  code: string;
  programId: string;
  description: string;
  isMandatory: boolean;
  orderIndex: string;
}

const BLANK_MODULE: ModuleForm = {
  title: "",
  code: "",
  programId: "",
  description: "",
  isMandatory: true,
  orderIndex: "",
};

interface CourseForm {
  title: string;
  code: string;
  description: string;
  deliveryMode: string;
  durationWeeks: string;
  localPrice: string;
  foreignPrice: string;
  isPublished: boolean;
}

const BLANK_COURSE: CourseForm = {
  title: "",
  code: "",
  description: "",
  deliveryMode: "",
  durationWeeks: "",
  localPrice: "",
  foreignPrice: "",
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

interface StandaloneCourse {
  id: string;
  title: string;
  code: string | null;
  description: string | null;
  isPublished: boolean;
  localPrice: number | null;
  foreignPrice: number | null;
  createdAt: string;
  isStandalone: boolean;
}

interface InstitutionProgram {
  id: string;
  title: string;
  type: string;
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

interface InstitutionLecturer {
  id: string;
  title: string | null;
  profile: { fullName: string | null; email: string | null } | null;
}

interface CourseWithLecturers {
  id: string;
  title: string;
  code: string | null;
  courseLecturers: {
    id: string;
    role: string;
    lecturer: {
      id: string;
      title: string | null;
      profile: { fullName: string | null; email: string | null } | null;
    } | null;
  }[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function ApprovalBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { label: string; className: string; icon: React.ReactNode }
  > = {
    APPROVED: {
      label: "Approved",
      className: "bg-emerald-100 text-emerald-700",
      icon: <CheckCircle className="h-3 w-3" />,
    },
    PENDING: {
      label: "Pending Review",
      className: "bg-amber-100 text-amber-700",
      icon: <Clock className="h-3 w-3" />,
    },
    CHANGES_REQUESTED: {
      label: "Changes Needed",
      className: "bg-red-100 text-red-700",
      icon: <AlertCircle className="h-3 w-3" />,
    },
    DRAFT: {
      label: "Draft",
      className: "bg-slate-100 text-slate-600",
      icon: null,
    },
  };
  const { label, className, icon } = map[status] ?? map.DRAFT!;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
    >
      {icon}
      {label}
    </span>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export default function LecturerDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const utils = api.useUtils();

  // ── Auth state ─────────────────────────────────────────────────────────────
  const [fullName, setFullName] = useState<string | null>(null);
  const [lecturerId, setLecturerId] = useState<string | null>(null);
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<
    "PENDING" | "APPROVED" | "REJECTED" | null
  >(null);
  const [isApproved, setIsApproved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // ── Data state ─────────────────────────────────────────────────────────────
  const [courseLecturers, setCourseLecturers] = useState<CourseLecturer[]>([]);
  const [standaloneCourses, setStandaloneCourses] = useState<
    StandaloneCourse[]
  >([]);
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Manager state ──────────────────────────────────────────────────────────
  const [managerInfo, setManagerInfo] = useState<ManagerInfo | null>(null);
  const [activeTab, setActiveTab] = useState<"lecturer" | "institution">(
    "lecturer",
  );

  // ── Module modal state ─────────────────────────────────────────────────────
  const [moduleModal, setModuleModal] = useState(false);
  const [moduleForm, setModuleForm] = useState<ModuleForm>(BLANK_MODULE);
  const [moduleLoading, setModuleLoading] = useState(false);
  const [moduleError, setModuleError] = useState<string | null>(null);

  // ── Standalone course modal state ──────────────────────────────────────────
  const [courseModal, setCourseModal] = useState<"closed" | "create" | "edit">(
    "closed",
  );
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseForm, setCourseForm] = useState<CourseForm>(BLANK_COURSE);
  const [courseLoading, setCourseLoading] = useState(false);
  const [courseError, setCourseError] = useState<string | null>(null);

  // ── Program modal state ────────────────────────────────────────────────────
  const [programModal, setProgramModal] = useState<
    "closed" | "create" | "edit"
  >("closed");
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [programForm, setProgramForm] = useState<ProgramForm>(BLANK_PROGRAM);
  const [programError, setProgramError] = useState<string | null>(null);

  // ── Review modal ───────────────────────────────────────────────────────────
  const [reviewModal, setReviewModal] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  // ── Course lecturer assignment ─────────────────────────────────────────────
  const [coursePanel, setCoursePanel] = useState<{
    id: string;
    title: string;
    type: string;
    field: string;
  } | null>(null);
  const [courses, setCourses] = useState<CourseWithLecturers[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [institutionLecturers, setInstitutionLecturers] = useState<
    InstitutionLecturer[]
  >([]);
  const [assignPanel, setAssignPanel] = useState<CourseWithLecturers | null>(
    null,
  );
  const [assignRole, setAssignRole] = useState<string>("LECTURER");
  const [assignSearch, setAssignSearch] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // ── tRPC ───────────────────────────────────────────────────────────────────

  const { data: managerInfoData } = api.institution.getMyManagerInfo.useQuery(
    undefined,
    { enabled: isApproved },
  );

  useEffect(() => {
    if (managerInfoData !== undefined)
      setManagerInfo(managerInfoData as ManagerInfo | null);
  }, [managerInfoData]);

  const { data: programs = [], isLoading: programsLoading } =
    api.program.getMyPrograms.useQuery(undefined, { enabled: isApproved });
  const { data: pendingPrograms = [] } = api.program.getPendingReview.useQuery(
    undefined,
    { enabled: !!managerInfo?.canManagePrograms },
  );
  const { data: stats } = api.program.getInstitutionStats.useQuery(undefined, {
    enabled: !!managerInfo?.canViewAnalytics,
  });
  const { data: institutionPrograms = [], isLoading: programsListLoading } =
    api.program.getInstitutionPrograms.useQuery(undefined, {
      enabled: true,
      retry: false,
    });

  console.log("PROGRAMS:", institutionPrograms, "APPROVED:", isApproved);

  const createProgramMutation = api.program.create.useMutation({
    onSuccess: () => {
      void utils.program.getMyPrograms.invalidate();
      setProgramModal("closed");
      setProgramForm(BLANK_PROGRAM);
      setProgramError(null);
    },
    onError: (e) => setProgramError(e.message),
  });
  const updateProgramMutation = api.program.update.useMutation({
    onSuccess: () => {
      void utils.program.getMyPrograms.invalidate();
      setProgramModal("closed");
      setEditingProgramId(null);
      setProgramError(null);
    },
    onError: (e) => setProgramError(e.message),
  });
  const deleteProgramMutation = api.program.delete.useMutation({
    onSuccess: () => {
      void utils.program.getMyPrograms.invalidate();
      void utils.program.getInstitutionStats.invalidate();
    },
  });
  const togglePublish = api.program.togglePublish.useMutation({
    onSuccess: () => {
      void utils.program.getMyPrograms.invalidate();
      void utils.program.getInstitutionStats.invalidate();
    },
  });
  const approveProgram = api.program.approve.useMutation({
    onSuccess: () => {
      void utils.program.getMyPrograms.invalidate();
      void utils.program.getPendingReview.invalidate();
      void utils.program.getInstitutionStats.invalidate();
    },
  });
  const requestChanges = api.program.requestChanges.useMutation({
    onSuccess: () => {
      void utils.program.getPendingReview.invalidate();
      setReviewModal(null);
      setReviewNote("");
    },
  });

  // ── Auth init ──────────────────────────────────────────────────────────────

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
        .select("id, approvalStatus, institutionId")
        .eq("profileId", user.id)
        .single();

      setSetupComplete(!!lecturer);
      setApprovalStatus(
        (lecturer?.approvalStatus as "PENDING" | "APPROVED" | "REJECTED") ??
          null,
      );

      if (lecturer?.approvalStatus === "APPROVED") {
        setIsApproved(true);
        setLecturerId(lecturer.id);
        await fetchDashboardData(lecturer.id, user.id, lecturer.institutionId);
      } else {
        setLoading(false);
      }
      setUserId(user.id);
    };
    void init();
  }, []);

  const fetchDashboardData = async (
    lId: string,
    userId: string,
    institutionId: string | null,
  ) => {
    try {
      const [coursesRes, resourcesRes] = await Promise.all([
        // Single query — get ALL CourseLecturer rows for this lecturer
        // with full course data including isStandalone
        supabase
          .from("CourseLecturer")
          .select(
            "id, role, course:Course(id, title, code, description, isPublished, localPrice, foreignPrice, createdAt, isStandalone, program:Program(title))",
          )
          .eq("lecturerId", lId),
        supabase
          .from("LibraryResource")
          .select("id, title, type, views, downloads, isFree, createdAt")
          .eq("uploadedBy", userId)
          .order("createdAt", { ascending: false })
          .limit(10),
      ]);

      if (coursesRes.data) {
        const allRows = coursesRes.data as any[];

        // Modules — rows where the linked course is NOT standalone
        const moduleRows = allRows.filter((cl) => {
          const c = Array.isArray(cl.course) ? cl.course[0] : cl.course;
          return c && !c.isStandalone;
        });
        setCourseLecturers(moduleRows as CourseLecturer[]);

        // Standalone courses — extract the course object from rows where isStandalone is true
        const courseRows = allRows
          .filter((cl) => {
            const c = Array.isArray(cl.course) ? cl.course[0] : cl.course;
            return c && c.isStandalone === true;
          })
          .map((cl) =>
            Array.isArray(cl.course) ? cl.course[0] : cl.course,
          );
        setStandaloneCourses(courseRows as StandaloneCourse[]);
      }

      if (resourcesRes.data)
        setResources(resourcesRes.data as LibraryResource[]);
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ── Module creation ────────────────────────────────────────────────────────

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleForm.title.trim()) {
      setModuleError("Title is required.");
      return;
    }
    if (!moduleForm.programId) {
      setModuleError("Please select a program.");
      return;
    }
    if (!lecturerId) {
      setModuleError("Lecturer ID not found.");
      return;
    }

    setModuleLoading(true);
    setModuleError(null);
    try {
      const newId = crypto.randomUUID();
      const { data: course, error } = await supabase
        .from("Course")
        .insert({
          id: newId,
          title: moduleForm.title,
          code: moduleForm.code || null,
          programId: moduleForm.programId,
          description: moduleForm.description || null,
          isMandatory: moduleForm.isMandatory,
          orderIndex: moduleForm.orderIndex
            ? parseInt(moduleForm.orderIndex)
            : 0,
          isStandalone: false,
          isPublished: false,
          createdById: lecturerId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select("id, title, code, program:Program(title)")
        .single();

      if (error) throw new Error(error.message);

      // Auto-assign the creating lecturer to this module
      await supabase.from("CourseLecturer").insert({
        id: crypto.randomUUID(),
        courseId: newId,
        lecturerId: lecturerId,
        role: "LECTURER",
      });

      // Add to courseLecturers state
      const program = Array.isArray(course?.program)
        ? course?.program[0]
        : course?.program;
      setCourseLecturers((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "LECTURER",
          course: [
            {
              id: newId,
              title: moduleForm.title,
              code: moduleForm.code || null,
              program: program
                ? [{ title: (program as { title: string }).title }]
                : null,
            },
          ],
        },
      ]);

      setModuleModal(false);
      setModuleForm(BLANK_MODULE);
    } catch (err) {
      setModuleError(
        err instanceof Error ? err.message : "Failed to create module.",
      );
    } finally {
      setModuleLoading(false);
    }
  };

  // ── Standalone course creation ─────────────────────────────────────────────

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.title.trim()) {
      setCourseError("Title is required.");
      return;
    }
    if (!lecturerId) {
      setCourseError("Lecturer ID not found.");
      return;
    }

    setCourseLoading(true);
    setCourseError(null);
    try {
      const newId = crypto.randomUUID();
      const { data: course, error } = await supabase
        .from("Course")
        .insert({
          id: newId,
          title: courseForm.title,
          code: courseForm.code || null,
          description: courseForm.description || null,
          isStandalone: true,
          programId: null,
          isMandatory: false,
          orderIndex: 0,
          isPublished: courseForm.isPublished,
          localPrice: courseForm.localPrice
            ? parseFloat(courseForm.localPrice)
            : null,
          foreignPrice: courseForm.foreignPrice
            ? parseFloat(courseForm.foreignPrice)
            : null,
          createdById: lecturerId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select(
          "id, title, code, description, isPublished, localPrice, foreignPrice, createdAt, isStandalone",
        )
        .single();

      if (error) throw new Error(error.message);

      // Auto-assign the creating lecturer
      await supabase.from("CourseLecturer").insert({
        id: crypto.randomUUID(),
        courseId: newId,
        lecturerId: lecturerId,
        role: "LECTURER",
      });

      if (course)
        setStandaloneCourses((prev) => [course as StandaloneCourse, ...prev]);
      setCourseModal("closed");
      setCourseForm(BLANK_COURSE);
    } catch (err) {
      setCourseError(
        err instanceof Error ? err.message : "Failed to create course.",
      );
    } finally {
      setCourseLoading(false);
    }
  };

  const handleEditCourse = (course: StandaloneCourse) => {
    setEditingCourseId(course.id);
    setCourseForm({
      title: course.title,
      code: course.code ?? "",
      description: course.description ?? "",
      deliveryMode: "",
      durationWeeks: "",
      localPrice: course.localPrice?.toString() ?? "",
      foreignPrice: course.foreignPrice?.toString() ?? "",
      isPublished: course.isPublished,
    });
    setCourseError(null);
    setCourseModal("edit");
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourseId) return;
    if (!courseForm.title.trim()) {
      setCourseError("Title is required.");
      return;
    }

    setCourseLoading(true);
    setCourseError(null);
    try {
      const { error } = await supabase
        .from("Course")
        .update({
          title: courseForm.title,
          code: courseForm.code || null,
          description: courseForm.description || null,
          isPublished: courseForm.isPublished,
          localPrice: courseForm.localPrice
            ? parseFloat(courseForm.localPrice)
            : null,
          foreignPrice: courseForm.foreignPrice
            ? parseFloat(courseForm.foreignPrice)
            : null,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", editingCourseId);

      if (error) throw new Error(error.message);

      setStandaloneCourses((prev) =>
        prev.map((c) =>
          c.id === editingCourseId
            ? {
                ...c,
                title: courseForm.title,
                code: courseForm.code || null,
                description: courseForm.description || null,
                isPublished: courseForm.isPublished,
                localPrice: courseForm.localPrice
                  ? parseFloat(courseForm.localPrice)
                  : null,
                foreignPrice: courseForm.foreignPrice
                  ? parseFloat(courseForm.foreignPrice)
                  : null,
              }
            : c,
        ),
      );
      setCourseModal("closed");
      setEditingCourseId(null);
    } catch (err) {
      setCourseError(
        err instanceof Error ? err.message : "Failed to update course.",
      );
    } finally {
      setCourseLoading(false);
    }
  };

  const handleToggleCourse = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("Course")
      .update({ isPublished: !current, updatedAt: new Date().toISOString() })
      .eq("id", id);
    if (!error)
      setStandaloneCourses((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isPublished: !current } : c)),
      );
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm("Delete this course? This cannot be undone.")) return;
    const { error } = await supabase.from("Course").delete().eq("id", id);
    if (!error) setStandaloneCourses((prev) => prev.filter((c) => c.id !== id));
  };

  // ── Course panel (manager) ─────────────────────────────────────────────────

  const openCoursePanel = async (program: {
    id: string;
    title: string;
    type: string;
    field: string;
  }) => {
    setCoursePanel(program);
    setAssignPanel(null);
    setCoursesLoading(true);
    try {
      const [coursesRes, lecturersRes] = await Promise.all([
        supabase
          .from("Course")
          .select(
            `id, title, code, courseLecturers:CourseLecturer(id, role, lecturer:Lecturer(id, title, profile:Profile(fullName, email)))`,
          )
          .eq("programId", program.id)
          .order("orderIndex", { ascending: true }),
        supabase
          .from("Lecturer")
          .select("id, title, profile:Profile(fullName, email)")
          .eq("institutionId", managerInfo!.institution!.id)
          .eq("approvalStatus", "APPROVED"),
      ]);
      setCourses((coursesRes.data ?? []) as unknown as CourseWithLecturers[]);
      setInstitutionLecturers(
        (lecturersRes.data ?? []) as unknown as InstitutionLecturer[],
      );
    } catch (err) {
      console.error("Failed to load courses:", err);
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleAssignLecturer = async (lecturerId: string) => {
    if (!assignPanel) return;
    setAssignLoading(true);
    setAssignError(null);
    try {
      const { error } = await supabase.from("CourseLecturer").insert({
        id: crypto.randomUUID(),
        courseId: assignPanel.id,
        lecturerId,
        role: assignRole,
      });
      if (error) throw error;
      const lec = institutionLecturers.find((l) => l.id === lecturerId);
      setCourses((prev) =>
        prev.map((c) =>
          c.id === assignPanel.id
            ? {
                ...c,
                courseLecturers: [
                  ...c.courseLecturers,
                  {
                    id: crypto.randomUUID(),
                    role: assignRole,
                    lecturer: lec
                      ? { id: lec.id, title: lec.title, profile: lec.profile }
                      : null,
                  },
                ],
              }
            : c,
        ),
      );
    } catch (err) {
      setAssignError(
        err instanceof Error ? err.message : "Failed to assign lecturer.",
      );
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRemoveCourseLecturer = async (
    courseLecturerId: string,
    courseId: string,
  ) => {
    if (!confirm("Remove this lecturer from the course?")) return;
    setActionLoadingId(courseLecturerId);
    try {
      const { error } = await supabase
        .from("CourseLecturer")
        .delete()
        .eq("id", courseLecturerId);
      if (error) throw error;
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId
            ? {
                ...c,
                courseLecturers: c.courseLecturers.filter(
                  (cl) => cl.id !== courseLecturerId,
                ),
              }
            : c,
        ),
      );
    } catch (err) {
      console.error("Remove error:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // ── Program handlers ───────────────────────────────────────────────────────

  const buildProgramPayload = (form: ProgramForm) => ({
    title: form.title.trim(),
    slug: form.slug.trim() || undefined,
    type: form.type as (typeof PROGRAM_TYPES)[number],
    level: form.level as (typeof PROGRAM_LEVELS)[number],
    field: form.field as (typeof PROGRAM_FIELDS)[number],
    durationMonths: form.durationMonths ? parseInt(form.durationMonths) : null,
    deliveryMode: form.deliveryMode as (typeof DELIVERY_MODES)[number],
    language: form.language.length > 0 ? form.language : ["English"],
    description: form.description || null,
    entryRequirements: form.entryRequirements || null,
    careerOutcomes: form.careerOutcomes || null,
    creditPoints: form.creditPoints ? parseInt(form.creditPoints) : null,
    creditFramework: form.creditFramework || null,
    localPrice: form.localPrice ? parseFloat(form.localPrice) : null,
    foreignPrice: form.foreignPrice ? parseFloat(form.foreignPrice) : null,
    scholarshipAvailable: form.scholarshipAvailable,
  });

  const handleCreateProgram = (e: React.FormEvent) => {
    e.preventDefault();
    setProgramError(null);
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
    createProgramMutation.mutate(buildProgramPayload(programForm));
  };

  const handleEditProgram = (program: (typeof programs)[number]) => {
    setEditingProgramId(program.id);
    setProgramForm({
      title: program.title,
      slug: program.slug,
      type: program.type,
      level: program.level,
      field: program.field,
      durationMonths: program.durationMonths?.toString() ?? "",
      deliveryMode: program.deliveryMode,
      language: program.language,
      description: program.description ?? "",
      entryRequirements: program.entryRequirements ?? "",
      careerOutcomes: program.careerOutcomes ?? "",
      creditPoints: program.creditPoints?.toString() ?? "",
      creditFramework: program.creditFramework ?? "",
      localPrice: program.localPrice?.toString() ?? "",
      foreignPrice: program.foreignPrice?.toString() ?? "",
      scholarshipAvailable: program.scholarshipAvailable,
      isPublished: program.isPublished,
    });
    setProgramError(null);
    setProgramModal("edit");
  };

  const handleUpdateProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProgramId) return;
    setProgramError(null);
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
    updateProgramMutation.mutate({
      id: editingProgramId,
      data: buildProgramPayload(programForm),
    });
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const totalViews = resources.reduce((sum, r) => sum + (r.views ?? 0), 0);
  const totalDownloads = resources.reduce(
    (sum, r) => sum + (r.downloads ?? 0),
    0,
  );
  const isMutating =
    createProgramMutation.isPending || updateProgramMutation.isPending;

  const filteredLecturers = institutionLecturers.filter((l) => {
    const q = assignSearch.toLowerCase();
    return (
      l.profile?.fullName?.toLowerCase().includes(q) ??
      l.profile?.email?.toLowerCase().includes(q)
    );
  });

  const resourceTypeColors: Record<string, string> = {
    EBOOK: "bg-blue-100 text-blue-700",
    JOURNAL: "bg-purple-100 text-purple-700",
    VIDEO_LECTURE: "bg-red-100 text-red-700",
    RESEARCH_PAPER: "bg-orange-100 text-orange-700",
    SIMULATION: "bg-green-100 text-green-700",
    PAST_PAPER: "bg-gray-100 text-gray-700",
  };

  if (setupComplete === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

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
        </div>

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
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${activeTab === "lecturer" ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <BookOpen className="h-4 w-4" /> My Work
                </button>
                <button
                  onClick={() => setActiveTab("institution")}
                  className={`relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${activeTab === "institution" ? "bg-violet-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <Building2 className="h-4 w-4" />
                  {managerInfo.institution?.name ?? "Institution"}
                  {pendingPrograms.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                      {pendingPrograms.length}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* ══ LECTURER TAB ══════════════════════════════════════════════ */}
            {activeTab === "lecturer" && (
              <div className="space-y-6">
                {/* ── Quick Stats ── */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    {
                      icon: Layers,
                      color: "text-blue-600",
                      bg: "bg-blue-50",
                      value: courseLecturers.length,
                      label: "Assigned Modules",
                      sub: "across programs",
                    },
                    {
                      icon: GraduationCap,
                      color: "text-emerald-600",
                      bg: "bg-emerald-50",
                      value: standaloneCourses.length,
                      label: "My Courses",
                      sub: `${standaloneCourses.filter((c) => c.isPublished).length} published`,
                    },
                    {
                      icon: Users,
                      color: "text-orange-600",
                      bg: "bg-orange-50",
                      value: 0,
                      label: "Students Enrolled",
                      sub: "across all courses",
                    },
                    {
                      icon: FileText,
                      color: "text-purple-600",
                      bg: "bg-purple-50",
                      value: resources.length,
                      label: "Resources Uploaded",
                      sub: `${totalViews} total views`,
                    },
                  ].map(({ icon: Icon, color, bg, value, label, sub }) => (
                    <div
                      key={label}
                      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            {label}
                          </p>
                          <p className="mt-1 text-3xl font-bold text-gray-900">
                            {value}
                          </p>
                        </div>
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-xl ${bg}`}
                        >
                          <Icon className={`h-6 w-6 ${color}`} />
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-gray-400">{sub}</p>
                    </div>
                  ))}
                </div>

                {/* ── Quick Actions ── */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setModuleForm(BLANK_MODULE);
                      setModuleError(null);
                      setModuleModal(true);
                    }}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" /> Add Module
                  </button>
                  <button
                    onClick={() => {
                      setCourseForm(BLANK_COURSE);
                      setCourseError(null);
                      setCourseModal("create");
                    }}
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <Plus className="h-4 w-4" /> Create Course
                  </button>
                  <button
                    onClick={() => router.push("/resources")}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    <FileText className="h-4 w-4" /> Upload Resource
                  </button>
                </div>

                {/* ── At a glance ── */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* My Modules preview */}
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                      <div>
                        <h2 className="font-bold text-gray-900">My Modules</h2>
                        <p className="mt-0.5 text-xs text-gray-500">
                          Course units within institution programs
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setModuleForm(BLANK_MODULE);
                          setModuleError(null);
                          setModuleModal(true);
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add
                      </button>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {courseLecturers.length === 0 ? (
                        <div className="px-6 py-10 text-center">
                          <Layers className="mx-auto mb-3 h-10 w-10 text-gray-200" />
                          <p className="text-sm font-medium text-gray-500">
                            No modules assigned yet
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            Create a module linked to an institution program.
                          </p>
                        </div>
                      ) : (
                        <>
                          {courseLecturers.filter((cl) => cl.role).slice(0, 4).map((cl) => {
                            const course = Array.isArray(cl.course)
                              ? cl.course[0]
                              : (cl.course ?? null);
                            const program = Array.isArray(course?.program)
                              ? course?.program[0]
                              : (course?.program ?? null);
                            return (
                              <div
                                key={cl.id}
                                className="flex items-center gap-3 px-6 py-3"
                              >
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700">
                                  <Layers className="h-4 w-4 text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-gray-900">
                                    {course?.title ?? "—"}
                                  </p>
                                  <div className="mt-0.5 flex items-center gap-2">
                                    {course?.code && (
                                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-500">
                                        {course.code}
                                      </span>
                                    )}
                                    {program?.title && (
                                      <span className="flex items-center gap-1 truncate text-xs text-gray-400">
                                        <BookOpen className="h-3 w-3 flex-shrink-0" />
                                        {program.title}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {cl.role !== "LECTURER" && (
                                  <span
                                    className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                                      cl.role === "CO_LECTURER"
                                        ? "bg-purple-100 text-purple-700"
                                        : "bg-orange-100 text-orange-700"
                                    }`}
                                  >
                                    {cl.role.replace("_", " ")}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                          {courseLecturers.length > 4 && (
                            <div className="px-6 py-3 text-center">
                              <span className="text-xs text-gray-400">
                                +{courseLecturers.length - 4} more modules
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* My Courses preview */}
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                      <div>
                        <h2 className="font-bold text-gray-900">My Courses</h2>
                        <p className="mt-0.5 text-xs text-gray-500">
                          Standalone certificate courses
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setCourseForm(BLANK_COURSE);
                          setCourseError(null);
                          setCourseModal("create");
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        <Plus className="h-3.5 w-3.5" /> Create
                      </button>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {standaloneCourses.length === 0 ? (
                        <div className="px-6 py-10 text-center">
                          <GraduationCap className="mx-auto mb-3 h-10 w-10 text-gray-200" />
                          <p className="text-sm font-medium text-gray-500">
                            No standalone courses yet
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            Create certificate courses students enroll in
                            directly.
                          </p>
                        </div>
                      ) : (
                        <>
                          {standaloneCourses.slice(0, 4).map((course) => (
                            <div
                              key={course.id}
                              className="flex items-center justify-between px-6 py-3"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                                  <GraduationCap className="h-4 w-4 text-emerald-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {course.title}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-gray-400">
                                    {course.code && (
                                      <span className="font-mono">
                                        {course.code}
                                      </span>
                                    )}
                                    {course.localPrice && (
                                      <span>
                                        LKR {course.localPrice.toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${course.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                                >
                                  {course.isPublished ? "Published" : "Draft"}
                                </span>
                                <button
                                  onClick={() => handleEditCourse(course)}
                                  className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {standaloneCourses.length > 4 && (
                            <div className="px-6 py-3 text-center">
                              <span className="text-xs text-gray-400">
                                +{standaloneCourses.length - 4} more courses
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Pending actions ── */}
                {(standaloneCourses.some((c) => !c.isPublished) ||
                  resources.length === 0) && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <p className="text-sm font-semibold text-amber-800">
                        Pending Actions
                      </p>
                    </div>
                    <div className="space-y-2">
                      {standaloneCourses
                        .filter((c) => !c.isPublished)
                        .slice(0, 3)
                        .map((c) => (
                          <div
                            key={c.id}
                            className="flex items-center justify-between rounded-lg bg-white px-4 py-2.5"
                          >
                            <div className="flex items-center gap-2">
                              <EyeOff className="h-3.5 w-3.5 text-amber-500" />
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">{c.title}</span>{" "}
                                is unpublished
                              </p>
                            </div>
                            <button
                              onClick={() => handleToggleCourse(c.id, false)}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                            >
                              Publish →
                            </button>
                          </div>
                        ))}
                      {resources.length === 0 && (
                        <div className="flex items-center justify-between rounded-lg bg-white px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 text-amber-500" />
                            <p className="text-sm text-gray-700">
                              No resources uploaded yet
                            </p>
                          </div>
                          <button
                            onClick={() => router.push("/resources")}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                          >
                            Upload →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Recent Resources ── */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <h2 className="font-bold text-gray-900">
                      Recent Resources
                    </h2>
                    <button
                      onClick={() => router.push("/resources")}
                      className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
                    >
                      <Plus className="h-3.5 w-3.5" /> Upload
                    </button>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {resources.length === 0 ? (
                      <div className="px-6 py-10 text-center">
                        <FileText className="mx-auto mb-3 h-10 w-10 text-gray-200" />
                        <p className="text-sm font-medium text-gray-500">
                          No resources yet
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          Upload learning materials for your students.
                        </p>
                      </div>
                    ) : (
                      resources.slice(0, 4).map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between px-6 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50">
                              <FileText className="h-4 w-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {r.title}
                              </p>
                              <p className="text-xs text-gray-400">
                                {r.views} views · {r.downloads} downloads
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                {
                                  EBOOK: "bg-blue-100 text-blue-700",
                                  JOURNAL: "bg-purple-100 text-purple-700",
                                  VIDEO_LECTURE: "bg-red-100 text-red-700",
                                  RESEARCH_PAPER:
                                    "bg-orange-100 text-orange-700",
                                  SIMULATION: "bg-green-100 text-green-700",
                                  PAST_PAPER: "bg-gray-100 text-gray-700",
                                }[r.type] ?? "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {r.type.replace("_", " ")}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs ${r.isFree ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}
                            >
                              {r.isFree ? "Free" : "Premium"}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ══ INSTITUTION TAB ═══════════════════════════════════════════ */}
            {activeTab === "institution" && managerInfo && (
              <div className="space-y-6">
                {/* Institution header */}
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
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${managerInfo.institution?.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
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
                {managerInfo.canViewAnalytics && stats && (
                  <div className="grid gap-4 sm:grid-cols-5">
                    {[
                      {
                        label: "Total Programs",
                        value: stats.totalPrograms,
                        icon: BookOpen,
                        color: "text-blue-600",
                        bg: "bg-blue-50",
                      },
                      {
                        label: "Published",
                        value: stats.publishedPrograms,
                        icon: TrendingUp,
                        color: "text-green-600",
                        bg: "bg-green-50",
                      },
                      {
                        label: "Pending Review",
                        value: stats.pendingPrograms,
                        icon: Clock,
                        color: "text-amber-600",
                        bg: "bg-amber-50",
                      },
                      {
                        label: "Enrollments",
                        value: stats.totalEnrollments,
                        icon: Users,
                        color: "text-orange-600",
                        bg: "bg-orange-50",
                      },
                      {
                        label: "Lecturers",
                        value: stats.totalLecturers,
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

                {/* Pending Review */}
                {managerInfo.canManagePrograms &&
                  pendingPrograms.length > 0 && (
                    <div className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm">
                      <div className="flex items-center gap-3 border-b border-amber-100 bg-amber-50 px-6 py-4">
                        <Clock className="h-5 w-5 text-amber-600" />
                        <h2 className="text-base font-bold text-amber-900">
                          Pending Review ({pendingPrograms.length})
                        </h2>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {pendingPrograms.map((program) => (
                          <div
                            key={program.id}
                            className="flex items-center justify-between px-6 py-4"
                          >
                            <div>
                              <p className="font-medium text-gray-900">
                                {program.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                Submitted by{" "}
                                {program.createdBy?.profile?.fullName ??
                                  "Unknown"}{" "}
                                · {program.type.replace(/_/g, " ")} ·{" "}
                                {program.field.replace(/_/g, " ")}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  approveProgram.mutate({ id: program.id })
                                }
                                disabled={approveProgram.isPending}
                                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                              >
                                {approveProgram.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-3 w-3" />
                                )}{" "}
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setReviewModal({
                                    id: program.id,
                                    title: program.title,
                                  });
                                  setReviewNote("");
                                }}
                                className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                              >
                                <AlertCircle className="h-3 w-3" /> Request
                                Changes
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Programs management */}
                {managerInfo.canManagePrograms && !coursePanel && (
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
                      <h2 className="text-xl font-bold text-gray-900">
                        Programs
                      </h2>
                      <button
                        onClick={() => {
                          setEditingProgramId(null);
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
                      {programsLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                        </div>
                      ) : programs.length === 0 ? (
                        <div className="py-8 text-center">
                          <BookOpen className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                          <p className="text-gray-500">No programs yet</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {programs.map((program) => (
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
                                <ApprovalBadge
                                  status={program.approvalStatus}
                                />
                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${program.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                                >
                                  {program.isPublished ? "Published" : "Draft"}
                                </span>
                                <button
                                  onClick={() =>
                                    openCoursePanel({
                                      id: program.id,
                                      title: program.title,
                                      type: program.type,
                                      field: program.field,
                                    })
                                  }
                                  className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                                >
                                  <Users className="h-3 w-3" /> Modules
                                </button>
                                {program.approvalStatus === "APPROVED" && (
                                  <button
                                    onClick={() =>
                                      togglePublish.mutate({ id: program.id })
                                    }
                                    disabled={togglePublish.isPending}
                                    className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:opacity-50"
                                  >
                                    {togglePublish.isPending ? (
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
                                )}
                                <button
                                  onClick={() => handleEditProgram(program)}
                                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                                >
                                  <Pencil className="h-3 w-3" /> Edit
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm("Delete this program?"))
                                      deleteProgramMutation.mutate({
                                        id: program.id,
                                      });
                                  }}
                                  disabled={deleteProgramMutation.isPending}
                                  className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                                >
                                  {deleteProgramMutation.isPending ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3 w-3" />
                                  )}{" "}
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

                {/* Course Lecturer Panel */}
                {managerInfo.canManagePrograms && coursePanel && (
                  <div className="space-y-4">
                    <button
                      onClick={() => {
                        setCoursePanel(null);
                        setAssignPanel(null);
                      }}
                      className="flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
                    >
                      <ArrowLeft className="h-4 w-4" /> Back to Programs
                    </button>
                    <div className="flex items-center gap-4 rounded-xl border border-violet-100 bg-white p-5 shadow-sm">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100">
                        <BookOpen className="h-6 w-6 text-violet-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">
                          {coursePanel.title}
                        </h2>
                        <p className="text-sm text-gray-500">
                          {coursePanel.type.replace(/_/g, " ")} ·{" "}
                          {coursePanel.field.replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>
                    {coursesLoading ? (
                      <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                      </div>
                    ) : courses.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
                        <Layers className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                        <p className="font-medium text-gray-500">
                          No modules in this program yet
                        </p>
                        <p className="mt-1 text-sm text-gray-400">
                          Lecturers can create modules from their My Work tab.
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-5 lg:grid-cols-2">
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                          <div className="border-b border-gray-100 bg-gray-50 px-5 py-4">
                            <h3 className="font-bold text-gray-900">
                              Modules ({courses.length})
                            </h3>
                            <p className="mt-0.5 text-xs text-gray-500">
                              Click a module to manage its lecturers
                            </p>
                          </div>
                          <div className="divide-y divide-gray-50">
                            {courses.map((course) => (
                              <button
                                key={course.id}
                                onClick={() => {
                                  setAssignPanel(course);
                                  setAssignSearch("");
                                  setAssignError(null);
                                  setAssignRole("LECTURER");
                                }}
                                className={`flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-gray-50 ${assignPanel?.id === course.id ? "border-l-2 border-l-violet-500 bg-violet-50" : ""}`}
                              >
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {course.title}
                                  </p>
                                  {course.code && (
                                    <p className="font-mono text-xs text-gray-400">
                                      {course.code}
                                    </p>
                                  )}
                                </div>
                                <span className="ml-3 flex-shrink-0 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
                                  {course.courseLecturers.length} lecturer
                                  {course.courseLecturers.length !== 1
                                    ? "s"
                                    : ""}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                        {assignPanel ? (
                          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-100 bg-gray-50 px-5 py-4">
                              <h3 className="font-bold text-gray-900">
                                {assignPanel.title}
                              </h3>
                              <p className="mt-0.5 text-xs text-gray-500">
                                Assign lecturers from your institution
                              </p>
                            </div>
                            <div className="space-y-4 p-5">
                              {assignPanel.courseLecturers.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
                                    Currently Assigned
                                  </p>
                                  {assignPanel.courseLecturers.map((cl) => (
                                    <div
                                      key={cl.id}
                                      className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5"
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                                          {cl.lecturer?.profile?.fullName
                                            ?.charAt(0)
                                            .toUpperCase() ?? "?"}
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium text-gray-900">
                                            {cl.lecturer?.title
                                              ? `${cl.lecturer.title} `
                                              : ""}
                                            {cl.lecturer?.profile?.fullName ??
                                              "Unknown"}
                                          </p>
                                          <span
                                            className={`text-xs font-medium ${cl.role === "LECTURER" ? "text-blue-600" : cl.role === "CO_LECTURER" ? "text-purple-600" : "text-orange-600"}`}
                                          >
                                            {cl.role.replace("_", " ")}
                                          </span>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() =>
                                          handleRemoveCourseLecturer(
                                            cl.id,
                                            assignPanel.id,
                                          )
                                        }
                                        disabled={actionLoadingId === cl.id}
                                        className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                                      >
                                        {actionLoadingId === cl.id ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <UserX className="h-3 w-3" />
                                        )}{" "}
                                        Remove
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="space-y-1.5">
                                <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
                                  Role for new assignment
                                </p>
                                <div className="flex gap-2">
                                  {LECTURER_ROLES.map((r) => (
                                    <button
                                      key={r}
                                      type="button"
                                      onClick={() => setAssignRole(r)}
                                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${assignRole === r ? "border-violet-300 bg-violet-50 text-violet-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                                    >
                                      {r.replace("_", " ")}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                  type="text"
                                  placeholder="Search lecturers…"
                                  value={assignSearch}
                                  onChange={(e) =>
                                    setAssignSearch(e.target.value)
                                  }
                                  className="w-full rounded-lg border border-gray-200 py-2.5 pr-3 pl-9 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                                />
                              </div>
                              {assignError && (
                                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                                  {assignError}
                                </p>
                              )}
                              <div className="max-h-56 divide-y divide-gray-50 overflow-y-auto rounded-xl border border-gray-100">
                                {filteredLecturers.length === 0 ? (
                                  <p className="px-4 py-8 text-center text-sm text-gray-400">
                                    {assignSearch
                                      ? "No lecturers match your search"
                                      : "No approved lecturers in this institution"}
                                  </p>
                                ) : (
                                  filteredLecturers.map((lec) => {
                                    const alreadyAssigned =
                                      assignPanel.courseLecturers.some(
                                        (cl) => cl.lecturer?.id === lec.id,
                                      );
                                    return (
                                      <div
                                        key={lec.id}
                                        className="flex items-center justify-between px-4 py-3"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                                            {lec.profile?.fullName
                                              ?.charAt(0)
                                              .toUpperCase() ?? "?"}
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium text-gray-900">
                                              {lec.title ? `${lec.title} ` : ""}
                                              {lec.profile?.fullName ??
                                                "Unknown"}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                              {lec.profile?.email}
                                            </p>
                                          </div>
                                        </div>
                                        {alreadyAssigned ? (
                                          <span className="ml-2 flex-shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                            Assigned
                                          </span>
                                        ) : (
                                          <button
                                            onClick={() =>
                                              handleAssignLecturer(lec.id)
                                            }
                                            disabled={assignLoading}
                                            className="ml-2 flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
                                          >
                                            {assignLoading ? (
                                              <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                              <UserPlus className="h-3 w-3" />
                                            )}{" "}
                                            Assign
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-16">
                            <div className="text-center">
                              <Users className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                              <p className="text-sm font-medium text-gray-500">
                                Select a module to manage lecturers
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Announcements */}
                {managerInfo.canPostAnnouncements && !coursePanel && (
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

      {/* ══ ADD MODULE MODAL ══════════════════════════════════════════════════ */}
      {moduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                  <Layers className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Add New Module
                  </h2>
                  <p className="text-xs text-slate-500">
                    A course unit within an institution program
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModuleModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateModule} className="space-y-4 p-6">
              <Field label="Program" required>
                <select
                  value={moduleForm.programId}
                  onChange={(e) =>
                    setModuleForm((f) => ({ ...f, programId: e.target.value }))
                  }
                  className={inputCls}
                >
                  <option value="">Select a program…</option>
                  {institutionPrograms.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.type.replace(/_/g, " ")})
                    </option>
                  ))}
                </select>
                {institutionPrograms.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    No approved programs found for your institution.
                  </p>
                )}
              </Field>
              <Field label="Module Title" required>
                <input
                  type="text"
                  value={moduleForm.title}
                  placeholder="e.g. Introduction to Databases"
                  onChange={(e) =>
                    setModuleForm((f) => ({ ...f, title: e.target.value }))
                  }
                  className={inputCls}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Module Code">
                  <input
                    type="text"
                    value={moduleForm.code}
                    placeholder="e.g. CS301"
                    onChange={(e) =>
                      setModuleForm((f) => ({ ...f, code: e.target.value }))
                    }
                    className={inputCls}
                  />
                </Field>
                <Field label="Order Index">
                  <input
                    type="number"
                    value={moduleForm.orderIndex}
                    min="0"
                    placeholder="e.g. 1"
                    onChange={(e) =>
                      setModuleForm((f) => ({
                        ...f,
                        orderIndex: e.target.value,
                      }))
                    }
                    className={inputCls}
                  />
                </Field>
              </div>
              <Field label="Description">
                <textarea
                  value={moduleForm.description}
                  rows={3}
                  placeholder="Brief description of this module…"
                  onChange={(e) =>
                    setModuleForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                  className={`${inputCls} resize-none`}
                />
              </Field>
              <button
                type="button"
                onClick={() =>
                  setModuleForm((f) => ({ ...f, isMandatory: !f.isMandatory }))
                }
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${moduleForm.isMandatory ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600"}`}
              >
                <div
                  className={`h-4 w-4 rounded-full border-2 transition ${moduleForm.isMandatory ? "border-blue-600 bg-blue-600" : "border-slate-300"}`}
                />
                Mandatory Module
              </button>
              {moduleError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                  {moduleError}
                </p>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModuleModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={moduleLoading}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {moduleLoading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}{" "}
                  Create Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ CREATE / EDIT COURSE MODAL ════════════════════════════════════════ */}
      {courseModal !== "closed" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
                  <GraduationCap className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {courseModal === "edit"
                      ? "Edit Course"
                      : "Create Standalone Course"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Certificate course students can enroll in directly
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setCourseModal("closed");
                  setEditingCourseId(null);
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              onSubmit={
                courseModal === "edit" ? handleUpdateCourse : handleCreateCourse
              }
              className="space-y-4 p-6"
            >
              <Field label="Course Title" required>
                <input
                  type="text"
                  value={courseForm.title}
                  placeholder="e.g. Python for Data Science"
                  onChange={(e) =>
                    setCourseForm((f) => ({ ...f, title: e.target.value }))
                  }
                  className={inputCls}
                />
              </Field>
              <Field label="Course Code">
                <input
                  type="text"
                  value={courseForm.code}
                  placeholder="e.g. PY101"
                  onChange={(e) =>
                    setCourseForm((f) => ({ ...f, code: e.target.value }))
                  }
                  className={inputCls}
                />
              </Field>
              <Field label="Description">
                <textarea
                  value={courseForm.description}
                  rows={3}
                  placeholder="What will students learn?"
                  onChange={(e) =>
                    setCourseForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                  className={`${inputCls} resize-none`}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Local Price (LKR)">
                  <div className="relative">
                    <DollarSign className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={courseForm.localPrice}
                      onChange={(e) =>
                        setCourseForm((f) => ({
                          ...f,
                          localPrice: e.target.value,
                        }))
                      }
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                </Field>
                <Field label="Foreign Price (USD)">
                  <div className="relative">
                    <Globe className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={courseForm.foreignPrice}
                      onChange={(e) =>
                        setCourseForm((f) => ({
                          ...f,
                          foreignPrice: e.target.value,
                        }))
                      }
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                </Field>
              </div>
              <button
                type="button"
                onClick={() =>
                  setCourseForm((f) => ({ ...f, isPublished: !f.isPublished }))
                }
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${courseForm.isPublished ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600"}`}
              >
                <div
                  className={`h-4 w-4 rounded-full border-2 transition ${courseForm.isPublished ? "border-emerald-600 bg-emerald-600" : "border-slate-300"}`}
                />
                Publish Immediately
              </button>
              {courseError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                  {courseError}
                </p>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCourseModal("closed");
                    setEditingCourseId(null);
                  }}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={courseLoading}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {courseLoading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {courseModal === "edit"
                    ? "Save Changes"
                    : courseForm.isPublished
                      ? "Create & Publish"
                      : "Create as Draft"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ REQUEST CHANGES MODAL ════════════════════════════════════════════ */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="font-bold text-gray-900">Request Changes</h3>
              <button
                onClick={() => setReviewModal(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <p className="text-sm text-gray-600">
                Provide feedback for{" "}
                <span className="font-semibold">"{reviewModal.title}"</span>
              </p>
              <textarea
                rows={4}
                placeholder="Describe what needs to be changed..."
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setReviewModal(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    requestChanges.mutate({
                      id: reviewModal.id,
                      note: reviewNote,
                    })
                  }
                  disabled={reviewNote.length < 10 || requestChanges.isPending}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {requestChanges.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}{" "}
                  Send Feedback
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ ADD / EDIT PROGRAM MODAL ══════════════════════════════════════════ */}
      {programModal !== "closed" && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100">
                  <BookOpen className="h-5 w-5 text-violet-600" />
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  {programModal === "edit" ? "Edit Program" : "New Program"}
                </h2>
              </div>
              <button
                onClick={() => {
                  setProgramModal("closed");
                  setEditingProgramId(null);
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
                        className={`rounded-full px-3 py-1 text-xs font-medium transition ${selected ? "bg-violet-600 text-white" : "border border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50"}`}
                      >
                        {lang}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief overview…"
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
              {programError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                  {programError}
                </p>
              )}
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setProgramModal("closed");
                    setEditingProgramId(null);
                  }}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isMutating}
                  className="flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
                >
                  {isMutating && <Loader2 className="h-4 w-4 animate-spin" />}
                  {programModal === "edit" ? "Save Changes" : "Create Program"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

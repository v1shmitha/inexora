"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, BookOpen, CheckCircle2, ChevronDown, ChevronUp,
  Clock, ClipboardList, ExternalLink, FileText, GraduationCap,
  Layers, Link2, Loader2, Lock, Upload, Users, Video,
  X, AlertCircle, BarChart3, Award, AlignLeft,
} from "lucide-react";
import { api } from "~/trpc/react";
import { createClient } from "~/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────

type Tab = "overview" | "content" | "assessments" | "grades";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview",    label: "Overview",    icon: <BookOpen className="h-4 w-4" /> },
  { id: "content",     label: "Content",     icon: <FileText className="h-4 w-4" /> },
  { id: "assessments", label: "Assessments", icon: <ClipboardList className="h-4 w-4" /> },
  { id: "grades",      label: "Grades",      icon: <BarChart3 className="h-4 w-4" /> },
];

const RESOURCE_ICONS: Record<string, React.ReactNode> = {
  PDF:           <FileText className="h-4 w-4 text-red-500" />,
  VIDEO_UPLOAD:  <Video className="h-4 w-4 text-blue-500" />,
  VIDEO_LINK:    <Video className="h-4 w-4 text-purple-500" />,
  IMAGE:         <FileText className="h-4 w-4 text-green-500" />,
  PRESENTATION:  <FileText className="h-4 w-4 text-orange-500" />,
  EXTERNAL_LINK: <Link2 className="h-4 w-4 text-slate-500" />,
};

const ASSESSMENT_COLORS: Record<string, string> = {
  ASSIGNMENT:   "bg-blue-100 text-blue-700",
  QUIZ:         "bg-emerald-100 text-emerald-700",
  EXAM:         "bg-red-100 text-red-700",
  PROJECT:      "bg-violet-100 text-violet-700",
  PRESENTATION: "bg-orange-100 text-orange-700",
};

// ── Markdown renderer (reuse from ContentTab) ─────────────────────────────
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const flushList = (key: string) => {
    if (!listItems.length) return;
    if (listType === "ul") {
      elements.push(<ul key={key} className="my-2 list-disc pl-5 space-y-0.5">{listItems.map((li, i) => <li key={i} className="text-sm text-slate-700">{renderInline(li)}</li>)}</ul>);
    } else {
      elements.push(<ol key={key} className="my-2 list-decimal pl-5 space-y-0.5">{listItems.map((li, i) => <li key={i} className="text-sm text-slate-700">{renderInline(li)}</li>)}</ol>);
    }
    listItems = []; listType = null;
  };

  lines.forEach((line, i) => {
    if (line.startsWith("### ")) { flushList(`fl${i}`); elements.push(<h3 key={i} className="mt-3 mb-1 text-sm font-bold text-slate-900">{renderInline(line.slice(4))}</h3>); }
    else if (line.startsWith("## ")) { flushList(`fl${i}`); elements.push(<h2 key={i} className="mt-4 mb-1 text-base font-bold text-slate-900">{renderInline(line.slice(3))}</h2>); }
    else if (line.startsWith("# ")) { flushList(`fl${i}`); elements.push(<h1 key={i} className="mt-4 mb-1 text-lg font-bold text-slate-900">{renderInline(line.slice(2))}</h1>); }
    else if (/^[-*] /.test(line)) { if (listType !== "ul") { flushList(`fl${i}`); listType = "ul"; } listItems.push(line.slice(2)); }
    else if (/^\d+\. /.test(line)) { if (listType !== "ol") { flushList(`fl${i}`); listType = "ol"; } listItems.push(line.replace(/^\d+\. /, "")); }
    else if (line.trim() === "") { flushList(`fl${i}`); elements.push(<div key={i} className="h-2" />); }
    else { flushList(`fl${i}`); elements.push(<p key={i} className="text-sm leading-relaxed text-slate-700">{renderInline(line)}</p>); }
  });
  flushList("final");
  return <>{elements}</>;
}

function renderInline(text: string): React.ReactNode {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={i}>{part.slice(1, -1)}</em>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={i} className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs text-slate-700">{part.slice(1, -1)}</code>;
    return part;
  });
}

function formatDuration(mins: number | null | undefined): string | null {
  if (!mins) return null;
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div className={`h-2 rounded-full transition-all ${percent === 100 ? "bg-emerald-500" : "bg-blue-500"}`}
        style={{ width: `${percent}%` }} />
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────

export default function StudentCourseDetailPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const router = useRouter();
  const utils = api.useUtils();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [expandedInstructions, setExpandedInstructions] = useState<Set<string>>(new Set());
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [submissionText, setSubmissionText] = useState<Record<string, string>>({});
  const [submissionFile, setSubmissionFile] = useState<Record<string, string>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);

  // ── tRPC ─────────────────────────────────────────────────────────────

  const { data: course, isLoading: courseLoading } =
    api.studentCourse.getCourseDetail.useQuery(
      { courseId: courseId ?? "" },
      { enabled: !!courseId, staleTime: 0 },
    );

  const { data: assessments = [], isLoading: assessmentsLoading } =
    api.studentCourse.getCourseAssessments.useQuery(
      { courseId: courseId ?? "" },
      { enabled: !!courseId && activeTab === "assessments", staleTime: 0 },
    );

  const { data: grades = [], isLoading: gradesLoading } =
    api.studentCourse.getCourseGrades.useQuery(
      { courseId: courseId ?? "" },
      { enabled: !!courseId && activeTab === "grades", staleTime: 0 },
    );

  const toggleComplete = api.studentCourse.toggleResourceComplete.useMutation({
    onSuccess: () => void utils.studentCourse.getCourseDetail.invalidate({ courseId }),
  });

  const submitAssessment = api.studentCourse.submitAssessment.useMutation({
    onSuccess: (_, vars) => {
      void utils.studentCourse.getCourseAssessments.invalidate({ courseId });
      setSubmittingId(null);
      setSubmissionText((p) => { const n = { ...p }; delete n[vars.assessmentId]; return n; });
      setSubmissionFile((p) => { const n = { ...p }; delete n[vars.assessmentId]; return n; });
      setSubmitError(null);
    },
    onError: (e) => setSubmitError(e.message),
  });

  // ── File upload for submission ────────────────────────────────────────

  const handleSubmissionFile = async (e: React.ChangeEvent<HTMLInputElement>, assessmentId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingId(assessmentId);
    try {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `submissions/${courseId}/${assessmentId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("course-resources")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw new Error(error.message);
      const { data } = supabase.storage.from("course-resources").getPublicUrl(path);
      setSubmissionFile((p) => ({ ...p, [assessmentId]: data.publicUrl }));
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Handlers ─────────────────────────────────────────────────────────

  const toggleSection = (id: string) =>
    setCollapsedSections((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleInstructions = (id: string) =>
    setExpandedInstructions((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleSubmit = (assessmentId: string) => {
    const text = submissionText[assessmentId];
    const file = submissionFile[assessmentId];
    if (!text && !file) { setSubmitError("Please write an answer or upload a file."); return; }
    setSubmitError(null);
    submitAssessment.mutate({ assessmentId, submissionText: text ?? null, fileUrl: file ?? null });
  };

  // ── Loading / not found ───────────────────────────────────────────────

  if (courseLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="font-medium text-slate-600">Course not found or you are not enrolled.</p>
          <button onClick={() => router.push("/dashboard/student")} className="mt-3 text-sm text-blue-600 hover:underline">
            Back to My Learning
          </button>
        </div>
      </div>
    );
  }

  const isModule = !course.isStandalone;
  const lecturer = course.courseLecturers[0]?.lecturer;
  const tabBadges: Partial<Record<Tab, number>> = {
    content:     course.totalResources,
    assessments: course._count.assessments,
    grades:      grades.filter((g) => g.status === "GRADED").length,
  };

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Course header ── */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <button
              onClick={() => router.push("/dashboard/student")}
              className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" /> Back to My Learning
            </button>

            <div className="flex items-start gap-4">
              <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl ${isModule ? "bg-blue-100" : "bg-emerald-100"}`}>
                {isModule
                  ? <Layers className="h-7 w-7 text-blue-600" />
                  : <GraduationCap className="h-7 w-7 text-emerald-600" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${isModule ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"}`}>
                    {isModule ? "Module" : "Standalone Course"}
                  </span>
                  {course.program && (
                    <span className="text-xs text-slate-400">{course.program.title}</span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
                {course.code && (
                  <span className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-500">{course.code}</span>
                )}
                {lecturer && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                    <Users className="h-3.5 w-3.5" />
                    {lecturer.title ? `${lecturer.title} ` : ""}{lecturer.profile?.fullName}
                  </p>
                )}
              </div>

              {/* Progress circle */}
              <div className="hidden flex-shrink-0 flex-col items-center gap-1 sm:flex">
                <div className="relative flex h-16 w-16 items-center justify-center">
                  <svg className="absolute h-16 w-16 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="24" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                    <circle cx="28" cy="28" r="24" fill="none"
                      stroke={course.progressPercent === 100 ? "#10b981" : "#3b82f6"}
                      strokeWidth="4"
                      strokeDasharray={`${(course.progressPercent / 100) * 150.8} 150.8`}
                    />
                  </svg>
                  <span className="text-sm font-bold text-slate-900">{course.progressPercent}%</span>
                </div>
                <span className="text-xs text-slate-400">Progress</span>
              </div>
            </div>

            {/* Progress bar (mobile) */}
            <div className="mt-4 sm:hidden">
              <div className="mb-1 flex justify-between text-xs text-slate-500">
                <span>{course.completedResources} of {course.totalResources} resources</span>
                <span className="font-bold text-blue-600">{course.progressPercent}%</span>
              </div>
              <ProgressBar percent={course.progressPercent} />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`relative flex flex-shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
                  activeTab === t.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}
              >
                {t.icon}{t.label}
                {tabBadges[t.id] != null && tabBadges[t.id]! > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${activeTab === t.id ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                    {tabBadges[t.id]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ════ OVERVIEW ════ */}
        {activeTab === "overview" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-5">
              {/* Description */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-3 font-bold text-slate-900">About This Course</h2>
                {course.description ? (
                  <p className="text-sm leading-relaxed text-slate-600">{course.description}</p>
                ) : (
                  <p className="text-sm italic text-slate-400">No description provided.</p>
                )}
              </div>

              {/* Lecturers */}
              {course.courseLecturers.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 font-bold text-slate-900">Your Instructors</h2>
                  <div className="space-y-4">
                    {course.courseLecturers.map((cl) => (
                      <div key={cl.id} className="flex items-start gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                          {cl.lecturer?.profile?.fullName?.charAt(0).toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {cl.lecturer?.title ? `${cl.lecturer.title} ` : ""}
                            {cl.lecturer?.profile?.fullName}
                          </p>
                          <p className="text-xs text-slate-400">{cl.role.replace("_", " ")}</p>
                          {cl.lecturer?.bio && (
                            <p className="mt-1 text-xs text-slate-500">{cl.lecturer.bio}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar stats */}
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 font-bold text-slate-900">Your Progress</h3>
                <div className="space-y-3">
                  <div>
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="text-slate-500">Overall</span>
                      <span className="font-bold text-blue-600">{course.progressPercent}%</span>
                    </div>
                    <ProgressBar percent={course.progressPercent} />
                  </div>
                  {[
                    { label: "Resources completed", value: `${course.completedResources} / ${course.totalResources}` },
                    { label: "Sections",            value: course.sections.length },
                    { label: "Assessments",         value: course._count.assessments },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">{label}</span>
                      <span className="font-semibold text-slate-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 font-bold text-slate-900">Enrollment</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      course.enrollment.status === "ACTIVE" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                    }`}>{course.enrollment.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Enrolled on</span>
                    <span className="font-medium text-slate-700">{new Date(course.enrollment.createdAt).toLocaleDateString()}</span>
                  </div>
                  {course.enrollment.grade && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Grade</span>
                      <span className="font-bold text-violet-700">{course.enrollment.grade}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════ CONTENT ════ */}
        {activeTab === "content" && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900">Course Content</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  {course.sections.length} sections · {course.totalResources} resources · {course.completedResources} completed
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
                {course.progressPercent}% complete
              </div>
            </div>

            {course.sections.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
                <FileText className="mx-auto mb-4 h-12 w-12 text-slate-200" />
                <p className="font-medium text-slate-600">No content available yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {course.sections.map((section, sIdx) => {
                  const isCollapsed = collapsedSections.has(section.id);
                  const showInstructions = expandedInstructions.has(section.id);
                  const secPercent = section.totalResources > 0
                    ? Math.round((section.completedResources / section.totalResources) * 100)
                    : 0;

                  return (
                    <div key={section.id} className={`overflow-hidden rounded-xl border bg-white shadow-sm transition ${
                      !section.isUnlocked ? "border-slate-100 opacity-70" : "border-slate-200"
                    }`}>
                      {/* Section header */}
                      <button
                        onClick={() => section.isUnlocked && toggleSection(section.id)}
                        disabled={!section.isUnlocked}
                        className="flex w-full items-center gap-3 px-5 py-4 text-left"
                      >
                        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                          section.isComplete
                            ? "bg-emerald-100 text-emerald-700"
                            : section.isUnlocked
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-400"
                        }`}>
                          {section.isComplete ? <CheckCircle2 className="h-4 w-4" /> : sIdx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900">{section.title}</p>
                            {!section.isUnlocked && <Lock className="h-3.5 w-3.5 text-slate-400" />}
                          </div>
                          {section.description && (
                            <p className="text-xs text-slate-400 truncate">{section.description}</p>
                          )}
                          <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                            <span>{section.totalResources} resources</span>
                            <span className={`font-medium ${section.isComplete ? "text-emerald-600" : "text-blue-600"}`}>
                              {secPercent}% done
                            </span>
                          </div>
                        </div>
                        {section.isUnlocked && (
                          isCollapsed
                            ? <ChevronDown className="h-4 w-4 flex-shrink-0 text-slate-400" />
                            : <ChevronUp className="h-4 w-4 flex-shrink-0 text-slate-400" />
                        )}
                      </button>

                      {/* Locked message */}
                      {!section.isUnlocked && (
                        <div className="border-t border-slate-100 bg-slate-50 px-5 py-3">
                          <p className="flex items-center gap-2 text-xs text-slate-400">
                            <Lock className="h-3.5 w-3.5" />
                            Complete the previous section to unlock this one.
                          </p>
                        </div>
                      )}

                      {/* Section body */}
                      {section.isUnlocked && !isCollapsed && (
                        <div className="px-5 pb-4 pt-1">
                          {/* Instructions */}
                          {(section as any).instructions && (
                            <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50/60">
                              <button onClick={() => toggleInstructions(section.id)}
                                className="flex w-full items-center justify-between px-4 py-3 text-left"
                              >
                                <span className="flex items-center gap-2 text-xs font-semibold text-amber-700">
                                  <AlignLeft className="h-3.5 w-3.5" /> Section Instructions
                                </span>
                                {showInstructions ? <ChevronUp className="h-3.5 w-3.5 text-amber-500" /> : <ChevronDown className="h-3.5 w-3.5 text-amber-500" />}
                              </button>
                              {showInstructions && (
                                <div className="border-t border-amber-100 px-4 pb-4 pt-3">
                                  {renderMarkdown((section as any).instructions)}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Resources */}
                          <div className="space-y-2">
                            {section.resources.length === 0 && (
                              <p className="py-4 text-center text-sm text-slate-400">No resources in this section yet.</p>
                            )}
                            {section.resources.map((r) => (
                              <div key={r.id} className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition ${
                                r.isCompleted
                                  ? "border-emerald-100 bg-emerald-50/40"
                                  : "border-slate-100 bg-slate-50 hover:border-slate-200 hover:bg-white"
                              }`}>
                                <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                                  {RESOURCE_ICONS[r.type]}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-slate-900">{r.title}</p>
                                  {(r as any).description && (
                                    <p className="mt-0.5 text-xs text-slate-500">{(r as any).description}</p>
                                  )}
                                  <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-slate-400">
                                    <span>{r.type.replace("_", " ")}</span>
                                    {(r as any).durationMins && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />{formatDuration((r as any).durationMins)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-shrink-0 items-center gap-2">
                                  {(r.fileUrl ?? r.externalUrl) && (
                                    <a href={r.fileUrl ?? r.externalUrl ?? "#"} target="_blank" rel="noopener noreferrer"
                                      className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" /> Open
                                    </a>
                                  )}
                                  <button
                                    onClick={() => toggleComplete.mutate({ resourceId: r.id, courseId: courseId! })}
                                    disabled={toggleComplete.isPending}
                                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                                      r.isCompleted
                                        ? "border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-50"
                                        : "border-slate-200 bg-white text-slate-500 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                                    }`}
                                  >
                                    {toggleComplete.isPending
                                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      : <CheckCircle2 className="h-3.5 w-3.5" />
                                    }
                                    {r.isCompleted ? "Done" : "Mark Done"}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════ ASSESSMENTS ════ */}
        {activeTab === "assessments" && (
          <div>
            <div className="mb-6">
              <h2 className="font-bold text-slate-900">Assessments</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                {assessments.length} assessment{assessments.length !== 1 ? "s" : ""}
              </p>
            </div>

            {assessmentsLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
            ) : assessments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
                <ClipboardList className="mx-auto mb-4 h-12 w-12 text-slate-200" />
                <p className="font-medium text-slate-600">No assessments yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assessments.map((a) => {
                  const sub = a.mySubmission;
                  const isOverdue = a.dueDate && new Date(a.dueDate) < new Date();
                  const canSubmit = !sub || sub.status === "RESUBMIT_REQUIRED";
                  const isSubmitting = submittingId === a.id;

                  return (
                    <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                      {/* Header */}
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-slate-900">{a.title}</h3>
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ASSESSMENT_COLORS[a.type] ?? "bg-slate-100 text-slate-600"}`}>
                              {a.type}
                            </span>
                            {isOverdue && !sub && (
                              <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                                <AlertCircle className="h-3 w-3" /> Overdue
                              </span>
                            )}
                            {sub && (
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                sub.status === "GRADED" ? "bg-emerald-100 text-emerald-700"
                                : sub.status === "RESUBMIT_REQUIRED" ? "bg-amber-100 text-amber-700"
                                : "bg-blue-100 text-blue-700"
                              }`}>
                                {sub.status === "GRADED" ? "Graded"
                                  : sub.status === "RESUBMIT_REQUIRED" ? "Resubmit Required"
                                  : "Submitted"}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-4 text-xs text-slate-400">
                            {a.totalMarks && <span>{a.totalMarks} marks</span>}
                            {a.weightPercent && <span>{Number(a.weightPercent)}% of grade</span>}
                            {a.dueDate && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Due {new Date(a.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Grade badge */}
                        {sub?.status === "GRADED" && sub.marksObtained != null && (
                          <div className="rounded-xl border border-violet-100 bg-violet-50 px-4 py-2 text-center">
                            <p className="text-xs text-violet-400">Score</p>
                            <p className="text-xl font-bold text-violet-700">
                              {Number(sub.marksObtained)}{a.totalMarks ? `/${a.totalMarks}` : ""}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Instructions */}
                      {a.instructions && (
                        <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Instructions</p>
                          <p className="text-sm text-slate-600 leading-relaxed">{a.instructions}</p>
                        </div>
                      )}

                      {/* Existing submission */}
                      {sub && (
                        <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-4 space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Your Submission</p>
                          {sub.submissionText && (
                            <p className="text-sm text-slate-700 leading-relaxed">{sub.submissionText}</p>
                          )}
                          {sub.fileUrl && (
                            <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700"
                            >
                              <FileText className="h-3.5 w-3.5" /> View submitted file
                            </a>
                          )}
                          <p className="text-xs text-slate-400">
                            Submitted {new Date(sub.submittedAt).toLocaleDateString()}
                          </p>
                          {sub.feedback && (
                            <div className="mt-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
                              <p className="text-xs font-semibold text-emerald-700 mb-0.5">Lecturer Feedback</p>
                              <p className="text-sm text-emerald-800">{sub.feedback}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Submission form */}
                      {canSubmit && (
                        <div className="mt-4 space-y-3">
                          {sub?.status === "RESUBMIT_REQUIRED" && (
                            <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                              <AlertCircle className="h-3.5 w-3.5" /> Your lecturer has requested a resubmission.
                            </p>
                          )}

                          {isSubmitting ? (
                            <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                                {sub ? "Resubmit" : "Your Submission"}
                              </p>
                              <textarea
                                rows={4}
                                placeholder="Write your answer here…"
                                value={submissionText[a.id] ?? ""}
                                onChange={(e) => setSubmissionText((p) => ({ ...p, [a.id]: e.target.value }))}
                                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                              />
                              <div>
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept=".pdf,.doc,.docx,.zip,.txt,.ppt,.pptx"
                                  className="hidden"
                                  onChange={(e) => handleSubmissionFile(e, a.id)}
                                />
                                {submissionFile[a.id] ? (
                                  <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                                    <FileText className="h-4 w-4 text-green-600" />
                                    <span className="flex-1 text-xs font-medium text-green-800">File ready to submit</span>
                                    <button onClick={() => setSubmissionFile((p) => { const n = { ...p }; delete n[a.id]; return n; })}
                                      className="text-green-600 hover:text-green-800"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => { setActiveUploadId(a.id); fileInputRef.current?.click(); }}
                                    disabled={uploadingId === a.id}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 py-3 text-xs font-medium text-slate-500 transition hover:border-blue-300 hover:text-blue-600 disabled:opacity-50"
                                  >
                                    {uploadingId === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                    {uploadingId === a.id ? "Uploading…" : "Attach a file (PDF, DOC, ZIP)"}
                                  </button>
                                )}
                              </div>
                              {submitError && (
                                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{submitError}</p>
                              )}
                              <div className="flex justify-end gap-2">
                                <button onClick={() => setSubmittingId(null)}
                                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSubmit(a.id)}
                                  disabled={submitAssessment.isPending}
                                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                                >
                                  {submitAssessment.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                  Submit
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSubmittingId(a.id)}
                              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                              <Upload className="h-4 w-4" />
                              {sub ? "Resubmit" : "Submit Assignment"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════ GRADES ════ */}
        {activeTab === "grades" && (
          <div>
            <div className="mb-6">
              <h2 className="font-bold text-slate-900">My Grades</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                {grades.filter((g) => g.status === "GRADED").length} graded submissions
              </p>
            </div>

            {gradesLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-violet-500" /></div>
            ) : grades.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
                <Award className="mx-auto mb-4 h-12 w-12 text-slate-200" />
                <p className="font-medium text-slate-600">No grades yet</p>
                <p className="mt-1 text-sm text-slate-400">Submit assessments to see your grades here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {grades.map((g) => {
                  const percent = g.marksObtained != null && g.assessment.totalMarks
                    ? Math.round((Number(g.marksObtained) / g.assessment.totalMarks) * 100)
                    : null;
                  const passed = g.assessment.passMarks != null
                    ? Number(g.marksObtained) >= g.assessment.passMarks
                    : null;

                  return (
                    <div key={g.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-slate-900">{g.assessment.title}</h3>
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ASSESSMENT_COLORS[g.assessment.type] ?? "bg-slate-100 text-slate-600"}`}>
                              {g.assessment.type}
                            </span>
                            {g.status === "GRADED" && passed !== null && (
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                {passed ? "Passed" : "Failed"}
                              </span>
                            )}
                            {g.status !== "GRADED" && (
                              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                                Pending
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-4 text-xs text-slate-400">
                            <span>Submitted {new Date(g.submittedAt).toLocaleDateString()}</span>
                            {g.gradedAt && <span>Graded {new Date(g.gradedAt).toLocaleDateString()}</span>}
                            {g.assessment.weightPercent && <span>{Number(g.assessment.weightPercent)}% weight</span>}
                          </div>
                        </div>

                        {g.status === "GRADED" && g.marksObtained != null && (
                          <div className="flex-shrink-0 text-center">
                            <p className="text-2xl font-bold text-violet-700">
                              {Number(g.marksObtained)}{g.assessment.totalMarks ? `/${g.assessment.totalMarks}` : ""}
                            </p>
                            {percent !== null && (
                              <p className="text-xs text-slate-400">{percent}%</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Score bar */}
                      {percent !== null && g.status === "GRADED" && (
                        <div className="mt-4">
                          <div className="h-2 w-full rounded-full bg-slate-100">
                            <div
                              className={`h-2 rounded-full ${passed ? "bg-emerald-500" : "bg-red-400"}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Feedback */}
                      {g.feedback && (
                        <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
                          <p className="mb-1 text-xs font-semibold text-emerald-700">Feedback</p>
                          <p className="text-sm text-emerald-800">{g.feedback}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
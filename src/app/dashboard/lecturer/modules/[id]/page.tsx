"use client";

import { useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Layers, Loader2, ArrowLeft, FileText, Video, Link2,
  ExternalLink, Upload, Users, ClipboardList, BookOpen,
  Pencil, X, Plus, Trash2, Eye, EyeOff, AlertCircle,
  GripVertical, CheckCircle, Clock, Mail,
} from "lucide-react";
import { api } from "~/trpc/react";
import { uploadCourseResource, detectResourceType, formatFileSize } from "~/lib/courseStorage";

// ── Types ──────────────────────────────────────────────────────────────────

type Tab = "overview" | "resources" | "assessments" | "students";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview",    label: "Overview",    icon: <BookOpen className="h-4 w-4" /> },
  { id: "resources",   label: "Resources",   icon: <FileText className="h-4 w-4" /> },
  { id: "assessments", label: "Assessments", icon: <ClipboardList className="h-4 w-4" /> },
  { id: "students",    label: "Students",    icon: <Users className="h-4 w-4" /> },
];

const RESOURCE_ICONS: Record<string, React.ReactNode> = {
  PDF:           <FileText className="h-4 w-4 text-red-500" />,
  VIDEO_UPLOAD:  <Video className="h-4 w-4 text-blue-500" />,
  VIDEO_LINK:    <Video className="h-4 w-4 text-purple-500" />,
  IMAGE:         <FileText className="h-4 w-4 text-green-500" />,
  PRESENTATION:  <FileText className="h-4 w-4 text-orange-500" />,
  EXTERNAL_LINK: <Link2 className="h-4 w-4 text-slate-500" />,
};

const RESOURCE_LABELS: Record<string, string> = {
  PDF: "PDF", VIDEO_UPLOAD: "Video", VIDEO_LINK: "Video Link",
  IMAGE: "Image", PRESENTATION: "Presentation", EXTERNAL_LINK: "Link",
};

const inputCls = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const ASSESSMENT_TYPES = ["ASSIGNMENT", "QUIZ", "EXAM", "PROJECT", "PRESENTATION"] as const;

// ── Component ──────────────────────────────────────────────────────────────

export default function ModuleDetailPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const utils = api.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialTab = (searchParams.get("tab") as Tab) ?? "overview";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [linkModal, setLinkModal] = useState(false);
  const [linkType, setLinkType] = useState<"VIDEO_LINK" | "EXTERNAL_LINK">("EXTERNAL_LINK");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkDesc, setLinkDesc] = useState("");

  const [editingOverview, setEditingOverview] = useState(false);
  const [overviewForm, setOverviewForm] = useState({ title: "", description: "", code: "" });

  const [assessmentModal, setAssessmentModal] = useState<"closed" | "create" | "edit">("closed");
  const [editingAssessmentId, setEditingAssessmentId] = useState<string | null>(null);
  const [assessmentForm, setAssessmentForm] = useState({ title: "", type: "", totalMarks: "", passMarks: "", weightPercent: "", dueDate: "", instructions: "" });
  const [assessmentError, setAssessmentError] = useState<string | null>(null);

  const [gradeModal, setGradeModal] = useState<{ submissionId: string; studentName: string; totalMarks: number | null } | null>(null);
  const [gradeMarks, setGradeMarks] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [gradeStatus, setGradeStatus] = useState<"GRADED" | "RESUBMIT_REQUIRED">("GRADED");

  // ── tRPC ──────────────────────────────────────────────────────────────────

  const { data: modules = [], isLoading: moduleLoading } = api.course.getMyModules.useQuery();
  const moduleData = modules.find((m) => m.course.id === courseId);
  const course = moduleData?.course;

  const { data: resources = [], isLoading: resourcesLoading } =
    api.courseResource.getByCourse.useQuery({ courseId: courseId ?? "" }, { enabled: !!courseId });

  const { data: assessments = [], isLoading: assessmentsLoading } =
    api.assessment.getByCourse.useQuery({ courseId: courseId ?? "" }, { enabled: !!courseId });

  const { data: students = [], isLoading: studentsLoading } =
    api.student.getStudentsByCourse.useQuery({ courseId: courseId ?? "" }, { enabled: !!courseId });

  const updateModule = api.course.update.useMutation({
    onSuccess: () => { void utils.course.getMyModules.invalidate(); setEditingOverview(false); },
  });

  const createResource = api.courseResource.create.useMutation({
    onSuccess: () => { void utils.courseResource.getByCourse.invalidate(); setLinkModal(false); setLinkUrl(""); setLinkTitle(""); setLinkDesc(""); },
  });
  const deleteResource = api.courseResource.delete.useMutation({
    onSuccess: () => void utils.courseResource.getByCourse.invalidate(),
  });
  const toggleResource = api.courseResource.togglePublish.useMutation({
    onSuccess: () => void utils.courseResource.getByCourse.invalidate(),
  });

  const createAssessment = api.assessment.create.useMutation({
    onSuccess: () => { void utils.assessment.getByCourse.invalidate(); setAssessmentModal("closed"); setAssessmentForm({ title: "", type: "", totalMarks: "", passMarks: "", weightPercent: "", dueDate: "", instructions: "" }); },
    onError: (e) => setAssessmentError(e.message),
  });
  const updateAssessment = api.assessment.update.useMutation({
    onSuccess: () => { void utils.assessment.getByCourse.invalidate(); setAssessmentModal("closed"); setEditingAssessmentId(null); },
    onError: (e) => setAssessmentError(e.message),
  });
  const deleteAssessment = api.assessment.delete.useMutation({
    onSuccess: () => void utils.assessment.getByCourse.invalidate(),
  });

  const gradeSubmission = api.assessment.gradeSubmission.useMutation({
    onSuccess: () => { void utils.assessment.getByCourse.invalidate(); setGradeModal(null); setGradeMarks(""); setGradeFeedback(""); },
  });

  const updateGrade = api.student.updateGrade.useMutation({
    onSuccess: () => void utils.student.getStudentsByCourse.invalidate(),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !courseId) return;
    setUploading(true);
    setUploadError(null);
    try {
      const result = await uploadCourseResource(file, courseId);
      if (result.error) throw new Error(result.error);
      await createResource.mutateAsync({ courseId, title: file.name.replace(/\.[^.]+$/, ""), type: detectResourceType(file), fileUrl: result.url, sizeBytes: result.sizeBytes, mimeType: result.mimeType });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddLink = () => {
    if (!linkUrl.trim() || !linkTitle.trim() || !courseId) return;
    createResource.mutate({ courseId, title: linkTitle.trim(), type: linkType, externalUrl: linkUrl.trim(), description: linkDesc || null });
  };

  const handleAssessmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAssessmentError(null);
    if (!assessmentForm.title.trim() || !assessmentForm.type) { setAssessmentError("Title and type are required."); return; }
    const payload = {
      title: assessmentForm.title.trim(),
      type: assessmentForm.type as typeof ASSESSMENT_TYPES[number],
      totalMarks: assessmentForm.totalMarks ? parseInt(assessmentForm.totalMarks) : null,
      passMarks: assessmentForm.passMarks ? parseInt(assessmentForm.passMarks) : null,
      weightPercent: assessmentForm.weightPercent ? parseFloat(assessmentForm.weightPercent) : null,
      dueDate: assessmentForm.dueDate ? new Date(assessmentForm.dueDate).toISOString() : null,
      instructions: assessmentForm.instructions || null,
    };
    if (editingAssessmentId) { updateAssessment.mutate({ id: editingAssessmentId, ...payload }); }
    else { createAssessment.mutate({ courseId: courseId!, ...payload }); }
  };

  if (moduleLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  }

  if (!course) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="font-medium text-slate-600">Module not found</p>
          <button onClick={() => router.push("/dashboard/lecturer/modules")} className="mt-3 text-sm text-blue-600 hover:underline">Back to Modules</button>
        </div>
      </div>
    );
  }

  const tabBadges: Record<Tab, number> = {
    overview: 0,
    resources: resources.length,
    assessments: assessments.length,
    students: students.filter((s) => s.status === "ACTIVE").length,
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Module header ── */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <button onClick={() => router.push("/dashboard/lecturer/modules")}
              className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Modules
            </button>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100">
                <Layers className="h-7 w-7 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {course.code && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-500">{course.code}</span>
                  )}
                  {course.program && (
                    <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                      <BookOpen className="h-3 w-3" />{course.program.title}
                    </span>
                  )}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    course.isMandatory ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                  }`}>
                    {course.isMandatory ? "Mandatory" : "Optional"} · Order #{course.orderIndex}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    moduleData?.role === "LECTURER" ? "bg-blue-100 text-blue-700"
                    : moduleData?.role === "CO_LECTURER" ? "bg-purple-100 text-purple-700"
                    : "bg-orange-100 text-orange-700"
                  }`}>
                    {moduleData?.role?.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}
              >
                {tab.icon}{tab.label}
                {tabBadges[tab.id] > 0 && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${activeTab === tab.id ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                    {tabBadges[tab.id]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ════ OVERVIEW ════ */}
        {activeTab === "overview" && (
          <div className="max-w-2xl">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              {editingOverview ? (
                <div className="space-y-4">
                  <Field label="Title" required>
                    <input type="text" value={overviewForm.title} className={inputCls} onChange={(e) => setOverviewForm((f) => ({ ...f, title: e.target.value }))} />
                  </Field>
                  <Field label="Module Code">
                    <input type="text" value={overviewForm.code} placeholder="e.g. CS301" className={inputCls} onChange={(e) => setOverviewForm((f) => ({ ...f, code: e.target.value }))} />
                  </Field>
                  <Field label="Description">
                    <textarea rows={5} value={overviewForm.description} className={`${inputCls} resize-none`} onChange={(e) => setOverviewForm((f) => ({ ...f, description: e.target.value }))} />
                  </Field>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setEditingOverview(false)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                    <button onClick={() => updateModule.mutate({ id: courseId!, title: overviewForm.title || undefined, code: overviewForm.code || null, description: overviewForm.description || null })}
                      disabled={updateModule.isPending}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      {updateModule.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <h2 className="text-lg font-bold text-slate-900">{course.title}</h2>
                    <button
                      onClick={() => { setOverviewForm({ title: course.title, description: course.description ?? "", code: course.code ?? "" }); setEditingOverview(true); }}
                      className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                  </div>
                  {course.description ? (
                    <p className="text-sm leading-relaxed text-slate-600">{course.description}</p>
                  ) : (
                    <p className="text-sm italic text-slate-400">No description yet. Click Edit to add one.</p>
                  )}
                  <div className="mt-6 grid grid-cols-3 gap-3 border-t border-slate-50 pt-5">
                    {[
                      { label: "Resources",   value: resources.length },
                      { label: "Assessments", value: assessments.length },
                      { label: "Students",    value: students.length },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-center">
                        <p className="text-xs text-slate-400">{label}</p>
                        <p className="mt-0.5 text-xl font-bold text-slate-900">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════ RESOURCES ════ */}
        {activeTab === "resources" && (
          <div>
            {uploadError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />{uploadError}
                <button onClick={() => setUploadError(null)} className="ml-auto"><X className="h-4 w-4" /></button>
              </div>
            )}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-900">Module Resources</h2>
                <p className="text-sm text-slate-500">{resources.length} resource{resources.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="flex gap-2">
                <input ref={fileInputRef} type="file" accept=".pdf,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.avi,.mkv" className="hidden" onChange={handleFileUpload} />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploading ? "Uploading…" : "Upload File"}
                </button>
                <button onClick={() => setLinkModal(true)}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Link2 className="h-4 w-4" /> Add Link
                </button>
              </div>
            </div>

            {resourcesLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
            ) : resources.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
                <FileText className="mx-auto mb-4 h-12 w-12 text-slate-200" />
                <p className="font-medium text-slate-600">No resources yet</p>
                <p className="mt-1 text-sm text-slate-400">Upload lecture notes, recordings, or add external links.</p>
                <div className="mt-6 flex justify-center gap-3">
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"><Upload className="h-4 w-4" /> Upload File</button>
                  <button onClick={() => setLinkModal(true)} className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Link2 className="h-4 w-4" /> Add Link</button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {resources.map((r, index) => (
                  <div key={r.id} className={`flex items-center gap-4 rounded-xl border bg-white px-5 py-4 shadow-sm ${!r.isPublished ? "opacity-60 border-slate-100" : "border-slate-200"}`}>
                    <span className="w-5 text-center text-xs font-semibold text-slate-400">{index + 1}</span>
                    <GripVertical className="h-4 w-4 flex-shrink-0 cursor-grab text-slate-300" />
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-50 shadow-sm">{RESOURCE_ICONS[r.type]}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">{r.title}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>{RESOURCE_LABELS[r.type]}</span>
                        {r.sizeBytes && <span>{formatFileSize(r.sizeBytes)}</span>}
                        {!r.isPublished && <span className="text-amber-500">Hidden</span>}
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-1">
                      {(r.fileUrl ?? r.externalUrl) && (
                        <a href={r.fileUrl ?? r.externalUrl ?? "#"} target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-blue-600" title="Open"><ExternalLink className="h-4 w-4" /></a>
                      )}
                      <button onClick={() => toggleResource.mutate({ id: r.id })} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">{r.isPublished ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
                      <button onClick={() => { if (confirm("Delete this resource?")) deleteResource.mutate({ id: r.id }); }} disabled={deleteResource.isPending} className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════ ASSESSMENTS ════ */}
        {activeTab === "assessments" && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900">Assessments</h2>
                <p className="text-sm text-slate-500">{assessments.length} assessment{assessments.length !== 1 ? "s" : ""}</p>
              </div>
              <button onClick={() => { setAssessmentForm({ title: "", type: "", totalMarks: "", passMarks: "", weightPercent: "", dueDate: "", instructions: "" }); setAssessmentError(null); setEditingAssessmentId(null); setAssessmentModal("create"); }}
                className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                <Plus className="h-4 w-4" /> New Assessment
              </button>
            </div>

            {assessmentsLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-violet-500" /></div>
            ) : assessments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
                <ClipboardList className="mx-auto mb-4 h-12 w-12 text-slate-200" />
                <p className="font-medium text-slate-600">No assessments yet</p>
                <p className="mt-1 text-sm text-slate-400">Create assignments, quizzes, and exams for this module.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assessments.map((a) => {
                  const pending = a.submissions.filter((s) => s.status === "SUBMITTED").length;
                  const graded = a.submissions.filter((s) => s.status === "GRADED").length;
                  const isOverdue = a.dueDate && new Date(a.dueDate) < new Date();
                  return (
                    <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-slate-900">{a.title}</h3>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${{ ASSIGNMENT: "bg-blue-100 text-blue-700", QUIZ: "bg-emerald-100 text-emerald-700", EXAM: "bg-red-100 text-red-700", PROJECT: "bg-violet-100 text-violet-700", PRESENTATION: "bg-orange-100 text-orange-700" }[a.type] ?? "bg-slate-100 text-slate-600"}`}>{a.type}</span>
                            {isOverdue && <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700"><AlertCircle className="h-3 w-3" />Overdue</span>}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-slate-400">
                            {a.totalMarks && <span>{a.totalMarks} marks</span>}
                            {a.dueDate && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Due {new Date(a.dueDate).toLocaleDateString()}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setEditingAssessmentId(a.id); setAssessmentForm({ title: a.title, type: a.type, totalMarks: a.totalMarks?.toString() ?? "", passMarks: a.passMarks?.toString() ?? "", weightPercent: a.weightPercent?.toString() ?? "", dueDate: a.dueDate ? new Date(a.dueDate).toISOString().slice(0, 16) : "", instructions: a.instructions ?? "" }); setAssessmentError(null); setAssessmentModal("edit"); }}
                            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                          ><Pencil className="h-3 w-3" /> Edit</button>
                          <button onClick={() => { if (confirm("Delete?")) deleteAssessment.mutate({ id: a.id }); }} disabled={deleteAssessment.isPending} className="rounded-lg bg-red-50 p-1.5 text-red-600 transition hover:bg-red-100 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-50 pt-4">
                        {[
                          { label: "Submitted", value: a.submissions.length, color: "text-blue-600" },
                          { label: "Pending",   value: pending,             color: "text-amber-600" },
                          { label: "Graded",    value: graded,              color: "text-emerald-600" },
                        ].map(({ label, value, color }) => (
                          <div key={label} className="rounded-lg bg-slate-50 px-3 py-2 text-center">
                            <p className={`text-lg font-bold ${color}`}>{value}</p>
                            <p className="text-xs text-slate-400">{label}</p>
                          </div>
                        ))}
                      </div>
                      {pending > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pending Grading</p>
                          {a.submissions.filter((s) => s.status === "SUBMITTED").map((sub) => (
                            <div key={sub.id} className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50 px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-800">{sub.student?.profile?.fullName?.charAt(0).toUpperCase() ?? "?"}</div>
                                <div>
                                  <p className="text-sm font-medium text-slate-900">{sub.student?.profile?.fullName ?? "Unknown"}</p>
                                  <p className="text-xs text-slate-400">Submitted {new Date(sub.submittedAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <button onClick={() => { setGradeModal({ submissionId: sub.id, studentName: sub.student?.profile?.fullName ?? "Student", totalMarks: a.totalMarks ?? null }); setGradeMarks(""); setGradeFeedback(""); setGradeStatus("GRADED"); }}
                                className="flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-700"
                              ><CheckCircle className="h-3 w-3" /> Grade</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════ STUDENTS ════ */}
        {activeTab === "students" && (
          <div>
            <div className="mb-6">
              <h2 className="font-bold text-slate-900">Enrolled Students</h2>
              <p className="text-sm text-slate-500">{students.filter((s) => s.status === "ACTIVE").length} active · {students.filter((s) => s.status === "COMPLETED").length} completed</p>
            </div>
            {studentsLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>
            ) : students.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
                <Users className="mx-auto mb-4 h-12 w-12 text-slate-200" />
                <p className="font-medium text-slate-600">No students enrolled yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {students.map((e) => (
                  <div key={e.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">{e.student?.profile?.fullName?.charAt(0).toUpperCase() ?? "?"}</div>
                      <div>
                        <p className="font-medium text-slate-900">{e.student?.profile?.fullName ?? "Unknown"}</p>
                        <div className="flex items-center gap-1 text-xs text-slate-400"><Mail className="h-3 w-3" />{e.student?.profile?.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {e.grade && <div className="rounded-lg bg-violet-50 px-3 py-1.5 text-center"><p className="text-xs text-violet-400">Grade</p><p className="text-sm font-bold text-violet-700">{e.grade}</p></div>}
                      <select value={e.status} onChange={(ev) => updateGrade.mutate({ courseEnrollmentId: e.id, status: ev.target.value as any })} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium outline-none">
                        <option value="ACTIVE">Active</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="FAILED">Failed</option>
                        <option value="WITHDRAWN">Withdrawn</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ Modals (same as course detail) ════════════════════════════════════ */}

      {linkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <h2 className="font-bold text-slate-900">Add Link Resource</h2>
              <button onClick={() => setLinkModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-6">
              <div className="flex gap-2">
                {(["VIDEO_LINK", "EXTERNAL_LINK"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setLinkType(t)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition ${linkType === t ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600"}`}
                  >{t === "VIDEO_LINK" ? "🎬 Video Link" : "🔗 External Link"}</button>
                ))}
              </div>
              <Field label="Title" required><input type="text" value={linkTitle} placeholder="e.g. Week 1 Lecture" onChange={(e) => setLinkTitle(e.target.value)} className={inputCls} /></Field>
              <Field label="URL" required><input type="url" value={linkUrl} placeholder={linkType === "VIDEO_LINK" ? "https://youtube.com/..." : "https://..."} onChange={(e) => setLinkUrl(e.target.value)} className={inputCls} /></Field>
              <Field label="Description"><textarea rows={2} value={linkDesc} placeholder="Optional…" onChange={(e) => setLinkDesc(e.target.value)} className={`${inputCls} resize-none`} /></Field>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setLinkModal(false)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button onClick={handleAddLink} disabled={!linkUrl.trim() || !linkTitle.trim() || createResource.isPending}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {createResource.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Add Resource
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {assessmentModal !== "closed" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100"><ClipboardList className="h-5 w-5 text-violet-600" /></div>
                <h2 className="font-bold text-slate-900">{assessmentModal === "edit" ? "Edit Assessment" : "New Assessment"}</h2>
              </div>
              <button onClick={() => setAssessmentModal("closed")} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAssessmentSubmit} className="space-y-4 p-6">
              <Field label="Title" required><input type="text" value={assessmentForm.title} placeholder="e.g. Midterm Exam" onChange={(e) => setAssessmentForm((f) => ({ ...f, title: e.target.value }))} className={inputCls} /></Field>
              <Field label="Type" required>
                <select value={assessmentForm.type} onChange={(e) => setAssessmentForm((f) => ({ ...f, type: e.target.value }))} className={`${inputCls} appearance-none`}>
                  <option value="">Select type…</option>
                  {ASSESSMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Total Marks"><input type="number" min="0" value={assessmentForm.totalMarks} placeholder="100" onChange={(e) => setAssessmentForm((f) => ({ ...f, totalMarks: e.target.value }))} className={inputCls} /></Field>
                <Field label="Pass Marks"><input type="number" min="0" value={assessmentForm.passMarks} placeholder="50" onChange={(e) => setAssessmentForm((f) => ({ ...f, passMarks: e.target.value }))} className={inputCls} /></Field>
                <Field label="Weight (%)"><input type="number" min="0" max="100" value={assessmentForm.weightPercent} placeholder="25" onChange={(e) => setAssessmentForm((f) => ({ ...f, weightPercent: e.target.value }))} className={inputCls} /></Field>
              </div>
              <Field label="Due Date"><input type="datetime-local" value={assessmentForm.dueDate} onChange={(e) => setAssessmentForm((f) => ({ ...f, dueDate: e.target.value }))} className={inputCls} /></Field>
              <Field label="Instructions"><textarea rows={3} value={assessmentForm.instructions} placeholder="Instructions for students…" onChange={(e) => setAssessmentForm((f) => ({ ...f, instructions: e.target.value }))} className={`${inputCls} resize-none`} /></Field>
              {assessmentError && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{assessmentError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setAssessmentModal("closed")} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={createAssessment.isPending || updateAssessment.isPending}
                  className="flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
                >
                  {(createAssessment.isPending || updateAssessment.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                  {assessmentModal === "edit" ? "Save Changes" : "Create Assessment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {gradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="font-bold text-slate-900">Grade Submission</h2>
                <p className="text-xs text-slate-500">{gradeModal.studentName}</p>
              </div>
              <button onClick={() => setGradeModal(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-6">
              <Field label={`Marks${gradeModal.totalMarks ? ` (out of ${gradeModal.totalMarks})` : ""}`} required>
                <input type="number" min="0" max={gradeModal.totalMarks ?? undefined} value={gradeMarks} placeholder="0" onChange={(e) => setGradeMarks(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Feedback">
                <textarea rows={3} value={gradeFeedback} placeholder="Optional feedback…" onChange={(e) => setGradeFeedback(e.target.value)} className={`${inputCls} resize-none`} />
              </Field>
              <div className="flex gap-2">
                {(["GRADED", "RESUBMIT_REQUIRED"] as const).map((s) => (
                  <button key={s} type="button" onClick={() => setGradeStatus(s)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition ${gradeStatus === s ? (s === "GRADED" ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-amber-300 bg-amber-50 text-amber-700") : "border-slate-200 text-slate-600"}`}
                  >{s === "GRADED" ? "✓ Graded" : "↩ Request Resubmission"}</button>
                ))}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setGradeModal(null)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button onClick={() => gradeSubmission.mutate({ submissionId: gradeModal.submissionId, marksObtained: parseFloat(gradeMarks), feedback: gradeFeedback || null, status: gradeStatus })}
                  disabled={!gradeMarks || gradeSubmission.isPending}
                  className="flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
                >
                  {gradeSubmission.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Submit Grade
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ClipboardList, Plus, Loader2, Search, X, ChevronDown,
  Clock, CheckCircle, AlertCircle, Users, Pencil, Trash2,
  BookOpen, Calendar,
} from "lucide-react";
import { api } from "~/trpc/react";

// ── Types ──────────────────────────────────────────────────────────────────

const ASSESSMENT_TYPES = ["ASSIGNMENT", "QUIZ", "EXAM", "PROJECT", "PRESENTATION"] as const;

interface AssessmentForm {
  courseId: string;
  title: string;
  type: string;
  totalMarks: string;
  passMarks: string;
  weightPercent: string;
  dueDate: string;
  instructions: string;
}

const BLANK_FORM: AssessmentForm = {
  courseId: "", title: "", type: "", totalMarks: "", passMarks: "",
  weightPercent: "", dueDate: "", instructions: "",
};

const inputCls = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

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

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    ASSIGNMENT:   "bg-blue-100 text-blue-700",
    QUIZ:         "bg-emerald-100 text-emerald-700",
    EXAM:         "bg-red-100 text-red-700",
    PROJECT:      "bg-violet-100 text-violet-700",
    PRESENTATION: "bg-orange-100 text-orange-700",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${map[type] ?? "bg-slate-100 text-slate-600"}`}>
      {type}
    </span>
  );
}

// ── Grade submission modal ─────────────────────────────────────────────────

interface GradeModalState {
  submissionId: string;
  studentName: string;
  totalMarks: number | null;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function AssessmentsPage() {
  const searchParams = useSearchParams();
  const preselectedCourseId = searchParams.get("courseId");

  const utils = api.useUtils();

  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>(preselectedCourseId ?? "ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<"assessments" | "pending">("assessments");

  // Assessment modal
  const [assessmentModal, setAssessmentModal] = useState<"closed" | "create" | "edit">("closed");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AssessmentForm>(BLANK_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  // Grade modal
  const [gradeModal, setGradeModal] = useState<GradeModalState | null>(null);
  const [gradeMarks, setGradeMarks] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [gradeStatus, setGradeStatus] = useState<"GRADED" | "RESUBMIT_REQUIRED">("GRADED");

  // ── tRPC ──────────────────────────────────────────────────────────────────

  const { data: assessments = [], isLoading } = api.assessment.getMyAssessments.useQuery();
  const { data: pendingSubmissions = [], isLoading: pendingLoading } = api.assessment.getPendingSubmissions.useQuery();
  const { data: modules = [] } = api.course.getMyModules.useQuery();
  const { data: courses = [] } = api.course.getMyCourses.useQuery();

  const allCourses = [
    ...modules.map((m) => ({ id: m.course.id, title: m.course.title })),
    ...courses.map((c) => ({ id: c.id, title: c.title })),
  ];

  const createAssessment = api.assessment.create.useMutation({
    onSuccess: () => { void utils.assessment.getMyAssessments.invalidate(); closeModal(); },
    onError: (e) => setFormError(e.message),
  });

  const updateAssessment = api.assessment.update.useMutation({
    onSuccess: () => { void utils.assessment.getMyAssessments.invalidate(); closeModal(); },
    onError: (e) => setFormError(e.message),
  });

  const deleteAssessment = api.assessment.delete.useMutation({
    onSuccess: () => void utils.assessment.getMyAssessments.invalidate(),
  });

  const gradeSubmission = api.assessment.gradeSubmission.useMutation({
    onSuccess: () => {
      void utils.assessment.getPendingSubmissions.invalidate();
      setGradeModal(null);
      setGradeMarks("");
      setGradeFeedback("");
    },
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...BLANK_FORM, courseId: courseFilter !== "ALL" ? courseFilter : "" });
    setFormError(null);
    setAssessmentModal("create");
  };

  const openEdit = (a: typeof assessments[number]) => {
    setEditingId(a.id);
    setForm({
      courseId: a.courseId,
      title: a.title,
      type: a.type,
      totalMarks: a.totalMarks?.toString() ?? "",
      passMarks: a.passMarks?.toString() ?? "",
      weightPercent: a.weightPercent?.toString() ?? "",
      dueDate: a.dueDate ? new Date(a.dueDate).toISOString().slice(0, 16) : "",
      instructions: a.instructions ?? "",
    });
    setFormError(null);
    setAssessmentModal("edit");
  };

  const closeModal = () => {
    setAssessmentModal("closed");
    setEditingId(null);
    setForm(BLANK_FORM);
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.title.trim()) { setFormError("Title is required."); return; }
    if (!form.type) { setFormError("Please select a type."); return; }
    if (!editingId && !form.courseId) { setFormError("Please select a course."); return; }

    const payload = {
      title: form.title.trim(),
      type: form.type as typeof ASSESSMENT_TYPES[number],
      totalMarks: form.totalMarks ? parseInt(form.totalMarks) : null,
      passMarks: form.passMarks ? parseInt(form.passMarks) : null,
      weightPercent: form.weightPercent ? parseFloat(form.weightPercent) : null,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      instructions: form.instructions || null,
    };

    if (editingId) {
      updateAssessment.mutate({ id: editingId, ...payload });
    } else {
      createAssessment.mutate({ courseId: form.courseId, ...payload });
    }
  };

  const isMutating = createAssessment.isPending || updateAssessment.isPending;

  // ── Filtered ──────────────────────────────────────────────────────────────

  const filtered = assessments.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch = a.title.toLowerCase().includes(q) || a.course.title.toLowerCase().includes(q);
    const matchCourse = courseFilter === "ALL" || a.courseId === courseFilter;
    const matchType = typeFilter === "ALL" || a.type === typeFilter;
    return matchSearch && matchCourse && matchType;
  });

  const isOverdue = (dueDate: Date | null) => dueDate && new Date(dueDate) < new Date();

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Assessments</h1>
            <p className="mt-1 text-sm text-slate-500">Create and manage assessments across your courses</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            <Plus className="h-4 w-4" /> New Assessment
          </button>
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          {[
            { label: "Total Assessments", value: assessments.length, icon: ClipboardList, color: "text-violet-600", bg: "bg-violet-50" },
            { label: "Pending Grading", value: pendingSubmissions.length, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Total Submissions", value: assessments.reduce((s, a) => s + a.submissions.length, 0), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Graded", value: assessments.reduce((s, a) => s + a.submissions.filter((sub) => sub.status === "GRADED").length, 0), icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-1 rounded-xl border border-slate-200 bg-white p-1 w-fit shadow-sm">
          <button
            onClick={() => setActiveTab("assessments")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === "assessments" ? "bg-violet-600 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            All Assessments
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`relative rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === "pending" ? "bg-amber-500 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Pending Grading
            {pendingSubmissions.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {pendingSubmissions.length}
              </span>
            )}
          </button>
        </div>

        {/* ── Assessments Tab ── */}
        {activeTab === "assessments" && (
          <>
            {/* Filters */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search assessments…" value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </div>
              <div className="relative">
                <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-200 py-2.5 pl-3 pr-8 text-sm outline-none sm:w-48"
                >
                  <option value="ALL">All Courses</option>
                  {allCourses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
              <div className="relative">
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-200 py-2.5 pl-3 pr-8 text-sm outline-none sm:w-40"
                >
                  <option value="ALL">All Types</option>
                  {ASSESSMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-4">
                <p className="text-sm text-slate-500">{filtered.length} assessment{filtered.length !== 1 ? "s" : ""}</p>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center">
                  <ClipboardList className="mx-auto mb-4 h-12 w-12 text-slate-200" />
                  <p className="font-medium text-slate-600">No assessments yet</p>
                  <p className="mt-1 text-sm text-slate-400">Create an assessment for one of your courses or modules.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {filtered.map((a) => {
                    const submitted = a.submissions.length;
                    const graded = a.submissions.filter((s) => s.status === "GRADED").length;
                    const overdue = isOverdue(a.dueDate);

                    return (
                      <div key={a.id} className="flex items-center gap-4 px-6 py-4">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-violet-50">
                          <ClipboardList className="h-5 w-5 text-violet-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-slate-900">{a.title}</p>
                            <TypeBadge type={a.type} />
                            {overdue && (
                              <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                                <AlertCircle className="h-3 w-3" /> Overdue
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-4 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />{a.course.title}
                            </span>
                            {a.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Due {new Date(a.dueDate).toLocaleDateString()}
                              </span>
                            )}
                            {a.totalMarks && <span>{a.totalMarks} marks</span>}
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />{submitted} submitted · {graded} graded
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-2">
                          <button onClick={() => openEdit(a)}
                            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                          >
                            <Pencil className="h-3 w-3" /> Edit
                          </button>
                          <button
                            onClick={() => { if (confirm("Delete this assessment?")) deleteAssessment.mutate({ id: a.id }); }}
                            disabled={deleteAssessment.isPending}
                            className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                          >
                            {deleteAssessment.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Pending Grading Tab ── */}
        {activeTab === "pending" && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <p className="text-sm text-slate-500">
                {pendingLoading ? "Loading…" : `${pendingSubmissions.length} submission${pendingSubmissions.length !== 1 ? "s" : ""} awaiting grading`}
              </p>
            </div>

            {pendingLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              </div>
            ) : pendingSubmissions.length === 0 ? (
              <div className="py-16 text-center">
                <CheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-300" />
                <p className="font-medium text-slate-600">All caught up!</p>
                <p className="mt-1 text-sm text-slate-400">No submissions pending grading.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {pendingSubmissions.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
                      {sub.student.profile?.fullName?.charAt(0).toUpperCase() ?? "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900">{sub.student.profile?.fullName ?? "Unknown"}</p>
                      <p className="text-xs text-slate-400">
                        {sub.assessment.course.title} · {sub.assessment.title}
                      </p>
                      <p className="text-xs text-slate-400">
                        Submitted {new Date(sub.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      {sub.assessment.totalMarks && (
                        <span className="text-xs text-slate-500">/{sub.assessment.totalMarks} marks</span>
                      )}
                      <button
                        onClick={() => {
                          setGradeModal({
                            submissionId: sub.id,
                            studentName: sub.student.profile?.fullName ?? "Student",
                            totalMarks: sub.assessment.totalMarks ?? null,
                          });
                          setGradeMarks("");
                          setGradeFeedback("");
                          setGradeStatus("GRADED");
                        }}
                        className="flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-700"
                      >
                        <CheckCircle className="h-3 w-3" /> Grade
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ Assessment Modal ════════════════════════════════════════════════════ */}
      {assessmentModal !== "closed" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100">
                  <ClipboardList className="h-5 w-5 text-violet-600" />
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  {assessmentModal === "edit" ? "Edit Assessment" : "New Assessment"}
                </h2>
              </div>
              <button onClick={closeModal} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              {assessmentModal === "create" && (
                <Field label="Course / Module" required>
                  <div className="relative">
                    <select value={form.courseId}
                      onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
                      className={`${inputCls} appearance-none pr-8`}
                    >
                      <option value="">Select a course or module…</option>
                      {allCourses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </Field>
              )}

              <Field label="Title" required>
                <input type="text" value={form.title} placeholder="e.g. Midterm Exam"
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className={inputCls}
                />
              </Field>

              <Field label="Type" required>
                <div className="relative">
                  <select value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    className={`${inputCls} appearance-none pr-8`}
                  >
                    <option value="">Select type…</option>
                    {ASSESSMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </Field>

              <div className="grid grid-cols-3 gap-4">
                <Field label="Total Marks">
                  <input type="number" min="0" value={form.totalMarks} placeholder="100"
                    onChange={(e) => setForm((f) => ({ ...f, totalMarks: e.target.value }))}
                    className={inputCls}
                  />
                </Field>
                <Field label="Pass Marks">
                  <input type="number" min="0" value={form.passMarks} placeholder="50"
                    onChange={(e) => setForm((f) => ({ ...f, passMarks: e.target.value }))}
                    className={inputCls}
                  />
                </Field>
                <Field label="Weight (%)">
                  <input type="number" min="0" max="100" value={form.weightPercent} placeholder="25"
                    onChange={(e) => setForm((f) => ({ ...f, weightPercent: e.target.value }))}
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field label="Due Date">
                <input type="datetime-local" value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  className={inputCls}
                />
              </Field>

              <Field label="Instructions">
                <textarea value={form.instructions} rows={3}
                  placeholder="Instructions for students…"
                  onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
                  className={`${inputCls} resize-none`}
                />
              </Field>

              {formError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{formError}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" disabled={isMutating}
                  className="flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
                >
                  {isMutating && <Loader2 className="h-4 w-4 animate-spin" />}
                  {assessmentModal === "edit" ? "Save Changes" : "Create Assessment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ Grade Modal ══════════════════════════════════════════════════════════ */}
      {gradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Grade Submission</h2>
                <p className="text-xs text-slate-500">{gradeModal.studentName}</p>
              </div>
              <button onClick={() => setGradeModal(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <Field label={`Marks Obtained${gradeModal.totalMarks ? ` (out of ${gradeModal.totalMarks})` : ""}`} required>
                <input type="number" min="0" max={gradeModal.totalMarks ?? undefined}
                  value={gradeMarks} placeholder="0"
                  onChange={(e) => setGradeMarks(e.target.value)}
                  className={inputCls}
                />
              </Field>

              <Field label="Feedback">
                <textarea rows={3} value={gradeFeedback} placeholder="Optional feedback for the student…"
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  className={`${inputCls} resize-none`}
                />
              </Field>

              <div className="flex gap-2">
                {(["GRADED", "RESUBMIT_REQUIRED"] as const).map((s) => (
                  <button key={s} type="button" onClick={() => setGradeStatus(s)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                      gradeStatus === s
                        ? s === "GRADED" ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-amber-300 bg-amber-50 text-amber-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {s === "GRADED" ? "✓ Graded" : "↩ Request Resubmission"}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setGradeModal(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!gradeMarks) return;
                    gradeSubmission.mutate({
                      submissionId: gradeModal.submissionId,
                      marksObtained: parseFloat(gradeMarks),
                      feedback: gradeFeedback || null,
                      status: gradeStatus,
                    });
                  }}
                  disabled={!gradeMarks || gradeSubmission.isPending}
                  className="flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
                >
                  {gradeSubmission.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit Grade
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
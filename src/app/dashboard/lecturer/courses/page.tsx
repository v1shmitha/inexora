"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap, Plus, Loader2, Search, X, DollarSign,
  Globe, Users, ClipboardList, Eye, EyeOff, Pencil,
  Trash2, ArrowRight,
} from "lucide-react";
import { api } from "~/trpc/react";

// ── Types ──────────────────────────────────────────────────────────────────

interface CourseForm {
  title: string;
  code: string;
  description: string;
  localPrice: string;
  foreignPrice: string;
  isPublished: boolean;
}

const BLANK: CourseForm = {
  title: "", code: "", description: "",
  localPrice: "", foreignPrice: "", isPublished: false,
};

const inputCls = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

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

// ── Component ──────────────────────────────────────────────────────────────

export default function CoursesPage() {
  const router = useRouter();
  const utils = api.useUtils();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
  const [modalOpen, setModalOpen] = useState<"closed" | "create" | "edit">("closed");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CourseForm>(BLANK);
  const [formError, setFormError] = useState<string | null>(null);

  // ── tRPC ──────────────────────────────────────────────────────────────────

  const { data: courses = [], isLoading } = api.course.getMyCourses.useQuery(
    undefined, { staleTime: 0 },
  );

  const createCourse = api.course.createCourse.useMutation({
    onSuccess: () => { void utils.course.getMyCourses.invalidate(); closeModal(); },
    onError: (e) => setFormError(e.message),
  });

  const updateCourse = api.course.update.useMutation({
    onSuccess: () => { void utils.course.getMyCourses.invalidate(); closeModal(); },
    onError: (e) => setFormError(e.message),
  });

  const togglePublish = api.course.togglePublish.useMutation({
    onSuccess: () => void utils.course.getMyCourses.invalidate(),
  });

  const deleteCourse = api.course.delete.useMutation({
    onSuccess: () => void utils.course.getMyCourses.invalidate(),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingId(null);
    setForm(BLANK);
    setFormError(null);
    setModalOpen("create");
  };

  const openEdit = (course: typeof courses[number]) => {
    setEditingId(course.id);
    setForm({
      title: course.title,
      code: course.code ?? "",
      description: course.description ?? "",
      localPrice: course.localPrice?.toString() ?? "",
      foreignPrice: course.foreignPrice?.toString() ?? "",
      isPublished: course.isPublished,
    });
    setFormError(null);
    setModalOpen("edit");
  };

  const closeModal = () => {
    setModalOpen("closed");
    setEditingId(null);
    setForm(BLANK);
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.title.trim()) { setFormError("Title is required."); return; }
    const payload = {
      title: form.title.trim(),
      code: form.code || null,
      description: form.description || null,
      localPrice: form.localPrice ? parseFloat(form.localPrice) : null,
      foreignPrice: form.foreignPrice ? parseFloat(form.foreignPrice) : null,
      isPublished: form.isPublished,
    };
    if (editingId) {
      updateCourse.mutate({ id: editingId, ...payload });
    } else {
      createCourse.mutate(payload);
    }
  };

  // ── Filtered ──────────────────────────────────────────────────────────────

  const filtered = courses.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      c.title.toLowerCase().includes(q) ||
      (c.code?.toLowerCase().includes(q) ?? false);
    const matchFilter =
      filter === "ALL" ||
      (filter === "PUBLISHED" && c.isPublished) ||
      (filter === "DRAFT" && !c.isPublished);
    return matchSearch && matchFilter;
  });

  const totalStudents = courses.reduce((s, c) => s + c.courseEnrollments.length, 0);
  const published = courses.filter((c) => c.isPublished).length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Courses</h1>
            <p className="mt-1 text-sm text-slate-500">
              Standalone certificate courses students enroll in directly
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" /> Create Course
          </button>
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Courses",  value: courses.length, icon: GraduationCap, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Published",      value: published,       icon: Eye,           color: "text-blue-600",   bg: "bg-blue-50" },
            { label: "Total Students", value: totalStudents,   icon: Users,         color: "text-violet-600", bg: "bg-violet-50" },
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

        {/* Search + filter */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm shadow-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            {(["ALL", "PUBLISHED", "DRAFT"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-md px-4 py-1.5 text-xs font-semibold transition ${
                  filter === f
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {f === "ALL" ? "All" : f === "PUBLISHED" ? "Published" : "Draft"}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
            <GraduationCap className="mx-auto mb-4 h-12 w-12 text-slate-200" />
            <p className="font-medium text-slate-600">
              {search ? "No courses match your search" : "No courses yet"}
            </p>
            {!search && (
              <p className="mt-1 text-sm text-slate-400">
                Create a certificate course students can enroll in directly.
              </p>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course) => {
              const activeStudents = course.courseEnrollments.filter(
                (e) => e.status === "ACTIVE",
              ).length;

              return (
                <div
                  key={course.id}
                  className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-200 hover:shadow-md"
                >
                  {/* Card header */}
                  <div className="flex items-start gap-3 p-5 pb-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-sm">
                      <GraduationCap className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-snug text-slate-900">
                        {course.title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {course.code && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-500">
                            {course.code}
                          </span>
                        )}
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          course.isPublished
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}>
                          {course.isPublished ? "Published" : "Draft"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {course.description && (
                    <p className="px-5 pb-3 text-xs leading-relaxed text-slate-500 line-clamp-2">
                      {course.description}
                    </p>
                  )}

                  {/* Pricing */}
                  <div className="mx-5 mb-3 flex flex-wrap gap-2">
                    {course.localPrice ? (
                      <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        <DollarSign className="h-3 w-3" />
                        LKR {Number(course.localPrice).toLocaleString()}
                      </span>
                    ) : (
                      <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                        Free
                      </span>
                    )}
                    {course.foreignPrice && (
                      <span className="flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
                        <Globe className="h-3 w-3" />
                        USD {Number(course.foreignPrice).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Stats strip */}
                  <div className="mx-5 mb-4 flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
                    <span className="flex items-center gap-1.5 text-xs">
                      <Users className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="font-bold text-slate-800">{activeStudents}</span>
                      <span className="text-slate-400">students</span>
                    </span>
                    <span className="h-3 w-px bg-slate-200" />
                    <span className="flex items-center gap-1.5 text-xs">
                      <ClipboardList className="h-3.5 w-3.5 text-violet-500" />
                      <span className="font-bold text-slate-800">{course.assessments.length}</span>
                      <span className="text-slate-400">assessments</span>
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 border-t border-slate-100 p-3">
                    <button
                      onClick={() => router.push(`/dashboard/lecturer/courses/${course.id}`)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Open <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => togglePublish.mutate({ id: course.id })}
                      disabled={togglePublish.isPending}
                      title={course.isPublished ? "Unpublish" : "Publish"}
                      className="rounded-lg border border-slate-200 p-2 text-slate-400 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50"
                    >
                      {togglePublish.isPending
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : course.isPublished
                          ? <EyeOff className="h-3.5 w-3.5" />
                          : <Eye className="h-3.5 w-3.5" />
                      }
                    </button>
                    <button
                      onClick={() => openEdit(course)}
                      title="Edit"
                      className="rounded-lg border border-slate-200 p-2 text-slate-400 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => { if (confirm("Delete this course?")) deleteCourse.mutate({ id: course.id }); }}
                      disabled={deleteCourse.isPending}
                      title="Delete"
                      className="rounded-lg border border-slate-200 p-2 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      {deleteCourse.isPending
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />
                      }
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══ Modal ══════════════════════════════════════════════════════════════ */}
      {modalOpen !== "closed" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
                  <GraduationCap className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {modalOpen === "edit" ? "Edit Course" : "Create Standalone Course"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Certificate course students enroll in directly
                  </p>
                </div>
              </div>
              <button onClick={closeModal} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <Field label="Course Title" required>
                <input
                  type="text" value={form.title} placeholder="e.g. Python for Data Science"
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className={inputCls}
                />
              </Field>

              <Field label="Course Code">
                <input
                  type="text" value={form.code} placeholder="e.g. PY101"
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  className={inputCls}
                />
              </Field>

              <Field label="Description">
                <textarea
                  value={form.description} rows={3} placeholder="What will students learn?"
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className={`${inputCls} resize-none`}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Local Price (LKR)">
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number" min="0" step="0.01" placeholder="0.00" value={form.localPrice}
                      onChange={(e) => setForm((f) => ({ ...f, localPrice: e.target.value }))}
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                </Field>
                <Field label="Foreign Price (USD)">
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number" min="0" step="0.01" placeholder="0.00" value={form.foreignPrice}
                      onChange={(e) => setForm((f) => ({ ...f, foreignPrice: e.target.value }))}
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                </Field>
              </div>

              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, isPublished: !f.isPublished }))}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                  form.isPublished
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                <div className={`h-4 w-4 rounded-full border-2 transition ${
                  form.isPublished ? "border-emerald-600 bg-emerald-600" : "border-slate-300"
                }`} />
                Publish Immediately
              </button>

              {formError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{formError}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button" onClick={closeModal}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={createCourse.isPending || updateCourse.isPending}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {(createCourse.isPending || updateCourse.isPending) && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {modalOpen === "edit"
                    ? "Save Changes"
                    : form.isPublished ? "Create & Publish" : "Create as Draft"
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
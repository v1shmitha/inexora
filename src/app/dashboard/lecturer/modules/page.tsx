"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Layers,
  Plus,
  Loader2,
  BookOpen,
  Search,
  X,
  ChevronDown,
  Users,
  ClipboardList,
  Pencil,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { api } from "~/trpc/react";

interface ModuleForm {
  programId: string;
  title: string;
  code: string;
  description: string;
  isMandatory: boolean;
  orderIndex: string;
}

const BLANK: ModuleForm = {
  programId: "",
  title: "",
  code: "",
  description: "",
  isMandatory: true,
  orderIndex: "",
};

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

const FIELD_COLORS: Record<string, string> = {
  ENGINEERING: "bg-blue-50 text-blue-700 border-blue-100",
  INFORMATION_TECHNOLOGY: "bg-cyan-50 text-cyan-700 border-cyan-100",
  BUSINESS_MANAGEMENT: "bg-amber-50 text-amber-700 border-amber-100",
  MEDICINE: "bg-red-50 text-red-700 border-red-100",
  DATA_SCIENCE: "bg-violet-50 text-violet-700 border-violet-100",
  ARTIFICIAL_INTELLIGENCE: "bg-purple-50 text-purple-700 border-purple-100",
};
const fieldColor = (f?: string) =>
  FIELD_COLORS[f ?? ""] ?? "bg-slate-50 text-slate-600 border-slate-100";

export default function ModulesPage() {
  const router = useRouter();
  const utils = api.useUtils();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ModuleForm>(BLANK);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: modules = [], isLoading } = api.course.getMyModules.useQuery(
    undefined,
    { staleTime: 0 },
  );
  const { data: programs = [] } = api.program.getMyPrograms.useQuery(
    undefined,
    { staleTime: 0 },
  );
  const approvedPrograms = programs;

  const createModule = api.course.createModule.useMutation({
    onSuccess: () => {
      void utils.course.getMyModules.invalidate();
      closeModal();
    },
    onError: (e) => setFormError(e.message),
  });
  const updateModule = api.course.update.useMutation({
    onSuccess: () => {
      void utils.course.getMyModules.invalidate();
      closeModal();
    },
    onError: (e) => setFormError(e.message),
  });
  const deleteModule = api.course.delete.useMutation({
    onSuccess: () => void utils.course.getMyModules.invalidate(),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(BLANK);
    setFormError(null);
    setModalOpen(true);
  };
  const openEdit = (mod: (typeof modules)[number]) => {
    setEditingId(mod.course.id);
    setForm({
      programId: mod.course.programId ?? "",
      title: mod.course.title,
      code: mod.course.code ?? "",
      description: mod.course.description ?? "",
      isMandatory: mod.course.isMandatory,
      orderIndex: mod.course.orderIndex.toString(),
    });
    setFormError(null);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(BLANK);
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.title.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (editingId) {
      updateModule.mutate({
        id: editingId,
        title: form.title.trim(),
        code: form.code || null,
        description: form.description || null,
        isMandatory: form.isMandatory,
        orderIndex: form.orderIndex ? parseInt(form.orderIndex) : 0,
      });
    } else {
      if (!form.programId) {
        setFormError("Please select a program.");
        return;
      }
      createModule.mutate({
        programId: form.programId,
        title: form.title.trim(),
        code: form.code || null,
        description: form.description || null,
        isMandatory: form.isMandatory,
        orderIndex: form.orderIndex ? parseInt(form.orderIndex) : 0,
      });
    }
  };

  const filtered = modules.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.course.title.toLowerCase().includes(q) ||
      (m.course.code?.toLowerCase().includes(q) ?? false) ||
      (m.course.program?.title.toLowerCase().includes(q) ?? false)
    );
  });

  // Group by program title
  const grouped = filtered.reduce<Record<string, typeof filtered>>(
    (acc, mod) => {
      const key = mod.course.program?.title ?? "Unassigned";
      if (!acc[key]) acc[key] = [];
      acc[key]!.push(mod);
      return acc;
    },
    {},
  );

  // Sort groups alphabetically
  const sortedGroups = Object.entries(grouped).sort(([a], [b]) => 
    a.localeCompare(b)
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Modules</h1>
            <p className="mt-1 text-sm text-slate-500">
              Course units you teach within institution programs
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Add Module
          </button>
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {[
            {
              id: "total-modules",
              label: "Total Modules",
              value: modules.length,
              icon: Layers,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              id: "students-enrolled",
              label: "Students Enrolled",
              value: modules.reduce(
                (s, m) => s + m.course.courseEnrollments.length,
                0,
              ),
              icon: Users,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
            },
            {
              id: "assessments",
              label: "Assessments",
              value: modules.reduce(
                (s, m) => s + m.course.assessments.length,
                0,
              ),
              icon: ClipboardList,
              color: "text-violet-600",
              bg: "bg-violet-50",
            },
          ].map(({ id, label, value, icon: Icon, color, bg }) => (
            <div
              key={id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
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

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, code or program…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-4 pl-9 text-sm shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
            <Layers className="mx-auto mb-4 h-12 w-12 text-slate-200" />
            <p className="font-medium text-slate-600">
              {search ? "No modules match your search" : "No modules yet"}
            </p>
            {!search && (
              <p className="mt-1 text-sm text-slate-400">
                Add a module linked to an institution program.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {sortedGroups.map(([programTitle, mods]) => {
              const field = mods[0]?.course.program?.field;
              return (
                <div key={programTitle}>
                  {/* Program group header */}
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100">
                      <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <span className="text-sm font-bold text-slate-800">
                      {programTitle}
                    </span>
                    {field && (
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${fieldColor(field)}`}
                      >
                        {field.replace(/_/g, " ")}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      {mods.length} module{mods.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Module cards grid */}
                  {/* Module cards grid */}
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {mods.map((mod, idx) => {
    console.log('Module key:', mod.courseLecturerId, 'Course ID:', mod.course.id);
    // Ensure we have a unique key by combining multiple identifiers
    const uniqueKey = mod.courseLecturerId || 
                      mod.course.id || 
                      `module-${idx}-${mod.course.title}`;
    
    return (
      <div
        key={uniqueKey}
        className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md"
      >
        {/* Card header */}
        <div className="flex items-start gap-3 p-5 pb-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-sm">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="leading-snug font-semibold text-slate-900">
              {mod.course.title}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {mod.course.code && (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-500">
                  {mod.course.code}
                </span>
              )}
              {mod.course.isMandatory && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  Mandatory
                </span>
              )}
              {mod.course.orderIndex > 0 && (
                <span className="text-xs text-slate-400">
                  #{mod.course.orderIndex}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {mod.course.description && (
          <p className="line-clamp-2 px-5 pb-3 text-xs leading-relaxed text-slate-500">
            {mod.course.description}
          </p>
        )}

        {/* Stats */}
        <div className="mx-5 mb-4 flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
          <span className="flex items-center gap-1.5 text-xs">
            <Users className="h-3.5 w-3.5 text-emerald-500" />
            <span className="font-bold text-slate-800">
              {mod.course.courseEnrollments.length}
            </span>
            <span className="text-slate-400">students</span>
          </span>
          <span className="h-3 w-px bg-slate-200" />
          <span className="flex items-center gap-1.5 text-xs">
            <ClipboardList className="h-3.5 w-3.5 text-violet-500" />
            <span className="font-bold text-slate-800">
              {mod.course.assessments.length}
            </span>
            <span className="text-slate-400">assessments</span>
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 border-t border-slate-100 p-3">
          <button
            onClick={() =>
              router.push(
                `/dashboard/lecturer/modules/${mod.course.id}`,
              )
            }
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
          >
            Open <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => openEdit(mod)}
            title="Edit"
            className="rounded-lg border border-slate-200 p-2 text-slate-400 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              if (confirm("Delete this module?"))
                deleteModule.mutate({ id: mod.course.id });
            }}
            disabled={deleteModule.isPending}
            title="Delete"
            className="rounded-lg border border-slate-200 p-2 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            {deleteModule.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    );
  })}
</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                  <Layers className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {editingId ? "Edit Module" : "Add New Module"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    A course unit within an institution program
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              {!editingId && (
                <Field label="Program" required>
                  <div className="relative">
                    <select
                      value={form.programId}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, programId: e.target.value }))
                      }
                      className={`${inputCls} appearance-none pr-8`}
                    >
                      <option value="">Select a program…</option>
                      {approvedPrograms.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({p.type.replace(/_/g, " ")})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                  {approvedPrograms.length === 0 && (
                    <p className="mt-1 text-xs text-amber-600">
                      No approved programs found for your institution.
                    </p>
                  )}
                </Field>
              )}
              <Field label="Module Title" required>
                <input
                  type="text"
                  value={form.title}
                  placeholder="e.g. Introduction to Databases"
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  className={inputCls}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Module Code">
                  <input
                    type="text"
                    value={form.code}
                    placeholder="e.g. CS301"
                    onChange={(e) =>
                      setForm((f) => ({ ...f, code: e.target.value }))
                    }
                    className={inputCls}
                  />
                </Field>
                <Field label="Order Index">
                  <input
                    type="number"
                    value={form.orderIndex}
                    min="0"
                    placeholder="e.g. 1"
                    onChange={(e) =>
                      setForm((f) => ({ ...f, orderIndex: e.target.value }))
                    }
                    className={inputCls}
                  />
                </Field>
              </div>
              <Field label="Description">
                <textarea
                  value={form.description}
                  rows={3}
                  placeholder="Brief description of this module…"
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  className={`${inputCls} resize-none`}
                />
              </Field>
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({ ...f, isMandatory: !f.isMandatory }))
                }
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                  form.isMandatory
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                <div
                  className={`h-4 w-4 rounded-full border-2 transition ${form.isMandatory ? "border-blue-600 bg-blue-600" : "border-slate-300"}`}
                />
                Mandatory Module
              </button>
              {formError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                  {formError}
                </p>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createModule.isPending || updateModule.isPending}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {(createModule.isPending || updateModule.isPending) && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {editingId ? "Save Changes" : "Create Module"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
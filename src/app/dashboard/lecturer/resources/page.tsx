"use client";

import { useState, useRef } from "react";
import {
  FileText,
  BookOpen,
  Video,
  FlaskConical,
  ClipboardList,
  Newspaper,
  Upload,
  Link2,
  Plus,
  Search,
  Filter,
  Trash2,
  Pencil,
  Loader2,
  X,
  Eye,
  Download,
  ExternalLink,
  Globe,
  Lock,
  Users,
  ChevronDown,
} from "lucide-react";
import { api } from "~/trpc/react";
import {
  uploadLibraryResource,
  detectLibraryResourceType,
} from "~/lib/libraryStorage";

// ── Constants ──────────────────────────────────────────────────────────────

const RESOURCE_TYPES = [
  "EBOOK",
  "JOURNAL",
  "VIDEO_LECTURE",
  "RESEARCH_PAPER",
  "SIMULATION",
  "PAST_PAPER",
] as const;

const TYPE_META: Record<
  string,
  {
    label: string;
    icon: React.ReactNode;
    bg: string;
    text: string;
    border: string;
  }
> = {
  EBOOK: {
    label: "E-Book",
    icon: <BookOpen className="h-4 w-4" />,
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-100",
  },
  JOURNAL: {
    label: "Journal",
    icon: <Newspaper className="h-4 w-4" />,
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-100",
  },
  VIDEO_LECTURE: {
    label: "Video Lecture",
    icon: <Video className="h-4 w-4" />,
    bg: "bg-red-50",
    text: "text-red-500",
    border: "border-red-100",
  },
  RESEARCH_PAPER: {
    label: "Research Paper",
    icon: <FileText className="h-4 w-4" />,
    bg: "bg-orange-50",
    text: "text-orange-600",
    border: "border-orange-100",
  },
  SIMULATION: {
    label: "Simulation",
    icon: <FlaskConical className="h-4 w-4" />,
    bg: "bg-green-50",
    text: "text-green-600",
    border: "border-green-100",
  },
  PAST_PAPER: {
    label: "Past Paper",
    icon: <ClipboardList className="h-4 w-4" />,
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-100",
  },
};

const ACCESS_META: Record<
  string,
  { label: string; icon: React.ReactNode; className: string }
> = {
  PUBLIC: {
    label: "Public",
    icon: <Globe className="h-3 w-3" />,
    className: "bg-green-100 text-green-700",
  },
  ENROLLED: {
    label: "Enrolled",
    icon: <Users className="h-3 w-3" />,
    className: "bg-blue-100 text-blue-700",
  },
  PREMIUM: {
    label: "Premium",
    icon: <Lock className="h-3 w-3" />,
    className: "bg-amber-100 text-amber-700",
  },
};

const FIELDS = [
  "Engineering",
  "Information Technology",
  "Business",
  "Medicine",
  "Data Science",
  "Arts",
  "Education",
  "Law",
  "Other",
];

interface ResourceForm {
  title: string;
  type: string;
  subject: string;
  field: string;
  author: string;
  publisher: string;
  yearPublished: string;
  description: string;
  fileUrl: string;
  isFree: boolean;
  accessLevel: string;
  isLink: boolean;
}

const BLANK: ResourceForm = {
  title: "",
  type: "EBOOK",
  subject: "",
  field: "",
  author: "",
  publisher: "",
  yearPublished: "",
  description: "",
  fileUrl: "",
  isFree: true,
  accessLevel: "PUBLIC",
  isLink: false,
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

// ── Component ──────────────────────────────────────────────────────────────

export default function LibraryResourcesPage() {
  const utils = api.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [modal, setModal] = useState<"closed" | "create" | "edit">("closed");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ResourceForm>(BLANK);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // ── tRPC ──────────────────────────────────────────────────────────────────

  const { data: resources = [], isLoading } =
    api.libraryResource.getMyResources.useQuery(undefined, { staleTime: 0 });

  const createResource = api.libraryResource.create.useMutation({
    onSuccess: () => {
      void utils.libraryResource.getMyResources.invalidate();
      closeModal();
    },
    onError: (e) => setFormError(e.message),
  });

  const updateResource = api.libraryResource.update.useMutation({
    onSuccess: () => {
      void utils.libraryResource.getMyResources.invalidate();
      closeModal();
    },
    onError: (e) => setFormError(e.message),
  });

  const deleteResource = api.libraryResource.delete.useMutation({
    onSuccess: () => void utils.libraryResource.getMyResources.invalidate(),
  });

  // ── File upload ───────────────────────────────────────────────────────────

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const result = await uploadLibraryResource(file);
      if (result.error) throw new Error(result.error);
      setForm((f) => ({
        ...f,
        fileUrl: result.url ?? "",
        title: f.title || file.name.replace(/\.[^.]+$/, ""),
        type: detectLibraryResourceType(file),
        isLink: false,
      }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openCreate = () => {
    setForm(BLANK);
    setFormError(null);
    setUploadError(null);
    setEditingId(null);
    setModal("create");
  };

  const openEdit = (r: (typeof resources)[number]) => {
    setEditingId(r.id);
    setForm({
      title: r.title,
      type: r.type,
      subject: r.subject ?? "",
      field: r.field ?? "",
      author: r.author ?? "",
      publisher: r.publisher ?? "",
      yearPublished: r.yearPublished?.toString() ?? "",
      description: r.description ?? "",
      fileUrl: r.fileUrl ?? "",
      isFree: r.isFree,
      accessLevel: r.accessLevel,
      isLink: !r.fileUrl || r.type === "VIDEO_LECTURE",
    });
    setFormError(null);
    setUploadError(null);
    setModal("edit");
  };

  const closeModal = () => {
    setModal("closed");
    setEditingId(null);
    setForm(BLANK);
    setFormError(null);
    setUploadError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.title.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (!form.type) {
      setFormError("Type is required.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      type: form.type as (typeof RESOURCE_TYPES)[number],
      subject: form.subject || null,
      field: form.field || null,
      author: form.author || null,
      publisher: form.publisher || null,
      yearPublished: form.yearPublished ? parseInt(form.yearPublished) : null,
      description: form.description || null,
      fileUrl: form.fileUrl || null,
      isFree: form.isFree,
      accessLevel: form.accessLevel as "PUBLIC" | "ENROLLED" | "PREMIUM",
    };

    if (editingId) {
      updateResource.mutate({ id: editingId, ...payload });
    } else {
      createResource.mutate(payload);
    }
  };

  const isMutating = createResource.isPending || updateResource.isPending;

  // ── Filtered ──────────────────────────────────────────────────────────────

  const filtered = resources.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      r.title.toLowerCase().includes(q) ||
      (r.author?.toLowerCase().includes(q) ?? false) ||
      (r.subject?.toLowerCase().includes(q) ?? false);
    const matchType = typeFilter === "ALL" || r.type === typeFilter;
    return matchSearch && matchType;
  });

  // Stats
  const totalViews = resources.reduce((s, r) => s + r.views, 0);
  const totalDownloads = resources.reduce((s, r) => s + r.downloads, 0);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Library Resources
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Ebooks, journals, research papers and lectures shared with
              students
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Add Resource
          </button>
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          {[
            {
              label: "Total Resources",
              value: resources.length,
              icon: FileText,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              label: "Total Views",
              value: totalViews,
              icon: Eye,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
            },
            {
              label: "Downloads",
              value: totalDownloads,
              icon: Download,
              color: "text-violet-600",
              bg: "bg-violet-50",
            },
            {
              label: "Public",
              value: resources.filter((r) => r.accessLevel === "PUBLIC").length,
              icon: Globe,
              color: "text-orange-600",
              bg: "bg-orange-50",
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div
              key={label}
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

        {/* Type filter pills */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setTypeFilter("ALL")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              typeFilter === "ALL"
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            All Types
          </button>
          {RESOURCE_TYPES.map((t) => {
            const meta = TYPE_META[t]!;
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  typeFilter === t
                    ? `border ${meta.border} ${meta.bg} ${meta.text}`
                    : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                {meta.icon}
                {meta.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, author or subject…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-4 pl-9 text-sm shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Resources list */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-slate-200" />
            <p className="font-medium text-slate-600">
              {search || typeFilter !== "ALL"
                ? "No resources match your search"
                : "No resources yet"}
            </p>
            {!search && typeFilter === "ALL" && (
              <p className="mt-1 text-sm text-slate-400">
                Upload ebooks, journals or research papers to share with
                students.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => {
              const meta = TYPE_META[r.type] ?? TYPE_META.EBOOK!;
              const access = ACCESS_META[r.accessLevel] ?? ACCESS_META.PUBLIC!;
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                >
                  {/* Type icon */}
                  <div
                    className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border ${meta.border} ${meta.bg}`}
                  >
                    <span className={meta.text}>{meta.icon}</span>
                  </div>

                  {/* Main info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{r.title}</p>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-medium ${meta.border} ${meta.bg} ${meta.text}`}
                      >
                        {meta.label}
                      </span>
                      <span
                        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${access.className}`}
                      >
                        {access.icon}
                        {access.label}
                      </span>
                      {r.isFree ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          Free
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          Premium
                        </span>
                      )}
                    </div>

                    {/* Meta row */}
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 text-xs text-slate-400">
                      {r.author && <span>by {r.author}</span>}
                      {r.publisher && <span>{r.publisher}</span>}
                      {r.yearPublished && <span>{r.yearPublished}</span>}
                      {r.subject && <span>· {r.subject}</span>}
                    </div>

                    {r.description && (
                      <p className="mt-1 line-clamp-1 text-xs text-slate-400">
                        {r.description}
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="hidden flex-shrink-0 flex-col items-end gap-1 sm:flex">
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Eye className="h-3.5 w-3.5" />
                      {r.views.toLocaleString()} views
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Download className="h-3.5 w-3.5" />
                      {r.downloads.toLocaleString()} downloads
                    </span>
                    <span className="text-xs text-slate-300">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-shrink-0 items-center gap-1">
                    {r.fileUrl && (
                      <a
                        href={r.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-blue-600"
                        title="Open"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <button
                      onClick={() => openEdit(r)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Delete this resource?"))
                          deleteResource.mutate({ id: r.id });
                      }}
                      disabled={deleteResource.isPending}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      title="Delete"
                    >
                      {deleteResource.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══ Add / Edit Modal ══════════════════════════════════════════════════ */}
      {modal !== "closed" && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">
                    {modal === "edit"
                      ? "Edit Resource"
                      : "Add Library Resource"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Shared in the platform library for students
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

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              {/* Upload or link toggle */}
              {modal === "create" && (
                <div className="flex gap-2 rounded-xl border border-slate-100 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, isLink: false }))}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
                      !form.isLink
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <Upload className="h-4 w-4" /> Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, isLink: true }))}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
                      form.isLink
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <Link2 className="h-4 w-4" /> Add Link
                  </button>
                </div>
              )}

              {/* File upload area */}
              {!form.isLink && modal === "create" && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.epub,.doc,.docx,.ppt,.pptx,.mp4,.mov"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  {form.fileUrl ? (
                    <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                      <FileText className="h-5 w-5 flex-shrink-0 text-green-600" />
                      <p className="flex-1 truncate text-sm font-medium text-green-800">
                        File uploaded successfully
                      </p>
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, fileUrl: "" }))}
                        className="text-green-600 hover:text-green-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-8 transition hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50"
                    >
                      {uploading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      ) : (
                        <Upload className="h-8 w-8 text-slate-300" />
                      )}
                      <div className="text-center">
                        <p className="text-sm font-semibold text-slate-600">
                          {uploading ? "Uploading…" : "Click to upload"}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          PDF, EPUB, DOCX, PPT, MP4 supported
                        </p>
                      </div>
                    </button>
                  )}
                  {uploadError && (
                    <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                      {uploadError}
                    </p>
                  )}
                </div>
              )}

              {/* Link URL */}
              {form.isLink && (
                <Field label="URL" required>
                  <div className="relative">
                    <Link2 className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="url"
                      value={form.fileUrl}
                      placeholder="https://…"
                      onChange={(e) =>
                        setForm((f) => ({ ...f, fileUrl: e.target.value }))
                      }
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                </Field>
              )}

              {/* Core fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Title" required>
                  <input
                    type="text"
                    value={form.title}
                    placeholder="e.g. Introduction to Algorithms"
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                    className={inputCls}
                  />
                </Field>
                <Field label="Type" required>
                  <div className="relative">
                    <select
                      value={form.type}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, type: e.target.value }))
                      }
                      className={`${inputCls} appearance-none pr-8`}
                    >
                      {RESOURCE_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {TYPE_META[t]?.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Author">
                  <input
                    type="text"
                    value={form.author}
                    placeholder="e.g. Thomas H. Cormen"
                    onChange={(e) =>
                      setForm((f) => ({ ...f, author: e.target.value }))
                    }
                    className={inputCls}
                  />
                </Field>
                <Field label="Publisher">
                  <input
                    type="text"
                    value={form.publisher}
                    placeholder="e.g. MIT Press"
                    onChange={(e) =>
                      setForm((f) => ({ ...f, publisher: e.target.value }))
                    }
                    className={inputCls}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Subject">
                  <input
                    type="text"
                    value={form.subject}
                    placeholder="e.g. Algorithms"
                    onChange={(e) =>
                      setForm((f) => ({ ...f, subject: e.target.value }))
                    }
                    className={inputCls}
                  />
                </Field>
                <Field label="Field">
                  <div className="relative">
                    <select
                      value={form.field}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, field: e.target.value }))
                      }
                      className={`${inputCls} appearance-none pr-8`}
                    >
                      <option value="">Select…</option>
                      {FIELDS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </Field>
                <Field label="Year Published">
                  <input
                    type="number"
                    value={form.yearPublished}
                    placeholder="e.g. 2023"
                    min="1900"
                    max="2099"
                    onChange={(e) =>
                      setForm((f) => ({ ...f, yearPublished: e.target.value }))
                    }
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field label="Description">
                <textarea
                  value={form.description}
                  rows={3}
                  placeholder="Brief description of this resource…"
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  className={`${inputCls} resize-none`}
                />
              </Field>

              {/* Access & pricing */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Access Level">
                  <div className="flex gap-2">
                    {(["PUBLIC", "ENROLLED", "PREMIUM"] as const).map(
                      (level) => {
                        const a = ACCESS_META[level]!;
                        return (
                          <button
                            key={level}
                            type="button"
                            onClick={() =>
                              setForm((f) => ({ ...f, accessLevel: level }))
                            }
                            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-semibold transition ${
                              form.accessLevel === level
                                ? `${a.className} border-current`
                                : "border-slate-200 text-slate-500 hover:border-slate-300"
                            }`}
                          >
                            {a.icon}
                            {a.label}
                          </button>
                        );
                      },
                    )}
                  </div>
                </Field>
                <Field label="Pricing">
                  <div className="flex gap-2">
                    {([true, false] as const).map((free) => (
                      <button
                        key={String(free)}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, isFree: free }))}
                        className={`flex flex-1 items-center justify-center rounded-lg border py-2 text-xs font-semibold transition ${
                          form.isFree === free
                            ? free
                              ? "border-green-300 bg-green-50 text-green-700"
                              : "border-amber-300 bg-amber-50 text-amber-700"
                            : "border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        {free ? "Free" : "Premium"}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              {formError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                  {formError}
                </p>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isMutating || uploading}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {isMutating && <Loader2 className="h-4 w-4 animate-spin" />}
                  {modal === "edit" ? "Save Changes" : "Add Resource"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

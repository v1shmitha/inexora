"use client";

import { useState, useRef } from "react";
import {
  ChevronDown, ChevronUp, Plus, Loader2, FileText, Video,
  Link2, ExternalLink, Upload, Trash2, Eye, EyeOff,
  Pencil, X, GripVertical, BookOpen, Clock, AlignLeft,
  CheckCircle2,
} from "lucide-react";
import { api } from "~/trpc/react";
import { uploadCourseResource, detectResourceType, formatFileSize } from "~/lib/courseStorage";

// ── Constants ──────────────────────────────────────────────────────────────

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
const textareaCls = `${inputCls} resize-none`;

// ── Minimal markdown renderer ─────────────────────────────────────────────
// Renders bold, italic, headings, bullet lists, numbered lists, inline code

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const flushList = (key: string) => {
    if (listItems.length === 0) return;
    if (listType === "ul") {
      elements.push(
        <ul key={key} className="my-2 list-disc pl-5 space-y-0.5">
          {listItems.map((li, i) => (
            <li key={i} className="text-sm text-slate-700">{renderInline(li)}</li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <ol key={key} className="my-2 list-decimal pl-5 space-y-0.5">
          {listItems.map((li, i) => (
            <li key={i} className="text-sm text-slate-700">{renderInline(li)}</li>
          ))}
        </ol>
      );
    }
    listItems = [];
    listType = null;
  };

  lines.forEach((line, i) => {
    // Headings
    if (line.startsWith("### ")) {
      flushList(`fl-${i}`);
      elements.push(<h3 key={i} className="mt-3 mb-1 text-sm font-bold text-slate-900">{renderInline(line.slice(4))}</h3>);
    } else if (line.startsWith("## ")) {
      flushList(`fl-${i}`);
      elements.push(<h2 key={i} className="mt-4 mb-1 text-base font-bold text-slate-900">{renderInline(line.slice(3))}</h2>);
    } else if (line.startsWith("# ")) {
      flushList(`fl-${i}`);
      elements.push(<h1 key={i} className="mt-4 mb-1 text-lg font-bold text-slate-900">{renderInline(line.slice(2))}</h1>);
    // Unordered list
    } else if (/^[-*] /.test(line)) {
      if (listType !== "ul") { flushList(`fl-${i}`); listType = "ul"; }
      listItems.push(line.slice(2));
    // Ordered list
    } else if (/^\d+\. /.test(line)) {
      if (listType !== "ol") { flushList(`fl-${i}`); listType = "ol"; }
      listItems.push(line.replace(/^\d+\. /, ""));
    // Horizontal rule
    } else if (/^---+$/.test(line.trim())) {
      flushList(`fl-${i}`);
      elements.push(<hr key={i} className="my-3 border-slate-200" />);
    // Empty line
    } else if (line.trim() === "") {
      flushList(`fl-${i}`);
      elements.push(<div key={i} className="h-2" />);
    // Regular paragraph
    } else {
      flushList(`fl-${i}`);
      elements.push(<p key={i} className="text-sm leading-relaxed text-slate-700">{renderInline(line)}</p>);
    }
  });
  flushList("final");
  return <>{elements}</>;
}

function renderInline(text: string): React.ReactNode {
  // Split on bold, italic, inline code
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs text-slate-700">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────

function formatDuration(mins: number | null | undefined): string | null {
  if (!mins) return null;
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function totalSectionTime(resources: { durationMins?: number | null }[]): number {
  return resources.reduce((s, r) => s + (r.durationMins ?? 0), 0);
}

// ── Add Resource inline form ───────────────────────────────────────────────

function AddResourceForm({
  courseId, sectionId, onDone,
}: {
  courseId: string; sectionId: string; onDone: () => void;
}) {
  const utils = api.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<"upload" | "link">("upload");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMins, setDurationMins] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkType, setLinkType] = useState<"VIDEO_LINK" | "EXTERNAL_LINK">("EXTERNAL_LINK");
  const [fileUrl, setFileUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [detectedType, setDetectedType] = useState("PDF");
  const [sizeBytes, setSizeBytes] = useState<number | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);

  const createResource = api.courseResource.create.useMutation({
    onSuccess: () => {
      void utils.courseResource.getSections.invalidate({ courseId });
      onDone();
    },
  });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const result = await uploadCourseResource(file, courseId);
      if (result.error) throw new Error(result.error);
      setFileUrl(result.url ?? "");
      setTitle((t) => t || file.name.replace(/\.[^.]+$/, ""));
      setDetectedType(detectResourceType(file));
      setSizeBytes(result.sizeBytes);
      setMimeType(result.mimeType);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = () => {
    if (!title.trim()) return;
    const dur = durationMins ? parseInt(durationMins) : null;
    if (mode === "upload") {
      if (!fileUrl) return;
      createResource.mutate({
        courseId, sectionId, title: title.trim(),
        type: detectedType as any, fileUrl,
        description: description || null,
        sizeBytes, mimeType, durationMins: dur,
      });
    } else {
      if (!linkUrl.trim()) return;
      createResource.mutate({
        courseId, sectionId, title: title.trim(),
        type: linkType, externalUrl: linkUrl.trim(),
        description: description || null,
        durationMins: dur,
      });
    }
  };

  const canSave = title.trim() && (mode === "upload" ? !!fileUrl : !!linkUrl.trim());

  return (
    <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4 space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-2">
        {(["upload", "link"] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              mode === m ? "border-blue-300 bg-white text-blue-700 shadow-sm" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {m === "upload" ? <><Upload className="h-3.5 w-3.5" /> Upload File</> : <><Link2 className="h-3.5 w-3.5" /> Add Link</>}
          </button>
        ))}
      </div>

      {/* Upload */}
      {mode === "upload" && (
        <>
          <input ref={fileInputRef} type="file"
            accept=".pdf,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mov"
            className="hidden" onChange={handleFile}
          />
          {fileUrl ? (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />
              <span className="flex-1 truncate text-xs font-medium text-green-800">File uploaded successfully</span>
              <button onClick={() => setFileUrl("")} className="text-green-600 hover:text-green-800">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-blue-200 bg-white py-5 text-xs font-medium text-slate-500 transition hover:border-blue-400 hover:text-blue-600 disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Uploading…" : "Click to upload  ·  PDF, Video, Image, PPT"}
            </button>
          )}
          {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
        </>
      )}

      {/* Link */}
      {mode === "link" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            {(["VIDEO_LINK", "EXTERNAL_LINK"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setLinkType(t)}
                className={`rounded-lg border px-3 py-1 text-xs font-medium transition ${
                  linkType === t ? "border-blue-300 bg-white text-blue-700" : "border-slate-200 text-slate-500"
                }`}
              >
                {t === "VIDEO_LINK" ? "🎬 Video (YouTube etc.)" : "🔗 External Link"}
              </button>
            ))}
          </div>
          <input type="url" value={linkUrl}
            placeholder={linkType === "VIDEO_LINK" ? "https://youtube.com/…" : "https://…"}
            onChange={(e) => setLinkUrl(e.target.value)}
            className={inputCls}
          />
        </div>
      )}

      {/* Title */}
      <input type="text" value={title} placeholder="Resource title  e.g. Week 1 Lecture Notes"
        onChange={(e) => setTitle(e.target.value)}
        className={inputCls}
      />

      {/* Description */}
      <textarea value={description} rows={2}
        placeholder="Description for students  e.g. Read pages 1–20 before the lecture session"
        onChange={(e) => setDescription(e.target.value)}
        className={textareaCls}
      />

      {/* Duration */}
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 flex-shrink-0 text-slate-400" />
        <input type="number" min="1" value={durationMins} placeholder="Estimated time (minutes)"
          onChange={(e) => setDurationMins(e.target.value)}
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-1">
        <button onClick={onDone}
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100"
        >
          Cancel
        </button>
        <button onClick={handleSave}
          disabled={createResource.isPending || uploading || !canSave}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {createResource.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Add Resource
        </button>
      </div>
    </div>
  );
}

// ── Section form (create/edit) ─────────────────────────────────────────────

function SectionForm({
  initial, onSave, onCancel, saving,
}: {
  initial?: { title: string; description: string; instructions: string };
  onSave: (data: { title: string; description: string; instructions: string }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [instructions, setInstructions] = useState(initial?.instructions ?? "");
  const [preview, setPreview] = useState(false);

  return (
    <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/60 p-4">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Section Title <span className="text-red-500">*</span>
        </label>
        <input type="text" value={title}
          placeholder="e.g. Week 1 — Introduction, Getting Started, Core Concepts…"
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && title.trim() && onSave({ title, description, instructions })}
          autoFocus
          className={inputCls}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Short Description
        </label>
        <input type="text" value={description}
          placeholder="e.g. Introduction to core database concepts"
          onChange={(e) => setDescription(e.target.value)}
          className={inputCls}
        />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Instructions for Students
            <span className="ml-1 font-normal normal-case text-slate-400">(Markdown supported)</span>
          </label>
          <button type="button" onClick={() => setPreview(!preview)}
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            {preview ? "Edit" : "Preview"}
          </button>
        </div>
        {preview ? (
          <div className="min-h-[120px] rounded-lg border border-slate-200 bg-white px-4 py-3">
            {instructions.trim()
              ? renderMarkdown(instructions)
              : <p className="text-sm italic text-slate-400">Nothing to preview yet.</p>
            }
          </div>
        ) : (
          <textarea value={instructions} rows={5}
            placeholder={`What should students do in this section?\n\n## Objectives\n- Read the lecture notes before class\n- Watch the video recording\n\n**Note:** Submit the assignment by Friday`}
            onChange={(e) => setInstructions(e.target.value)}
            className={textareaCls}
          />
        )}
        <p className="mt-1 text-xs text-slate-400">
          Supports **bold**, *italic*, `code`, # headings, - lists, 1. numbered lists
        </p>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel}
          className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
        >
          Cancel
        </button>
        <button onClick={() => title.trim() && onSave({ title, description, instructions })}
          disabled={saving || !title.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {initial ? "Save Section" : "Create Section"}
        </button>
      </div>
    </div>
  );
}

// ── Main ContentTab ────────────────────────────────────────────────────────

export default function ContentTab({ courseId }: { courseId: string }) {
  const utils = api.useUtils();

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [showNewSection, setShowNewSection] = useState(false);
  const [expandedInstructions, setExpandedInstructions] = useState<Set<string>>(new Set());

  // ── tRPC ──────────────────────────────────────────────────────────────────

  const { data: sections = [], isLoading } = api.courseResource.getSections.useQuery(
    { courseId }, { enabled: !!courseId, staleTime: 0 },
  );

  const createSection = api.courseResource.createSection.useMutation({
    onSuccess: () => { void utils.courseResource.getSections.invalidate({ courseId }); setShowNewSection(false); },
  });

  const updateSection = api.courseResource.updateSection.useMutation({
    onSuccess: () => { void utils.courseResource.getSections.invalidate({ courseId }); setEditingSection(null); },
  });

  const deleteSection = api.courseResource.deleteSection.useMutation({
    onSuccess: () => void utils.courseResource.getSections.invalidate({ courseId }),
  });

  const deleteResource = api.courseResource.delete.useMutation({
    onSuccess: () => void utils.courseResource.getSections.invalidate({ courseId }),
  });

  const toggleResource = api.courseResource.togglePublish.useMutation({
    onSuccess: () => void utils.courseResource.getSections.invalidate({ courseId }),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const toggleCollapse = (id: string) =>
    setCollapsed((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleInstructions = (id: string) =>
    setExpandedInstructions((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const totalResources = sections.reduce((s, sec) => s + sec.resources.length, 0);
  const totalMins = sections.reduce((s, sec) => s + totalSectionTime(sec.resources), 0);

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-bold text-slate-900">Course Content</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {sections.length} section{sections.length !== 1 ? "s" : ""} · {totalResources} resource{totalResources !== 1 ? "s" : ""}
            {totalMins > 0 && <> · <Clock className="inline h-3.5 w-3.5 text-slate-400" /> {formatDuration(totalMins)} total</>}
          </p>
        </div>
        <button
          onClick={() => setShowNewSection(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Add Section
        </button>
      </div>

      {/* New section form */}
      {showNewSection && (
        <div className="mb-4">
          <SectionForm
            onSave={(data) => createSection.mutate({ courseId, ...data, orderIndex: sections.length })}
            onCancel={() => setShowNewSection(false)}
            saving={createSection.isPending}
          />
        </div>
      )}

      {/* Empty state */}
      {sections.length === 0 && !showNewSection && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
          <BookOpen className="mx-auto mb-4 h-12 w-12 text-slate-200" />
          <p className="font-medium text-slate-600">No sections yet</p>
          <p className="mt-1 text-sm text-slate-400 max-w-sm mx-auto">
            Sections organise your course into logical parts — e.g. "Week 1", "Introduction", "Core Concepts"
          </p>
          <button
            onClick={() => setShowNewSection(true)}
            className="mt-5 mx-auto flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Create First Section
          </button>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-3">
        {sections.map((section, sIdx) => {
          const isCollapsed = collapsed.has(section.id);
          const isEditing = editingSection === section.id;
          const isAddingHere = addingTo === section.id;
          const showInstructions = expandedInstructions.has(section.id);
          const secDuration = totalSectionTime(section.resources);

          return (
            <div key={section.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

              {/* ── Section header ── */}
              <div className={`flex items-center gap-3 px-5 py-4 ${isCollapsed ? "bg-slate-50" : "bg-white border-b border-slate-100"}`}>
                <GripVertical className="h-4 w-4 flex-shrink-0 cursor-grab text-slate-300" />

                <div
                  className="flex flex-1 cursor-pointer items-center gap-3"
                  onClick={() => !isEditing && toggleCollapse(section.id)}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-700 flex-shrink-0">
                    {sIdx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{section.title}</p>
                    {section.description && (
                      <p className="text-xs text-slate-400 truncate">{section.description}</p>
                    )}
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-slate-400">
                      <span>{section.resources.length} resource{section.resources.length !== 1 ? "s" : ""}</span>
                      {secDuration > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />{formatDuration(secDuration)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section controls */}
                <div className="flex flex-shrink-0 items-center gap-1">
                  <button
                    onClick={() => setEditingSection(section.id)}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    title="Edit section"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => { if (confirm(`Delete "${section.title}" and all its resources?`)) deleteSection.mutate({ id: section.id }); }}
                    disabled={deleteSection.isPending}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    title="Delete section"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => toggleCollapse(section.id)} className="rounded-lg p-1.5 text-slate-400">
                    {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* ── Edit section form ── */}
              {isEditing && (
                <div className="px-5 py-4 border-b border-slate-100">
                  <SectionForm
                    initial={{
                      title: section.title,
                      description: section.description ?? "",
                      instructions: (section as any).instructions ?? "",
                    }}
                    onSave={(data) => updateSection.mutate({ id: section.id, ...data })}
                    onCancel={() => setEditingSection(null)}
                    saving={updateSection.isPending}
                  />
                </div>
              )}

              {/* ── Section body ── */}
              {!isCollapsed && !isEditing && (
                <div className="px-5 pb-4 pt-3">

                  {/* Instructions */}
                  {(section as any).instructions && (
                    <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50/60">
                      <button
                        onClick={() => toggleInstructions(section.id)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left"
                      >
                        <span className="flex items-center gap-2 text-xs font-semibold text-amber-700">
                          <AlignLeft className="h-3.5 w-3.5" /> Instructions for this section
                        </span>
                        {showInstructions
                          ? <ChevronUp className="h-3.5 w-3.5 text-amber-500" />
                          : <ChevronDown className="h-3.5 w-3.5 text-amber-500" />
                        }
                      </button>
                      {showInstructions && (
                        <div className="border-t border-amber-100 px-4 pb-4 pt-3">
                          {renderMarkdown((section as any).instructions)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Resources */}
                  {section.resources.length === 0 && !isAddingHere && (
                    <p className="py-3 text-center text-sm text-slate-400">
                      No resources yet — add your first one below.
                    </p>
                  )}

                  <div className="space-y-1">
                    {section.resources.map((r, rIdx) => (
                      <div key={r.id}
                        className={`group flex items-start gap-3 rounded-xl border px-4 py-3 transition ${
                          !r.isPublished ? "border-slate-100 bg-slate-50 opacity-60" : "border-slate-100 bg-slate-50 hover:border-slate-200 hover:bg-white"
                        }`}
                      >
                        {/* Index */}
                        <span className="mt-0.5 w-5 flex-shrink-0 text-center text-xs font-semibold text-slate-400">{rIdx + 1}</span>

                        {/* Type icon */}
                        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                          {RESOURCE_ICONS[r.type]}
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900">{r.title}</p>
                          {(r as any).description && (
                            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{(r as any).description}</p>
                          )}
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-slate-400">
                            <span>{RESOURCE_LABELS[r.type]}</span>
                            {r.sizeBytes && <span>{formatFileSize(r.sizeBytes)}</span>}
                            {(r as any).durationMins && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />{formatDuration((r as any).durationMins)}
                              </span>
                            )}
                            {!r.isPublished && <span className="text-amber-500">Hidden from students</span>}
                          </div>
                        </div>

                        {/* Resource actions */}
                        <div className="flex flex-shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
                          {(r.fileUrl ?? r.externalUrl) && (
                            <a href={r.fileUrl ?? r.externalUrl ?? "#"} target="_blank" rel="noopener noreferrer"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-blue-600"
                              title="Open"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <button onClick={() => toggleResource.mutate({ id: r.id })}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-700"
                            title={r.isPublished ? "Hide from students" : "Show to students"}
                          >
                            {r.isPublished ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={() => { if (confirm("Delete this resource?")) deleteResource.mutate({ id: r.id }); }}
                            disabled={deleteResource.isPending}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add resource */}
                  {isAddingHere ? (
                    <AddResourceForm courseId={courseId} sectionId={section.id} onDone={() => setAddingTo(null)} />
                  ) : (
                    <button
                      onClick={() => setAddingTo(section.id)}
                      className="mt-3 flex w-full items-center gap-2 rounded-xl border border-dashed border-slate-200 px-4 py-3 text-xs font-medium text-slate-400 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add resource to this section
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
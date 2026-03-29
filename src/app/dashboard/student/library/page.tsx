"use client";

import { useState, useEffect } from "react";
import {
  BookOpen, Search, FileText, Video, Newspaper, FlaskConical,
  ClipboardList, Eye, Download, Globe, Lock, Users,
  Loader2, X, ExternalLink,
} from "lucide-react";
import { createClient } from "~/lib/supabase/client";

interface Resource {
  id: string;
  title: string;
  type: string;
  subject: string | null;
  field: string | null;
  author: string | null;
  publisher: string | null;
  yearPublished: number | null;
  description: string | null;
  fileUrl: string | null;
  isFree: boolean;
  accessLevel: string;
  views: number;
  downloads: number;
}

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
  EBOOK:          { label: "E-Book",        icon: <BookOpen className="h-4 w-4" />,      bg: "bg-blue-50",   text: "text-blue-600",   border: "border-blue-100" },
  JOURNAL:        { label: "Journal",        icon: <Newspaper className="h-4 w-4" />,     bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100" },
  VIDEO_LECTURE:  { label: "Video Lecture",  icon: <Video className="h-4 w-4" />,         bg: "bg-red-50",    text: "text-red-500",    border: "border-red-100" },
  RESEARCH_PAPER: { label: "Research Paper", icon: <FileText className="h-4 w-4" />,      bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-100" },
  SIMULATION:     { label: "Simulation",     icon: <FlaskConical className="h-4 w-4" />,  bg: "bg-green-50",  text: "text-green-600",  border: "border-green-100" },
  PAST_PAPER:     { label: "Past Paper",     icon: <ClipboardList className="h-4 w-4" />, bg: "bg-slate-50",  text: "text-slate-600",  border: "border-slate-100" },
};

const ACCESS_META: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  PUBLIC:   { label: "Public",   icon: <Globe className="h-3 w-3" />,  className: "bg-green-100 text-green-700" },
  ENROLLED: { label: "Enrolled", icon: <Users className="h-3 w-3" />,  className: "bg-blue-100 text-blue-700" },
  PREMIUM:  { label: "Premium",  icon: <Lock className="h-3 w-3" />,   className: "bg-amber-100 text-amber-700" },
};

const RESOURCE_TYPES = ["EBOOK", "JOURNAL", "VIDEO_LECTURE", "RESEARCH_PAPER", "SIMULATION", "PAST_PAPER"] as const;

export default function LibraryPage() {
  const supabase = createClient();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("LibraryResource")
        .select("id, title, type, subject, field, author, publisher, yearPublished, description, fileUrl, isFree, accessLevel, views, downloads")
        .eq("accessLevel", "PUBLIC")
        .order("createdAt", { ascending: false });

      if (data) setResources(data as Resource[]);
      setLoading(false);
    };
    void fetchResources();
  }, []);

  const filtered = resources.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      r.title.toLowerCase().includes(q) ||
      (r.author?.toLowerCase().includes(q) ?? false) ||
      (r.subject?.toLowerCase().includes(q) ?? false) ||
      (r.field?.toLowerCase().includes(q) ?? false);
    const matchType = typeFilter === "ALL" || r.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Library</h1>
            <p className="mt-3 text-lg text-slate-500">
              Ebooks, journals, research papers and video lectures
            </p>
          </div>
          <div className="mx-auto mt-8 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title, author or subject…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Type filter pills */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
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
                {meta.icon}{meta.label}
              </button>
            );
          })}
          <span className="ml-auto text-sm text-slate-400">
            {filtered.length} resource{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Resources list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-slate-200" />
            <p className="font-medium text-slate-600">
              {search || typeFilter !== "ALL" ? "No resources match your search" : "No resources yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => {
              const meta = TYPE_META[r.type] ?? TYPE_META.EBOOK!;
              const access = ACCESS_META[r.accessLevel] ?? ACCESS_META.PUBLIC!;
              return (
                <div key={r.id}
                  className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                >
                  <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border ${meta.border} ${meta.bg}`}>
                    <span className={meta.text}>{meta.icon}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{r.title}</p>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${meta.border} ${meta.bg} ${meta.text}`}>
                        {meta.label}
                      </span>
                      <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${access.className}`}>
                        {access.icon}{access.label}
                      </span>
                      {r.isFree ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Free</span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Premium</span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 text-xs text-slate-400">
                      {r.author && <span>by {r.author}</span>}
                      {r.publisher && <span>{r.publisher}</span>}
                      {r.yearPublished && <span>{r.yearPublished}</span>}
                      {r.subject && <span>· {r.subject}</span>}
                    </div>
                    {r.description && (
                      <p className="mt-1 line-clamp-1 text-xs text-slate-400">{r.description}</p>
                    )}
                  </div>

                  <div className="hidden flex-shrink-0 flex-col items-end gap-1 text-xs text-slate-400 sm:flex">
                    <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{r.views.toLocaleString()}</span>
                    <span className="flex items-center gap-1"><Download className="h-3.5 w-3.5" />{r.downloads.toLocaleString()}</span>
                  </div>

                  {r.fileUrl && (
                    <a
                      href={r.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Open
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
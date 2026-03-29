"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Library, Search, FileText, Video, BookOpen,
  Lock, Download, Eye, Loader2, ChevronRight,
} from "lucide-react";
import { api } from "~/trpc/react";

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  EBOOK: "E-Book", JOURNAL: "Journal", VIDEO_LECTURE: "Video Lecture",
  RESEARCH_PAPER: "Research Paper", SIMULATION: "Simulation", PAST_PAPER: "Past Paper",
};

const RESOURCE_TYPE_ICONS: Record<string, React.ReactNode> = {
  EBOOK:          <BookOpen className="h-5 w-5 text-blue-500" />,
  JOURNAL:        <FileText className="h-5 w-5 text-violet-500" />,
  VIDEO_LECTURE:  <Video className="h-5 w-5 text-red-500" />,
  RESEARCH_PAPER: <FileText className="h-5 w-5 text-emerald-500" />,
  SIMULATION:     <FileText className="h-5 w-5 text-amber-500" />,
  PAST_PAPER:     <FileText className="h-5 w-5 text-slate-500" />,
};

const RESOURCE_TYPE_BG: Record<string, string> = {
  EBOOK: "bg-blue-50", JOURNAL: "bg-violet-50", VIDEO_LECTURE: "bg-red-50",
  RESEARCH_PAPER: "bg-emerald-50", SIMULATION: "bg-amber-50", PAST_PAPER: "bg-slate-50",
};

export default function PublicResourcesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [resourceType, setResourceType] = useState<string>("");

  const { data: resources = [], isLoading } = api.libraryResource.listPublic.useQuery({
    search: search || undefined,
    type: resourceType || undefined,
  }, { staleTime: 60_000 });

  const freeResources = resources.filter((r) => r.isFree);
  const premiumResources = resources.filter((r) => !r.isFree);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Hero */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500">
              <Library className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-semibold text-amber-600 uppercase tracking-wide">Digital Library</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Learning Resources</h1>
          <p className="text-slate-500 max-w-xl">
            Browse our library of e-books, journals, video lectures, and research papers. Free resources are available to all. Premium resources require enrollment.
          </p>

          {/* Search + filter */}
          <div className="mt-6 flex flex-col gap-3 max-w-2xl sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search resources…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <select
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-blue-400"
            >
              <option value="">All Types</option>
              {Object.entries(RESOURCE_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            {/* Free Resources */}
            {freeResources.length > 0 && (
              <section>
                <div className="mb-4 flex items-center gap-3">
                  <h2 className="text-lg font-bold text-slate-900">Free Resources</h2>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    {freeResources.length} available
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {freeResources.map((resource) => (
                    <ResourceCard
                      key={resource.id}
                      resource={resource}
                      isFree
                      onAccess={() => router.push("/login")}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Premium Resources */}
            {premiumResources.length > 0 && (
              <section>
                <div className="mb-4 flex items-center gap-3">
                  <h2 className="text-lg font-bold text-slate-900">Premium Resources</h2>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                    Enrollment required
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {premiumResources.map((resource) => (
                    <ResourceCard
                      key={resource.id}
                      resource={resource}
                      isFree={false}
                      onAccess={() => router.push("/login")}
                    />
                  ))}
                </div>
              </section>
            )}

            {resources.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
                <Library className="mx-auto mb-4 h-12 w-12 text-slate-200" />
                <p className="font-medium text-slate-600">No resources found</p>
                <p className="mt-1 text-sm text-slate-400">Try a different search term.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ResourceCard({
  resource, isFree, onAccess,
}: {
  resource: any;
  isFree: boolean;
  onAccess: () => void;
}) {
  return (
    <div className={`flex flex-col rounded-xl border bg-white shadow-sm transition ${
      isFree ? "border-slate-200 hover:border-emerald-200 hover:shadow-md" : "border-slate-200 opacity-80"
    }`}>
      <div className="flex flex-1 flex-col p-5">
        {/* Icon + type */}
        <div className="mb-3 flex items-center justify-between">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${RESOURCE_TYPE_BG[resource.type] ?? "bg-slate-50"}`}>
            {RESOURCE_TYPE_ICONS[resource.type] ?? <FileText className="h-5 w-5 text-slate-400" />}
          </div>
          {isFree ? (
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">Free</span>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
              <Lock className="h-3 w-3" /> Premium
            </span>
          )}
        </div>

        <h3 className="font-bold text-sm leading-snug text-slate-900">{resource.title}</h3>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
          <span>{RESOURCE_TYPE_LABELS[resource.type] ?? resource.type}</span>
          {resource.author && <span>by {resource.author}</span>}
          {resource.yearPublished && <span>{resource.yearPublished}</span>}
        </div>

        {resource.description && (
          <p className="mt-2 text-xs leading-relaxed text-slate-500 line-clamp-2">
            {resource.description}
          </p>
        )}

        <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
          {resource.views > 0 && (
            <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {resource.views}</span>
          )}
          {resource.downloads > 0 && (
            <span className="flex items-center gap-1"><Download className="h-3.5 w-3.5" /> {resource.downloads}</span>
          )}
        </div>

        <button
          onClick={onAccess}
          className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
            isFree
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {isFree ? (
            <><Download className="h-4 w-4" /> Access Free</>
          ) : (
            <><Lock className="h-4 w-4" /> Login to Access</>
          )}
        </button>
      </div>
    </div>
  );
}
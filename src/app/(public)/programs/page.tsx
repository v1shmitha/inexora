"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap, Search, SlidersHorizontal, BookOpen,
  Clock, Globe, Building2, ChevronRight, Loader2, X,
} from "lucide-react";
import { api } from "~/trpc/react";

const FIELD_LABELS: Record<string, string> = {
  INFORMATION_TECHNOLOGY: "IT",
  BUSINESS_MANAGEMENT: "Business",
  ENGINEERING: "Engineering",
  ACCOUNTING_FINANCE: "Finance",
  DATA_SCIENCE: "Data Science",
  ARTIFICIAL_INTELLIGENCE: "AI",
  CYBER_SECURITY: "Cyber Security",
  MEDICINE: "Medicine",
  LAW: "Law",
  EDUCATION: "Education",
  OTHER: "Other",
};

const LEVEL_LABELS: Record<string, string> = {
  ENTRY: "Entry Level",
  UNDERGRADUATE: "Undergraduate",
  POSTGRADUATE: "Postgraduate",
  RESEARCH: "Research",
};

const TYPE_LABELS: Record<string, string> = {
  BACHELOR: "Bachelor's",
  MASTER: "Master's",
  PHD: "PhD",
  DIPLOMA: "Diploma",
  CERTIFICATE: "Certificate",
  FOUNDATION: "Foundation",
  PROFESSIONAL: "Professional",
  MICROCREDENTIAL: "Microcredential",
  SHORT_COURSE: "Short Course",
};

const DELIVERY_LABELS: Record<string, string> = {
  ONLINE: "Online",
  ON_CAMPUS: "On Campus",
  HYBRID: "Hybrid",
  BLENDED: "Blended",
};

const DELIVERY_COLORS: Record<string, string> = {
  ONLINE: "bg-emerald-50 text-emerald-700",
  ON_CAMPUS: "bg-blue-50 text-blue-700",
  HYBRID: "bg-violet-50 text-violet-700",
  BLENDED: "bg-amber-50 text-amber-700",
};

export default function PublicProgramsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [field, setField] = useState<string>("");
  const [level, setLevel] = useState<string>("");
  const [delivery, setDelivery] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const { data: programs = [], isLoading } = api.program.listPublic.useQuery({
    search: search || undefined,
    field: field || undefined,
    level: level || undefined,
    deliveryMode: delivery || undefined,
  }, { staleTime: 60_000 });

  const hasFilters = !!(field || level || delivery);
  const clearFilters = () => { setField(""); setLevel(""); setDelivery(""); };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Hero */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Browse Programs</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Find Your Perfect Program
          </h1>
          <p className="text-slate-500 max-w-xl">
            Explore programs from Sri Lanka's leading universities and institutions. Filter by field, level, or delivery mode to find what suits you.
          </p>

          {/* Search */}
          <div className="mt-6 flex gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search programs, institutions…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition shadow-sm ${
                hasFilters
                  ? "border-blue-300 bg-blue-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {hasFilters && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-blue-600 text-xs font-bold">
                  {[field, level, delivery].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="mt-4 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 max-w-2xl">
              <select
                value={field}
                onChange={(e) => setField(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
              >
                <option value="">All Fields</option>
                {Object.entries(FIELD_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
              >
                <option value="">All Levels</option>
                {Object.entries(LEVEL_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <select
                value={delivery}
                onChange={(e) => setDelivery(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
              >
                <option value="">All Delivery Modes</option>
                {Object.entries(DELIVERY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-500 hover:text-red-600"
                >
                  <X className="h-3.5 w-3.5" /> Clear
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : programs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
            <GraduationCap className="mx-auto mb-4 h-12 w-12 text-slate-200" />
            <p className="font-medium text-slate-600">No programs found</p>
            <p className="mt-1 text-sm text-slate-400">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <p className="mb-5 text-sm text-slate-500">
              {programs.length} program{programs.length !== 1 ? "s" : ""} found
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {programs.map((program) => (
                <div
                  key={program.id}
                  className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md"
                >
                  {/* Top accent */}
                  <div className="h-1.5 rounded-t-xl bg-gradient-to-r from-blue-500 to-violet-500" />

                  <div className="flex flex-1 flex-col p-5">
                    {/* Badges */}
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {TYPE_LABELS[program.type] ?? program.type}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${DELIVERY_COLORS[program.deliveryMode] ?? "bg-slate-100 text-slate-600"}`}>
                        {DELIVERY_LABELS[program.deliveryMode] ?? program.deliveryMode}
                      </span>
                      {program.scholarshipAvailable && (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          Scholarship
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-bold leading-snug text-slate-900">{program.title}</h3>

                    {/* Institution */}
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                      <Building2 className="h-3.5 w-3.5" />
                      <span className="truncate">{program.institution.name}</span>
                    </div>

                    {/* Meta */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                      {program.durationMonths && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {program.durationMonths >= 12
                            ? `${Math.round(program.durationMonths / 12)} yr${program.durationMonths >= 24 ? "s" : ""}`
                            : `${program.durationMonths} months`}
                        </span>
                      )}
                      {program.field && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" />
                          {FIELD_LABELS[program.field] ?? program.field}
                        </span>
                      )}
                      {program.language?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Globe className="h-3.5 w-3.5" />
                          {program.language.join(", ")}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {program.description && (
                      <p className="mt-3 text-xs leading-relaxed text-slate-500 line-clamp-2">
                        {program.description}
                      </p>
                    )}

                    {/* Price */}
                    {program.localPrice && (
                      <p className="mt-3 text-sm font-bold text-slate-900">
                        LKR {Number(program.localPrice).toLocaleString()}
                        <span className="ml-1 text-xs font-normal text-slate-400">/ program</span>
                      </p>
                    )}

                    {/* CTA */}
                    <button
                      onClick={() => router.push(`/programs/${program.id}`)}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                    >
                      View Details <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
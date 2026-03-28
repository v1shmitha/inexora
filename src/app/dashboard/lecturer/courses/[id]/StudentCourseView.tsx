"use client";

import { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Video,
  Link2,
  ExternalLink,
  Play,
  Eye,
  User,
  Download,
  Award,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { formatFileSize } from "~/lib/courseStorage";

interface Resource {
  id: string;
  title: string;
  type: string;
  description?: string | null;
  fileUrl?: string | null;
  externalUrl?: string | null;
  durationMins?: number | null;
  isPublished: boolean;
  sizeBytes?: number | null;
}

interface Section {
  id: string;
  title: string;
  description?: string | null;
  instructions?: string | null;
  resources: Resource[];
  orderIndex: number;
}

interface Course {
  id: string;
  title: string;
  code?: string | null;
  description?: string | null;
  localPrice?: number | null;
  foreignPrice?: number | null;
}

interface StudentCourseViewProps {
  course: Course;
  sections: Section[];
  enrolledStudents?: number;
  onExitPreview?: () => void;
}

const RESOURCE_ICONS: Record<string, React.ReactNode> = {
  PDF: <FileText className="h-5 w-5 text-red-500" />,
  VIDEO_UPLOAD: <Video className="h-5 w-5 text-blue-500" />,
  VIDEO_LINK: <Video className="h-5 w-5 text-purple-500" />,
  IMAGE: <FileText className="h-5 w-5 text-green-500" />,
  PRESENTATION: <FileText className="h-5 w-5 text-orange-500" />,
  EXTERNAL_LINK: <Link2 className="h-5 w-5 text-slate-500" />,
};

const RESOURCE_LABELS: Record<string, string> = {
  PDF: "PDF Document",
  VIDEO_UPLOAD: "Video",
  VIDEO_LINK: "Video Link",
  IMAGE: "Image",
  PRESENTATION: "Presentation",
  EXTERNAL_LINK: "External Link",
};

function formatDuration(mins: number | null | undefined): string | null {
  if (!mins) return null;
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function StudentCourseView({ course, sections, enrolledStudents = 0, onExitPreview }: StudentCourseViewProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(sections.map(s => s.id)));

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const totalResources = sections.reduce((sum, s) => sum + s.resources.length, 0);
  const totalDuration = sections.reduce(
    (sum, s) => sum + s.resources.reduce((rSum, r) => rSum + (r.durationMins || 0), 0),
    0
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Preview Banner */}
      {onExitPreview && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">Student Preview Mode</span>
              <span className="hidden text-xs text-amber-700 sm:inline">
                You're seeing this course as a student would see it
              </span>
            </div>
            <button
              onClick={onExitPreview}
              className="rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-amber-700"
            >
              Exit Preview
            </button>
          </div>
        </div>
      )}

      {/* Course Header */}
      <div className="border-b border-slate-200 bg-white rounded-t-xl">
        <div className="px-4 py-6 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{course.title}</h1>
              {course.description && (
                <p className="mt-2 text-sm text-slate-600 sm:text-base">{course.description}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5">
                <User className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">{enrolledStudents} students</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5">
                <BookOpen className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">{sections.length} sections</span>
              </div>
              {totalDuration > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5">
                  <Clock className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">
                    {formatDuration(totalDuration)} total
                  </span>
                </div>
              )}
              {course.localPrice && (
                <div className="flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-1.5">
                  <span className="text-sm font-medium text-blue-700">LKR {Number(course.localPrice).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="mt-6 space-y-4">
        {sections.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-slate-200" />
            <p className="font-medium text-slate-600">No content available yet</p>
            <p className="mt-1 text-sm text-slate-400">
              This course hasn't been published or content is being prepared.
            </p>
          </div>
        ) : (
          sections.map((section, idx) => {
            const isExpanded = expandedSections.has(section.id);
            const publishedResources = section.resources.filter(r => r.isPublished);
            const hasContent = publishedResources.length > 0;

            return (
              <div key={section.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="flex w-full items-center justify-between bg-slate-50 px-4 py-4 text-left transition hover:bg-slate-100 sm:px-6"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-700">
                      {idx + 1}
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-slate-900">{section.title}</h3>
                      {section.description && (
                        <p className="text-xs text-slate-500 sm:text-sm">{section.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 sm:text-sm">
                      {publishedResources.length} item{publishedResources.length !== 1 ? "s" : ""}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-slate-400 sm:h-5 sm:w-5" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400 sm:h-5 sm:w-5" />
                    )}
                  </div>
                </button>

                {/* Section Content */}
                {isExpanded && (
                  <div className="divide-y divide-slate-100">
                    {/* Resources */}
                    {!hasContent ? (
                      <div className="px-4 py-8 text-center sm:px-6">
                        <p className="text-sm text-slate-400">No content in this section yet.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {publishedResources.map((resource) => (
                          <div key={resource.id} className="flex flex-col gap-3 px-4 py-4 hover:bg-slate-50 sm:flex-row sm:items-start sm:gap-4 sm:px-6">
                            {/* Resource Icon */}
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white shadow-sm border border-slate-200">
                              {RESOURCE_ICONS[resource.type] || <FileText className="h-5 w-5 text-slate-400" />}
                            </div>

                            {/* Resource Content */}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-slate-900">{resource.title}</span>
                                <span className="text-xs text-slate-400">{RESOURCE_LABELS[resource.type]}</span>
                              </div>
                              {resource.description && (
                                <p className="mt-1 text-sm text-slate-500">{resource.description}</p>
                              )}
                              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                                {resource.durationMins && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDuration(resource.durationMins)}
                                  </span>
                                )}
                                {resource.sizeBytes && (
                                  <span>{formatFileSize(resource.sizeBytes)}</span>
                                )}
                              </div>
                            </div>

                            {/* Resource Action */}
                            {(resource.fileUrl || resource.externalUrl) && (
                              <a
                                href={resource.fileUrl || resource.externalUrl || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-shrink-0 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 sm:w-auto"
                              >
                                {resource.type === "VIDEO_LINK" ? (
                                  <Play className="h-4 w-4" />
                                ) : resource.type === "EXTERNAL_LINK" ? (
                                  <ExternalLink className="h-4 w-4" />
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                                {resource.type === "VIDEO_LINK" ? "Watch" : resource.type === "EXTERNAL_LINK" ? "Open" : "View"}
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
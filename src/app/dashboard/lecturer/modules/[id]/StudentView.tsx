"use client";

import { useState, useEffect } from "react";
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
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Home,
  MessageSquare,
  ThumbsUp,
  Flag,
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
  orderIndex?: number;
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
  program?: {
    id: string;
    title: string;
    institution?: {
      name: string;
    };
  } | null;
}

interface StudentViewProps {
  course: Course;
  sections: Section[];
  enrolledStudents?: number;
  onExitPreview?: () => void;
}

// Resource icon mapping
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

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const flushList = (key: string) => {
    if (listItems.length === 0) return;
    if (listType === "ul") {
      elements.push(
        <ul key={key} className="my-2 list-disc pl-5 space-y-1">
          {listItems.map((li, i) => (
            <li key={i} className="text-sm text-slate-700">{renderInline(li)}</li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <ol key={key} className="my-2 list-decimal pl-5 space-y-1">
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
    if (line.startsWith("### ")) {
      flushList(`fl-${i}`);
      elements.push(<h3 key={i} className="mt-3 mb-2 text-base font-semibold text-slate-900">{renderInline(line.slice(4))}</h3>);
    } else if (line.startsWith("## ")) {
      flushList(`fl-${i}`);
      elements.push(<h2 key={i} className="mt-4 mb-2 text-lg font-semibold text-slate-900">{renderInline(line.slice(3))}</h2>);
    } else if (line.startsWith("# ")) {
      flushList(`fl-${i}`);
      elements.push(<h1 key={i} className="mt-4 mb-3 text-xl font-bold text-slate-900">{renderInline(line.slice(2))}</h1>);
    } else if (/^[-*] /.test(line)) {
      if (listType !== "ul") { flushList(`fl-${i}`); listType = "ul"; }
      listItems.push(line.slice(2));
    } else if (/^\d+\. /.test(line)) {
      if (listType !== "ol") { flushList(`fl-${i}`); listType = "ol"; }
      listItems.push(line.replace(/^\d+\. /, ""));
    } else if (line.trim() === "") {
      flushList(`fl-${i}`);
      elements.push(<div key={i} className="h-2" />);
    } else {
      flushList(`fl-${i}`);
      elements.push(<p key={i} className="text-sm leading-relaxed text-slate-700 mb-2">{renderInline(line)}</p>);
    }
  });
  flushList("final");
  return <>{elements}</>;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

// Track completed resources (in a real app, this would come from backend)
interface CompletedState {
  [resourceId: string]: boolean;
}

export default function StudentView({ course, sections, enrolledStudents = 0, onExitPreview }: StudentViewProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(sections.map(s => s.id)));
  const [currentSectionId, setCurrentSectionId] = useState<string>(sections[0]?.id);
  const [currentResourceId, setCurrentResourceId] = useState<string | null>(null);
  const [completedResources, setCompletedResources] = useState<CompletedState>(() => {
    // Load from localStorage in a real app
    const saved = localStorage.getItem(`course-${course.id}-progress`);
    return saved ? JSON.parse(saved) : {};
  });
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");

  // Save progress to localStorage
  useEffect(() => {
    localStorage.setItem(`course-${course.id}-progress`, JSON.stringify(completedResources));
  }, [completedResources, course.id]);

  // Get current section and resource
  const currentSection = sections.find(s => s.id === currentSectionId);
  const currentResource = currentSection?.resources.find(r => r.id === currentResourceId);

  // Calculate progress
  const allResources = sections.flatMap(s => s.resources);
  const totalResources = allResources.length;
  const completedCount = Object.values(completedResources).filter(Boolean).length;
  const courseProgress = totalResources > 0 ? (completedCount / totalResources) * 100 : 0;

  // Get all resources in order for navigation
  const allResourcesOrdered = sections.flatMap(s => 
    s.resources.map(r => ({ ...r, sectionId: s.id, sectionTitle: s.title }))
  );
  const currentIndex = currentResourceId 
    ? allResourcesOrdered.findIndex(r => r.id === currentResourceId)
    : -1;
  const prevResource = currentIndex > 0 ? allResourcesOrdered[currentIndex - 1] : null;
  const nextResource = currentIndex < allResourcesOrdered.length - 1 ? allResourcesOrdered[currentIndex + 1] : null;

  // Check if a resource is accessible (all previous resources completed)
  const isResourceAccessible = (resourceId: string, resourceIndex: number) => {
    // First resource is always accessible
    if (resourceIndex === 0) return true;
    // Check if all previous resources are completed
    const previousResources = allResourcesOrdered.slice(0, resourceIndex);
    return previousResources.every(r => completedResources[r.id]);
  };

  // Mark resource as complete
  const markComplete = () => {
    if (currentResourceId) {
      setCompletedResources(prev => ({ ...prev, [currentResourceId!]: true }));
    }
  };

  // Navigate to next resource
  const goToNext = () => {
    if (nextResource) {
      setCurrentSectionId(nextResource.sectionId);
      setCurrentResourceId(nextResource.id);
    }
  };

  // Navigate to previous resource
  const goToPrev = () => {
    if (prevResource) {
      setCurrentSectionId(prevResource.sectionId);
      setCurrentResourceId(prevResource.id);
    }
  };

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

  // Calculate section progress
  const getSectionProgress = (section: Section) => {
    const sectionResources = section.resources;
    if (sectionResources.length === 0) return 0;
    const completed = sectionResources.filter(r => completedResources[r.id]).length;
    return (completed / sectionResources.length) * 100;
  };

  const totalDuration = sections.reduce(
    (sum, s) => sum + s.resources.reduce((rSum, r) => rSum + (r.durationMins || 0), 0),
    0
  );

  // Mobile sidebar state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileSidebarOpen(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-blue-600 p-3 text-white shadow-lg lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Sidebar - Fixed navigation */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-80 transform border-r border-slate-200 bg-white transition-transform duration-300 lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-16'}
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="border-b border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:block"
              >
                {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {sidebarOpen && (
              <>
                <h2 className="mt-3 font-semibold text-slate-900 truncate">{course.title}</h2>
                
                {/* Course Progress Bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>{Math.round(courseProgress)}% complete</span>
                    <span>{completedCount}/{totalResources} items</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100">
                    <div
                      className="h-1.5 rounded-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${courseProgress}%` }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Navigation Tree */}
          <nav className="flex-1 overflow-y-auto p-2">
            {sections.map((section, idx) => {
              const isExpanded = expandedSections.has(section.id);
              const sectionProgress = getSectionProgress(section);
              const isComplete = sectionProgress === 100;

              return (
                <div key={section.id} className="mb-1">
                  <button
                    onClick={() => {
                      toggleSection(section.id);
                      if (!currentResourceId) {
                        setCurrentSectionId(section.id);
                      }
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg p-2 text-left transition ${
                      currentSectionId === section.id && !currentResourceId
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-slate-300 flex-shrink-0" />
                    )}
                    {sidebarOpen && (
                      <>
                        <span className="flex-1 text-sm font-medium truncate">{section.title}</span>
                        <div className="flex items-center gap-1">
                          {sectionProgress > 0 && sectionProgress < 100 && (
                            <span className="text-xs text-slate-400">{Math.round(sectionProgress)}%</span>
                          )}
                          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </>
                    )}
                  </button>

                  {isExpanded && sidebarOpen && (
                    <div className="ml-6 mt-1 space-y-1">
                      {section.resources.map((resource, rIdx) => {
                        const resourceIndex = allResourcesOrdered.findIndex(r => r.id === resource.id);
                        const isAccessible = isResourceAccessible(resource.id, resourceIndex);
                        const isCompleted = completedResources[resource.id];
                        const isActive = currentResourceId === resource.id;

                        return (
                          <button
                            key={resource.id}
                            onClick={() => {
                              if (isAccessible) {
                                setCurrentSectionId(section.id);
                                setCurrentResourceId(resource.id);
                                if (window.innerWidth < 1024) setMobileSidebarOpen(false);
                              }
                            }}
                            disabled={!isAccessible}
                            className={`flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm transition ${
                              isActive
                                ? 'bg-blue-100 text-blue-700'
                                : isAccessible
                                ? 'hover:bg-slate-50'
                                : 'cursor-not-allowed opacity-50'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                            ) : isAccessible ? (
                              <div className="h-3.5 w-3.5 rounded-full border border-slate-300 flex-shrink-0" />
                            ) : (
                              <Lock className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                            )}
                            <span className="truncate">{resource.title}</span>
                            {resource.durationMins && (
                              <span className="ml-auto text-xs text-slate-400">{resource.durationMins}min</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Exit Preview Button */}
          {onExitPreview && sidebarOpen && (
            <div className="border-t border-slate-200 p-4">
              <button
                onClick={onExitPreview}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-100"
              >
                <Eye className="h-4 w-4" />
                Exit Student Preview
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {currentResource ? (
          // Resource Detail View
          <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
            {/* Breadcrumb Navigation */}
            <nav className="mb-6 text-sm">
              <ol className="flex flex-wrap items-center gap-2">
                <li>
                  <button
                    onClick={() => {
                      setCurrentResourceId(null);
                      setCurrentSectionId(sections[0]?.id);
                    }}
                    className="flex items-center gap-1 text-slate-500 hover:text-slate-700"
                  >
                    <Home className="h-3.5 w-3.5" />
                    <span>{course.title}</span>
                  </button>
                </li>
                <li className="text-slate-300">/</li>
                <li className="text-slate-600">{currentSection?.title}</li>
                <li className="text-slate-300">/</li>
                <li className="text-slate-900 font-medium truncate">{currentResource.title}</li>
              </ol>
            </nav>

            {/* Resource Content */}
            <div className="rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 sm:p-8">
                <h1 className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl">{currentResource.title}</h1>
                
                {/* Resource Type Badge */}
                <div className="mb-4 flex items-center gap-2">
                  {RESOURCE_ICONS[currentResource.type]}
                  <span className="text-sm text-slate-500">{RESOURCE_LABELS[currentResource.type]}</span>
                  {currentResource.durationMins && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1 text-sm text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDuration(currentResource.durationMins)}
                      </span>
                    </>
                  )}
                </div>

                {/* Resource Media */}
                {(currentResource.fileUrl || currentResource.externalUrl) && (
                  <div className="mb-6">
                    {currentResource.type === 'VIDEO_LINK' && (
                      <div className="aspect-video rounded-lg bg-slate-900 overflow-hidden">
                        <iframe
                          src={currentResource.externalUrl}
                          className="h-full w-full"
                          allowFullScreen
                          title={currentResource.title}
                        />
                      </div>
                    )}
                    {currentResource.type === 'PDF' && (
                      <iframe
                        src={currentResource.fileUrl}
                        className="h-[500px] w-full rounded-lg border"
                        title={currentResource.title}
                      />
                    )}
                    {currentResource.type === 'IMAGE' && (
                      <img
                        src={currentResource.fileUrl || undefined}
                        alt={currentResource.title}
                        className="max-h-[500px] w-auto mx-auto rounded-lg"
                      />
                    )}
                    {currentResource.type === 'EXTERNAL_LINK' && (
                      <a
                        href={currentResource.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open Resource
                      </a>
                    )}
                  </div>
                )}

                {/* Description */}
                {currentResource.description && (
                  <div className="mb-6 rounded-lg bg-slate-50 p-4">
                    <h3 className="mb-2 font-semibold text-slate-900">Description</h3>
                    <p className="text-slate-600">{currentResource.description}</p>
                  </div>
                )}

                {/* Completion and Navigation */}
                <div className="mt-8 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-3">
                    <button
                      onClick={goToPrev}
                      disabled={!prevResource}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </button>
                    <button
                      onClick={goToNext}
                      disabled={!nextResource}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {!completedResources[currentResource.id] && (
                    <button
                      onClick={markComplete}
                      className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mark as Complete
                    </button>
                  )}
                  {completedResources[currentResource.id] && (
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Completed</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Discussion / Notes Section */}
            <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-3">
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  <MessageSquare className="h-4 w-4" />
                  Notes & Discussion
                  <ChevronDown className={`h-4 w-4 transition-transform ${showNotes ? 'rotate-180' : ''}`} />
                </button>
              </div>
              {showNotes && (
                <div className="p-6">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Your Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Take notes for this lesson..."
                    className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                  <div className="mt-3 flex gap-2">
                    <button className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
                      <ThumbsUp className="h-4 w-4" />
                      Helpful
                    </button>
                    <button className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
                      <Flag className="h-4 w-4" />
                      Report
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Course Overview Page
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Preview Banner */}
            {onExitPreview && (
              <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50">
                <div className="flex items-center justify-between px-4 py-3">
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
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">{course.title}</h1>
              {course.description && (
                <p className="mt-3 text-lg text-slate-600">{course.description}</p>
              )}
            </div>

            {/* Course Stats */}
            <div className="mb-8 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2">
                <User className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">{enrolledStudents} students</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2">
                <BookOpen className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">{sections.length} sections</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2">
                <Clock className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">{formatDuration(totalDuration)} total</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium text-slate-700">{completedCount}/{totalResources} completed</span>
              </div>
            </div>

            {/* Course Progress */}
            <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="mb-3 font-semibold text-slate-900">Your Progress</h2>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${courseProgress}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-slate-600">{Math.round(courseProgress)}%</span>
              </div>
            </div>

            {/* Course Content */}
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Course Content</h2>
            <div className="space-y-3">
              {sections.map((section, idx) => {
                const sectionProgress = getSectionProgress(section);
                const isExpanded = expandedSections.has(section.id);

                return (
                  <div key={section.id} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="flex w-full items-center justify-between p-4 hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-400">Section {idx + 1}</span>
                        <span className="font-semibold text-slate-900">{section.title}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {sectionProgress === 100 ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : sectionProgress > 0 && (
                          <span className="text-xs text-slate-500">{Math.round(sectionProgress)}%</span>
                        )}
                        <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="border-t border-slate-100 p-4 space-y-2">
                        {section.resources.map((resource, rIdx) => {
                          const resourceIndex = allResourcesOrdered.findIndex(r => r.id === resource.id);
                          const isAccessible = isResourceAccessible(resource.id, resourceIndex);
                          const isCompleted = completedResources[resource.id];

                          return (
                            <button
                              key={resource.id}
                              onClick={() => {
                                if (isAccessible) {
                                  setCurrentSectionId(section.id);
                                  setCurrentResourceId(resource.id);
                                }
                              }}
                              disabled={!isAccessible}
                              className={`flex w-full items-center gap-3 rounded-lg p-2 transition ${
                                isAccessible ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-not-allowed opacity-50'
                              }`}
                            >
                              {RESOURCE_ICONS[resource.type]}
                              <span className="flex-1 text-left text-sm text-slate-700">{resource.title}</span>
                              {isCompleted && (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              )}
                              {!isAccessible && !isCompleted && (
                                <Lock className="h-3.5 w-3.5 text-slate-400" />
                              )}
                              {resource.durationMins && (
                                <span className="text-xs text-slate-400">{resource.durationMins} min</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Overlay for mobile sidebar */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
    </div>
  );
}
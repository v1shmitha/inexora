"use client";

import { useState, useEffect } from "react";
import { Video, FileText, Users, TrendingUp, Loader2, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "~/lib/supabase/client";

interface CourseLecturer {
  id: string;
  role: string;
  course: {
    id: string;
    title: string;
    code: string | null;
    program: { title: string }[] | null;
  }[] | null;
}

interface LibraryResource {
  id: string;
  title: string;
  type: string;
  views: number;
  downloads: number;
  isFree: boolean;
  createdAt: string;
}

export default function LecturerDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState<string | null>(null);
  const [lecturerId, setLecturerId] = useState<string | null>(null);
  const [courseLecturers, setCourseLecturers] = useState<CourseLecturer[]>([]);
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("Profile")
        .select("fullName")
        .eq("id", user.id)
        .single();

      setFullName(profile?.fullName ?? null);

      // Get lecturer record
      const { data: lecturer } = await supabase
        .from("Lecturer")
        .select("id")
        .eq("profileId", user.id)
        .single();

      if (lecturer) {
        setLecturerId(lecturer.id);
        await fetchDashboardData(lecturer.id, user.id);
      } else {
        setLoading(false);
      }
    };

    void init();
  }, []);

  const fetchDashboardData = async (lId: string, userId: string) => {
    try {
      setLoading(true);

      const [coursesRes, resourcesRes] = await Promise.all([
        // Get courses this lecturer is assigned to
        supabase
          .from("CourseLecturer")
          .select("id, role, course:Course(id, title, code, program:Program(title))")
          .eq("lecturerId", lId),

        // Get library resources uploaded by this user
        supabase
          .from("LibraryResource")
          .select("id, title, type, views, downloads, isFree, createdAt")
          .eq("uploadedBy", userId)
          .order("createdAt", { ascending: false })
          .limit(10),
      ]);

      if (coursesRes.data) setCourseLecturers(coursesRes.data as CourseLecturer[]);
      if (resourcesRes.data) setResources(resourcesRes.data as LibraryResource[]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalViews = resources.reduce((sum, r) => sum + (r.views ?? 0), 0);
  const totalDownloads = resources.reduce((sum, r) => sum + (r.downloads ?? 0), 0);

  const resourceTypeColors: Record<string, string> = {
    EBOOK: "bg-blue-100 text-blue-700",
    JOURNAL: "bg-purple-100 text-purple-700",
    VIDEO_LECTURE: "bg-red-100 text-red-700",
    RESEARCH_PAPER: "bg-orange-100 text-orange-700",
    SIMULATION: "bg-green-100 text-green-700",
    PAST_PAPER: "bg-gray-100 text-gray-700",
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">Lecturer Dashboard</h1>
            <p className="text-gray-600">
              Welcome back,{" "}
              <span className="font-semibold text-blue-600">{fullName ?? "Lecturer"}</span>
            </p>
          </div>
          <button
            onClick={() => router.push("/resources")}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            + Upload Resource
          </button>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-6 md:grid-cols-4">
          {[
            { icon: Video, color: "text-blue-600", value: courseLecturers.length, label: "Assigned Courses" },
            { icon: FileText, color: "text-green-600", value: resources.length, label: "Resources" },
            { icon: Users, color: "text-orange-600", value: totalViews, label: "Total Views" },
            { icon: TrendingUp, color: "text-purple-600", value: totalDownloads, label: "Downloads" },
          ].map(({ icon: Icon, color, value, label }) => (
            <div key={label} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <Icon className={`mb-2 h-8 w-8 ${color}`} />
              <div className="mb-1 text-3xl font-bold text-gray-900">{value}</div>
              <div className="text-sm text-gray-600">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-8 md:grid-cols-2">

          {/* Courses */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900">My Courses</h2>
            </div>
            <div className="p-6">
              {courseLecturers.length === 0 ? (
                <div className="py-8 text-center">
                  <BookOpen className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                  <p className="text-gray-600">Not assigned to any courses yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {courseLecturers.slice(0, 5).map((cl) => {
                    const course = Array.isArray(cl.course) ? cl.course[0] : null;
                    const program = Array.isArray(course?.program) ? course?.program[0] : null;
                    return (
                      <div key={cl.id} className="rounded-lg border border-gray-200 p-4">
                        <h3 className="mb-1 font-semibold text-gray-900">
                          {course?.title ?? "Unknown Course"}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          {course?.code && <span className="font-mono text-xs">{course.code}</span>}
                          {program?.title && <span className="text-gray-500">{program.title}</span>}
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            cl.role === "LECTURER"
                              ? "bg-blue-100 text-blue-700"
                              : cl.role === "CO_LECTURER"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-orange-100 text-orange-700"
                          }`}>
                            {cl.role.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Resources */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900">My Resources</h2>
              <button
                onClick={() => router.push("/resources")}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-700"
              >
                Add Resource
              </button>
            </div>
            <div className="p-6">
              {resources.length === 0 ? (
                <div className="py-8 text-center">
                  <FileText className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                  <p className="text-gray-600">No resources uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {resources.slice(0, 5).map((resource) => (
                    <div key={resource.id} className="rounded-lg border border-gray-200 p-4">
                      <h3 className="mb-2 font-semibold text-gray-900">{resource.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            resourceTypeColors[resource.type] ?? "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {resource.type.replace("_", " ")}
                        </span>
                        <span>{resource.views} views</span>
                        <span>{resource.downloads} downloads</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${
                          resource.isFree
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {resource.isFree ? "Free" : "Premium"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
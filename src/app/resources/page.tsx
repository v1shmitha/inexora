"use client";

import { useRouter } from "next/navigation";
import { BookOpen, Video, FileText, Download } from "lucide-react";

export default function Resources() {
  const router = useRouter();

  const resourceCategories = [
    {
      icon: BookOpen,
      title: "Digital Library",
      description: "Access textbooks, journals, and academic publications",
      color: "blue",
    },
    {
      icon: Video,
      title: "Video Lectures",
      description: "Watch recorded lectures from expert educators",
      color: "green",
    },
    {
      icon: FileText,
      title: "Research Papers",
      description: "Browse academic research and publications",
      color: "orange",
    },
    {
      icon: Download,
      title: "Study Materials",
      description: "Download course materials, notes, and guides",
      color: "purple",
    },
  ];

  const colorClasses: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    orange: "bg-orange-100 text-orange-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-50 to-blue-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold text-gray-900 md:text-5xl">
              Educational Resources
            </h1>
            <p className="text-xl leading-relaxed text-gray-600">
              Access a comprehensive collection of learning materials, lectures,
              and research to support your educational journey
            </p>
          </div>
        </div>
      </section>

      {/* Resource Categories */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 grid gap-8 md:grid-cols-2">
            {resourceCategories.map((category, index) => {
              const colorClass = colorClasses[category.color] ?? "bg-blue-100 text-blue-600";
              return (
                <div
                  key={index}
                  className="group rounded-xl border border-gray-200 bg-white p-8 transition hover:shadow-xl"
                >
                  <div
                    className={`mb-6 flex h-16 w-16 items-center justify-center rounded-xl transition group-hover:scale-110 ${colorClass}`}
                  >
                    <category.icon className="h-8 w-8" />
                  </div>
                  <h3 className="mb-3 text-2xl font-bold text-gray-900">
                    {category.title}
                  </h3>
                  <p className="mb-6 leading-relaxed text-gray-600">
                    {category.description}
                  </p>
                  <button
                    onClick={() => router.push("/signup")}
                    className="flex items-center font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Access Resources
                    <svg
                      className="ml-2 h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Coming Soon */}
          <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-slate-50 p-8 md:p-12">
            <div className="mx-auto max-w-3xl text-center">
              <BookOpen className="mx-auto mb-6 h-16 w-16 text-blue-600" />
              <h2 className="mb-4 text-3xl font-bold text-gray-900">
                Coming Soon
              </h2>
              <p className="mb-8 text-lg leading-relaxed text-gray-600">
                We&apos;re building a comprehensive digital library with
                thousands of resources. Sign up now to get early access when we
                launch.
              </p>
              <button
                onClick={() => router.push("/signup")}
                className="rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white transition hover:bg-blue-700"
              >
                Get Early Access
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* For Lecturers */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
              For Lecturers &amp; Content Creators
            </h2>
            <p className="mx-auto max-w-3xl text-xl text-gray-600">
              Share your knowledge with thousands of students. Upload lectures,
              create courses, and contribute to Sri Lanka&apos;s digital
              education ecosystem.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Video,
                color: "bg-blue-100 text-blue-600",
                title: "Upload Content",
                desc: "Share video lectures and learning materials",
              },
              {
                icon: FileText,
                color: "bg-green-100 text-green-600",
                title: "Track Engagement",
                desc: "Monitor views and student interactions",
              },
              {
                icon: BookOpen,
                color: "bg-orange-100 text-orange-600",
                title: "Build Your Profile",
                desc: "Establish yourself as an expert educator",
              },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="rounded-xl bg-white p-6 text-center">
                <div
                  className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${color}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-bold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-600">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => router.push("/signup")}
              className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Join as Lecturer
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
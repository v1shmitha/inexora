"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  BookOpen,
  Briefcase,
  FlaskConical,
  Clock,
  Award,
  TrendingUp,
} from "lucide-react";
import { createClient } from "~/lib/supabase/client";

// ── Types ──────────────────────────────────────────────────────────────────
interface Provider {
  name: string;
  country: string;
  logo_url: string | null;
}

interface ProgramCategory {
  id: string;
  name: string;
  display_order: number;
}

interface Program {
  id: string;
  title: string;
  description: string;
  duration_months: number;
  credits: number;
  is_credit_transferable: boolean;
  fees_lkr: number | null;
  is_published: boolean;
  category_id: string;
  provider: Provider | null;
  category: ProgramCategory | null;
}

// ── Component ──────────────────────────────────────────────────────────────
export default function Programs() {
  const [categories, setCategories] = useState<ProgramCategory[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const supabase = createClient();

  // Fetch categories on mount
  useEffect(() => {
    void fetchCategories();
  }, []);

  // Fetch programs whenever selectedCategory changes
  useEffect(() => {
    void fetchPrograms();
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("program_categories")
        .select("*")
        .order("display_order");

      if (error) throw error;
      setCategories(data ?? []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("programs")
        .select(`
          *,
          provider:providers(name, country, logo_url),
          category:program_categories(name)
        `)
        .eq("is_published", true);

      if (selectedCategory) query = query.eq("category_id", selectedCategory);

      const { data, error } = await query.limit(20);
      if (error) throw error;
      setPrograms(data ?? []);
    } catch (error) {
      console.error("Error fetching programs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/signup");
    } else {
      alert("Enrollment flow coming soon!");
    }
  };

  const categoryIcons: Record<string, typeof GraduationCap> = {
    "Entry-Level & Bridging": GraduationCap,
    "Degree Pathways": BookOpen,
    "Career-Oriented Programs": Briefcase,
    "Research & Postgraduate": FlaskConical,
  };

  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-50 to-blue-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold text-gray-900 md:text-5xl">
              Programs &amp; Pathways
            </h1>
            <p className="text-xl leading-relaxed text-gray-600">
              Explore diverse educational programs from leading institutions.
              Build your future with stackable credentials and flexible learning
              pathways.
            </p>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="border-b border-gray-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`rounded-lg px-6 py-3 font-medium transition ${
                selectedCategory === null
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Programs
            </button>
            {categories.map((category) => {
              const Icon = categoryIcons[category.name] ?? BookOpen;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center space-x-2 rounded-lg px-6 py-3 font-medium transition ${
                    selectedCategory === category.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{category.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="py-12 text-center">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
              <p className="mt-4 text-gray-600">Loading programs...</p>
            </div>
          ) : programs.length === 0 ? (
            <div className="py-12 text-center">
              <BookOpen className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                No programs available
              </h3>
              <p className="text-gray-600">Check back soon for new programs.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {programs.map((program) => (
                <div
                  key={program.id}
                  className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-xl"
                >
                  <div className="p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="mb-2 text-lg font-bold text-gray-900 transition group-hover:text-blue-600">
                          {program.title}
                        </h3>
                        <p className="mb-2 text-sm text-gray-600">
                          {program.provider?.name}
                        </p>
                      </div>
                    </div>

                    <p className="mb-4 line-clamp-3 text-sm text-gray-600">
                      {program.description}
                    </p>

                    <div className="mb-4 space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="mr-2 h-4 w-4" />
                        <span>{program.duration_months} months</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Award className="mr-2 h-4 w-4" />
                        <span>{program.credits} credits</span>
                      </div>
                      {program.is_credit_transferable && (
                        <div className="flex items-center text-sm text-green-600">
                          <TrendingUp className="mr-2 h-4 w-4" />
                          <span>Credit transferable</span>
                        </div>
                      )}
                    </div>

                    {program.fees_lkr && (
                      <div className="mb-4 text-lg font-bold text-gray-900">
                        LKR {program.fees_lkr.toLocaleString()}
                      </div>
                    )}

                    <button
                      onClick={handleApply}
                      className="w-full rounded-lg bg-blue-600 py-2 font-medium text-white transition hover:bg-blue-700"
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Stackable Credentials Info */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-white p-8 shadow-lg md:p-12">
            <h2 className="mb-6 text-3xl font-bold text-gray-900">
              How Stackable Credentials Work
            </h2>
            <p className="mb-6 text-lg leading-relaxed text-gray-600">
              Build your education incrementally. Each program you complete adds
              credits to your profile, which can be transferred and stacked
              toward higher qualifications. Start with a certificate, build to a
              diploma, and continue to a degree—all while gaining practical
              skills.
            </p>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Start Anywhere",
                  desc: "Choose a program that matches your current level",
                },
                {
                  step: "2",
                  title: "Earn Credits",
                  desc: "Complete programs and accumulate transferable credits",
                },
                {
                  step: "3",
                  title: "Progress Higher",
                  desc: "Use credits toward advanced qualifications",
                },
              ].map(({ step, title, desc }) => (
                <div key={step} className="text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <span className="text-xl font-bold text-blue-600">
                      {step}
                    </span>
                  </div>
                  <h3 className="mb-2 font-semibold text-gray-900">{title}</h3>
                  <p className="text-sm text-gray-600">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

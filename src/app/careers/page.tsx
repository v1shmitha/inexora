"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, MapPin, Clock, DollarSign, Building2 } from "lucide-react";
import { createClient } from "~/lib/supabase/client";

interface Job {
  id: string;
  title: string;
  company_name: string;
  description: string;
  location: string | null;
  job_type: string;
  salary_range: string | null;
  experience_years: number;
  is_internship: boolean;
  is_active: boolean;
  required_skills: string[] | null;
  created_at: string;
}

type FilterType = "all" | "internship" | "job";

export default function Careers() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    void fetchJobs();
  }, [filter]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("jobs")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (filter === "internship") query = query.eq("is_internship", true);
      else if (filter === "job") query = query.eq("is_internship", false);

      const { data, error } = await query.limit(20);
      if (error) throw error;
      setJobs(data ?? []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) router.push("/signup");
    else alert("Application flow coming soon!");
  };

  const handlePostOpportunity = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) router.push("/signup");
    else alert("Employer posting flow coming soon!");
  };

  const filters: { label: string; value: FilterType }[] = [
    { label: "All Opportunities", value: "all" },
    { label: "Internships", value: "internship" },
    { label: "Full-Time Jobs", value: "job" },
  ];

  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-50 to-blue-50 py-20 text-center">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="mb-6 text-4xl font-bold text-gray-900 md:text-5xl">
            Careers &amp; Industry Connections
          </h1>
          <p className="text-xl leading-relaxed text-gray-600">
            Connect your education to employment. Discover internships and job
            opportunities aligned with your skills and qualifications.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b border-gray-200 bg-white py-12">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-3 px-4 sm:px-6 lg:px-8">
          {filters.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`rounded-lg px-6 py-3 font-medium transition ${
                filter === value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Jobs List */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="py-12 text-center">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
              <p className="mt-4 text-gray-600">Loading opportunities...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="py-12 text-center">
              <Briefcase className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                No opportunities available
              </h3>
              <p className="text-gray-600">Check back soon for new postings.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-xl border border-gray-200 bg-white p-6 transition hover:shadow-lg"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      <div className="mb-4 flex items-start space-x-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                          <Briefcase className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="mb-1 text-xl font-bold text-gray-900">
                            {job.title}
                          </h3>
                          <p className="mb-2 text-gray-600">{job.company_name}</p>
                          {job.is_internship && (
                            <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                              Internship
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="mb-4 line-clamp-2 text-gray-600">
                        {job.description}
                      </p>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        {job.location && (
                          <div className="flex items-center">
                            <MapPin className="mr-1 h-4 w-4" />
                            <span>{job.location}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <Clock className="mr-1 h-4 w-4" />
                          <span>{job.job_type}</span>
                        </div>
                        {job.salary_range && (
                          <div className="flex items-center">
                            <DollarSign className="mr-1 h-4 w-4" />
                            <span>{job.salary_range}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <Building2 className="mr-1 h-4 w-4" />
                          <span>{job.experience_years}+ years exp</span>
                        </div>
                      </div>

                      {job.required_skills && job.required_skills.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {job.required_skills.slice(0, 5).map((skill, idx) => (
                            <span
                              key={idx}
                              className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 md:ml-6 md:mt-0">
                      <button
                        onClick={handleApply}
                        className="whitespace-nowrap rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition hover:bg-blue-700"
                      >
                        Apply Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Employer CTA */}
      <section className="bg-blue-600 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <Briefcase className="mx-auto mb-6 h-16 w-16" />
          <h2 className="mb-6 text-3xl font-bold md:text-4xl">For Employers</h2>
          <p className="mb-8 text-xl leading-relaxed text-blue-100">
            Access a pool of qualified candidates with verified educational
            credentials. Post job openings and internships to connect with the
            right talent.
          </p>
          <button
            onClick={handlePostOpportunity}
            className="rounded-lg bg-white px-8 py-4 text-lg font-semibold text-blue-600 transition hover:bg-blue-50"
          >
            Post an Opportunity
          </button>
        </div>
      </section>
    </div>
  );
}
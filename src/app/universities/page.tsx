"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, MapPin, Globe, Users } from "lucide-react";
import { createClient } from "~/lib/supabase/client";

interface Provider {
  id: string;
  name: string;
  type: string;
  description: string | null;
  country: string;
  website: string | null;
  logo_url: string | null;
  capacity: number;
  partnership_status: string;
}

export default function Universities() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    void fetchProviders();
  }, [filter]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("providers")
        .select("*")
        .eq("partnership_status", "active");

      if (filter !== "all") {
        query = query.eq("country", filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setProviders(data ?? []);
    } catch (error) {
      console.error("Error fetching providers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPrograms = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/signup");
    } else {
      alert("Provider programs view coming soon!");
    }
  };

  const handlePartner = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/signup");
    } else {
      alert("Partner flow coming soon!");
    }
  };

  const filters = [
    { label: "All Partners", value: "all" },
    { label: "Sri Lankan", value: "Sri Lanka" },
    { label: "International", value: "International" },
  ];

  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-50 to-blue-50 py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="mb-6 text-4xl font-bold text-gray-900 md:text-5xl">
            Partner Universities &amp; Institutions
          </h1>
          <p className="text-xl leading-relaxed text-gray-600">
            Access programs from recognized local and international institutions
            through our trusted network
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

      {/* Providers Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="py-12 text-center">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
              <p className="mt-4 text-gray-600">Loading institutions...</p>
            </div>
          ) : providers.length === 0 ? (
            <div className="py-12 text-center">
              <Building2 className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                No institutions found
              </h3>
              <p className="text-gray-600">Check back soon for new partners.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className="group rounded-xl border border-gray-200 bg-white p-6 transition hover:shadow-xl"
                >
                  <div className="mb-4 flex items-start space-x-4">
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                      {provider.logo_url ? (
                        <img
                          src={provider.logo_url}
                          alt={provider.name}
                          className="h-12 w-12 object-contain"
                        />
                      ) : (
                        <Building2 className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-1 font-bold text-gray-900 transition group-hover:text-blue-600">
                        {provider.name}
                      </h3>
                      <p className="text-sm text-gray-600">{provider.type}</p>
                    </div>
                  </div>

                  {provider.description && (
                    <p className="mb-4 line-clamp-3 text-sm text-gray-600">
                      {provider.description}
                    </p>
                  )}

                  <div className="mb-4 space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="mr-2 h-4 w-4" />
                      <span>{provider.country}</span>
                    </div>
                    {provider.website && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Globe className="mr-2 h-4 w-4" />
                        <a
                          href={provider.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-600"
                        >
                          Visit Website
                        </a>
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="mr-2 h-4 w-4" />
                      <span>Capacity: {provider.capacity} students</span>
                    </div>
                  </div>

                  <button
                    onClick={handleViewPrograms}
                    className="w-full rounded-lg bg-blue-600 py-2 font-medium text-white transition hover:bg-blue-700"
                  >
                    View Programs
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Partner CTA */}
      <section className="bg-blue-600 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <Building2 className="mx-auto mb-6 h-16 w-16" />
          <h2 className="mb-6 text-3xl font-bold md:text-4xl">
            Become a Partner Institution
          </h2>
          <p className="mb-8 text-xl leading-relaxed text-blue-100">
            Join our network and reach thousands of motivated students across
            Sri Lanka. Expand your impact and contribute to national education
            development.
          </p>
          <button
            onClick={handlePartner}
            className="rounded-lg bg-white px-8 py-4 text-lg font-semibold text-blue-600 transition hover:bg-blue-50"
          >
            Partner With Us
          </button>
        </div>
      </section>
    </div>
  );
}
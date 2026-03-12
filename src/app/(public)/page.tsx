"use client";

import {
  ArrowRight,
  Users,
  Building2,
  Briefcase,
  BookOpen,
  TrendingUp,
  Award,
  Globe,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const stats = [
    { label: "Students Enrolled", value: "10,000+", icon: Users },
    { label: "Partner Universities", value: "50+", icon: Building2 },
    { label: "Programs Offered", value: "200+", icon: BookOpen },
    { label: "Career Placements", value: "85%", icon: Briefcase },
  ];

  const features = [
    {
      icon: BookOpen,
      title: "Stackable Credentials",
      description:
        "Build your education pathway with credit-transferable programs",
    },
    {
      icon: Globe,
      title: "Global Partnerships",
      description:
        "Access local and international universities in one platform",
    },
    {
      icon: TrendingUp,
      title: "Career Pathways",
      description:
        "Direct connection to employment and internship opportunities",
    },
    {
      icon: Award,
      title: "Quality Assured",
      description:
        "UGC/TVEC approved programs meeting national standards",
    },
  ];

  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-800 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Sri Lanka's Gateway to
              <br />
              Global Education & Careers
            </h1>

            <p className="text-xl md:text-2xl mb-8 text-blue-100 leading-relaxed">
              Connecting students with world-class education pathways and career
              opportunities through a unified national platform
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push("/programs")}
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:bg-blue-50 transition group"
              >
                Explore Pathways
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition" />
              </button>

              <button
                onClick={() => router.push("/login")}
                className="inline-flex items-center justify-center px-8 py-4 bg-blue-700 text-white rounded-lg font-semibold text-lg hover:bg-blue-800 transition border-2 border-white"
              >
                Apply Now
              </button>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center"
              >
                <stat.icon className="h-8 w-8 mx-auto mb-3 text-blue-200" />
                <div className="text-3xl font-bold mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-blue-100">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How DEH-SL Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A seamless ecosystem connecting all stakeholders in Sri Lanka's
              education landscape
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <InfoCard
              icon={Users}
              title="Students"
              description="Discover programs, build stackable credentials, and access career opportunities"
            />

            <InfoCard
              icon={Building2}
              title="Universities"
              description="Reach more students, manage programs, and track outcomes efficiently"
            />

            <InfoCard
              icon={Briefcase}
              title="Employers"
              description="Access skilled talent and offer internships aligned with educational programs"
            />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose DEH-SL
            </h2>
            <p className="text-xl text-gray-600">
              Trusted by students, institutions, and employers nationwide
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start space-x-4 p-6 rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Your Journey?
          </h2>

          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of students already building their future through
            DEH-SL
          </p>

          <button
            onClick={() => router.push("/signup")}
            className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:bg-blue-50 transition"
          >
            Get Started Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      </section>
    </div>
  );
}

/* Small reusable card */
function InfoCard({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-xl p-8 shadow-lg text-center group hover:shadow-xl transition">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition">
        <Icon className="h-8 w-8 text-blue-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">
        {title}
      </h3>
      <p className="text-gray-600 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

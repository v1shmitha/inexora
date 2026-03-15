"use client";

import { useRouter } from "next/navigation";
import { Mail, Phone, MapPin, Users, Building2, Briefcase, Shield } from "lucide-react";

export default function Contact() {
  const router = useRouter();

  const contactCategories = [
    {
      icon: Users,
      title: "For Students",
      description: "Questions about programs, applications, or your student journey?",
      email: "students@iNEXORA.lk",
      action: "Student Portal",
    },
    {
      icon: Building2,
      title: "For Universities",
      description: "Interested in partnering with iNEXORA?",
      email: "partners@iNEXORA.lk",
      action: "Partner With Us",
    },
    {
      icon: Briefcase,
      title: "For Employers",
      description: "Looking to recruit talent or post opportunities?",
      email: "employers@iNEXORA.lk",
      action: "Employer Access",
    },
    {
      icon: Shield,
      title: "For Government & NGOs",
      description: "Collaboration and regulatory inquiries",
      email: "info@iNEXORA.lk",
      action: "Contact Us",
    },
  ];

  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-50 to-blue-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold text-gray-900 md:text-5xl">
              Get in Touch
            </h1>
            <p className="text-xl leading-relaxed text-gray-600">
              We&apos;re here to help. Choose the category that best matches
              your inquiry.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Categories */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 grid gap-6 md:grid-cols-2">
            {contactCategories.map((category, index) => (
              <div
                key={index}
                className="group rounded-xl border border-gray-200 bg-white p-8 transition hover:shadow-xl"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 transition group-hover:scale-110">
                  <category.icon className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="mb-3 text-2xl font-bold text-gray-900">
                  {category.title}
                </h3>
                <p className="mb-4 leading-relaxed text-gray-600">
                  {category.description}
                </p>
                <div className="mb-4 flex items-center text-sm text-gray-600">
                  <Mail className="mr-2 h-4 w-4" />
                  <a
                    href={`mailto:${category.email}`}
                    className="hover:text-blue-600"
                  >
                    {category.email}
                  </a>
                </div>
                <button
                  onClick={() => router.push("/signup")}
                  className="flex items-center font-semibold text-blue-600 hover:text-blue-700"
                >
                  {category.action}
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
            ))}
          </div>

          {/* Office Info */}
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-slate-50 p-8">
              <h3 className="mb-6 text-2xl font-bold text-gray-900">
                Head Office
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <MapPin className="mt-1 h-6 w-6 flex-shrink-0 text-blue-600" />
                  <div>
                    <p className="mb-1 font-semibold text-gray-900">Address</p>
                    <p className="leading-relaxed text-gray-600">
                      Digital Educational Hub
                      <br />
                      123 Education Lane
                      <br />
                      Colombo 07, Sri Lanka
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <Phone className="mt-1 h-6 w-6 flex-shrink-0 text-blue-600" />
                  <div>
                    <p className="mb-1 font-semibold text-gray-900">Phone</p>
                    <p className="text-gray-600">+94 11 234 5678</p>
                    <p className="text-gray-600">+94 77 123 4567</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <Mail className="mt-1 h-6 w-6 flex-shrink-0 text-blue-600" />
                  <div>
                    <p className="mb-1 font-semibold text-gray-900">Email</p>
                    <p className="text-gray-600">info@iNEXORA.lk</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-slate-50 p-8">
              <h3 className="mb-6 text-2xl font-bold text-gray-900">
                Office Hours
              </h3>
              <div className="space-y-3">
                {[
                  { day: "Monday - Friday", hours: "8:30 AM - 5:00 PM" },
                  { day: "Saturday", hours: "9:00 AM - 1:00 PM" },
                  { day: "Sunday", hours: "Closed" },
                ].map(({ day, hours }, i, arr) => (
                  <div
                    key={day}
                    className={`flex justify-between py-2 ${i < arr.length - 1 ? "border-b border-gray-200" : ""}`}
                  >
                    <span className="font-medium text-gray-900">{day}</span>
                    <span className="text-gray-600">{hours}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-lg border border-blue-200 bg-white p-4">
                <p className="text-sm text-gray-600">
                  For urgent inquiries outside office hours, please email us and
                  we&apos;ll respond within 24 hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-6 text-3xl font-bold md:text-4xl">
            Ready to Transform Education?
          </h2>
          <p className="mb-8 text-xl leading-relaxed text-blue-100">
            Join thousands already benefiting from iNEXORA&apos;s unified
            education platform
          </p>
          <button
            onClick={() => router.push("/signup")}
            className="rounded-lg bg-white px-8 py-4 text-lg font-semibold text-blue-600 transition hover:bg-blue-50"
          >
            Get Started Today
          </button>
        </div>
      </section>
    </div>
  );
}
import { Mail, Phone, MapPin, Users, Building2, Briefcase, Shield } from 'lucide-react';

interface ContactProps {
  onShowAuth: (mode: 'signup') => void;
}

export default function Contact({ onShowAuth }: ContactProps) {
  const contactCategories = [
    {
      icon: Users,
      title: 'For Students',
      description: 'Questions about programs, applications, or your student journey?',
      email: 'students@deh-sl.lk',
      action: 'Student Portal',
    },
    {
      icon: Building2,
      title: 'For Universities',
      description: 'Interested in partnering with DEH-SL?',
      email: 'partners@deh-sl.lk',
      action: 'Partner With Us',
    },
    {
      icon: Briefcase,
      title: 'For Employers',
      description: 'Looking to recruit talent or post opportunities?',
      email: 'employers@deh-sl.lk',
      action: 'Employer Access',
    },
    {
      icon: Shield,
      title: 'For Government & NGOs',
      description: 'Collaboration and regulatory inquiries',
      email: 'info@deh-sl.lk',
      action: 'Contact Us',
    },
  ];

  return (
    <div className="bg-white min-h-screen">
      <section className="bg-gradient-to-br from-slate-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Get in Touch
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              We're here to help. Choose the category that best matches your inquiry.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {contactCategories.map((category, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-xl transition group"
              >
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                  <category.icon className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{category.title}</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">{category.description}</p>
                <div className="flex items-center text-sm text-gray-600 mb-4">
                  <Mail className="h-4 w-4 mr-2" />
                  <a href={`mailto:${category.email}`} className="hover:text-blue-600">
                    {category.email}
                  </a>
                </div>
                <button
                  onClick={() => onShowAuth('signup')}
                  className="text-blue-600 hover:text-blue-700 font-semibold flex items-center"
                >
                  {category.action}
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Head Office</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <MapPin className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Address</p>
                    <p className="text-gray-600 leading-relaxed">
                      Digital Educational Hub<br />
                      123 Education Lane<br />
                      Colombo 07, Sri Lanka
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <Phone className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Phone</p>
                    <p className="text-gray-600">+94 11 234 5678</p>
                    <p className="text-gray-600">+94 77 123 4567</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <Mail className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Email</p>
                    <p className="text-gray-600">info@deh-sl.lk</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Office Hours</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-900">Monday - Friday</span>
                  <span className="text-gray-600">8:30 AM - 5:00 PM</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-900">Saturday</span>
                  <span className="text-gray-600">9:00 AM - 1:00 PM</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="font-medium text-gray-900">Sunday</span>
                  <span className="text-gray-600">Closed</span>
                </div>
              </div>
              <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600">
                  For urgent inquiries outside office hours, please email us and we'll respond within 24 hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Education?
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Join thousands already benefiting from DEH-SL's unified education platform
          </p>
          <button
            onClick={() => onShowAuth('signup')}
            className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:bg-blue-50 transition"
          >
            Get Started Today
          </button>
        </div>
      </section>
    </div>
  );
}

import { BookOpen, Video, FileText, Download } from 'lucide-react';

interface ResourcesProps {
  onShowAuth: (mode: 'signup') => void;
}

export default function Resources({ onShowAuth }: ResourcesProps) {
  const resourceCategories = [
    {
      icon: BookOpen,
      title: 'Digital Library',
      description: 'Access textbooks, journals, and academic publications',
      color: 'blue',
    },
    {
      icon: Video,
      title: 'Video Lectures',
      description: 'Watch recorded lectures from expert educators',
      color: 'green',
    },
    {
      icon: FileText,
      title: 'Research Papers',
      description: 'Browse academic research and publications',
      color: 'orange',
    },
    {
      icon: Download,
      title: 'Study Materials',
      description: 'Download course materials, notes, and guides',
      color: 'purple',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white min-h-screen">
      <section className="bg-gradient-to-br from-slate-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Educational Resources
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Access a comprehensive collection of learning materials, lectures, and research to support your educational journey
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {resourceCategories.map((category, index) => {
              const colorClass = colorClasses[category.color as keyof typeof colorClasses];
              return (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-xl transition group"
                >
                  <div className={`w-16 h-16 ${colorClass} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition`}>
                    <category.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{category.title}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{category.description}</p>
                  <button
                    onClick={() => onShowAuth('signup')}
                    className="text-blue-600 hover:text-blue-700 font-semibold flex items-center"
                  >
                    Access Resources
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl p-8 md:p-12">
            <div className="max-w-3xl mx-auto text-center">
              <BookOpen className="h-16 w-16 text-blue-600 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Coming Soon
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                We're building a comprehensive digital library with thousands of resources. Sign up now to get early access when we launch.
              </p>
              <button
                onClick={() => onShowAuth('signup')}
                className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition"
              >
                Get Early Access
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              For Lecturers & Content Creators
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Share your knowledge with thousands of students. Upload lectures, create courses, and contribute to Sri Lanka's digital education ecosystem.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Upload Content</h3>
              <p className="text-sm text-gray-600">Share video lectures and learning materials</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Track Engagement</h3>
              <p className="text-sm text-gray-600">Monitor views and student interactions</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Build Your Profile</h3>
              <p className="text-sm text-gray-600">Establish yourself as an expert educator</p>
            </div>
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => onShowAuth('signup')}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Join as Lecturer
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

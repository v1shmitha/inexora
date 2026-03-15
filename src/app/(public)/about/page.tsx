import { Target, Eye, Heart, TrendingUp, Users, Globe } from 'lucide-react';

export default function About() {
  const values = [
    {
      icon: Target,
      title: 'Excellence',
      description: 'Committed to maintaining the highest standards in education',
    },
    {
      icon: Globe,
      title: 'Accessibility',
      description: 'Making quality education accessible to all Sri Lankans',
    },
    {
      icon: Users,
      title: 'Inclusivity',
      description: 'Creating opportunities regardless of background or location',
    },
    {
      icon: TrendingUp,
      title: 'Innovation',
      description: 'Leveraging technology to transform education delivery',
    },
  ];

  const impacts = [
    {
      metric: 'Education Access',
      description: 'Breaking geographical and economic barriers to quality education',
    },
    {
      metric: 'Skill Development',
      description: 'Aligning education with industry needs and global standards',
    },
    {
      metric: 'Economic Growth',
      description: 'Contributing to national development through skilled workforce',
    },
    {
      metric: 'Social Mobility',
      description: 'Creating pathways for career advancement and prosperity',
    },
  ];

  return (
    <div className="bg-white">
      <section className="bg-gradient-to-br from-slate-50 to-blue-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            About iNEXORA
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Building Sri Lanka's digital education infrastructure to connect students with world-class learning opportunities and career pathways
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <Eye className="h-8 w-8 text-blue-600" />
                <h2 className="text-3xl font-bold text-gray-900">Our Vision</h2>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                To establish Sri Lanka as a regional hub for digital education excellence, where every citizen has seamless access to quality learning pathways that lead to meaningful careers and contribute to national prosperity.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                We envision a future where education barriers are eliminated through technology, creating equal opportunities for all Sri Lankans to achieve their potential.
              </p>
            </div>

            <div>
              <div className="flex items-center space-x-3 mb-6">
                <Target className="h-8 w-8 text-blue-600" />
                <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                To create a unified digital platform that connects students, educational institutions, and employers, facilitating:
              </p>
              <ul className="space-y-3 text-lg text-gray-600">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Transparent access to quality education programs</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Stackable credentials and credit transfer systems</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Direct pathways from education to employment</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Recognition of prior learning and experience</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Sri Lanka Needs iNEXORA
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Addressing critical challenges in our education ecosystem
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {impacts.map((impact, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition">
                <h3 className="text-lg font-bold text-gray-900 mb-3">{impact.metric}</h3>
                <p className="text-gray-600 leading-relaxed">{impact.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-blue-50 rounded-2xl p-8 border-2 border-blue-100">
            <div className="flex items-start space-x-4">
              <Heart className="h-8 w-8 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Social & Economic Value</h3>
                <p className="text-lg text-gray-700 leading-relaxed">
                  iNEXORA represents more than a platform—it's a national infrastructure investment that will yield returns through increased employment, higher incomes, reduced education costs, and enhanced global competitiveness. By democratizing access to education and creating transparent pathways to careers, we're building the foundation for sustainable national development.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Core Values
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <value.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Join Us in Transforming Education
          </h2>
          <p className="text-xl text-blue-100 leading-relaxed">
            Whether you're a student seeking opportunities, an institution offering programs, or an employer looking for talent, iNEXORA provides the platform to achieve your goals while contributing to national progress.
          </p>
        </div>
      </section>
    </div>
  );
}

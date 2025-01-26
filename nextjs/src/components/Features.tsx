import Image from 'next/image';

const features = [
  {
    icon: '/images/icons/achievement.svg',
    title: 'Smart Achievements',
    description: 'Earn unique, AI-generated achievements that reflect your running milestones and progress'
  },
  {
    icon: '/images/icons/stats.svg',
    title: 'Detailed Analytics',
    description: 'Get comprehensive insights into your running patterns, progress, and performance metrics'
  },
  {
    icon: '/images/icons/community.svg',
    title: 'Active Community',
    description: 'Connect with fellow runners, share achievements, and participate in group challenges'
  }
];

export default function Features() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Powerful Features for Runners
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 bg-white rounded-lg shadow-sm border border-gray-100 animate-fade-in"
            >
              <div className="w-12 h-12 mb-4">
                <Image
                  src={feature.icon}
                  alt={feature.title}
                  width={48}
                  height={48}
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 
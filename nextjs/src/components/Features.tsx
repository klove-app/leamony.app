import Image from 'next/image';

const features = [
  {
    icon: '/images/icons/achievement.svg',
    title: 'Smart Achievements',
    description: 'Earn unique, AI-generated achievements that reflect your running milestones and progress',
    bgColor: 'bg-pink-50'
  },
  {
    icon: '/images/icons/stats.svg',
    title: 'Detailed Analytics',
    description: 'Get comprehensive insights into your running patterns, progress, and performance metrics',
    bgColor: 'bg-blue-50'
  },
  {
    icon: '/images/icons/community.svg',
    title: 'Active Community',
    description: 'Connect with fellow runners, share achievements, and participate in group challenges',
    bgColor: 'bg-yellow-50'
  }
];

export default function Features() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
          Powerful Features for Runners
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-8 rounded-2xl transition-all hover:scale-105"
            >
              <div className={`w-16 h-16 rounded-2xl ${feature.bgColor} p-4 mb-6`}>
                <Image
                  src={feature.icon}
                  alt={feature.title}
                  width={32}
                  height={32}
                  className="w-full h-full"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
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
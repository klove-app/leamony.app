'use client';

import Image from 'next/image';

export default function Features() {
  const features = [
    {
      title: 'Smart Achievements',
      description: 'Track your progress and earn badges for reaching milestones',
      icon: '/images/icons/achievement.svg'
    },
    {
      title: 'Detailed Analytics',
      description: 'Get insights into your running performance and progress',
      icon: '/images/icons/stats.svg'
    },
    {
      title: 'Active Community',
      description: 'Connect with other runners and share your achievements',
      icon: '/images/icons/community.svg'
    },
    {
      title: 'AI Training Plans',
      description: 'Get personalized training plans based on your goals and level',
      icon: '/images/icons/ai.svg'
    }
  ];

  return (
    <section id="features" className="features">
      <div className="container">
        <h2>Features that Power Your Running Journey</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">
                <Image 
                  src={feature.icon}
                  alt={feature.title}
                  width={48}
                  height={48}
                />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 
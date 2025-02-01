'use client';

export default function Stats() {
  const stats = [
    {
      number: '10K+',
      label: 'Active Runners'
    },
    {
      number: '1M+',
      label: 'Kilometers Run'
    },
    {
      number: '500K+',
      label: 'Training Sessions'
    },
    {
      number: '100K+',
      label: 'Goals Achieved'
    }
  ];

  return (
    <section className="stats">
      <div className="container">
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <h3 className="stat-number">{stat.number}</h3>
              <p className="stat-label">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 
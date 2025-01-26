const stats = [
  {
    number: '1,000+',
    label: 'Active Runners'
  },
  {
    number: '50,000+',
    label: 'Kilometers Run'
  },
  {
    number: '10,000+',
    label: 'Training Sessions'
  },
  {
    number: '500+',
    label: 'Goals Achieved'
  }
];

export default function Stats() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center p-6 bg-white rounded-lg shadow-sm animate-fade-in"
            >
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stat.number}
              </div>
              <div className="text-gray-600">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 
const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for getting started',
    features: [
      'Basic run tracking',
      'Community access',
      'Standard achievements',
      'Basic statistics',
      'Global challenges participation',
      'Community support'
    ],
    buttonText: 'Start Free',
    featured: false
  },
  {
    name: 'Pro',
    price: '$10',
    description: 'For dedicated runners',
    features: [
      'Advanced run tracking',
      'Priority support',
      'Custom achievements',
      'Detailed analytics',
      'AI training plans',
      'Strava integration',
      'Calendar integration',
      'Global challenges participation',
      'Training schedule planning'
    ],
    buttonText: 'Go Pro',
    featured: true
  },
  {
    name: 'Premium',
    price: '$50',
    description: 'For professional results',
    features: [
      'All Pro features included',
      'Certified coach feedback',
      'Personalized training adjustments',
      'Monthly progress review',
      'Priority support 24/7',
      'Custom training programs',
      'Global challenges participation',
      'Video analysis',
      'Nutrition guidance'
    ],
    buttonText: 'Get Premium',
    featured: false
  }
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Simple, Transparent Pricing
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`
                p-6 rounded-lg shadow-sm animate-fade-in
                ${plan.featured ? 'border-2 border-blue-500 relative' : 'border border-gray-200'}
              `}
            >
              {plan.featured && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-1 rounded-bl-lg rounded-tr-lg text-sm">
                  Popular
                </div>
              )}
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {plan.price}<span className="text-lg text-gray-600">/month</span>
                </div>
                <p className="text-gray-600">{plan.description}</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li
                    key={featureIndex}
                    className="flex items-center text-gray-600"
                  >
                    <svg
                      className="w-5 h-5 text-green-500 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <a
                href="https://t.me/sl_run_bot"
                target="_blank"
                rel="noopener noreferrer"
                className={`
                  w-full text-center px-6 py-3 rounded-md font-medium
                  ${plan.featured
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }
                `}
              >
                {plan.buttonText}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 
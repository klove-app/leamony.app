'use client';

export default function Pricing() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: '/month',
      description: 'Perfect for getting started',
      features: [
        'Basic training plans',
        'Activity tracking',
        'Community access',
        'Basic analytics'
      ],
      buttonText: 'Start Free',
      buttonLink: 'https://t.me/sl_run_bot'
    },
    {
      name: 'Pro',
      price: '$10',
      period: '/month',
      description: 'Best for serious runners',
      features: [
        'Advanced training plans',
        'Detailed analytics',
        'Priority support',
        'Custom goals'
      ],
      buttonText: 'Get Pro',
      buttonLink: 'https://t.me/sl_run_bot'
    },
    {
      name: 'Premium',
      price: '$50',
      period: '/month',
      description: 'For professional athletes',
      features: [
        'Personal coach',
        'Custom training plans',
        'Advanced analytics',
        '24/7 support'
      ],
      buttonText: 'Go Premium',
      buttonLink: 'https://t.me/sl_run_bot'
    }
  ];

  return (
    <section id="pricing" className="pricing">
      <div className="container">
        <h2>Choose Your Plan</h2>
        <div className="pricing-grid">
          {plans.map((plan, index) => (
            <div key={index} className="pricing-card">
              <h3>{plan.name}</h3>
              <div className="price">
                <span className="amount">{plan.price}</span>
                <span className="period">{plan.period}</span>
              </div>
              <p className="description">{plan.description}</p>
              <ul className="features">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex}>{feature}</li>
                ))}
              </ul>
              <a 
                href={plan.buttonLink} 
                className="button button-primary"
                target="_blank"
                rel="noopener noreferrer"
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
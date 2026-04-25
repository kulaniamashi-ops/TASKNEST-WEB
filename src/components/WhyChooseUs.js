import React from 'react';

const WhyChooseUs = () => {
  const features = [
    {
      title: "Trusted Professionals",
      description: "All our service providers are verified, background-checked, and highly rated by customers.",
      icon: "✅"
    },
    {
      title: "Quality Service",
      description: "We guarantee high-quality workmanship and customer satisfaction on every job.",
      icon: "⭐"
    },
    {
      title: "Affordable Pricing",
      description: "Get competitive, upfront pricing with no hidden fees or surprises.",
      icon: "💰"
    },
    {
      title: "24/7 Availability",
      description: "Need help urgently? We have professionals available around the clock.",
      icon: "⏰"
    }
  ];

  return (
    <section className="py-12 bg-light-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Why Choose Us?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
import React from 'react';

const ServiceCard = ({ service }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:scale-105">
      <div className="h-48 bg-gray-200 flex items-center justify-center">
        {service.image ? (
          <img src={service.image} alt={service.title} className="h-full w-full object-cover" />
        ) : (
          <span className="text-gray-500">Service Image</span>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800">{service.title}</h3>
        <p className="text-gray-600 mt-2">{service.description}</p>
        <div className="mt-4 flex justify-between items-center">
          <span className="text-light-green-600 font-bold">${service.price}</span>
          <button className="bg-light-green-500 text-white px-4 py-2 rounded-md hover:bg-light-green-600">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
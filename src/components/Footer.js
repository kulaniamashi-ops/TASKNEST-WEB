import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiFacebook, FiTwitter, FiInstagram, FiLinkedin, FiMail } from 'react-icons/fi';

const Footer = () => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  // List of services that match categories from services.js
  const services = [
    'House Cleaning', 'Plumbing', 'Electrical', 'Gardening', 
    'Painting', 'Moving', 'Repairs', 'Pest Control', 'Cooking',
    'Garage Labor', 'Laundry Services', 'House Painting', 
    'Car Repairs', 'Home Renovation', 'AC Repair'
  ];

  // Function to handle service click - navigates to services page with category filter
  const handleServiceClick = (service) => {
    navigate(`/services?category=${encodeURIComponent(service)}`);
  };

  // Function to handle View All click
  const handleViewAllClick = () => {
    navigate('/services');
  };

  // Function to handle newsletter subscription
  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (email) {
      alert(`Thank you for subscribing with email: ${email}`);
      setEmail('');
    }
  };

  return (
    <footer className="bg-gradient-to-b from-green-800 to-green-900 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div>
            <div className="flex items-center mb-6">
              <img 
                src="/logo.jpg" 
                alt="TaskNest Logo" 
                className="h-12 w-12 mr-3 rounded-full object-cover"
              />
              <h3 className="text-2xl font-bold">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-yellow-400">
                  TaskNest
                </span>
              </h3>
            </div>
            <p className="text-green-100 mb-6">
              Connecting you with trusted professionals for all your home service needs.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="bg-green-700 p-2 rounded-full hover:bg-green-600 transition hover:scale-110">
                <FiFacebook size={20} />
              </a>
              <a href="#" className="bg-green-700 p-2 rounded-full hover:bg-green-600 transition hover:scale-110">
                <FiTwitter size={20} />
              </a>
              <a href="#" className="bg-green-700 p-2 rounded-full hover:bg-green-600 transition hover:scale-110">
                <FiInstagram size={20} />
              </a>
              <a href="#" className="bg-green-700 p-2 rounded-full hover:bg-green-600 transition hover:scale-110">
                <FiLinkedin size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-xl font-semibold mb-6">Quick Links</h4>
            <ul className="space-y-4">
              <li>
                <Link to="/" className="text-green-100 hover:text-yellow-300 transition hover:pl-2 block duration-300">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-green-100 hover:text-yellow-300 transition hover:pl-2 block duration-300">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-green-100 hover:text-yellow-300 transition hover:pl-2 block duration-300">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-green-100 hover:text-yellow-300 transition hover:pl-2 block duration-300">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-xl font-semibold mb-6">Services</h4>
            <ul className="space-y-4">
              {services.slice(0, 4).map((service, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleServiceClick(service)}
                    className="text-green-100 hover:text-yellow-300 transition hover:pl-2 block duration-300 w-full text-left cursor-pointer"
                  >
                    {service}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={handleViewAllClick}
                  className="text-green-100 hover:text-yellow-300 transition hover:pl-2 block duration-300 font-medium cursor-pointer w-full text-left"
                >
                  View All →
                </button>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-xl font-semibold mb-6">Newsletter</h4>
            <p className="text-green-100 mb-6 text-lg">
              Subscribe to our newsletter for the latest updates and offers.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex">
              <input 
                type="email" 
                placeholder="Your email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="px-4 py-3 rounded-l-md w-full text-green-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-lg"
              />
              <button 
                type="submit"
                className="bg-yellow-400 text-green-800 px-5 py-3 rounded-r-md font-medium hover:bg-yellow-300 transition hover:scale-105 flex items-center justify-center"
              >
                <FiMail size={22} />
              </button>
            </form>
          </div>
        </div>
        
        <div className="border-t border-green-700 pt-8 text-center text-green-200">
          <p className="text-lg">© {new Date().getFullYear()} TaskNest. All rights reserved.</p>
          <p className="mt-2 text-green-300">Your trusted home service partner</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
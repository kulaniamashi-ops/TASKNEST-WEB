import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center font-bold text-xl">
              <img 
                src="/logo.jpg" 
                alt="TaskNest Logo" 
                className="h-10 w-10 mr-3 rounded-full object-cover"
              />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-yellow-400">
                TaskNest
              </span>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="hover:bg-green-700 px-3 py-2 rounded-md transition-all duration-300 hover:scale-105">Home</Link>
            <Link to="/services" className="hover:bg-green-700 px-3 py-2 rounded-md transition-all duration-300 hover:scale-105">Services</Link>
            <Link to="/about" className="hover:bg-green-700 px-3 py-2 rounded-md transition-all duration-300 hover:scale-105">About</Link>
            <Link to="/contact" className="hover:bg-green-700 px-3 py-2 rounded-md transition-all duration-300 hover:scale-105">Contact</Link>
            <Link to="/seller-login" className="bg-blue-500 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-600 transition-all shadow-md hover:shadow-lg">
              Seller Login
            </Link>
            <Link to="/profile" className="bg-yellow-400 text-green-800 px-4 py-2 rounded-md font-medium hover:bg-yellow-300 transition-all shadow-md hover:shadow-lg">
              Login/Sign Up
            </Link>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white focus:outline-none p-2 rounded-md hover:bg-green-700 transition"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-green-700 rounded-lg mt-2 shadow-xl">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link to="/" className="block hover:bg-green-600 px-3 py-2 rounded-md transition">Home</Link>
              <Link to="/services" className="block hover:bg-green-600 px-3 py-2 rounded-md transition">Services</Link>
              <Link to="/about" className="block hover:bg-green-600 px-3 py-2 rounded-md transition">About</Link>
              <Link to="/contact" className="block hover:bg-green-600 px-3 py-2 rounded-md transition">Contact</Link>
              <Link to="/seller-login" className="block bg-blue-500 text-white px-3 py-2 rounded-md font-medium">
                Seller Login
              </Link>
              <Link to="/profile" className="block bg-yellow-400 text-green-800 px-3 py-2 rounded-md font-medium text-center mt-2">
                Login/Sign Up
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../components/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { FiSearch, FiFilter, FiStar, FiMapPin, FiClock, FiCheck } from 'react-icons/fi';

const Search = () => {
  const { query: searchQuery } = useParams();
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    rating: '',
    experience: ''
  });

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servicesRef = collection(db, 'services');
        const q = query(
          servicesRef, 
          where('status', '==', 'approved')
        );
        const querySnapshot = await getDocs(q);
        
        const servicesData = [];
        querySnapshot.forEach((doc) => {
          servicesData.push({ id: doc.id, ...doc.data() });
        });

        setServices(servicesData);
        
        // Filter services based on search query
        const filtered = servicesData.filter(service => 
          service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.serviceDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.city.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        setFilteredServices(filtered);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching services:', error);
        setLoading(false);
      }
    };

    fetchServices();
  }, [searchQuery]);

  useEffect(() => {
    // Apply filters whenever filters change
    let result = services;
    
    if (filters.category) {
      result = result.filter(service => service.category === filters.category);
    }
    
    if (filters.minPrice) {
      result = result.filter(service => service.price >= parseFloat(filters.minPrice));
    }
    
    if (filters.maxPrice) {
      result = result.filter(service => service.price <= parseFloat(filters.maxPrice));
    }
    
    if (filters.rating) {
      result = result.filter(service => service.rating >= parseFloat(filters.rating));
    }
    
    if (filters.experience) {
      result = result.filter(service => {
        const exp = service.experience;
        if (filters.experience === 'novice') return exp === '<1 year';
        if (filters.experience === 'experienced') return exp === '1-3 years' || exp === '3-5 years';
        if (filters.experience === 'expert') return exp === '5+ years';
        return true;
      });
    }
    
    setFilteredServices(result);
  }, [filters, services]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      rating: '',
      experience: ''
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Search Results for "{searchQuery}"
          </h1>
          <p className="text-gray-600">
            {filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'} found
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow p-6 sticky top-24">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FiFilter className="mr-2" /> Filters
                </h2>
                <button 
                  onClick={clearFilters}
                  className="text-sm text-green-600 hover:text-green-700"
                >
                  Clear All
                </button>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">All Categories</option>
                  <option value="House Cleaning">House Cleaning</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Gardening">Gardening</option>
                  <option value="Painting">Painting</option>
                  <option value="Moving">Moving</option>
                  <option value="Repairs">Repairs</option>
                  <option value="Pest Control">Pest Control</option>
                  <option value="Cooking">Cooking</option>
                </select>
              </div>

              {/* Price Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="minPrice"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={handleFilterChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                  <input
                    type="number"
                    name="maxPrice"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={handleFilterChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              {/* Rating Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Rating</label>
                <select
                  name="rating"
                  value={filters.rating}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Any Rating</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                  <option value="1">1+ Star</option>
                </select>
              </div>

              {/* Experience Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                <select
                  name="experience"
                  value={filters.experience}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Any Experience</option>
                  <option value="novice">Novice (Less than 1 year)</option>
                  <option value="experienced">Experienced (1-5 years)</option>
                  <option value="expert">Expert (5+ years)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:w-3/4">
            {filteredServices.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <FiSearch className="mx-auto text-gray-400 text-4xl mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No services found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
                <Link
                  to="/"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                >
                  Browse All Services
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredServices.map(service => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Service Card Component
const ServiceCard = ({ service }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={service.coverImage || `${process.env.PUBLIC_URL}/default-cover.jpg`}
          alt={service.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md">
          <FiStar className="text-yellow-400" />
          <span className="text-sm font-semibold ml-1">{service.rating || 'New'}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-1">{service.name}</h3>
            <p className="text-green-600 font-medium">${service.price}/hour</p>
          </div>
          <img
            src={service.profileImage || `${process.env.PUBLIC_URL}/default-avatar.png`}
            alt={service.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
          />
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{service.serviceDescription}</p>

        <div className="flex items-center text-sm text-gray-500 mb-4">
          <FiMapPin className="mr-1" />
          <span>{service.city}</span>
          <span className="mx-2">•</span>
          <FiClock className="mr-1" />
          <span>{service.experience}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
            <FiCheck className="mr-1" />
            {service.category}
          </span>
          
          <Link
            to={`/service/${service.id}`}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Search;
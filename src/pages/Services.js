import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiSearch, FiFilter, FiStar, FiClock, FiMapPin } from 'react-icons/fi';
import { db } from '../components/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const Services = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('popularity');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get URL parameters
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const urlCategory = queryParams.get('category');
  const urlSearch = queryParams.get('search');

  const categories = [
    'All', 'House Cleaning', 'Plumbing', 'Electrical', 'Gardening', 
    'Painting', 'Moving', 'Repairs', 'Pest Control', 'Cooking',
    'House Cleaning', 'Garage Labor', 'Electrician', 'Gardening Services',
    'Pest Control', 'Moving Services', 'Laundry Services',
    'House Painting', 'Car Repairs', 'Cooking Services',
    'Home Renovation', 'Plumbing', 'AC Repair'
  ];

  // Remove duplicates from categories
  const uniqueCategories = [...new Set(categories)];

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const q = query(
          collection(db, "services"),
          where("status", "==", "approved")
        );
        const querySnapshot = await getDocs(q);
        
        const servicesData = [];
        
        for (const doc of querySnapshot.docs) {
          let data = doc.data();
          
          // Use the image URL directly (it's already stored as a URL string)
          if (data.coverImage) {
            data.image = data.coverImage;
          } else {
            data.image = `${process.env.PUBLIC_URL}/service-default.jpg`;
          }
          
          servicesData.push({ 
            id: doc.id, 
            ...data
          });
        }
        
        setServices(servicesData);
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Set initial category and search from URL parameters
  useEffect(() => {
    if (urlCategory) {
      setActiveCategory(decodeURIComponent(urlCategory));
    }
    if (urlSearch) {
      setSearchQuery(decodeURIComponent(urlSearch));
    }
  }, [urlCategory, urlSearch]);

  // Filter services based on search query and category
  const filteredServices = services.filter(service => {
    // Handle category matching - try different field names
    const serviceCategory = service.category || service.serviceType || '';
    const matchesCategory = activeCategory === 'All' || 
                           serviceCategory.toLowerCase().includes(activeCategory.toLowerCase()) ||
                           serviceCategory === activeCategory;
    
    // Handle search matching
    const serviceName = service.name || service.serviceName || '';
    const serviceDesc = service.serviceDescription || service.description || '';
    
    const matchesSearch = searchQuery === '' || 
                         serviceName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         serviceDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         serviceCategory.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  // Sort services based on selected option
  const sortedServices = [...filteredServices].sort((a, b) => {
    switch(sortBy) {
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'price-low':
        return parseFloat(a.price || 0) - parseFloat(b.price || 0);
      case 'price-high':
        return parseFloat(b.price || 0) - parseFloat(a.price || 0);
      case 'popularity':
      default:
        return (b.reviewsCount || 0) - (a.reviewsCount || 0);
    }
  });

  // Handle category change
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    // Update URL without reloading page
    const params = new URLSearchParams(location.search);
    if (category === 'All') {
      params.delete('category');
    } else {
      params.set('category', encodeURIComponent(category));
    }
    // Update URL without navigation
    window.history.replaceState({}, '', `${location.pathname}?${params.toString()}`);
  };

  // Handle search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    // Update URL without reloading page
    const params = new URLSearchParams(location.search);
    if (value.trim() === '') {
      params.delete('search');
    } else {
      params.set('search', encodeURIComponent(value.trim()));
    }
    window.history.replaceState({}, '', `${location.pathname}?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 pt-20 pb-16 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-green-900 mb-4">
            {activeCategory !== 'All' ? activeCategory : 'Our'} <span className="text-green-600">Services</span>
          </h1>
          <p className="text-xl text-green-700 max-w-3xl mx-auto">
            {activeCategory !== 'All' 
              ? `Browse all ${activeCategory} services`
              : 'Discover a wide range of professional home services tailored to your needs'}
          </p>
          {activeCategory !== 'All' && (
            <button
              onClick={() => handleCategoryChange('All')}
              className="mt-4 text-green-600 hover:text-green-800 font-medium"
            >
              ← Back to All Services
            </button>
          )}
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-12">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search for services..."
                className="w-full p-4 pl-12 border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400"
                value={searchQuery}
                onChange={handleSearch}
              />
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-400" size={20} />
            </div>
            
            <div className="flex gap-4">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="p-4 border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                <option value="popularity">Popularity</option>
                <option value="rating">Highest Rating</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              
              <button className="bg-green-600 text-white px-6 py-4 rounded-xl flex items-center gap-2 hover:bg-green-700 transition">
                <FiFilter size={18} /> Filters
              </button>
            </div>
          </div>
          
          {/* Categories */}
          <div className="mt-6 flex flex-wrap gap-3">
            {uniqueCategories.map(category => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-5 py-2 rounded-full transition ${
                  activeCategory === category 
                    ? 'bg-green-600 text-white' 
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Services Count */}
        <div className="mb-6">
          <p className="text-green-700 text-lg">
            Showing {sortedServices.length} {sortedServices.length === 1 ? 'service' : 'services'}
            {activeCategory !== 'All' && ` in "${activeCategory}"`}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>

        {/* Services Grid */}
        {sortedServices.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-green-900 mb-2">No services found</h3>
            <p className="text-green-700 mb-4">
              {searchQuery 
                ? `No services found matching "${searchQuery}"`
                : activeCategory !== 'All'
                ? `No services available in "${activeCategory}" category yet.`
                : 'No services available yet.'}
            </p>
            {(searchQuery || activeCategory !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('All');
                  window.history.replaceState({}, '', '/services');
                }}
                className="text-green-600 hover:text-green-800 font-medium"
              >
                View all services →
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {sortedServices.map(service => {
                const serviceCategory = service.category || service.serviceType || 'General';
                
                return (
                  <div key={service.id} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-green-100">
                    <div className="relative">
                      <img 
                        src={service.image} 
                        alt={service.name}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          e.target.src = `${process.env.PUBLIC_URL}/service-default.jpg`;
                        }}
                      />
                      <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {serviceCategory}
                      </div>
                      <div className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md">
                        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <h3 className="font-semibold text-lg mb-2 text-green-900">{service.name || service.serviceName}</h3>
                      
                      <div className="flex items-center mb-3">
                        <div className="flex items-center">
                          <FiStar className="text-yellow-400 mr-1" />
                          <span className="text-green-800 font-medium">{service.rating?.toFixed(1) || 'New'}</span>
                          <span className="text-green-600 ml-1">({service.reviewsCount || 0} reviews)</span>
                        </div>
                      </div>
                      
                      <p className="text-green-700 mb-4 line-clamp-2">
                        {service.serviceDescription || service.description || 'Professional service'}
                      </p>
                      
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center text-green-600">
                          <FiClock className="mr-1" />
                          <span>{service.experience || 'Not specified'}</span>
                        </div>
                        <div className="flex items-center text-green-600">
                          <FiMapPin className="mr-1" />
                          <span>{service.city || 'Not specified'}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-green-800">
                          {service.price ? `$${service.price}` : 'Contact for price'}
                        </span>
                        <Link 
                          to={`/service/${service.id}`}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More Button */}
            {sortedServices.length > 0 && (
              <div className="text-center mt-12">
                <button className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition">
                  Load More Services
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Services;
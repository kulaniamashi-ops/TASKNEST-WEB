import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db } from '../components/firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  FiStar, FiMapPin, FiClock, FiCheck, FiMessageCircle, 
  FiCalendar, FiDollarSign, FiAward, FiUsers, FiArrowLeft
} from 'react-icons/fi';
import { FaStar, FaRegStar, FaCheckCircle } from 'react-icons/fa';
import { getAuth } from 'firebase/auth';

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = getAuth();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    duration: '1',
    notes: ''
  });
  const [bookingInProgress, setBookingInProgress] = useState(false);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const docRef = doc(db, 'services', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setService({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.log('No such document!');
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching service:', error);
        setLoading(false);
      }
    };

    fetchService();
  }, [id]);

  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBookService = async () => {
    // Check if user is logged in
    const user = auth.currentUser;
    if (!user) {
      alert('Please log in to book a service');
      navigate('/login');
      return;
    }

    // Validate form
    if (!bookingData.date || !bookingData.time) {
      alert('Please select a date and time for your booking');
      return;
    }

    setBookingInProgress(true);

    try {
      // Calculate total price
      const totalPrice = service.price * parseInt(bookingData.duration);
      
      // Create order object - FIXED: Added correct sellerId field
      const orderData = {
        serviceId: service.id,
        serviceName: service.name,
        sellerId: service.uniqueCode, // Using uniqueCode as seller identifier
        sellerName: service.name,
        customerId: user.uid,
        customerName: user.displayName || 'Customer',
        customerEmail: user.email,
        customerPhone: user.phoneNumber || '',
        date: bookingData.date,
        time: bookingData.time,
        duration: parseInt(bookingData.duration),
        totalPrice: totalPrice,
        notes: bookingData.notes,
        status: 'pending', // Initial status
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Include additional service details for reference
        serviceCategory: service.category,
        serviceDescription: service.serviceDescription,
        sellerProfileImage: service.profileImage,
        service: service.name, // Added for dashboard display
        pricePerHour: service.price // Added for reference
      };

      // Add to orders collection
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
      alert(`Booking request sent to ${service.name} for ${bookingData.date} at ${bookingData.time}`);
      
      // Reset form
      setBookingData({
        date: '',
        time: '',
        duration: '1',
        notes: ''
      });
      
      // Optionally navigate to orders page or confirmation page
      // navigate('/my-orders');
      
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setBookingInProgress(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<FaStar key={i} className="text-yellow-400" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-yellow-400" />);
      }
    }

    return stars;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold text-green-900 mb-4">Service Not Found</h1>
          <Link to="/services" className="text-green-600 hover:text-green-700">
            Return to Services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-green-600 hover:text-green-700 mb-6"
        >
          <FiArrowLeft className="mr-2" />
          Back to Services
        </button>

        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <Link to="/" className="text-green-500 hover:text-green-700">Home</Link>
            </li>
            <li className="flex items-center">
              <span className="mx-2 text-green-400">/</span>
              <Link to="/services" className="text-green-500 hover:text-green-700">
                Services
              </Link>
            </li>
            <li className="flex items-center">
              <span className="mx-2 text-green-400">/</span>
              <span className="text-green-700">{service.name}</span>
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <img
                  src={service.profileImage || `${process.env.PUBLIC_URL}/default-avatar.png`}
                  alt={service.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
                
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <div>
                      <h1 className="text-2xl font-bold text-green-900 mb-1">{service.name}</h1>
                      <div className="flex items-center text-sm text-green-600 mb-2">
                        <FiMapPin className="mr-1" />
                        <span>{service.city}</span>
                        <span className="mx-2">•</span>
                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {service.category}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center mt-4 md:mt-0">
                      <div className="flex items-center mr-4">
                        {renderStars(service.rating || 0)}
                        <span className="ml-2 text-sm font-medium text-green-600">
                          ({service.reviewsCount || 0} reviews)
                        </span>
                      </div>
                      <span className="text-2xl font-bold text-green-600">${service.price}/hour</span>
                    </div>
                  </div>

                  <p className="text-green-700 mb-4">{service.serviceDescription}</p>

                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center text-sm text-green-600">
                      <FiClock className="mr-2" />
                      <span>{service.experience} experience</span>
                    </div>
                    <div className="flex items-center text-sm text-green-600">
                      <FiUsers className="mr-2" />
                      <span>{service.workType}</span>
                    </div>
                    {service.hasCertifications === 'Yes' && (
                      <div className="flex items-center text-sm text-green-600">
                        <FiAward className="mr-2" />
                        <span>Certified Professional</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-lg mb-6">
              <div className="border-b border-green-200">
                <nav className="flex -mb-px">
                  {['overview', 'reviews', 'portfolio'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-4 px-6 text-sm font-medium border-b-2 ${
                        activeTab === tab
                          ? 'border-green-500 text-green-600'
                          : 'border-transparent text-green-500 hover:text-green-700 hover:border-green-300'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <div>
                    <h3 className="text-lg font-semibold text-green-900 mb-4">About {service.name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                          <FiMapPin className="text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-green-800">Location</h4>
                          <p className="text-green-600">{service.address}, {service.city}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                          <FiDollarSign className="text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-green-800">Pricing</h4>
                          <p className="text-green-600">${service.price} per hour</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                          <FiClock className="text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-green-800">Experience</h4>
                          <p className="text-green-600">{service.experience}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                          <FiUsers className="text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-green-800">Work Type</h4>
                          <p className="text-green-600">{service.workType}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h4 className="font-medium text-green-800 mb-2">Education</h4>
                      <p className="text-green-600">{service.education}</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-green-800 mb-2">Preferred Working Locations</h4>
                      <p className="text-green-600">{service.preferredLocation}</p>
                    </div>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div>
                    <h3 className="text-lg font-semibold text-green-900 mb-4">Customer Reviews</h3>
                    {service.reviewsCount > 0 ? (
                      <div>
                        <p className="text-green-600">Reviews functionality would be implemented here.</p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FiMessageCircle className="mx-auto text-green-400 text-4xl mb-4" />
                        <p className="text-green-600">No reviews yet. Be the first to review this service!</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'portfolio' && (
                  <div>
                    <h3 className="text-lg font-semibold text-green-900 mb-4">Portfolio</h3>
                    {service.certificationImage ? (
                      <div>
                        <img
                          src={service.certificationImage}
                          alt="Certification"
                          className="w-full max-w-md mx-auto rounded-lg shadow-md"
                        />
                        <p className="text-center text-green-600 mt-4">Professional Certification</p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FiAward className="mx-auto text-green-400 text-4xl mb-4" />
                        <p className="text-green-600">No portfolio items available yet.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Booking Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-green-900 mb-4">Book This Service</h3>
              
              <div className="mb-6 p-4 bg-green-50 rounded-xl">
                <div className="flex items-center mb-2">
                  <FiDollarSign className="text-green-600 mr-2" />
                  <span className="font-medium">Pricing: ${service.price} per hour</span>
                </div>
                <div className="flex items-center">
                  <FiClock className="text-green-600 mr-2" />
                  <span className="text-sm text-green-600">Minimum 1 hour booking</span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-green-700 mb-2">Select Date</label>
                <div className="relative">
                  <input
                    type="date"
                    name="date"
                    value={bookingData.date}
                    onChange={handleBookingChange}
                    className="w-full p-3 border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <FiCalendar className="absolute right-3 top-3 text-green-400" />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-green-700 mb-2">Select Time</label>
                <select 
                  name="time"
                  value={bookingData.time}
                  onChange={handleBookingChange}
                  className="w-full p-3 border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                  <option value="">Select a time</option>
                  <option value="09:00">9:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="13:00">1:00 PM</option>
                  <option value="14:00">2:00 PM</option>
                  <option value="15:00">3:00 PM</option>
                  <option value="16:00">4:00 PM</option>
                  <option value="17:00">5:00 PM</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-green-700 mb-2">Duration (hours)</label>
                <select 
                  name="duration"
                  value={bookingData.duration}
                  onChange={handleBookingChange}
                  className="w-full p-3 border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                  <option value="1">1 hour</option>
                  <option value="2">2 hours</option>
                  <option value="3">3 hours</option>
                  <option value="4">4 hours</option>
                  <option value="5">5+ hours (custom)</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-green-700 mb-2">Additional Notes</label>
                <textarea
                  name="notes"
                  value={bookingData.notes}
                  onChange={handleBookingChange}
                  placeholder="Any special requirements or instructions..."
                  rows="3"
                  className="w-full p-3 border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              <button 
                onClick={handleBookService}
                disabled={bookingInProgress}
                className={`w-full bg-green-600 text-white py-3 px-4 rounded-xl transition font-medium flex items-center justify-center ${
                  bookingInProgress ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
                }`}
              >
                {bookingInProgress ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <FiCheck className="mr-2" />
                    Book Now
                  </>
                )}
              </button>

              <div className="mt-6 pt-6 border-t border-green-200">
                <h4 className="text-sm font-medium text-green-700 mb-3">Why book with us?</h4>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-green-600">
                    <FaCheckCircle className="text-green-500 mr-2" />
                    <span>Secure payment</span>
                  </li>
                  <li className="flex items-center text-sm text-green-600">
                    <FaCheckCircle className="text-green-500 mr-2" />
                    <span>Quality guaranteed</span>
                  </li>
                  <li className="flex items-center text-sm text-green-600">
                    <FaCheckCircle className="text-green-500 mr-2" />
                    <span>24/7 support</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;
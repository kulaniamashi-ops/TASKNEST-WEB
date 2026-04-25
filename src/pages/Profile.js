import React, { useState, useEffect } from 'react';
import { FiUser, FiMail, FiPhone, FiMapPin, FiEdit, FiSave, FiCalendar, FiCreditCard, FiBell, FiLock, FiTrash2, FiLogOut, FiLogIn, FiClock, FiCheckCircle, FiXCircle, FiAlertCircle, FiEye, FiRefreshCw } from 'react-icons/fi';
import { FaTools } from 'react-icons/fa';
import { auth, db } from '../components/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const navigate = useNavigate();
  
  // Form states
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  });
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
    joinDate: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const [bookings, setBookings] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [error, setError] = useState('');
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingStats, setBookingStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
    totalSpent: 0
  });

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // Check if admin user
        if (user.email === 'admin@tasknest.com') {
          console.log('🔑 Admin user detected, setting localStorage');
          localStorage.setItem('isAdmin', 'true');
          localStorage.setItem('adminEmail', user.email);
          navigate('/admin'); // Redirect to admin page
        } else {
          localStorage.removeItem('isAdmin');
          localStorage.removeItem('adminEmail');
          // Load user data from Firestore
          await loadUserData(user.uid);
          // Load user bookings
          await loadUserBookings(user.uid);
        }
      } else {
        setUser(null);
        setUserData({
          name: '',
          email: '',
          phone: '',
          address: '',
          bio: '',
          joinDate: ''
        });
        setBookings([]);
        setBookingStats({
          total: 0,
          active: 0,
          completed: 0,
          cancelled: 0,
          totalSpent: 0
        });
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('adminEmail');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const loadUserData = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      } else {
        // Set default user data if document doesn't exist
        const user = auth.currentUser;
        const joinDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        setUserData({
          name: user.displayName || '',
          email: user.email || '',
          phone: '',
          address: '',
          bio: '',
          joinDate: joinDate
        });
        
        // Create user document in Firestore if it doesn't exist
        await setDoc(doc(db, 'users', userId), {
          name: user.displayName || '',
          email: user.email || '',
          phone: '',
          address: '',
          bio: '',
          joinDate: joinDate,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Failed to load user data');
    }
  };

  const loadUserBookings = async (userId) => {
    try {
      setLoadingBookings(true);
      setError('');
      
      // Try multiple approaches to load bookings
      let ordersList = [];
      
      try {
        // First try: Query with customerEmail instead of customerId
        const ordersQuery = query(
          collection(db, 'orders'),
          where('customerEmail', '==', user?.email || ''),
          orderBy('createdAt', 'desc')
        );
        
        const ordersSnapshot = await getDocs(ordersQuery);
        ordersList = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore timestamp to readable date
          formattedDate: doc.data().createdAt?.toDate 
            ? doc.data().createdAt.toDate().toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            : 'Date not available'
        }));
        
        console.log('Found', ordersList.length, 'bookings by email');
      } catch (indexError) {
        console.log('Index error for email query, trying alternative...');
        
        try {
          // Second try: Try without orderBy
          const ordersQuery = query(
            collection(db, 'orders'),
            where('customerEmail', '==', user?.email || '')
          );
          
          const ordersSnapshot = await getDocs(ordersQuery);
          ordersList = ordersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            formattedDate: doc.data().createdAt?.toDate 
              ? doc.data().createdAt.toDate().toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : 'Date not available'
          }));
          
          // Sort manually
          ordersList.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
            return dateB - dateA;
          });
          
          console.log('Found', ordersList.length, 'bookings (manual sort)');
        } catch (noOrderError) {
          console.log('Trying to load all orders and filter client-side...');
          
          // Third try: Load all orders and filter locally
          const ordersSnapshot = await getDocs(collection(db, 'orders'));
          const allOrders = ordersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            formattedDate: doc.data().createdAt?.toDate 
              ? doc.data().createdAt.toDate().toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : 'Date not available'
          }));
          
          // Filter by customerId OR customerEmail
          ordersList = allOrders.filter(order => 
            order.customerId === userId || order.customerEmail === user?.email
          );
          
          // Sort manually
          ordersList.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
            return dateB - dateA;
          });
          
          console.log('Found', ordersList.length, 'bookings (client-side filter)');
        }
      }
      
      setBookings(ordersList);
      
      // Calculate booking statistics
      const stats = {
        total: ordersList.length,
        active: ordersList.filter(b => b.status === 'confirmed' || b.status === 'pending').length,
        completed: ordersList.filter(b => b.status === 'completed').length,
        cancelled: ordersList.filter(b => b.status === 'cancelled').length,
        totalSpent: ordersList.reduce((total, booking) => {
          const price = parseFloat(calculateTotalPrice(booking)) || 0;
          return total + price;
        }, 0)
      };
      
      setBookingStats(stats);
      
    } catch (error) {
      console.error('Error loading bookings:', error);
      setError('Failed to load bookings. Please try refreshing.');
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      
      // Check for admin credentials
      if (loginData.email === 'admin@tasknest.com' && loginData.password === 'admin12') {
        console.log('🔐 Admin login attempt detected');
        
        try {
          await signInWithEmailAndPassword(auth, loginData.email, loginData.password);
          // Admin-specific localStorage will be set in the useEffect
        } catch (error) {
          // If admin user doesn't exist in Firebase, create it
          if (error.code === 'auth/user-not-found') {
            console.log('⚠️ Admin user not found in Firebase, creating...');
            try {
              const userCredential = await createUserWithEmailAndPassword(
                auth,
                'admin@tasknest.com',
                'admin12'
              );
              
              await updateProfile(userCredential.user, {
                displayName: 'Administrator'
              });
              
              console.log('✅ Admin user created successfully');
              // Admin-specific localStorage will be set in the useEffect
            } catch (createError) {
              console.error('Error creating admin user:', createError);
              setError('Failed to create admin account: ' + createError.message);
            }
          } else {
            setError('Login failed: ' + error.message);
          }
        }
      } else {
        // Regular user login
        await signInWithEmailAndPassword(auth, loginData.email, loginData.password);
      }
      
      setLoginData({ email: '', password: '' });
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Prevent registering with admin email
    if (registerData.email === 'admin@tasknest.com') {
      setError('This email address is reserved for administrators');
      return;
    }

    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        registerData.email, 
        registerData.password
      );
      
      // Update profile with display name
      await updateProfile(userCredential.user, {
        displayName: registerData.name
      });

      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: registerData.name,
        email: registerData.email,
        phone: '',
        address: '',
        bio: '',
        joinDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      setRegisterData({ name: '', email: '', password: '', confirmPassword: '' });
    } catch (error) {
      setError('Registration failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('adminEmail');
      setBookings([]);
      setBookingStats({
        total: 0,
        active: 0,
        completed: 0,
        cancelled: 0,
        totalSpent: 0
      });
    } catch (error) {
      console.error('Logout error:', error);
      setError('Logout failed');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setError('');
    try {
      if (user) {
        // Update Firestore document
        await updateDoc(doc(db, 'users', user.uid), {
          ...userData,
          updatedAt: new Date()
        });
        
        // Update Firebase Auth profile if name changed
        if (userData.name !== user.displayName) {
          await updateProfile(user, {
            displayName: userData.name
          });
        }
        
        // Update email if changed
        if (userData.email !== user.email) {
          await updateEmail(user, userData.email);
        }
        
        setIsEditing(false);
        setError('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile: ' + error.message);
    }
  };

  const handlePasswordUpdate = async () => {
    setError('');
    
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(
        user.email, 
        passwordData.currentPassword
      );
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, passwordData.newPassword);
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });
      
      setError('Password updated successfully!');
    } catch (error) {
      console.error('Error updating password:', error);
      setError('Failed to update password: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'in progress':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    if (!status) return <FiAlertCircle className="mr-2" />;
    
    switch (status.toLowerCase()) {
      case 'completed':
        return <FiCheckCircle className="mr-2" />;
      case 'confirmed':
        return <FiCheckCircle className="mr-2" />;
      case 'pending':
        return <FiClock className="mr-2" />;
      case 'cancelled':
        return <FiXCircle className="mr-2" />;
      case 'in progress':
        return <FiAlertCircle className="mr-2" />;
      default:
        return <FiAlertCircle className="mr-2" />;
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await updateDoc(doc(db, 'orders', bookingId), {
        status: 'cancelled',
        cancelledAt: new Date(),
        updatedAt: new Date()
      });

      // Update local state
      setBookings(bookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'cancelled' } 
          : booking
      ));

      // Update stats
      setBookingStats(prev => ({
        ...prev,
        active: prev.active - 1,
        cancelled: prev.cancelled + 1
      }));

      setError('Booking cancelled successfully!');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      setError('Failed to cancel booking: ' + error.message);
    }
  };

  const handleBookAgain = async (booking) => {
    // Navigate to services page or show booking modal
    navigate('/services');
  };

  const handleViewBookingDetails = (booking) => {
    setSelectedBooking(booking);
  };

  const handleCloseBookingDetails = () => {
    setSelectedBooking(null);
  };

  const handleSetDefaultPayment = (id) => {
    setPaymentMethods(methods => 
      methods.map(method => ({
        ...method,
        default: method.id === id
      }))
    );
  };

  const handleDeletePayment = (id) => {
    setPaymentMethods(methods => methods.filter(method => method.id !== id));
  };

  const calculateTotalPrice = (booking) => {
    if (!booking) return '0.00';
    
    // Try different price fields
    if (booking.pricePerHour && booking.duration) {
      return (booking.pricePerHour * booking.duration).toFixed(2);
    }
    if (booking.totalPrice) {
      return parseFloat(booking.totalPrice).toFixed(2);
    }
    if (booking.price) {
      return parseFloat(booking.price).toFixed(2);
    }
    return '0.00';
  };

  const formatStatus = (status) => {
    if (!status) return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Show authentication forms if user is not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 pt-20 pb-16">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-green-900 mb-6 text-center">
              {authMode === 'login' ? 'Login to Your Account' : 'Create an Account'}
            </h2>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {/* Auth Mode Toggle */}
            <div className="flex mb-6 bg-green-100 rounded-lg p-1">
              <button
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 rounded-md text-center ${authMode === 'login' ? 'bg-white text-green-800 font-medium shadow-sm' : 'text-green-600'}`}
              >
                Login
              </button>
              <button
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-2 rounded-md text-center ${authMode === 'register' ? 'bg-white text-green-800 font-medium shadow-sm' : 'text-green-600'}`}
              >
                Register
              </button>
            </div>

            {/* Login Form */}
            {authMode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-green-800 font-medium mb-2">Email Address</label>
                  <input
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                    required
                    className="w-full p-3 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label className="block text-green-800 font-medium mb-2">Password</label>
                  <input
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                    required
                    className="w-full p-3 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                    placeholder="Enter your password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>
            )}

            {/* Registration Form */}
            {authMode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-green-800 font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                    required
                    className="w-full p-3 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-green-800 font-medium mb-2">Email Address</label>
                  <input
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                    required
                    className="w-full p-3 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label className="block text-green-800 font-medium mb-2">Password</label>
                  <input
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                    required
                    className="w-full p-3 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                    placeholder="Create a password"
                  />
                </div>
                <div>
                  <label className="block text-green-800 font-medium mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                    required
                    className="w-full p-3 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                    placeholder="Confirm your password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            )}

            <p className="text-center mt-6 text-green-700">
              {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="text-green-600 font-medium hover:underline"
              >
                {authMode === 'login' ? 'Register here' : 'Login here'}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show user profile if logged in (only for non-admin users)
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="relative mb-6 md:mb-0 md:mr-8">
              <div className="w-32 h-32 bg-green-200 rounded-full flex items-center justify-center">
                <FiUser className="text-green-600" size={64} />
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-green-900 mb-2">{userData.name}</h1>
              <p className="text-green-700 mb-4">{userData.bio}</p>
              <div className="flex items-center justify-center md:justify-start text-green-600">
                <FiCalendar className="mr-2" />
                <span>Member since {userData.joinDate}</span>
              </div>
            </div>
            
            <div className="flex flex-col space-y-3 mt-6 md:mt-0">
              <button
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                className="bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition flex items-center"
              >
                {isEditing ? <FiSave className="mr-2" /> : <FiEdit className="mr-2" />}
                {isEditing ? 'Save Changes' : 'Edit Profile'}
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-700 transition flex items-center"
              >
                <FiLogOut className="mr-2" /> Logout
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className={`mb-8 p-4 rounded-xl ${error.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden">
          <div className="flex border-b overflow-x-auto">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-4 font-medium whitespace-nowrap ${activeTab === 'profile' ? 'text-green-600 border-b-2 border-green-600' : 'text-green-800'}`}
            >
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-6 py-4 font-medium whitespace-nowrap ${activeTab === 'bookings' ? 'text-green-600 border-b-2 border-green-600' : 'text-green-800'}`}
            >
              My Bookings ({bookingStats.total})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-6 py-4 font-medium whitespace-nowrap ${activeTab === 'payments' ? 'text-green-600 border-b-2 border-green-600' : 'text-green-800'}`}
            >
              Payment Methods
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-4 font-medium whitespace-nowrap ${activeTab === 'settings' ? 'text-green-600 border-b-2 border-green-600' : 'text-green-800'}`}
            >
              Account Settings
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-green-900 mb-6">Personal Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-green-800 font-medium mb-2">Full Name</label>
                <div className="flex items-center p-4 border border-green-200 rounded-xl">
                  <FiUser className="text-green-500 mr-3" />
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={userData.name}
                      onChange={handleInputChange}
                      className="flex-1 focus:outline-none"
                    />
                  ) : (
                    <span>{userData.name}</span>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-green-800 font-medium mb-2">Email Address</label>
                <div className="flex items-center p-4 border border-green-200 rounded-xl">
                  <FiMail className="text-green-500 mr-3" />
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={userData.email}
                      onChange={handleInputChange}
                      className="flex-1 focus:outline-none"
                    />
                  ) : (
                    <span>{userData.email}</span>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-green-800 font-medium mb-2">Phone Number</label>
                <div className="flex items-center p-4 border border-green-200 rounded-xl">
                  <FiPhone className="text-green-500 mr-3" />
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={userData.phone}
                      onChange={handleInputChange}
                      className="flex-1 focus:outline-none"
                    />
                  ) : (
                    <span>{userData.phone}</span>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-green-800 font-medium mb-2">Address</label>
                <div className="flex items-center p-4 border border-green-200 rounded-xl">
                  <FiMapPin className="text-green-500 mr-3" />
                  {isEditing ? (
                    <input
                      type="text"
                      name="address"
                      value={userData.address}
                      onChange={handleInputChange}
                      className="flex-1 focus:outline-none"
                    />
                  ) : (
                    <span>{userData.address}</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-green-800 font-medium mb-2">Bio</label>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={userData.bio}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full p-4 border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              ) : (
                <p className="p-4 border border-green-200 rounded-xl">{userData.bio}</p>
              )}
            </div>

            {isEditing && (
              <div className="flex justify-end mt-6 space-y-3 md:space-y-0 md:space-x-4 flex-col md:flex-row">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 border border-green-600 text-green-600 rounded-xl font-medium hover:bg-green-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="bg-green-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-green-700 transition"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-green-900">My Bookings</h2>
              <div className="flex space-x-3">
                <button
                  onClick={() => loadUserBookings(user.uid)}
                  disabled={loadingBookings}
                  className="bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition flex items-center disabled:opacity-50"
                >
                  <FiRefreshCw className={`mr-2 ${loadingBookings ? 'animate-spin' : ''}`} />
                  {loadingBookings ? 'Loading...' : 'Refresh'}
                </button>
                <button
                  onClick={() => navigate('/services')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  Book New Service
                </button>
              </div>
            </div>
            
            {/* Booking Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
              <div className="bg-green-50 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600">Total Bookings</p>
                    <p className="text-2xl font-bold text-green-900">{bookingStats.total}</p>
                  </div>
                  <FiCalendar className="text-green-500 text-2xl" />
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">Active</p>
                    <p className="text-2xl font-bold text-blue-900">{bookingStats.active}</p>
                  </div>
                  <FiClock className="text-blue-500 text-2xl" />
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600">Completed</p>
                    <p className="text-2xl font-bold text-green-900">{bookingStats.completed}</p>
                  </div>
                  <FiCheckCircle className="text-green-500 text-2xl" />
                </div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600">Cancelled</p>
                    <p className="text-2xl font-bold text-red-900">{bookingStats.cancelled}</p>
                  </div>
                  <FiXCircle className="text-red-500 text-2xl" />
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600">Total Spent</p>
                    <p className="text-2xl font-bold text-purple-900">${bookingStats.totalSpent.toFixed(2)}</p>
                  </div>
                  <FiCreditCard className="text-purple-500 text-2xl" />
                </div>
              </div>
            </div>

            {loadingBookings ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-green-700">Loading your bookings...</p>
              </div>
            ) : bookings.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="py-4 text-left text-green-800 font-medium">Service</th>
                        <th className="py-4 text-left text-green-800 font-medium">Provider</th>
                        <th className="py-4 text-left text-green-800 font-medium">Date & Time</th>
                        <th className="py-4 text-left text-green-800 font-medium">Duration</th>
                        <th className="py-4 text-left text-green-800 font-medium">Total Price</th>
                        <th className="py-4 text-left text-green-800 font-medium">Status</th>
                        <th className="py-4 text-left text-green-800 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map(booking => (
                        <tr key={booking.id} className="border-b hover:bg-green-50">
                          <td className="py-4 text-green-900 font-medium">
                            <div className="flex items-center">
                              <FaTools className="mr-2 text-green-600" />
                              <div>
                                <div className="font-semibold">{booking.category || booking.serviceType || 'Service'}</div>
                                <div className="text-sm text-green-700">{booking.specialRequests || 'No special requests'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 text-green-700">
                            {booking.sellerName || booking.providerName || 'Not specified'}
                          </td>
                          <td className="py-4 text-green-700">
                            <div>
                              <div>{booking.formattedDate}</div>
                              {booking.scheduledDate && (
                                <div className="text-sm text-green-600">
                                  {booking.scheduledDate}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 text-green-700">
                            {booking.duration ? `${booking.duration} hour${booking.duration > 1 ? 's' : ''}` : 'Not specified'}
                          </td>
                          <td className="py-4 text-green-700 font-medium">
                            ${calculateTotalPrice(booking)}
                          </td>
                          <td className="py-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium inline-flex items-center ${getStatusColor(booking.status)}`}>
                              {getStatusIcon(booking.status)}
                              {formatStatus(booking.status)}
                            </span>
                          </td>
                          <td className="py-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleViewBookingDetails(booking)}
                                className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center"
                                title="View Details"
                              >
                                <FiEye className="mr-1" /> View
                              </button>
                              {(booking.status === 'pending' || booking.status === 'confirmed') && (
                                <button
                                  onClick={() => handleCancelBooking(booking.id)}
                                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                  Cancel
                                </button>
                              )}
                              {booking.status === 'completed' && (
                                <button
                                  onClick={() => handleBookAgain(booking)}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                  Book Again
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Booking Details Modal */}
                {selectedBooking && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                      <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-bold text-green-900">Booking Details</h3>
                          <button
                            onClick={handleCloseBookingDetails}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <FiXCircle size={24} />
                          </button>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-green-50 p-4 rounded-lg">
                              <label className="text-sm text-green-600">Service Category</label>
                              <p className="font-semibold text-green-900">{selectedBooking.category || selectedBooking.serviceType || 'Not specified'}</p>
                            </div>
                            
                            <div className="bg-blue-50 p-4 rounded-lg">
                              <label className="text-sm text-blue-600">Booking ID</label>
                              <p className="font-semibold text-blue-900">{selectedBooking.id}</p>
                            </div>
                            
                            <div className="bg-green-50 p-4 rounded-lg">
                              <label className="text-sm text-green-600">Service Provider</label>
                              <p className="font-semibold text-green-900">{selectedBooking.sellerName || selectedBooking.providerName || 'Not specified'}</p>
                            </div>
                            
                            <div className="bg-purple-50 p-4 rounded-lg">
                              <label className="text-sm text-purple-600">Status</label>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium inline-flex items-center ${getStatusColor(selectedBooking.status)}`}>
                                {getStatusIcon(selectedBooking.status)}
                                {formatStatus(selectedBooking.status)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <label className="text-sm text-gray-600">Date & Time</label>
                              <p className="font-semibold text-gray-900">{selectedBooking.formattedDate}</p>
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <label className="text-sm text-gray-600">Duration</label>
                              <p className="font-semibold text-gray-900">
                                {selectedBooking.duration ? `${selectedBooking.duration} hour${selectedBooking.duration > 1 ? 's' : ''}` : 'Not specified'}
                              </p>
                            </div>
                            
                            <div className="bg-green-50 p-4 rounded-lg">
                              <label className="text-sm text-green-600">Total Amount</label>
                              <p className="font-semibold text-green-900">${calculateTotalPrice(selectedBooking)}</p>
                            </div>
                          </div>
                          
                          {selectedBooking.pricePerHour && (
                            <div className="bg-blue-50 p-4 rounded-lg">
                              <label className="text-sm text-blue-600">Price Details</label>
                              <p className="text-blue-900">
                                ${selectedBooking.pricePerHour} per hour × {selectedBooking.duration} hours = ${calculateTotalPrice(selectedBooking)}
                              </p>
                            </div>
                          )}
                          
                          {selectedBooking.specialRequests && (
                            <div className="bg-yellow-50 p-4 rounded-lg">
                              <label className="text-sm text-yellow-600">Special Requests</label>
                              <p className="text-yellow-900">{selectedBooking.specialRequests}</p>
                            </div>
                          )}
                          
                          {selectedBooking.customerNotes && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <label className="text-sm text-gray-600">Your Notes</label>
                              <p className="text-gray-900">{selectedBooking.customerNotes}</p>
                            </div>
                          )}
                          
                          {selectedBooking.address && (
                            <div className="bg-green-50 p-4 rounded-lg">
                              <label className="text-sm text-green-600">Service Address</label>
                              <p className="text-green-900">{selectedBooking.address}</p>
                            </div>
                          )}
                          
                          {(selectedBooking.paymentMethod || selectedBooking.paymentStatus) && (
                            <div className="bg-purple-50 p-4 rounded-lg">
                              <label className="text-sm text-purple-600">Payment Information</label>
                              <div className="text-purple-900">
                                {selectedBooking.paymentMethod && <p>Method: {selectedBooking.paymentMethod}</p>}
                                {selectedBooking.paymentStatus && <p>Status: {selectedBooking.paymentStatus}</p>}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex justify-end space-x-3 mt-8">
                          {(selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') && (
                            <button
                              onClick={() => {
                                handleCancelBooking(selectedBooking.id);
                                handleCloseBookingDetails();
                              }}
                              className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition"
                            >
                              Cancel Booking
                            </button>
                          )}
                          <button
                            onClick={() => {
                              handleBookAgain(selectedBooking);
                              handleCloseBookingDetails();
                            }}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition"
                          >
                            Book Similar Service
                          </button>
                          <button
                            onClick={handleCloseBookingDetails}
                            className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiCalendar className="text-green-600" size={32} />
                </div>
                <p className="text-green-700 mb-6 text-lg">You haven't made any bookings yet.</p>
                <button 
                  onClick={() => navigate('/services')}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition"
                >
                  Browse Services
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-green-900 mb-6">Payment Methods</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {paymentMethods.map(method => (
                <div key={method.id} className={`border rounded-xl p-5 ${method.default ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                      <FiCreditCard className="text-green-600 mr-3" size={24} />
                      <div>
                        <h3 className="font-semibold text-green-900">{method.type} •••• {method.last4}</h3>
                        <p className="text-green-700 text-sm">Expires {method.expiry}</p>
                      </div>
                    </div>
                    {method.default ? (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">Default</span>
                    ) : (
                      <button 
                        onClick={() => handleSetDefaultPayment(method.id)}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        Set as default
                      </button>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <button 
                      onClick={() => handleDeletePayment(method.id)}
                      className="text-red-600 hover:text-red-800 flex items-center text-sm"
                    >
                      <FiTrash2 size={14} className="mr-1" /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button className="bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition flex items-center">
              <FiCreditCard className="mr-2" /> Add Payment Method
            </button>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-green-900 mb-6">Account Settings</h2>
            
            <div className="space-y-6">
              <div className="p-6 border border-green-200 rounded-xl">
                <h3 className="font-semibold text-lg text-green-900 mb-3 flex items-center">
                  <FiLock className="mr-2 text-green-600" /> Change Password
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-green-700 mb-2">Current Password</label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full p-3 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                  </div>
                  <div>
                    <label className="block text-green-700 mb-2">New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full p-3 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                  </div>
                  <div>
                    <label className="block text-green-700 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      name="confirmNewPassword"
                      value={passwordData.confirmNewPassword}
                      onChange={handlePasswordChange}
                      className="w-full p-3 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                  </div>
                </div>
                <button 
                  onClick={handlePasswordUpdate}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition"
                >
                  Update Password
                </button>
              </div>
              
              <div className="p-6 border border-green-200 rounded-xl">
                <h3 className="font-semibold text-lg text-green-900 mb-3 flex items-center">
                  <FiBell className="mr-2 text-green-600" /> Notification Preferences
                </h3>
                <div className="space-y-3 mb-4">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded text-green-600 focus:ring-green-500" defaultChecked />
                    <span className="ml-2 text-green-800">Email notifications</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded text-green-600 focus:ring-green-500" defaultChecked />
                    <span className="ml-2 text-green-800">SMS notifications</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded text-green-600 focus:ring-green-500" />
                    <span className="ml-2 text-green-800">Promotional offers</span>
                  </label>
                </div>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition">
                  Save Preferences
                </button>
              </div>
              
              <div className="p-6 border border-red-200 rounded-xl bg-red-50">
                <h3 className="font-semibold text-lg text-red-900 mb-3">Danger Zone</h3>
                <p className="text-red-700 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                <button className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
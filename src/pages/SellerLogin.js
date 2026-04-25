import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from '../components/firebase';
import { FaUserTie, FaUserPlus, FaHome } from 'react-icons/fa';

const SellerLogin = () => {
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateUniqueCode = async (code) => {
    try {
      const q = query(collection(db, 'services'), where('uniqueCode', '==', code));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { 
          id: doc.id,
          uniqueCode: code, // Ensure uniqueCode is included
          ...doc.data() 
        };
      }
      return null;
    } catch (e) {
      console.error('Error fetching unique code:', e);
      return null;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    const trimmedCode = code.trim();

    if (!trimmedCode) {
      setErrorMessage("Please enter your unique code");
      return;
    }

    // Validate code format (5 digits)
    if (!/^\d{5}$/.test(trimmedCode)) {
      setErrorMessage("Please enter a valid 5-digit code");
      return;
    }

    setIsLoading(true);
    try {
      const sellerDetails = await validateUniqueCode(trimmedCode);
      
      if (sellerDetails) {
        // Check if seller profile is approved
        if (sellerDetails.status === 'pending') {
          setErrorMessage("Your profile is pending approval. Please wait for admin approval.");
          setIsLoading(false);
          return;
        }

        if (sellerDetails.status === 'rejected') {
          setErrorMessage("Your profile has been rejected. Please contact support.");
          setIsLoading(false);
          return;
        }

        // Successful login - navigate to seller dashboard with seller details
        console.log('Login successful, navigating to dashboard with:', sellerDetails);
        navigate('/sellerdashboard', { 
          state: { 
            sellerDetails: {
              ...sellerDetails,
              // Ensure all required fields are present
              id: sellerDetails.id,
              uniqueCode: sellerDetails.uniqueCode,
              name: sellerDetails.name,
              category: sellerDetails.category,
              rating: sellerDetails.rating || 0
            }
          } 
        });
      } else {
        setErrorMessage("Invalid code. Please check your code and try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    navigate('/seller-reg');
  };

  const handleHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-500 to-green-800 flex flex-col justify-center items-center p-4">
      {/* Header Navigation */}
      <div className="absolute top-4 left-4">
        <button
          onClick={handleHome}
          className="flex items-center text-white hover:text-green-200 transition-colors"
        >
          <FaHome className="mr-2" />
          Back to Home
        </button>
      </div>

      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-green-600 p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
              <FaUserTie className="text-green-600 text-2xl" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white">Seller Login</h2>
          <p className="text-green-100 mt-2">Enter your unique 5-digit seller code</p>
        </div>

        <form onSubmit={handleLogin} className="p-6">
          <div className="mb-6">
            <label htmlFor="code" className="block text-gray-700 mb-3 font-medium">
              Unique Seller Code
            </label>
            <div className="relative">
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => {
                  // Allow only numbers and limit to 5 digits
                  const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                  setCode(value);
                }}
                placeholder="Enter your 5-digit code"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition text-center text-lg font-mono tracking-widest"
                required
                maxLength={5}
                pattern="\d{5}"
              />
              <div className="absolute right-3 top-3 text-gray-400">
                {code.length}/5
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Enter the 5-digit code you received during registration
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || code.length !== 5}
            className={`w-full py-3 px-4 rounded-lg text-white font-bold shadow-md transition flex items-center justify-center ${
              isLoading || code.length !== 5 
                ? 'bg-green-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 transform hover:scale-105'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </>
            ) : (
              <>
                <FaUserTie className="mr-2" /> 
                Login to Dashboard
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative flex items-center my-6">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink mx-4 text-gray-500 text-sm">or</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          {/* Additional Options */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleRegister}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center"
            >
              <FaUserPlus className="mr-2" /> 
              Register as New Seller
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  alert("Please contact support at support@tasknest.com or call +1-555-0123 to recover your seller code.");
                }}
                className="text-green-600 hover:text-green-800 font-medium text-sm"
              >
                Forgot your seller code?
              </button>
            </div>
          </div>
        </form>

        {/* Footer Info */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="text-center text-sm text-gray-600">
            <p className="flex items-center justify-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Need help? Contact our support team
            </p>
          </div>
        </div>
      </div>

      {/* Demo Codes Hint (remove in production) */}
      <div className="mt-6 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 max-w-md">
        <h3 className="text-white font-semibold mb-2 text-center">Demo Seller Codes</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-white bg-opacity-20 rounded p-2 text-center">
            <div className="text-white font-mono">12345</div>
            <div className="text-green-200 text-xs">House Cleaning</div>
          </div>
          <div className="bg-white bg-opacity-20 rounded p-2 text-center">
            <div className="text-white font-mono">67890</div>
            <div className="text-green-200 text-xs">Plumbing</div>
          </div>
          <div className="bg-white bg-opacity-20 rounded p-2 text-center">
            <div className="text-white font-mono">54321</div>
            <div className="text-green-200 text-xs">Electrical</div>
          </div>
          <div className="bg-white bg-opacity-20 rounded p-2 text-center">
            <div className="text-white font-mono">98765</div>
            <div className="text-green-200 text-xs">Gardening</div>
          </div>
        </div>
        <p className="text-green-200 text-xs text-center mt-2">
          Use these codes for testing (make sure these services exist in your database)
        </p>
      </div>
    </div>
  );
};

export default SellerLogin;
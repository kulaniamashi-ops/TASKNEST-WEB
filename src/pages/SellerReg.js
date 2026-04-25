import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { db, storage } from '../components/firebase'; 
import { collection, addDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { 
  FaUser, FaCamera, FaFileAlt, FaMapMarkerAlt, FaGraduationCap, 
  FaBirthdayCake, FaCity, FaBriefcase, FaAward, FaUsers, FaEnvelope, FaDollarSign
} from 'react-icons/fa';

const categories = [
  'House Cleaning',
  'Plumbing',
  'Electrical',
  'Gardening',
  'Painting',
  'Moving',
  'Repairs',
  'Pest Control',
  'Cooking'
];

const experienceLevels = [
  '<1 year',
  '1-3 years',
  '3-5 years',
  '5+ years',
];

const certificationOptions = ['Yes', 'No'];
const workTypeOptions = ['Individual', 'Team'];

const SellerReg = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    serviceDescription: '',
    phone: '',
    address: '',
    education: '',
    age: '',
    city: '',
    preferredLocation: '',
    selectedCategory: categories[0],
    selectedExperience: experienceLevels[0],
    hasCertifications: certificationOptions[1],
    workType: workTypeOptions[0],
    price: ''
  });
  const [profileImage, setProfileImage] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [certificationImage, setCertificationImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (event, imageType) => {
    const file = event.target.files[0];
    if (file) {
      switch(imageType) {
        case 'profile':
          setProfileImage(file);
          break;
        case 'cover':
          setCoverImage(file);
          break;
        case 'certification':
          setCertificationImage(file);
          break;
        default:
          break;
      }
    }
  };

  const uploadImageToStorage = async (image) => {
    if (!image) return '';
    try {
      const storageRef = ref(storage, `seller-images/${Date.now()}-${image.name}`);
      await uploadBytes(storageRef, image);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error("Image upload error:", error);
      return '';
    }
  };

  const registerSeller = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    const { name, email, serviceDescription, phone, address, education, age, city, 
            preferredLocation, selectedCategory, selectedExperience, 
            hasCertifications, workType, price } = formData;

    if (!name || !email || !serviceDescription || !phone || !address || 
        !education || !age || !city || !preferredLocation || !price) {
      setError('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    // Basic email validation
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address');
      setIsSubmitting(false);
      return;
    }

    // Price validation
    if (isNaN(price) || parseFloat(price) <= 0) {
      setError('Please enter a valid price');
      setIsSubmitting(false);
      return;
    }

    try {
      const uniqueCode = Math.floor(10000 + Math.random() * 90000).toString();
      const [profileImageUrl, coverImageUrl, certificationImageUrl] = await Promise.all([
        uploadImageToStorage(profileImage),
        uploadImageToStorage(coverImage),
        hasCertifications === 'Yes' ? uploadImageToStorage(certificationImage) : Promise.resolve('')
      ]);

      // Save to Firestore
      await addDoc(collection(db, "services"), {
        name,
        email,
        serviceDescription,
        phone,
        category: selectedCategory,
        uniqueCode,
        address,
        education,
        age: parseInt(age),
        city,
        experience: selectedExperience,
        hasCertifications,
        certificationImage: certificationImageUrl,
        workType,
        preferredLocation,
        profileImage: profileImageUrl,
        coverImage: coverImageUrl,
        price: parseFloat(price),
        timestamp: new Date(),
        status: 'pending', // Add status field for admin approval
        rating: 0,
        reviewsCount: 0
      });

      alert(`Registration successful! Your unique code: ${uniqueCode}\nPlease save this code for login.\nYour profile will be active after admin approval.`);
      navigate('/seller-login');
    } catch (e) {
      console.error("Error:", e);
      setError(`Registration failed: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-800 to-blue-600 p-6 text-white">
          <h1 className="text-2xl md:text-3xl font-bold">Become a TaskNest Seller</h1>
          <p className="text-blue-100 mt-2">Register your service and start earning today</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-4 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={registerSeller} className="p-6 md:p-8">
          {/* Progress Steps */}
          <div className="flex justify-between mb-8">
            {['Personal Info', 'Service Details', 'Verification'].map((step, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center 
                  ${index < 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {index + 1}
                </div>
                <span className="text-sm mt-2 text-gray-600">{step}</span>
              </div>
            ))}
          </div>

          {/* Image Upload Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FaCamera className="mr-2 text-blue-600" /> Profile Images
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-2 border-dashed border-blue-200 rounded-xl p-4 text-center hover:border-blue-400 transition">
                <label className="cursor-pointer">
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                      {profileImage ? (
                        <img src={URL.createObjectURL(profileImage)} alt="Profile" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <FaUser className="text-blue-400 text-3xl" />
                      )}
                    </div>
                    <span className="text-blue-600 font-medium">Upload Profile Photo</span>
                    <input 
                      type="file" 
                      onChange={(e) => handleImageChange(e, 'profile')} 
                      className="hidden" 
                      accept="image/*"
                    />
                  </div>
                </label>
              </div>
              <div className="border-2 border-dashed border-blue-200 rounded-xl p-4 text-center hover:border-blue-400 transition">
                <label className="cursor-pointer">
                  <div className="flex flex-col items-center">
                    <div className="w-full h-24 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                      {coverImage ? (
                        <img src={URL.createObjectURL(coverImage)} alt="Cover" className="w-full h-full rounded-lg object-cover" />
                      ) : (
                        <FaFileAlt className="text-blue-400 text-3xl" />
                      )}
                    </div>
                    <span className="text-blue-600 font-medium">Upload Cover Photo</span>
                    <input 
                      type="file" 
                      onChange={(e) => handleImageChange(e, 'cover')} 
                      className="hidden" 
                      accept="image/*"
                    />
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FaUser className="mr-2 text-blue-600" /> Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'name', icon: <FaUser className="text-blue-500" />, placeholder: 'Full Name', type: 'text' },
                { name: 'email', icon: <FaEnvelope className="text-blue-500" />, placeholder: 'Email Address', type: 'email' },
                { name: 'phone', icon: <FaMapMarkerAlt className="text-blue-500" />, placeholder: 'Phone Number', type: 'tel' },
                { name: 'education', icon: <FaGraduationCap className="text-blue-500" />, placeholder: 'Education', type: 'text' },
                { name: 'age', icon: <FaBirthdayCake className="text-blue-500" />, placeholder: 'Age', type: 'number' },
                { name: 'city', icon: <FaCity className="text-blue-500" />, placeholder: 'City', type: 'text' },
                { name: 'address', icon: <FaMapMarkerAlt className="text-blue-500" />, placeholder: 'Full Address', type: 'text' },
                { name: 'price', icon: <FaDollarSign className="text-blue-500" />, placeholder: 'Service Price ($)', type: 'number' },
              ].map((field, index) => (
                <div key={index} className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {field.icon}
                  </div>
                  <input
                    name={field.name}
                    type={field.type}
                    value={formData[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    required
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Service Description */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FaBriefcase className="mr-2 text-blue-600" /> Service Details
            </h2>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Service Description</label>
              <textarea
                name="serviceDescription"
                value={formData.serviceDescription}
                onChange={handleChange}
                placeholder="Describe your service in detail..."
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
          </div>

          {/* Service Category & Experience */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-gray-700 mb-2">Service Category</label>
              <div className="relative">
                <select 
                  name="selectedCategory"
                  value={formData.selectedCategory}
                  onChange={handleChange}
                  className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Years of Experience</label>
              <div className="relative">
                <select 
                  name="selectedExperience"
                  value={formData.selectedExperience}
                  onChange={handleChange}
                  className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                >
                  {experienceLevels.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Work Type & Certifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-gray-700 mb-2">Work Type</label>
              <div className="relative">
                <select 
                  name="workType"
                  value={formData.workType}
                  onChange={handleChange}
                  className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                >
                  {workTypeOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <FaUsers className="text-gray-400" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Professional Certifications</label>
              <div className="relative">
                <select 
                  name="hasCertifications"
                  value={formData.hasCertifications}
                  onChange={handleChange}
                  className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                >
                  {certificationOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <FaAward className="text-gray-400" />
                </div>
              </div>
              {formData.hasCertifications === 'Yes' && (
                <div className="mt-4">
                  <label className="block text-gray-700 mb-2">Upload Certification</label>
                  <div className="border-2 border-dashed border-blue-200 rounded-lg p-4 text-center hover:border-blue-400 transition">
                    <label className="cursor-pointer flex flex-col items-center">
                      <FaFileAlt className="text-blue-400 text-3xl mb-2" />
                      <span className="text-blue-600 font-medium">
                        {certificationImage ? certificationImage.name : 'Click to upload certification'}
                      </span>
                      <input 
                        type="file" 
                        onChange={(e) => handleImageChange(e, 'certification')} 
                        className="hidden" 
                        accept="image/*,application/pdf"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preferred Location */}
          <div className="mb-8">
            <label className="block text-gray-700 mb-2">Preferred Working Locations</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaMapMarkerAlt className="text-blue-500" />
              </div>
              <input
                name="preferredLocation"
                type="text"
                value={formData.preferredLocation}
                onChange={handleChange}
                placeholder="Enter cities or areas where you provide service"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="mb-8">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input 
                  id="terms" 
                  name="terms" 
                  type="checkbox" 
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  required
                />
              </div>
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                I agree to the <a href="#" className="text-blue-600 hover:underline">Terms and Conditions</a> and 
                <a href="#" className="text-blue-600 hover:underline"> Privacy Policy</a> of TaskNest
              </label>
            </div>
            </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full md:w-1/2 py-4 px-6 rounded-xl text-white font-bold shadow-lg transition 
                ${isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : 'COMPLETE REGISTRATION'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellerReg;
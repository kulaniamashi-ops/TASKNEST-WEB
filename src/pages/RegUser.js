import React, { useState } from "react";
import { auth, db, storage } from "../components/firebase";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { collection, doc, setDoc, getDocs, query, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FiCamera } from "react-icons/fi";
import { FaSpinner } from "react-icons/fa";
import { motion } from "framer-motion";
import emailjs from '@emailjs/browser';

const categoryImages = [
  `${process.env.PUBLIC_URL}/image1.png`,
  `${process.env.PUBLIC_URL}/image2.png`,
  `${process.env.PUBLIC_URL}/image3.png`,
  `${process.env.PUBLIC_URL}/image4.png`,
  `${process.env.PUBLIC_URL}/image5.png`,
  `${process.env.PUBLIC_URL}/image6.png`,
  `${process.env.PUBLIC_URL}/image7.png`,
  `${process.env.PUBLIC_URL}/image8.png`,
  `${process.env.PUBLIC_URL}/image9.png`,
  `${process.env.PUBLIC_URL}/image10.png`,
];

const RegUser = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    dob: "",
    address: "",
    gender: "",
    userType: "",
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const compressImage = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 800;
          const maxHeight = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            }));
          }, 'image/jpeg', 0.7);
        };
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImagePick = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    try {
      const compressedFile = await compressImage(file);
      setProfileImageFile(compressedFile);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileImage(event.target.result);
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      console.error("Image processing error:", err);
      setError("Failed to process image. Please try another one.");
    }
  };

  const sendWelcomeEmail = async (email, username) => {
    try {
      const templateParams = {
        to_email: email,
        username: username,
      };

      await emailjs.send(
        'service_z43a97a', // Your EmailJS Service ID
        'template_v54ahm3', // Your EmailJS Template ID
        templateParams,
        '2k9LK2DdgE8xtokeO' // Your EmailJS Public Key
      );
      
      console.log('Welcome email sent successfully');
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't show this error to the user as it's not critical
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    if (!agreedToTerms) {
      setError("You must agree to the Terms & Conditions");
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      // Check if username exists
      const usersRef = collection(db, "users");
      const usernameQuery = query(usersRef, where("username", "==", formData.username));
      const usernameSnapshot = await getDocs(usernameQuery);

      if (!usernameSnapshot.empty) {
        setError("Username already exists");
        setIsLoading(false);
        return;
      }

      // Check if email exists
      const emailQuery = query(usersRef, where("email", "==", formData.email));
      const emailSnapshot = await getDocs(emailQuery);

      if (!emailSnapshot.empty) {
        setError("Email already exists");
        setIsLoading(false);
        return;
      }

      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // Send email verification
      await sendEmailVerification(user);

      // Upload image if exists
      let imageUrl = "";
      if (profileImageFile) {
        try {
          const storageRef = ref(storage, `users/profileImages/${user.uid}`);
          const metadata = {
            contentType: profileImageFile.type,
            customMetadata: {
              'uploadedBy': user.uid,
              'uploadDate': new Date().toISOString()
            }
          };
          
          const uploadTask = await uploadBytes(storageRef, profileImageFile, metadata);
          imageUrl = await getDownloadURL(uploadTask.ref);
        } catch (uploadError) {
          console.error("Image upload failed:", uploadError);
          setError("Profile image upload failed, but account was created. You can update your profile picture later.");
        }
      }

      // Save user data
      await setDoc(doc(usersRef, user.uid), {
        uid: user.uid,
        username: formData.username,
        email: formData.email,
        fullName: formData.fullName,
        phone: formData.phone,
        dob: formData.dob,
        address: formData.address,
        gender: formData.gender,
        userType: formData.userType,
        profileImage: imageUrl || "",
        createdAt: new Date().toISOString(),
        emailVerified: false,
      });

      // Send welcome email with username
      await sendWelcomeEmail(formData.email, formData.username);

      setSuccess("Registration successful! Please check your email to verify your account.");
      setTimeout(() => navigate("/login"), 4000);
    } catch (error) {
      console.error("Registration error:", error);
      let errorMessage = "Registration failed. Please try again.";
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password should be at least 6 characters.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-green-500 to-green-700 overflow-hidden">
      <h1 className="absolute text-[200px] font-extrabold text-green-300 opacity-20 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 select-none">
        TASKNEST
      </h1>

      <div className="absolute inset-0 grid grid-cols-5 grid-rows-2 gap-4 p-10 opacity-40">
        {categoryImages.map((src, index) => (
          <motion.div
            key={index}
            className="w-48 h-48 bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-green-300 flex items-center justify-center"
            animate={{ y: [0, -20, 0] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatType: "reverse",
              delay: index * 0.2,
            }}
          >
            <img src={src} alt={`Category ${index + 1}`} className="w-full h-full object-cover" />
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 bg-white bg-opacity-95 p-8 rounded-xl shadow-lg w-full max-w-4xl border-4 border-green-400">
        <div className="bg-green-600 p-6 text-white text-center rounded-t-xl">
          <h2 className="text-3xl font-bold">Create Your Account</h2>
          <p className="mt-2">Join our community today</p>
        </div>

        <form onSubmit={handleRegister} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Profile Image Upload */}
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <label className="cursor-pointer">
                <div className="w-24 h-24 rounded-full border-4 border-green-100 flex items-center justify-center overflow-hidden bg-white hover:border-green-300 transition-all duration-300 shadow-md group-hover:shadow-lg">
                  {profileImage ? (
                    <img 
                      src={profileImage} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-green-400">
                      <FiCamera size={28} className="group-hover:text-green-600 transition-colors" />
                      <span className="text-xs mt-1 text-gray-500 group-hover:text-gray-700">Add Photo</span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImagePick}
                  className="hidden"
                />
              </label>
              {profileImage && (
                <button 
                  type="button"
                  onClick={() => {
                    setProfileImage(null);
                    setProfileImageFile(null);
                  }}
                  className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded-full hover:bg-red-600 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label htmlFor="fullName" className="block text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                name="fullName"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={isLoading}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="username" className="block text-gray-700 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                name="username"
                placeholder="johndoe"
                value={formData.username}
                onChange={handleChange}
                required
                minLength="3"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={isLoading}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={isLoading}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="phone" className="block text-gray-700 mb-2">
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                name="phone"
                placeholder="1234567890"
                value={formData.phone}
                onChange={handleChange}
                required
                pattern="[0-9]{10,15}"
                title="Please enter a valid phone number"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={isLoading}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="dob" className="block text-gray-700 mb-2">
                Date of Birth
              </label>
              <input
                id="dob"
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                required
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={isLoading}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="gender" className="block text-gray-700 mb-2">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={isLoading}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="••••••"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>

            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                placeholder="••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={isLoading}
              />
            </div>

            <div className="mb-4 md:col-span-2">
              <label htmlFor="address" className="block text-gray-700 mb-2">
                Address
              </label>
              <input
                id="address"
                type="text"
                name="address"
                placeholder="123 Main St, City"
                value={formData.address}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={isLoading}
              />
            </div>

            <div className="mb-4 md:col-span-2">
              <label className="block text-gray-700 mb-2">
                User Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="userType"
                    value="Buyer"
                    checked={formData.userType === "Buyer"}
                    onChange={handleChange}
                    required
                    className="sr-only"
                    disabled={isLoading}
                  />
                  <div className={`w-full p-4 border rounded-lg transition-all duration-300 ${
                    formData.userType === "Buyer" 
                      ? "border-green-500 bg-green-50 shadow-inner" 
                      : "border-gray-300 hover:border-green-300"
                  }`}>
                    <div className="font-semibold text-gray-800">Buyer</div>
                    <div className="text-xs text-gray-500 mt-1">I want to hire freelancers</div>
                  </div>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="userType"
                    value="Seller"
                    checked={formData.userType === "Seller"}
                    onChange={handleChange}
                    required
                    className="sr-only"
                    disabled={isLoading}
                  />
                  <div className={`w-full p-4 border rounded-lg transition-all duration-300 ${
                    formData.userType === "Seller" 
                      ? "border-green-500 bg-green-50 shadow-inner" 
                      : "border-gray-300 hover:border-green-300"
                  }`}>
                    <div className="font-semibold text-gray-800">Seller</div>
                    <div className="text-xs text-gray-500 mt-1">I want to offer services</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  required
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  disabled={isLoading}
                />
              </div>
              <label htmlFor="terms" className="ml-3 text-sm text-gray-600">
                I agree to the <a href="/terms" className="text-green-600 hover:underline font-medium">Terms of Service</a> and <a href="/privacy" className="text-green-600 hover:underline font-medium">Privacy Policy</a>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full ${isLoading ? 'bg-green-500' : 'bg-green-600'} text-white py-3 rounded-lg hover:bg-green-700 transition duration-300 flex items-center justify-center`}
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </button>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <button
                type="button"
                className="text-green-600 font-semibold hover:underline"
                onClick={() => navigate("/login")}
                disabled={isLoading}
              >
                Sign In
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegUser;
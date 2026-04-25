import React, { useState } from 'react';
import { FiMail, FiPhone, FiMapPin, FiSend, FiClock } from 'react-icons/fi';
import { db } from '../components/firebase'; // Make sure you have firebase config
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Save feedback to Firebase
      const feedbackRef = collection(db, 'feedback');
      await addDoc(feedbackRef, {
        ...formData,
        createdAt: serverTimestamp(),
        status: 'unread', // 'unread', 'read', 'replied', 'archived'
        replied: false,
        adminReply: '',
        type: 'contact_form',
        source: 'contact_page'
      });
      
      // Reset form and show success message
      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
      
    } catch (error) {
      console.error('Error saving feedback:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Message */}
        {success && (
          <div className="fixed top-24 right-4 z-50">
            <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg animate-slide-in">
              <div className="flex items-center">
                <div className="bg-green-600 rounded-full p-2 mr-3">
                  <FiSend className="text-white" />
                </div>
                <div>
                  <p className="font-semibold">Message Sent!</p>
                  <p className="text-sm">We'll get back to you soon.</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-green-900 mb-6">
            Contact <span className="text-green-600">Us</span>
          </h1>
          <p className="text-xl text-green-700 max-w-3xl mx-auto">
            Have questions or need assistance? We're here to help!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-8 h-full">
              <h2 className="text-2xl font-bold text-green-900 mb-6">Get in Touch</h2>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-green-100 p-3 rounded-full mr-4">
                    <FiMail className="text-green-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900">Email Us</h3>
                    <p className="text-green-700">support@tasknest.com</p>
                    <p className="text-green-700">info@tasknest.com</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-green-100 p-3 rounded-full mr-4">
                    <FiPhone className="text-green-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900">Call Us</h3>
                    <p className="text-green-700">+1 (555) 123-4567</p>
                    <p className="text-green-700">+1 (555) 987-6543</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-green-100 p-3 rounded-full mr-4">
                    <FiMapPin className="text-green-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900">Visit Us</h3>
                    <p className="text-green-700">123 Service Avenue</p>
                    <p className="text-green-700">New York, NY 10001</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-green-100 p-3 rounded-full mr-4">
                    <FiClock className="text-green-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900">Working Hours</h3>
                    <p className="text-green-700">Mon-Fri: 8:00 AM - 8:00 PM</p>
                    <p className="text-green-700">Sat-Sun: 9:00 AM - 5:00 PM</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-green-100">
                <h3 className="font-semibold text-green-900 mb-3">Response Time</h3>
                <p className="text-green-700 text-sm">
                  We typically respond to messages within 24 hours during business days.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8 h-full">
              <h2 className="text-2xl font-bold text-green-900 mb-6">Send us a Message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-green-800 font-medium mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full p-4 border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-green-800 font-medium mb-2">
                      Your Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full p-4 border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-green-800 font-medium mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full p-4 border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                    placeholder="What is this regarding?"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-green-800 font-medium mb-2">
                    Your Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows="5"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    className="w-full p-4 border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                    placeholder="Tell us how we can help you..."
                  ></textarea>
                  <p className="text-sm text-green-600 mt-2">
                    * Required fields
                  </p>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className={`bg-green-600 text-white px-8 py-4 rounded-xl font-semibold transition flex items-center justify-center ${
                    loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-green-700 hover:shadow-lg'
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message <FiSend className="ml-2" />
                    </>
                  )}
                </button>
              </form>
              
              <div className="mt-8 pt-6 border-t border-green-100">
                <p className="text-sm text-green-600">
                  By submitting this form, you agree to our privacy policy and allow us to contact you regarding your inquiry.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-green-900 text-center mb-10">Frequently Asked Questions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition">
              <h3 className="font-semibold text-lg text-green-900 mb-3">How do I book a service?</h3>
              <p className="text-green-700">
                Simply browse our services, select the one you need, choose a provider, and book directly through our platform. You can schedule for immediate help or book in advance.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition">
              <h3 className="font-semibold text-lg text-green-900 mb-3">Are the service providers verified?</h3>
              <p className="text-green-700">
                Yes, all our service providers undergo a thorough verification process including background checks, skill assessments, and customer reviews before they can join our platform.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition">
              <h3 className="font-semibold text-lg text-green-900 mb-3">What if I'm not satisfied with the service?</h3>
              <p className="text-green-700">
                We offer a satisfaction guarantee. If you're not happy with the service provided, contact us within 24 hours and we'll work to make it right or provide a refund.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition">
              <h3 className="font-semibold text-lg text-green-900 mb-3">How do payments work?</h3>
              <p className="text-green-700">
                Payments are processed securely through our platform. You pay after the service is completed and you're satisfied. We accept credit cards, debit cards, and digital wallets.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
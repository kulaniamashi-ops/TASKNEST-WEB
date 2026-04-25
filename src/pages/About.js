import React from 'react';
import { FiUsers, FiAward, FiSmile, FiGlobe } from 'react-icons/fi';

const About = () => {
  const stats = [
    { icon: <FiUsers size={30} />, number: '10,000+', label: 'Happy Customers' },
    { icon: <FiAward size={30} />, number: '500+', label: 'Verified Professionals' },
    { icon: <FiSmile size={30} />, number: '98%', label: 'Satisfaction Rate' },
    { icon: <FiGlobe size={30} />, number: '50+', label: 'Cities Covered' }
  ];

  const team = [
    { name: 'Sarah Johnson', role: 'CEO & Founder', image: `${process.env.PUBLIC_URL}/team1.jpg` },
    { name: 'Michael Chen', role: 'CTO', image: `${process.env.PUBLIC_URL}/team2.jpg` },
    { name: 'Emily Rodriguez', role: 'Head of Operations', image: `${process.env.PUBLIC_URL}/team3.jpg` },
    { 
      name: 'Your Name', // Replace with your actual name
      role: 'Project Developer', // You can customize this role
      image: `${process.env.PUBLIC_URL}/team4.jpg`, // Replace with your photo or use a placeholder
      description: 'Lead developer and architect behind TaskNest platform implementation.' // Optional: Add description
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-green-900 mb-6">
            About <span className="text-green-600">TaskNest</span>
          </h1>
          <p className="text-xl text-green-700 max-w-3xl mx-auto mb-10">
            We're on a mission to make home services accessible, reliable, and hassle-free for everyone.
          </p>
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
            <p className="text-lg text-green-800">
              TaskNest was founded in 2020 with a simple goal: to connect homeowners with trusted professionals 
              for all their home service needs. Today, we're a growing community of skilled professionals and 
              satisfied customers across the country. As part of my final year project, I've developed this platform 
              to demonstrate modern web development practices while solving real-world problems.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white p-8 rounded-2xl shadow-lg text-center hover:shadow-xl transition">
              <div className="text-green-600 mb-4 flex justify-center">
                {stat.icon}
              </div>
              <h3 className="text-4xl font-bold text-green-900 mb-2">{stat.number}</h3>
              <p className="text-green-700">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-bold text-green-900 mb-4">Our Mission</h2>
            <p className="text-green-800">
              To revolutionize the home services industry by creating a platform that empowers both service 
              providers and homeowners. We strive to make quality home services accessible to everyone while 
              ensuring fair compensation and growth opportunities for professionals.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-bold text-green-900 mb-4">Our Vision</h2>
            <p className="text-green-800">
              We envision a world where finding reliable home services is as easy as clicking a button. 
              Where trust is built-in, quality is guaranteed, and every interaction leaves both customers 
              and service providers feeling valued and satisfied. As a final year project, TaskNest represents 
              my vision for how technology can bridge gaps in traditional service markets, creating efficient 
              connections between service providers and those who need them most.
            </p>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-green-900 text-center mb-10">Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition hover:scale-[1.02] duration-300">
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-full h-56 object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${member.name.replace(' ', '+')}&background=10B981&color=fff&size=256`;
                  }}
                />
                <div className="p-6 text-center">
                  <h3 className="font-semibold text-lg text-green-900">{member.name}</h3>
                  <p className="text-green-600 mb-2">{member.role}</p>
                  {member.description && (
                    <p className="text-sm text-green-700 mt-2 italic">{member.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Developer Details Section */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-lg p-8 mb-16">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-2/3 mb-6 md:mb-0">
              <h2 className="text-2xl font-bold text-white mb-4">Project Developer</h2>
              <p className="text-green-50 mb-4">
                This platform was developed as my final year project to showcase full-stack development skills 
                using React, Node.js, and modern web technologies. The project focuses on creating a seamless 
                user experience while addressing real-world problems in the home services industry.
              </p>
              <div className="flex flex-wrap gap-4">
                <span className="bg-white text-green-600 px-4 py-2 rounded-full text-sm font-semibold">
                  React.js
                </span>
                <span className="bg-white text-green-600 px-4 py-2 rounded-full text-sm font-semibold">
                  Node.js
                </span>
                <span className="bg-white text-green-600 px-4 py-2 rounded-full text-sm font-semibold">
                  Tailwind CSS
                </span>
                <span className="bg-white text-green-600 px-4 py-2 rounded-full text-sm font-semibold">
                  Firebase
                </span>
              </div>
            </div>
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center mx-auto mb-4 overflow-hidden border-4 border-white">
                {/* Replace with your photo or initial */}
                <span className="text-4xl font-bold text-green-600">
                  YN
                </span>
              </div>
              <h3 className="font-bold text-xl text-white">Your Name</h3>
              <p className="text-green-100">Final Year Student</p>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="bg-white rounded-2xl shadow-lg p-10">
          <h2 className="text-3xl font-bold text-green-900 text-center mb-10">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-semibold text-xl text-green-900 mb-3">Trust & Safety</h3>
              <p className="text-green-700">
                We thoroughly vet all service providers and maintain high standards for quality and reliability.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-xl text-green-900 mb-3">Quality Service</h3>
              <p className="text-green-700">
                We're committed to delivering exceptional service that exceeds our customers' expectations.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-xl text-green-900 mb-3">Community Focus</h3>
              <p className="text-green-700">
                We believe in building strong communities by supporting local service professionals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
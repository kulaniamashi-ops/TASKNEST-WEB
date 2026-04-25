import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Services from './pages/Services';
import About from './pages/About';
import Contact from './pages/Contact';
import Profile from './pages/Profile';
import ServiceDetail from './pages/ServiceDetail';
import SellerLogin from './pages/SellerLogin';
import SellerReg from './pages/SellerReg';
import SellerDashboard from './pages/SellerDashboard';
import Search from './pages/search';
import Admin from './pages/admin';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/service/:id" element={<ServiceDetail />} />
            <Route path="/seller-login" element={<SellerLogin />} />
            <Route path="/seller-reg" element={<SellerReg />} />
            <Route path="/seller-dashboard" element={<SellerDashboard />} />
            <Route path="/sellerDashboard" element={<SellerDashboard />} />
            <Route path="/search/:query" element={<Search />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
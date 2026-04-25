import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from '../components/firebase';
import { onAuthStateChanged } from "firebase/auth";
import { 
  FaTrash, FaEdit, FaCheck, FaTimes, FaSearch, 
  FaUserCheck, FaUserTimes, FaEye, FaDollarSign, 
  FaUserFriends, FaShoppingCart, FaTools,
  FaSpinner, FaSignOutAlt, FaHome, FaUserCog,
  FaChartLine, FaDatabase, FaCog, FaShieldAlt,
  FaCalendar, FaPhone, FaEnvelope, FaMapMarkerAlt,
  FaTag, FaStar, FaClock, FaUsers, FaCheckCircle,
  FaTimesCircle, FaExclamationCircle, FaComments,
  FaReply, FaArchive, FaInbox
} from "react-icons/fa";
import { collection, getDocs, query, where, updateDoc, doc, deleteDoc, orderBy, Timestamp } from 'firebase/firestore';

const Admin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSellers: 0,
    pendingApprovals: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeSellers: 0,
    unreadMessages: 0,
    totalFeedback: 0
  });
  
  // Data states
  const [users, setUsers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [services, setServices] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  
  // Filter states
  const [userFilter, setUserFilter] = useState("all");
  const [sellerFilter, setSellerFilter] = useState("all");
  const [orderFilter, setOrderFilter] = useState("all");
  const [feedbackFilter, setFeedbackFilter] = useState("unread");

  // CHECK ADMIN AUTH ON MOUNT
  useEffect(() => {
    console.log("🏛️ Admin Page Loaded");
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email === 'admin@tasknest.com') {
        console.log("✅ Admin authenticated via Firebase");
        setIsAdmin(true);
        localStorage.setItem("isAdmin", "true");
        localStorage.setItem("adminEmail", user.email);
        await loadAllData();
        setLoading(false);
      } else {
        console.log("❌ Not admin or not logged in");
        setIsAdmin(false);
        alert("❌ Access Denied! You must login as admin first.");
        navigate("/profile");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const loadAllData = async () => {
    try {
      // Load users
      const usersQuery = query(collection(db, "users"));
      const usersSnapshot = await getDocs(usersQuery);
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'user'
      }));
      setUsers(usersList);

      // Load sellers
      const sellersQuery = query(collection(db, "services"));
      const sellersSnapshot = await getDocs(sellersQuery);
      const sellersList = sellersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'seller'
      }));
      setSellers(sellersList);

      // Load orders
      const ordersQuery = query(collection(db, "orders"));
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersList = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersList);

      // Load feedback/messages
      const feedbackQuery = query(
        collection(db, "feedback"),
        orderBy("createdAt", "desc")
      );
      const feedbackSnapshot = await getDocs(feedbackQuery);
      const feedbackList = feedbackSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFeedback(feedbackList);

      // Calculate statistics
      const pendingSellers = sellersList.filter(s => s.status === 'pending').length;
      const approvedSellers = sellersList.filter(s => s.status === 'approved').length;
      const totalRevenue = ordersList.reduce((sum, order) => sum + (order.pricePerHour * order.duration), 0);
      const unreadMessages = feedbackList.filter(f => f.status === 'unread').length;
      
      setStats({
        totalUsers: usersList.length,
        totalSellers: sellersList.length,
        pendingApprovals: pendingSellers,
        totalOrders: ordersList.length,
        totalRevenue: totalRevenue,
        activeSellers: approvedSellers,
        unreadMessages: unreadMessages,
        totalFeedback: feedbackList.length
      });

    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  // Feedback Management Functions
  const handleMarkAsRead = async (feedbackId) => {
    try {
      await updateDoc(doc(db, "feedback", feedbackId), {
        status: 'read',
        readAt: Timestamp.now()
      });
      
      setFeedback(feedback.map(item => 
        item.id === feedbackId ? { ...item, status: 'read', readAt: Timestamp.now() } : item
      ));
      
      setStats(prev => ({ 
        ...prev, 
        unreadMessages: prev.unreadMessages - 1
      }));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleArchiveFeedback = async (feedbackId) => {
    try {
      await updateDoc(doc(db, "feedback", feedbackId), {
        status: 'archived'
      });
      
      setFeedback(feedback.map(item => 
        item.id === feedbackId ? { ...item, status: 'archived' } : item
      ));
      
      if (feedback.find(f => f.id === feedbackId).status === 'unread') {
        setStats(prev => ({ 
          ...prev, 
          unreadMessages: prev.unreadMessages - 1
        }));
      }
      
      alert("Message archived!");
    } catch (error) {
      console.error("Error archiving feedback:", error);
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        await deleteDoc(doc(db, "feedback", feedbackId));
        
        const feedbackToDelete = feedback.find(f => f.id === feedbackId);
        setFeedback(feedback.filter(item => item.id !== feedbackId));
        
        setStats(prev => ({ 
          ...prev, 
          totalFeedback: prev.totalFeedback - 1,
          unreadMessages: feedbackToDelete.status === 'unread' ? prev.unreadMessages - 1 : prev.unreadMessages
        }));
        
        alert("Message deleted!");
      } catch (error) {
        console.error("Error deleting feedback:", error);
      }
    }
  };

  const handleSendReply = async (feedbackId) => {
    if (!replyMessage.trim()) {
      alert("Please enter a reply message");
      return;
    }

    try {
      await updateDoc(doc(db, "feedback", feedbackId), {
        status: 'replied',
        replied: true,
        adminReply: replyMessage,
        repliedAt: Timestamp.now()
      });
      
      setFeedback(feedback.map(item => 
        item.id === feedbackId ? { 
          ...item, 
          status: 'replied', 
          replied: true, 
          adminReply: replyMessage,
          repliedAt: Timestamp.now()
        } : item
      ));
      
      if (feedback.find(f => f.id === feedbackId).status === 'unread') {
        setStats(prev => ({ 
          ...prev, 
          unreadMessages: prev.unreadMessages - 1
        }));
      }
      
      setReplyMessage("");
      setSelectedFeedback(null);
      alert("Reply sent successfully!");
    } catch (error) {
      console.error("Error sending reply:", error);
      alert("Failed to send reply");
    }
  };

  const handleLogout = async () => {
    try {
      console.log("👋 Admin logging out...");
      await auth.signOut();
      localStorage.clear();
      navigate("/profile");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const goHome = () => {
    navigate("/");
  };

  // User Management Functions
  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
      try {
        await deleteDoc(doc(db, "users", userId));
        setUsers(users.filter(user => user.id !== userId));
        setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
        alert("User deleted successfully!");
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Failed to delete user");
      }
    }
  };

  const handleSuspendUser = async (userId, isSuspended) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        status: isSuspended ? 'active' : 'suspended'
      });
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: isSuspended ? 'active' : 'suspended' } : user
      ));
      
      alert(`User ${isSuspended ? 'activated' : 'suspended'} successfully!`);
    } catch (error) {
      console.error("Error updating user status:", error);
      alert("Failed to update user status");
    }
  };

  // Seller Management Functions
  const handleApproveSeller = async (sellerId) => {
    try {
      await updateDoc(doc(db, "services", sellerId), {
        status: 'approved'
      });
      
      setSellers(sellers.map(seller => 
        seller.id === sellerId ? { ...seller, status: 'approved' } : seller
      ));
      
      setStats(prev => ({ 
        ...prev, 
        pendingApprovals: prev.pendingApprovals - 1,
        activeSellers: prev.activeSellers + 1
      }));
      
      alert("Seller approved successfully!");
    } catch (error) {
      console.error("Error approving seller:", error);
      alert("Failed to approve seller");
    }
  };

  const handleRejectSeller = async (sellerId) => {
    if (window.confirm("Are you sure you want to reject this seller?")) {
      try {
        await updateDoc(doc(db, "services", sellerId), {
          status: 'rejected'
        });
        
        setSellers(sellers.map(seller => 
          seller.id === sellerId ? { ...seller, status: 'rejected' } : seller
        ));
        
        setStats(prev => ({ 
          ...prev, 
          pendingApprovals: prev.pendingApprovals - 1
        }));
        
        alert("Seller rejected!");
      } catch (error) {
        console.error("Error rejecting seller:", error);
        alert("Failed to reject seller");
      }
    }
  };

  const handleDeleteSeller = async (sellerId, sellerName) => {
    if (window.confirm(`Are you sure you want to delete seller "${sellerName}"?`)) {
      try {
        await deleteDoc(doc(db, "services", sellerId));
        
        const sellerToDelete = sellers.find(s => s.id === sellerId);
        setSellers(sellers.filter(seller => seller.id !== sellerId));
        
        setStats(prev => ({ 
          ...prev, 
          totalSellers: prev.totalSellers - 1,
          pendingApprovals: sellerToDelete.status === 'pending' ? prev.pendingApprovals - 1 : prev.pendingApprovals,
          activeSellers: sellerToDelete.status === 'approved' ? prev.activeSellers - 1 : prev.activeSellers
        }));
        
        alert("Seller deleted successfully!");
      } catch (error) {
        console.error("Error deleting seller:", error);
        alert("Failed to delete seller");
      }
    }
  };

  // Order Management Functions
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus
      });
      
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      alert(`Order status updated to ${newStatus}!`);
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to update order status");
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await deleteDoc(doc(db, "orders", orderId));
        setOrders(orders.filter(order => order.id !== orderId));
        setStats(prev => ({ ...prev, totalOrders: prev.totalOrders - 1 }));
        alert("Order deleted successfully!");
      } catch (error) {
        console.error("Error deleting order:", error);
        alert("Failed to delete order");
      }
    }
  };

  // Filter functions
  const getFilteredUsers = () => {
    let filtered = users;
    
    if (userFilter !== "all") {
      filtered = filtered.filter(user => user.status === userFilter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const getFilteredSellers = () => {
    let filtered = sellers;
    
    if (sellerFilter !== "all") {
      filtered = filtered.filter(seller => seller.status === sellerFilter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(seller => 
        seller.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seller.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seller.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seller.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const getFilteredOrders = () => {
    let filtered = orders;
    
    if (orderFilter !== "all") {
      filtered = filtered.filter(order => order.status === orderFilter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.sellerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const getFilteredServices = () => {
    let filtered = sellers.filter(s => s.status === 'approved');
    
    if (searchTerm) {
      filtered = filtered.filter(service => 
        service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.serviceDescription?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const getFilteredFeedback = () => {
    let filtered = feedback;
    
    if (feedbackFilter !== "all") {
      filtered = filtered.filter(item => item.status === feedbackFilter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.message?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active':
      case 'approved':
      case 'completed':
      case 'replied':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">✓ {status}</span>;
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">⏳ {status}</span>;
      case 'suspended':
      case 'rejected':
      case 'cancelled':
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">✗ {status}</span>;
      case 'unread':
        return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">📨 {status}</span>;
      case 'read':
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">📖 {status}</span>;
      case 'archived':
        return <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">📦 {status}</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">{status || 'unknown'}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 flex flex-col items-center justify-center">
        <FaSpinner className="animate-spin text-6xl text-white mb-4" />
        <h1 className="text-3xl font-bold text-white mb-2">🏛️ Admin Panel</h1>
        <p className="text-blue-300">Loading admin dashboard...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-800 to-indigo-900 p-6 shadow-xl">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <h1 className="text-4xl font-bold flex items-center">
                🏛️ Admin Dashboard
              </h1>
              <p className="text-blue-200 mt-1">Welcome back, admin@tasknest.com</p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={goHome}
                className="px-4 py-2 bg-green-600 rounded-lg font-semibold hover:bg-green-700 transition flex items-center"
              >
                <FaHome className="mr-2" /> Home
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 rounded-lg font-semibold hover:bg-red-700 transition flex items-center"
              >
                <FaSignOutAlt className="mr-2" /> Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-90">👥 Total Users</p>
                <p className="text-3xl font-bold mt-2">{stats.totalUsers}</p>
              </div>
              <FaUserFriends className="text-4xl opacity-80" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-90">✅ Active Sellers</p>
                <p className="text-3xl font-bold mt-2">{stats.activeSellers}</p>
              </div>
              <FaUserCheck className="text-4xl opacity-80" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-yellow-500 to-amber-500 p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-90">📨 Unread Messages</p>
                <p className="text-3xl font-bold mt-2">{stats.unreadMessages}</p>
              </div>
              <FaInbox className="text-4xl opacity-80" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-90">💰 Total Revenue</p>
                <p className="text-3xl font-bold mt-2">${stats.totalRevenue.toLocaleString()}</p>
              </div>
              <FaDollarSign className="text-4xl opacity-80" />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search across all data..."
              className="w-full p-4 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute right-4 top-4 text-gray-400" />
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">📊 Management Sections</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <button
              onClick={() => setActiveTab("users")}
              className={`p-4 rounded-lg flex flex-col items-center justify-center transition ${
                activeTab === "users" 
                  ? "bg-blue-600 text-white" 
                  : "bg-gray-700 hover:bg-gray-600 text-gray-300"
              }`}
            >
              <FaUserFriends className="text-2xl mb-2" />
              <span>Users ({stats.totalUsers})</span>
            </button>
            
            <button
              onClick={() => setActiveTab("sellers")}
              className={`p-4 rounded-lg flex flex-col items-center justify-center transition ${
                activeTab === "sellers" 
                  ? "bg-green-600 text-white" 
                  : "bg-gray-700 hover:bg-gray-600 text-gray-300"
              }`}
            >
              <FaUserCheck className="text-2xl mb-2" />
              <span>Sellers ({stats.totalSellers})</span>
            </button>
            
            <button
              onClick={() => setActiveTab("orders")}
              className={`p-4 rounded-lg flex flex-col items-center justify-center transition ${
                activeTab === "orders" 
                  ? "bg-purple-600 text-white" 
                  : "bg-gray-700 hover:bg-gray-600 text-gray-300"
              }`}
            >
              <FaShoppingCart className="text-2xl mb-2" />
              <span>Orders ({stats.totalOrders})</span>
            </button>
            
            <button
              onClick={() => setActiveTab("services")}
              className={`p-4 rounded-lg flex flex-col items-center justify-center transition ${
                activeTab === "services" 
                  ? "bg-yellow-600 text-white" 
                  : "bg-gray-700 hover:bg-gray-600 text-gray-300"
              }`}
            >
              <FaTools className="text-2xl mb-2" />
              <span>Services ({stats.activeSellers})</span>
            </button>
            
            <button
              onClick={() => setActiveTab("feedback")}
              className={`p-4 rounded-lg flex flex-col items-center justify-center transition ${
                activeTab === "feedback" 
                  ? "bg-pink-600 text-white" 
                  : "bg-gray-700 hover:bg-gray-600 text-gray-300"
              }`}
            >
              <FaComments className="text-2xl mb-2" />
              <span>Messages ({stats.totalFeedback})</span>
              {stats.unreadMessages > 0 && (
                <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {stats.unreadMessages}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          {/* Users Tab */}
          {activeTab === "users" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center">
                  <FaUserFriends className="mr-2" /> User Management
                </h3>
                <select 
                  className="bg-gray-700 text-white px-4 py-2 rounded-lg"
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                >
                  <option value="all">All Users</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              
              {getFilteredUsers().length === 0 ? (
                <div className="text-center py-12">
                  <FaUserFriends className="text-6xl text-gray-600 mx-auto mb-4" />
                  <p className="text-xl text-gray-400">No users found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="p-4">User</th>
                        <th className="p-4">Contact</th>
                        <th className="p-4">Join Date</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredUsers().map(user => (
                        <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-750">
                          <td className="p-4">
                            <div>
                              <div className="font-semibold">{user.name || 'No name'}</div>
                              <div className="text-sm text-gray-400">{user.email}</div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center text-gray-300">
                              <FaPhone className="mr-2" /> {user.phone || 'N/A'}
                            </div>
                            <div className="flex items-center text-gray-400 text-sm mt-1">
                              <FaMapMarkerAlt className="mr-2" /> {user.address || 'No address'}
                            </div>
                          </td>
                          <td className="p-4 text-gray-300">
                            {formatDate(user.createdAt) || user.joinDate || 'N/A'}
                          </td>
                          <td className="p-4">
                            {getStatusBadge(user.status || 'active')}
                          </td>
                          <td className="p-4">
                            <div className="flex space-x-2">
                              {user.status === 'suspended' ? (
                                <button
                                  onClick={() => handleSuspendUser(user.id, true)}
                                  className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                                >
                                  Activate
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleSuspendUser(user.id, false)}
                                  className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-sm"
                                >
                                  Suspend
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteUser(user.id, user.name)}
                                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Sellers Tab */}
          {activeTab === "sellers" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center">
                  <FaUserCheck className="mr-2" /> Seller Approvals
                </h3>
                <select 
                  className="bg-gray-700 text-white px-4 py-2 rounded-lg"
                  value={sellerFilter}
                  onChange={(e) => setSellerFilter(e.target.value)}
                >
                  <option value="all">All Sellers</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
              {getFilteredSellers().length === 0 ? (
                <div className="text-center py-12">
                  <FaUserCheck className="text-6xl text-gray-600 mx-auto mb-4" />
                  <p className="text-xl text-gray-400">No sellers found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="p-4">Seller</th>
                        <th className="p-4">Service</th>
                        <th className="p-4">Details</th>
                        <th className="p-4">Price</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredSellers().map(seller => (
                        <tr key={seller.id} className="border-b border-gray-700 hover:bg-gray-750">
                          <td className="p-4">
                            <div>
                              <div className="font-semibold">{seller.name}</div>
                              <div className="text-sm text-gray-400">
                                <FaEnvelope className="inline mr-1" /> {seller.email}
                              </div>
                              <div className="text-sm text-gray-400">
                                <FaPhone className="inline mr-1" /> {seller.phone}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium">{seller.category}</div>
                            <div className="text-sm text-gray-400">{seller.city}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Exp: {seller.experience}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-gray-300 max-w-xs truncate">
                              {seller.serviceDescription}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              ID: {seller.uniqueCode}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-xl font-bold text-green-400">
                              ${seller.price}
                            </div>
                          </td>
                          <td className="p-4">
                            {getStatusBadge(seller.status)}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col space-y-2">
                              {seller.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApproveSeller(seller.id)}
                                    className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm flex items-center"
                                  >
                                    <FaCheck className="mr-1" /> Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectSeller(seller.id)}
                                    className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm flex items-center"
                                  >
                                    <FaTimes className="mr-1" /> Reject
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleDeleteSeller(seller.id, seller.name)}
                                className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-sm flex items-center"
                              >
                                <FaTrash className="mr-1" /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center">
                  <FaShoppingCart className="mr-2" /> Order Management
                </h3>
                <select 
                  className="bg-gray-700 text-white px-4 py-2 rounded-lg"
                  value={orderFilter}
                  onChange={(e) => setOrderFilter(e.target.value)}
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              {getFilteredOrders().length === 0 ? (
                <div className="text-center py-12">
                  <FaShoppingCart className="text-6xl text-gray-600 mx-auto mb-4" />
                  <p className="text-xl text-gray-400">No orders found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="p-4">Order</th>
                        <th className="p-4">Customer</th>
                        <th className="p-4">Seller</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredOrders().map(order => (
                        <tr key={order.id} className="border-b border-gray-700 hover:bg-gray-750">
                          <td className="p-4">
                            <div>
                              <div className="font-semibold">Order #{order.id.slice(-6)}</div>
                              <div className="text-sm text-gray-400">
                                Duration: {order.duration} hours
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div>
                              <div className="font-medium">{order.customerName}</div>
                              <div className="text-sm text-gray-400">{order.customerEmail}</div>
                              <div className="text-xs text-gray-500">{order.customerPhone}</div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div>
                              <div className="font-medium">{order.sellerName}</div>
                              <div className="text-sm text-gray-400">ID: {order.sellerId}</div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-gray-300">
                              {order.date}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-xl font-bold text-green-400">
                              ${(order.pricePerHour * order.duration).toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-400">
                              ${order.pricePerHour}/hour
                            </div>
                          </td>
                          <td className="p-4">
                            {getStatusBadge(order.status || 'pending')}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col space-y-2">
                              <select 
                                className="bg-gray-700 text-white px-2 py-1 rounded text-sm"
                                value={order.status || 'pending'}
                                onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                              <button
                                onClick={() => handleDeleteOrder(order.id)}
                                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Services Tab */}
          {activeTab === "services" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center">
                  <FaTools className="mr-2" /> Service Management
                </h3>
              </div>
              
              {getFilteredServices().length === 0 ? (
                <div className="text-center py-12">
                  <FaTools className="text-6xl text-gray-600 mx-auto mb-4" />
                  <p className="text-xl text-gray-400">No active services found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getFilteredServices().map(service => (
                    <div key={service.id} className="bg-gray-750 rounded-xl p-6 hover:bg-gray-700 transition">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold text-lg">{service.name}</h4>
                          <div className="flex items-center text-gray-400 text-sm mt-1">
                            <FaTag className="mr-1" /> {service.category}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-400">${service.price}</div>
                          <div className="text-sm text-gray-400">per service</div>
                        </div>
                      </div>
                      
                      <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                        {service.serviceDescription}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center text-gray-400">
                          <FaMapMarkerAlt className="mr-2" /> {service.city}
                        </div>
                        <div className="flex items-center text-gray-400">
                          <FaClock className="mr-2" /> {service.experience}
                        </div>
                        <div className="flex items-center text-gray-400">
                          <FaStar className="mr-2" /> {service.rating || 0} ({service.reviewsCount || 0} reviews)
                        </div>
                        <div className="flex items-center text-gray-400">
                          <FaUsers className="mr-2" /> {service.workType}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-4">
                        <div className="text-xs text-gray-500">
                          ID: {service.uniqueCode}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleRejectSeller(service.id)}
                            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                          >
                            Deactivate
                          </button>
                          <button
                            onClick={() => handleDeleteSeller(service.id, service.name)}
                            className="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Feedback/Messages Tab */}
          {activeTab === "feedback" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center">
                  <FaComments className="mr-2" /> Customer Messages
                </h3>
                <div className="flex space-x-2">
                  <select 
                    className="bg-gray-700 text-white px-4 py-2 rounded-lg"
                    value={feedbackFilter}
                    onChange={(e) => setFeedbackFilter(e.target.value)}
                  >
                    <option value="all">All Messages</option>
                    <option value="unread">Unread</option>
                    <option value="read">Read</option>
                    <option value="replied">Replied</option>
                    <option value="archived">Archived</option>
                  </select>
                  <button
                    onClick={() => setSelectedFeedback(null)}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
                  >
                    New Message View
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Messages List */}
                <div className={`lg:col-span-${selectedFeedback ? '2' : '3'}`}>
                  {getFilteredFeedback().length === 0 ? (
                    <div className="text-center py-12 bg-gray-750 rounded-xl">
                      <FaComments className="text-6xl text-gray-600 mx-auto mb-4" />
                      <p className="text-xl text-gray-400">No messages found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {getFilteredFeedback().map(item => (
                        <div 
                          key={item.id} 
                          className={`p-4 rounded-xl cursor-pointer transition ${
                            selectedFeedback?.id === item.id 
                              ? 'bg-blue-900 border border-blue-700' 
                              : item.status === 'unread' 
                                ? 'bg-gray-750 hover:bg-gray-700 border-l-4 border-blue-500' 
                                : 'bg-gray-750 hover:bg-gray-700'
                          }`}
                          onClick={() => {
                            setSelectedFeedback(item);
                            if (item.status === 'unread') {
                              handleMarkAsRead(item.id);
                            }
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-semibold flex items-center">
                                {item.name}
                                {item.status === 'unread' && (
                                  <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">NEW</span>
                                )}
                              </div>
                              <div className="text-sm text-gray-400 mt-1">{item.email}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500">{formatDate(item.createdAt)}</div>
                              <div className="mt-1">{getStatusBadge(item.status)}</div>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <div className="font-medium text-green-300">{item.subject}</div>
                            <p className="text-gray-300 text-sm mt-2 line-clamp-2">
                              {item.message}
                            </p>
                          </div>
                          
                          <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-700">
                            <div className="text-xs text-gray-500">
                              Source: {item.type || 'contact_form'}
                            </div>
                            <div className="flex space-x-2">
                              {item.status === 'unread' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsRead(item.id);
                                  }}
                                  className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded"
                                >
                                  Mark Read
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleArchiveFeedback(item.id);
                                }}
                                className="text-xs bg-purple-600 hover:bg-purple-500 px-2 py-1 rounded"
                              >
                                Archive
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFeedback(item.id);
                                }}
                                className="text-xs bg-red-600 hover:bg-red-500 px-2 py-1 rounded"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Message Detail View */}
                {selectedFeedback && (
                  <div className="lg:col-span-1">
                    <div className="bg-gray-750 rounded-xl p-6 sticky top-6">
                      <div className="flex justify-between items-start mb-6">
                        <h4 className="text-lg font-bold">Message Details</h4>
                        <button
                          onClick={() => setSelectedFeedback(null)}
                          className="text-gray-400 hover:text-white"
                        >
                          <FaTimes />
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm text-gray-400">From</label>
                          <div className="font-semibold">{selectedFeedback.name}</div>
                          <div className="text-gray-300">{selectedFeedback.email}</div>
                        </div>
                        
                        <div>
                          <label className="text-sm text-gray-400">Subject</label>
                          <div className="font-medium text-green-300">{selectedFeedback.subject}</div>
                        </div>
                        
                        <div>
                          <label className="text-sm text-gray-400">Message</label>
                          <div className="bg-gray-800 p-4 rounded-lg mt-1">
                            <p className="text-gray-300 whitespace-pre-wrap">{selectedFeedback.message}</p>
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm text-gray-400">Received</label>
                          <div className="text-gray-300">{formatDate(selectedFeedback.createdAt)}</div>
                        </div>
                        
                        <div>
                          <label className="text-sm text-gray-400">Status</label>
                          <div className="mt-1">{getStatusBadge(selectedFeedback.status)}</div>
                        </div>
                        
                        {selectedFeedback.replied && selectedFeedback.adminReply && (
                          <div>
                            <label className="text-sm text-gray-400">Your Reply</label>
                            <div className="bg-blue-900 p-4 rounded-lg mt-1">
                              <p className="text-gray-300 whitespace-pre-wrap">{selectedFeedback.adminReply}</p>
                              <div className="text-xs text-gray-500 mt-2">
                                Replied on: {formatDate(selectedFeedback.repliedAt)}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {!selectedFeedback.replied && (
                          <div>
                            <label className="text-sm text-gray-400">Send Reply</label>
                            <textarea
                              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white"
                              rows="4"
                              placeholder="Type your reply here..."
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                            ></textarea>
                            <button
                              onClick={() => handleSendReply(selectedFeedback.id)}
                              className="w-full bg-green-600 hover:bg-green-700 py-2 rounded-lg mt-2 flex items-center justify-center"
                            >
                              <FaReply className="mr-2" /> Send Reply
                            </button>
                          </div>
                        )}
                        
                        <div className="flex space-x-2 pt-4 border-t border-gray-700">
                          {selectedFeedback.status !== 'archived' && (
                            <button
                              onClick={() => handleArchiveFeedback(selectedFeedback.id)}
                              className="flex-1 bg-purple-600 hover:bg-purple-700 py-2 rounded-lg flex items-center justify-center"
                            >
                              <FaArchive className="mr-2" /> Archive
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteFeedback(selectedFeedback.id)}
                            className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded-lg flex items-center justify-center"
                          >
                            <FaTrash className="mr-2" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-indigo-800 to-purple-800 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">⚡ Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              className="bg-white text-indigo-800 p-3 rounded-lg font-semibold hover:bg-gray-100"
              onClick={() => setActiveTab('sellers')}
            >
              Review Pending ({stats.pendingApprovals})
            </button>
            <button 
              className="bg-white text-indigo-800 p-3 rounded-lg font-semibold hover:bg-gray-100"
              onClick={() => setActiveTab('feedback')}
            >
              Check Messages ({stats.unreadMessages} new)
            </button>
            <button 
              className="bg-white text-indigo-800 p-3 rounded-lg font-semibold hover:bg-gray-100"
              onClick={loadAllData}
            >
              Refresh Data
            </button>
            <button 
              className="bg-white text-indigo-800 p-3 rounded-lg font-semibold hover:bg-gray-100"
              onClick={() => navigate('/seller-reg')}
            >
              Add New Service
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 border-t border-gray-800 p-4 text-center text-gray-500 text-sm">
        <p>🏛️ Admin Panel v2.0 • Logged in as: admin@tasknest.com</p>
        <p className="mt-1">Last Updated: {new Date().toLocaleTimeString()}</p>
        <p className="mt-1">Total Records: {stats.totalUsers + stats.totalSellers + stats.totalOrders + stats.totalFeedback}</p>
      </div>
    </div>
  );
};

export default Admin;
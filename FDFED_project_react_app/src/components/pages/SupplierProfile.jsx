
import React, { useEffect } from 'react';
import '../../assets/css/supplier_profile.css';
import '../../assets/css/home_page.css';
import { useSupplier } from '../../context/SupplierContext';
import { useNavigate, Link } from 'react-router-dom';

const SupplierProfile = () => {

  const { supplier, loading, error } = useSupplier();
  const navigate = useNavigate();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const handleLogout = (e) => {
    e.preventDefault();
    fetch('/logout', { method: 'POST', credentials: 'include' })
      .finally(() => {
        window.localStorage.clear();
        navigate('/');
      });
  };

  return (
    <div className="supplier-dashboard">
      {/* Common Header */}
      <header style={{
        width: '96%',
        background: '#fff',
        position: 'fixed',
        top: '2rem',
        left: '50%',
        transform: 'translate(-50%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 2rem',
        zIndex: 1000
      }}>
        <Link to="/" className="logo"><span>M</span>edi<span>Q</span>uick</Link>
        <nav className="navbar">
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/faqs">FAQs</Link></li>
            <li><Link to="/blogs">Blog</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
            <li><button className="logout-link" onClick={handleLogout}>Logout</button></li>
          </ul>
        </nav>
        <div className="fas fa-bars"></div>
      </header>
      {/* Sidebar with logo, welcome, and navigation */}
      <aside className="supplier-sidebar enhanced-sidebar">
        <div className="sidebar-logo">MediQuick</div>
        {supplier && supplier.name && (
          <div className="sidebar-welcome">Welcome, {supplier.name}!</div>
        )}
        <nav>
          <ul>
            <li><Link to="/supplier/dashboard">Dashboard</Link></li>
            <li><button className="logout-link" onClick={handleLogout}>Logout</button></li>
          </ul>
        </nav>
      </aside>
      {/* Main Content */}
      <div className="main-content">
        {loading ? (
          <div className="profile-card">Loading supplier profile...</div>
        ) : error ? (
          <div className="profile-card error">{error}</div>
        ) : !supplier ? (
          <div className="profile-card">No supplier data found.</div>
        ) : (
          <div className="profile-card">
            <div className="profile-details">
              <h2 className="profile-name">{supplier.name}</h2>
              <div className="profile-photo-container">
                <img 
                  id="supplier-photo"
                  src={supplier.profilePhoto || '/images/default-supplier.png'} 
                  alt="Profile Photo" 
                  onError={(e) => {
                    e.target.src = '/images/default-supplier.png';
                  }}
                />
              </div>
              <div className="profile-info-list">
                <div className="profile-info-item"><span>Email:</span> {supplier.email}</div>
                <div className="profile-info-item"><span>Mobile:</span> {supplier.mobile}</div>
                <div className="profile-info-item"><span>Address:</span> {supplier.address}</div>
                <div className="profile-info-item"><span>Supplier ID:</span> {supplier.supplierID}</div>
              </div>
              <button className="button" onClick={() => navigate('/supplier/edit-profile')}>Edit Profile</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierProfile;

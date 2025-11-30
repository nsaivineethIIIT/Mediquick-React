import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEmployee } from '../../context/EmployeeContext'; // NEW IMPORT
import '../../assets/css/EmployeeProfile.css';

const EmployeeProfile = () => {
  // Use the context hook to get employee data and functions
  const { 
    employee, 
    loading, 
    error, 
    previousRegistrations, 
    pendingRegistrations, 
    refetch // Use refetch for retry button
  } = useEmployee(); // MODIFIED
  
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isHeaderActive, setIsHeaderActive] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Removed loadProfileData call, handled by context
    
    const handleScroll = () => {
      setIsHeaderActive(window.scrollY > 30);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Removed loadProfileData function, replaced by context

  const handleApprove = (doctorName) => {
    if (window.confirm(`Are you sure you want to approve ${doctorName}?`)) {
      // Add your approval logic here
      alert(`Approved ${doctorName}`);
      // You can make another fetch call here to update the status and then call refetch()
    }
  };

  const handleReject = (doctorName) => {
    if (window.confirm(`Are you sure you want to reject ${doctorName}?`)) {
      // Add your rejection logic here
      alert(`Rejected ${doctorName}`);
      // You can make another fetch call here to update the status and then call refetch()
    }
  };

  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  const closeProfile = () => {
    navigate('/employee/dashboard');
  };

  if (loading) {
    return (
      <div className="employee-profile-page">
        <Header isHeaderActive={isHeaderActive} isNavOpen={isNavOpen} toggleNav={toggleNav} />
        <div className="container">
          <div className="loading">
            <i className="fas fa-spinner fa-spin"></i> Loading profile data...
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="employee-profile-page">
      <Header isHeaderActive={isHeaderActive} isNavOpen={isNavOpen} toggleNav={toggleNav} />
      
      <div className="container">
        <div className="close-btn" onClick={closeProfile}>
          <i className="fas fa-times"></i>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button className="retry-btn" onClick={refetch}>Retry</button>
          </div>
        )}

        {employee && (
          <div className="profile-content">
            <h1>{employee.name}</h1>

            <div className="profile-info">
              <div className="profile-details">
                <h2>Personal Details</h2>
                <p><strong>Name:</strong> {employee.name}</p>
                <p><strong>Email:</strong> {employee.email}</p>
                <p><strong>Mobile:</strong> {employee.mobile}</p>
                <p><strong>Address:</strong> {employee.address}</p>
              </div>
              <div className="profile-photo-container">
                <img 
                  id="employee-photo"
                  src={employee.profilePhoto || '/images/default-employee.svg'} 
                  alt="Profile Photo" 
                  onError={(e) => {
                    e.target.src = '/images/default-employee.svg';
                  }}
                />
              </div>
            </div>

            {/* Previous Registrations Section */}
            {previousRegistrations.length > 0 && (
              <div className="registrations">
                <h2>Previous Doctor Registrations</h2>
                <div id="previous-registrations">
                  <table>
                    <thead>
                      <tr>
                        <th>Doctor Name</th>
                        <th>Registration Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previousRegistrations.map((reg, index) => (
                        <tr key={index}>
                          <td>{reg.doctorName}</td>
                          <td>{reg.registrationDate}</td>
                          <td>{reg.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pending Registrations Section */}
            {pendingRegistrations.length > 0 && (
              <div className="registrations">
                <h2>Pending Doctor Registrations</h2>
                <div id="pending-registrations">
                  <table>
                    <thead>
                      <tr>
                        <th>Doctor Name</th>
                        <th>Registration Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingRegistrations.map((reg, index) => (
                        <tr key={index}>
                          <td>{reg.doctorName}</td>
                          <td>{reg.registrationDate}</td>
                          <td>
                            <button 
                              className="action-button approve" 
                              onClick={() => handleApprove(reg.doctorName)}
                            >
                              Approve
                            </button>
                            <button 
                              className="action-button reject" 
                              onClick={() => handleReject(reg.doctorName)}
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="action-buttons">
              <Link to="/employee/edit-profile" className="button">
                Edit Profile
              </Link>
              <Link to="/change_password" className="button">
                Change Password
              </Link>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

// Header Component
const Header = ({ isHeaderActive, isNavOpen, toggleNav }) => {
  return (
    <header className={isHeaderActive ? 'header-active' : ''}>
      <Link to="#" className="logo">
        <span>M</span>edi<span>Q</span>uick
      </Link>
      <nav className={`navbar ${isNavOpen ? 'nav-toggle' : ''}`}>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about-us">About Us</Link></li>
          <li><Link to="/faqs">FAQs</Link></li>
          <li><Link to="/blogs">Blog</Link></li>
          <li><Link to="/contact-us">Contact Us</Link></li>
        </ul>
      </nav>
      <div className={`fas fa-bars ${isNavOpen ? 'fa-times' : ''}`} onClick={toggleNav}></div>
    </header>
  );
};

// Footer Component
const Footer = () => {
  return (
    <section className="footer">
      <div className="box">
        <h2 className="logo"><span>M</span>edi<span>Q</span>uick</h2>
        <p>Your trusted healthcare partner, providing seamless access to online consultations, appointment bookings,
          and medicine deliveries, ensuring a hassle-free medical experience.</p>
      </div>
      <div className="box">
        <h2 className="logo"><span>S</span>hare</h2>
        <a href="mailto:mediquick2025@gmail.com">Email</a>
        <a href="https://www.facebook.com/share/1568c6qDuW/">Facebook</a>
        <a href="https://www.instagram.com/mediquick2025?igsh=MXVqaDRkY2xvNGJsZg==">Instagram</a>
        <a href="https://www.linkedin.com/in/medi-quick-437318355?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app">LinkedIn</a>
      </div>
      <div className="box">
        <h2 className="logo"><span>L</span>inks</h2>
        <Link to="/">Home</Link>
        <Link to="/about-us">About Us</Link>
        <Link to="/faqs">FAQ's</Link>
        <Link to="/contact-us">Contact Us</Link>
        <Link to="/blogs">Blog</Link>
        <Link to="/privacy-policy">Privacy Policy</Link>
        <Link to="/terms-conditions">Terms & Conditions</Link>
      </div>
      <h1 className="credit">Created by <span>Team MediQuick</span> all rights reserved.</h1>
    </section>
  );
};

export default EmployeeProfile;
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../assets/css/EmployeeDashboard.css';
import { useEmployee } from '../../context/EmployeeContext';
const EmployeeDashboard = () => {
  const { employee } = useEmployee();
  const [doctorRequests, setDoctorRequests] = useState([]);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isHeaderActive, setIsHeaderActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDoctorRequests();
    
    const handleScroll = () => {
      setIsHeaderActive(window.scrollY > 30);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchDoctorRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3002/employee/api/doctor-requests', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDoctorRequests(data.doctors);
        } else {
          setError('Failed to load doctor requests');
        }
      } else if (response.status === 401) {
        navigate('/employee/form');
      } else {
        setError('Failed to fetch doctor requests');
      }
    } catch (error) {
      console.error('Error fetching doctor requests:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDoctor = async (doctorId, doctorName) => {
    if (!window.confirm(`Are you sure you want to approve ${doctorName}?`)) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`http://localhost:3002/employee/approve_doctor/${doctorId}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Check if response is JSON or HTML
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // If it's HTML, we got an error page
        const text = await response.text();
        console.error('HTML response received:', text.substring(0, 200));
        throw new Error('Server returned an error page. Please check the server logs.');
      }

      if (response.ok) {
        // Remove the approved doctor from the list
        setDoctorRequests(prev => prev.filter(doctor => doctor._id !== doctorId));
        
        // Show success message
        setError('');
        alert(`Doctor ${doctorName} approved successfully!`);
        
        // Refresh the list
        fetchDoctorRequests();
      } else {
        // Handle specific error cases
        if (response.status === 401) {
          setError('Session expired. Please login again.');
          navigate('/employee/form');
        } else if (response.status === 404) {
          setError('Doctor not found.');
        } else {
          setError(data.error || data.message || `Failed to approve doctor. Status: ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Error approving doctor:', error);
      
      // Check if the doctor was actually approved despite the error
      // Refresh the list to see current status
      fetchDoctorRequests();
      
      if (error.message.includes('Server returned an error page')) {
        setError('Server error occurred, but the action might have completed. Refreshing list...');
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  const closeProfile = () => {
    navigate("/");
  };

  const handleLogout = () => {
    navigate('/employee/form');
  };

  if (loading && doctorRequests.length === 0) {
    return (
      <div className="employee-dashboard">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="employee-dashboard">
      <header className={isHeaderActive ? 'header-active' : ''}>
        <Link to="#" className="logo">
          <span>M</span>edi<span>Q</span>uick
        </Link>
        <nav className={`navbar ${isNavOpen ? 'nav-toggle' : ''}`}>
          <ul>
            <li>{employee && employee.name && (
        <h1 className="welcome-message">Welcome, {employee.name}!</h1>
      )}</li>
            <li><Link to="#doc_ssn">Generate Doctor SSN</Link></li>
            <li><Link to="#supp_req">Pending Supplier Requests</Link></li>
            <li><Link to="#supp_ssn">Generate Supplier SSN</Link></li>
            <li><Link to="/employee/doctor_requests">Pending Doctor Requests</Link></li>
            <li><Link to="/employee/form" onClick={handleLogout}>LogOut</Link></li>
            <li>
              <Link to="/employee/profile">
                <img 
                  src="https://static.thenounproject.com/png/638636-200.png" 
                  alt="Profile Image" 
                  height="30px" 
                  width="30px" 
                />
              </Link>
            </li>
          </ul>
        </nav>
        <div className={`fas fa-bars ${isNavOpen ? 'fa-times' : ''}`} onClick={toggleNav}></div>
      </header>

      <section id="doc_req" className="about">
        <div className="close-btn" onClick={closeProfile}>
          <i className="fas fa-times"></i>
        </div>
        <h1 className="heading">Pending Doctor Requests</h1>
        <br />
        
        {error && (
          <div className="error-message">
            {error}
            <button 
              onClick={fetchDoctorRequests} 
              style={{marginLeft: '10px', padding: '5px 10px'}}
            >
              Refresh
            </button>
          </div>
        )}
        
        {loading && (
          <div className="loading-message">
            Processing...
          </div>
        )}

        <table>
          <thead>
            <tr>
              <th>Doctor Name</th>
              <th>Registration Number</th>
              <th>Documents</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {doctorRequests.length > 0 ? (
              doctorRequests.map((doctor, index) => (
                <tr key={doctor._id || index}>
                  <td>{doctor.name}</td>
                  <td>{doctor.registrationNumber}</td>
                  <td>
                    {doctor.documentPath ? (
                      <a 
                        href={`http://localhost:3002${doctor.documentPath}`} 
                        className="view-pdf" 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        View Document
                      </a>
                    ) : (
                      <span className="no-document">No document</span>
                    )}
                  </td>
                  <td>
                    <span className="status-pending">Pending</span>
                  </td>
                  <td>
                    <button 
                      className="approve-btn"
                      onClick={() => handleApproveDoctor(doctor._id, doctor.name)}
                      disabled={loading}
                    >
                      {loading ? 'Approving...' : 'Approve'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                  No pending doctor requests
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <Footer />
    </div>
  );
};

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
        <a href="/">Home</a>
        <a href="/about-us">About Us</a>
        <a href="/faqs">FAQ's</a>
        <a href="/contact-us">Contact Us</a>
        <a href="/blogs">Blog</a>
        <a href="/privacy-policy">Privacy Policy</a>
        <a href="/terms-conditions">Terms & Conditions</a>
      </div>
      <h1 className="credit">Created by <span>Team MediQuick</span> all rights reserved.</h1>
    </section>
  );
};

export default EmployeeDashboard;
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const DoctorProfile = () => {
  const [doctorData, setDoctorData] = useState(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [previousAppointments, setPreviousAppointments] = useState([]);
  const [loading, setLoading] = useState({
    profile: true,
    upcoming: true,
    previous: true
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // Fetch doctor profile data
  const fetchDoctorProfile = async () => {
    try {
      const response = await fetch('http://localhost:3002/doctor/api/profile', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch doctor profile');
      }
      
      const doctor = await response.json();
      setDoctorData(doctor);
      setLoading(prev => ({ ...prev, profile: false }));
      
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
      setErrors(prev => ({ ...prev, profile: error.message }));
      setLoading(prev => ({ ...prev, profile: false }));
    }
  };

  // Fetch appointments
  const fetchAppointments = async () => {
    try {
      // Fetch upcoming appointments
      const upcomingResponse = await fetch('http://localhost:3002/doctor/appointments/upcoming', {
        credentials: 'include'
      });
      
      if (upcomingResponse.ok) {
        const appointments = await upcomingResponse.json();
        setUpcomingAppointments(appointments);
      } else {
        throw new Error('Failed to fetch upcoming appointments');
      }
      
      setLoading(prev => ({ ...prev, upcoming: false }));
      
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
      setErrors(prev => ({ ...prev, upcoming: error.message }));
      setLoading(prev => ({ ...prev, upcoming: false }));
    }

    try {
      // Fetch previous appointments
      const previousResponse = await fetch('http://localhost:3002/doctor/appointments/previous', {
        credentials: 'include'
      });
      
      if (previousResponse.ok) {
        const appointments = await previousResponse.json();
        setPreviousAppointments(appointments);
      } else {
        throw new Error('Failed to fetch previous appointments');
      }
      
      setLoading(prev => ({ ...prev, previous: false }));
      
    } catch (error) {
      console.error('Error fetching previous appointments:', error);
      setErrors(prev => ({ ...prev, previous: error.message }));
      setLoading(prev => ({ ...prev, previous: false }));
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchDoctorProfile();
    fetchAppointments();
  }, []);

  // Status color classes
  const getStatusClass = (status) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'pending') return 'status-pending';
    if (statusLower === 'confirmed') return 'status-confirmed';
    if (statusLower === 'completed') return 'status-completed';
    if (statusLower === 'cancelled') return 'status-cancelled';
    return '';
  };

  // Format appointment date
  const formatAppointmentDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="doctor-profile-container">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap');

        :root {
          --blue: #0188df;
          --black: #444d53;
          --white: #fff;
        }

        * {
          font-family: "Roboto", sans-serif;
          margin: 0;
          padding: 0;
          text-decoration: none;
          outline: none;
          box-sizing: border-box;
          transition: all linear .2s;
        }

        html {
          font-size: 62.5%;
          overflow-x: hidden;
          scroll-behavior: smooth;
        }

        body {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        /* Header styles */
        header {
          width: 96%;
          background: var(--white);
          position: fixed;
          top: 2rem;
          left: 50%;
          transform: translate(-50%);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 2rem;
          z-index: 1000;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        header a {
          color: var(--black);
        }

        header a:hover {
          color: var(--blue);
        }

        header .logo {
          font-size: 3rem;
          font-weight: bold;
        }

        header .logo span {
          color: var(--blue);
        }

        header .navbar ul {
          display: flex;
          align-items: center;
          justify-content: space-between;
          list-style: none;
        }

        header .navbar ul li {
          margin: 0 1rem;
        }

        header .navbar ul li a {
          font-size: 1.6rem;
          color: var(--black);
          padding: 0.5rem 1rem;
          border-radius: 4px;
        }

        header .navbar ul li a:hover {
          color: var(--blue);
          background-color: rgba(1, 136, 223, 0.1);
        }

        header .fa-bars {
          font-size: 3rem;
          color: var(--blue);
          cursor: pointer;
          display: none;
        }

        .header-active {
          top: 0;
          width: 100%;
          box-shadow: .1rem .3rem rgba(0, 0, 0, .3);
        }

        /* Updated styles for the content area */
        .container {
          width: 96%;
          max-width: 80rem;
          margin: 12rem auto 2rem auto;
          background: var(--white);
          padding: 2rem;
          box-shadow: .1rem .3rem rgba(0, 0, 0, .3);
          border-radius: .5rem;
        }

        h2 {
          font-size: 3rem;
          color: var(--black);
          margin-bottom: 2rem;
          text-align: center;
        }

        h3 {
          font-size: 2.5rem;
          color: var(--black);
          margin: 2rem 0 1rem 0;
        }

        .profile-details {
          margin-bottom: 2rem;
        }

        .profile-details p {
          font-size: 1.6rem;
          color: var(--black);
          margin: .5rem 0;
        }

        .profile-details p strong {
          color: var(--blue);
        }

        .appointments {
          margin-top: 2rem;
        }

        .appointments ul {
          list-style-type: none;
          padding: 0;
        }

        .appointment-item {
          background: var(--black);
          color: var(--white);
          margin: .5rem 0;
          padding: 1rem;
          border-radius: .5rem;
          font-size: 1.5rem;
          border: .1rem solid var(--blue);
        }

        .appointment-item:hover {
          background: var(--white);
          color: var(--blue);
          border: .1rem solid var(--black);
        }

        .appointment-item .patient-name {
          font-weight: bold;
          margin-bottom: 0.5rem;
        }

        .appointment-item .appointment-details {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
        }

        .appointment-item .appointment-details span {
          margin-right: 1rem;
        }

        .status-pending {
          color: #FFA500;
        }

        .status-confirmed {
          color: #32CD32;
        }

        .status-completed {
          color: #1E90FF;
        }

        .status-cancelled {
          color: #FF4500;
        }

        .loading {
          text-align: center;
          font-size: 1.8rem;
          color: var(--blue);
          padding: 2rem;
        }

        .error-message {
          color: #FF4500;
          font-size: 1.6rem;
          text-align: center;
          padding: 1rem;
        }

        /* Button styling to match .button class */
        .btn {
          display: inline-block;
          height: 3.5rem;
          width: 15rem;
          background: var(--black);
          color: var(--white);
          font-size: 1.7rem;
          text-transform: capitalize;
          border-radius: .5rem;
          cursor: pointer;
          text-align: center;
          line-height: 3.5rem;
          margin: 1rem;
          border: .1rem solid var(--blue);
          text-decoration: none;
        }

        .btn:hover {
          border: .1rem solid var(--blue);
          background: var(--white);
          color: var(--blue);
          letter-spacing: .2rem;
        }

        .action-buttons {
          text-align: center;
          margin: 2rem 0;
        }

        /* Footer styles */
        .footer {
          background: var(--black);
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          padding: 2rem 0;
          margin-top: auto;
        }

        .footer .box {
          width: 30rem;
          margin: 2rem;
          text-align: center;
        }

        .footer .box .logo {
          padding: 2rem 0;
          font-size: 3rem;
          color: var(--white);
        }

        .footer .box .logo:hover {
          color: var(--blue);
        }

        .footer .box .logo span {
          color: var(--blue);
        }

        .footer .box p {
          font-size: 1.5rem;
          color: var(--white);
        }

        .footer .box a {
          color: var(--white);
          font-size: 2rem;
          display: block;
          padding: .2rem 0;
        }

        .footer .box a:hover {
          text-decoration: underline;
        }

        .footer .credit {
          width: 85%;
          padding-top: 1rem;
          font-size: 2rem;
          color: var(--white);
          text-align: center;
          border-top: .2rem solid var(--white);
        }

        .footer .credit span {
          color: var(--blue);
          text-decoration: underline;
          letter-spacing: .5rem;
        }

        .profile-photo-container {
          text-align: center;
          margin-bottom: 20px;
        }

        .profile-photo {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid var(--blue);
        }

        /* Media queries */
        @media (max-width: 768px) {
          html {
            font-size: 55%;
          }

          header .fa-bars {
            display: block;
          }

          header .navbar {
            position: fixed;
            top: -100rem;
            left: 0;
            width: 100%;
            background: var(--white);
            opacity: 0;
          }

          header .navbar ul {
            flex-flow: column;
            padding: 2rem 0;
          }

          header .navbar ul li {
            margin: 1rem 0;
            width: 100%;
            text-align: center;
          }

          header .navbar ul li a {
            font-size: 2rem;
            display: block;
            padding: 1rem;
          }

          .header-active {
            top: 0;
            width: 100%;
          }

          .container {
            margin: 10rem auto 2rem auto;
            padding: 1.5rem;
          }

          .appointment-item .appointment-details {
            flex-direction: column;
          }

          .appointment-item .appointment-details span {
            margin-right: 0;
            margin-bottom: 0.5rem;
          }

          .action-buttons {
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .btn {
            margin: 0.5rem 0;
            width: 100%;
            max-width: 200px;
          }
        }
      `}</style>

      {/* Header */}
      <header>
        <Link to="/" className="logo">
          <span>M</span>edi<span>Q</span>uick
        </Link>
        <nav className="navbar">
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/faqs">FAQs</Link></li>
            <li><Link to="/blogs">Blog</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
            <li><Link to="/doctor/form">Logout</Link></li>
          </ul>
        </nav>
        <div className="fas fa-bars"></div>
      </header>

      {/* Main Content */}
      <div className="container">
        <h2>Doctor Profile</h2>
        
        {/* Doctor Profile Section */}
        <div id="doctor-profile">
          {loading.profile ? (
            <div className="loading">Loading doctor profile...</div>
          ) : errors.profile ? (
            <div className="error-message">
              Error loading doctor profile. <Link to="/doctor/form" className="btn">Go to Login</Link>
            </div>
          ) : doctorData ? (
            <>
              <div className="profile-photo-container">
                <img 
                  src={doctorData.profilePhoto || '/images/default-doctor.svg'} 
                  alt="Profile Photo" 
                  className="profile-photo"
                  onError={(e) => {
                    e.target.src = '/images/default-doctor.svg';
                  }}
                />
              </div>
              <div className="profile-details">
                <p><strong>Name:</strong> {doctorData.name || 'N/A'}</p>
                <p><strong>Email:</strong> {doctorData.email || 'N/A'}</p>
                <p><strong>Mobile:</strong> {doctorData.mobile || 'N/A'}</p>
                <p><strong>Address:</strong> {doctorData.address || 'N/A'}</p>
                <p><strong>Specialization:</strong> {doctorData.specialization || 'N/A'}</p>
                <p><strong>College:</strong> {doctorData.college || 'N/A'}</p>
                <p><strong>Year of Passing:</strong> {doctorData.yearOfPassing || 'N/A'}</p>
                <p><strong>Location:</strong> {doctorData.location || 'N/A'}</p>
                <p><strong>Online Status:</strong> {doctorData.onlineStatus || 'N/A'}</p>
                <p><strong>Consultation Fee:</strong> ₹{doctorData.consultationFee || 'N/A'}</p>
                <p><strong>Registration Number:</strong> {doctorData.registrationNumber || 'N/A'}</p>
                {doctorData.ssn && <p><strong>SSN:</strong> {doctorData.ssn || 'N/A'}</p>}
              </div>
            </>
          ) : (
            <div className="error-message">Doctor data not available.</div>
          )}
        </div>

        {/* Upcoming Appointments Section */}
        <div className="appointments">
          <h3>Upcoming Appointments</h3>
          <div id="upcoming-appointments">
            {loading.upcoming ? (
              <div className="loading">Loading upcoming appointments...</div>
            ) : errors.upcoming ? (
              <div className="error-message">Error loading upcoming appointments</div>
            ) : upcomingAppointments.length === 0 ? (
              <p>No upcoming appointments found.</p>
            ) : (
              <ul>
                {upcomingAppointments.map(appointment => (
                  <li key={appointment._id} className="appointment-item">
                    <div className="patient-name">
                      {appointment.patientId?.name || 'Unknown Patient'}
                    </div>
                    <div className="appointment-details">
                      <span><strong>Date:</strong> {formatAppointmentDate(appointment.date)}</span>
                      <span><strong>Time:</strong> {appointment.time}</span>
                      <span><strong>Type:</strong> {appointment.type}</span>
                      <span className={getStatusClass(appointment.status)}>
                        <strong>Status:</strong> {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Previous Appointments Section */}
        <div className="appointments">
          <h3>Previous Appointments</h3>
          <div id="previous-appointments">
            {loading.previous ? (
              <div className="loading">Loading previous appointments...</div>
            ) : errors.previous ? (
              <div className="error-message">Error loading previous appointments</div>
            ) : previousAppointments.length === 0 ? (
              <p>No previous appointments found.</p>
            ) : (
              <ul>
                {previousAppointments.map(appointment => (
                  <li key={appointment._id} className="appointment-item">
                    <div className="patient-name">
                      {appointment.patientId?.name || 'Unknown Patient'}
                    </div>
                    <div className="appointment-details">
                      <span><strong>Date:</strong> {formatAppointmentDate(appointment.date)}</span>
                      <span><strong>Time:</strong> {appointment.time}</span>
                      <span><strong>Type:</strong> {appointment.type}</span>
                      <span className={getStatusClass(appointment.status)}>
                        <strong>Status:</strong> {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {doctorData && (
          <div className="action-buttons">
            <Link to="/doctor/edit-profile" className="btn">Edit Profile</Link>
            <Link to="/doctor/dashboard" className="btn">Go to Dashboard</Link>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="box">
          <Link to="/" className="logo">
            <span>M</span>edi<span>Q</span>uick
          </Link>
          <p>Your Health, Our Priority - Anytime, Anywhere</p>
        </div>
        <div className="box">
          <h3>Quick Links</h3>
          <Link to="/">Home</Link>
          <Link to="/about">About Us</Link>
          <Link to="/faqs">FAQs</Link>
          <Link to="/blogs">Blog</Link>
          <Link to="/contact">Contact Us</Link>
        </div>
        <div className="box">
          <h3>Follow Us</h3>
          <a href="#"><i className="fab fa-facebook-f"></i> Facebook</a>
          <a href="#"><i className="fab fa-twitter"></i> Twitter</a>
          <a href="#"><i className="fab fa-instagram"></i> Instagram</a>
          <a href="#"><i className="fab fa-linkedin"></i> LinkedIn</a>
        </div>
        <div className="credit">
          &copy; Copyright <span>2025</span> | All Rights Reserved by <span>MediQuick</span>
        </div>
      </footer>
    </div>
  );
};

export default DoctorProfile;
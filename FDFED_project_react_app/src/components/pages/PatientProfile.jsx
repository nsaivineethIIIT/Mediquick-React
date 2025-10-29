import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const PatientProfile = () => {
  const [patientData, setPatientData] = useState({
    name: '',
    email: '',
    mobile: '',
    address: '',
    profilePhoto: '/images/default-patient.svg'
  });
  const [previousAppointments, setPreviousAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState({
    profile: true,
    previous: true,
    upcoming: true
  });
  const [errors, setErrors] = useState({});
  const [chatModal, setChatModal] = useState({
    isOpen: false,
    appointmentId: null,
    messages: []
  });
  
  const messageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const navigate = useNavigate();

  // Fetch patient profile data
  const loadPatientData = async () => {
    try {
      console.log('Fetching patient profile data...');
      
      const response = await fetch('http://localhost:3002/patient/profile-data', {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to load profile data');
      }
      
      setPatientData({
        name: data.patient.name,
        email: data.patient.email,
        mobile: data.patient.mobile,
        address: data.patient.address,
        profilePhoto: data.patient.profilePhoto || '/images/default-patient.svg'
      });
      
      setLoading(prev => ({ ...prev, profile: false }));
      
    } catch (error) {
      console.error('Error loading patient profile data:', error);
      setErrors(prev => ({ ...prev, profile: error.message }));
      setLoading(prev => ({ ...prev, profile: false }));
    }
  };

  // Fetch appointments
  const fetchAppointments = async (type) => {
    try {
      const response = await fetch(`http://localhost:3002/patient/api/patient/appointments/${type}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${type} appointments`);
      }
      
      const appointments = await response.json();
      
      if (type === 'previous') {
        setPreviousAppointments(appointments);
      } else {
        setUpcomingAppointments(appointments);
      }
      
      setLoading(prev => ({ ...prev, [type]: false }));
      
    } catch (error) {
      console.error(`Error fetching ${type} appointments:`, error);
      setErrors(prev => ({ ...prev, [type]: error.message }));
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  // Cancel appointment
  const cancelAppointment = async (appointmentId) => {
    const appointment = upcomingAppointments.find(appt => appt.id === appointmentId);
    
    if (appointment) {
      const status = appointment.status.toLowerCase();
      
      if (status === 'completed') {
        alert('Cannot cancel a completed appointment');
        return;
      }
      
      if (status === 'cancelled') {
        alert('This appointment is already cancelled');
        return;
      }
    }

    if (confirm('Are you sure you want to cancel this appointment?')) {
      try {
        const response = await fetch(`http://localhost:3002/appointment/patient/${appointmentId}/cancel`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.details || 'Failed to cancel appointment');
        }

        const data = await response.json();
        
        if (data.message) {
          alert('Appointment cancelled successfully');
          // Refresh appointments
          fetchAppointments('upcoming');
          fetchAppointments('previous');
        }
      } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'An error occurred while cancelling the appointment');
      }
    }
  };

  // Chat functionality
  const openChat = (appointmentId) => {
    setChatModal({
      isOpen: true,
      appointmentId,
      messages: []
    });
    loadMessages(appointmentId);
  };

  const closeChat = () => {
    setChatModal({
      isOpen: false,
      appointmentId: null,
      messages: []
    });
  };

  const loadMessages = async (appointmentId) => {
    try {
      const response = await fetch(`http://localhost:3002/chat/${appointmentId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.messages) {
        setChatModal(prev => ({
          ...prev,
          messages: data.messages
        }));
        
        // Scroll to bottom of chat
        setTimeout(() => {
          if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
          }
        }, 100);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const sendMessage = async () => {
    if (!messageInputRef.current?.value.trim() || !chatModal.appointmentId) return;
    
    try {
      const response = await fetch('http://localhost:3002/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          appointmentId: chatModal.appointmentId,
          message: messageInputRef.current.value.trim(),
          senderType: 'patient'
        })
      });
      
      if (response.ok) {
        messageInputRef.current.value = '';
        loadMessages(chatModal.appointmentId);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const sendFile = async () => {
    const file = fileInputRef.current?.files[0];
    if (!file || !chatModal.appointmentId) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('appointmentId', chatModal.appointmentId);
    formData.append('senderType', 'patient');

    try {
      const response = await fetch('http://localhost:3002/chat/send-file', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (response.ok) {
        fileInputRef.current.value = '';
        loadMessages(chatModal.appointmentId);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send file');
      }
    } catch (error) {
      console.error('Error sending file:', error);
      alert('Failed to send file');
    }
  };

  const handleFileInputChange = () => {
    if (fileInputRef.current?.files.length > 0) {
      sendFile();
    }
  };

  const handleMessageKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  // Close profile and redirect to dashboard
  const closeProfile = () => {
    navigate('/patient/dashboard');
  };

  // Load data on component mount
  useEffect(() => {
    loadPatientData();
    fetchAppointments('previous');
    fetchAppointments('upcoming');
  }, []);

  // Poll for new messages when chat is open
  useEffect(() => {
    let interval;
    if (chatModal.isOpen && chatModal.appointmentId) {
      interval = setInterval(() => {
        loadMessages(chatModal.appointmentId);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [chatModal.isOpen, chatModal.appointmentId]);

  // Status color classes
  const getStatusClass = (status) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'completed') return 'status-completed';
    if (statusLower === 'cancelled') return 'status-cancelled';
    if (statusLower === 'confirmed') return 'status-confirmed';
    if (statusLower === 'pending') return 'status-pending';
    return '';
  };

  return (
    <div className="patient-profile-container">
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

        .patient-profile-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

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

        .patient-profile {
          flex: 1;
          padding: 20px;
          background-color: white;
          margin: 100px 20px 20px 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          position: relative;
        }

        .profile-container {
          max-width: 800px;
          margin: auto;
        }

        .profile-header {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
          flex-direction: column;
          text-align: center;
        }

        .profile-picture img {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid var(--blue);
          margin-bottom: 15px;
        }

        .profile-info h1 {
          margin: 0;
          font-size: 2.4rem;
          color: var(--black);
        }

        .profile-info p {
          margin: 5px 0;
          color: var(--blue);
          font-size: 1.6rem;
        }

        .appointment-history,
        .future-appointments {
          margin-top: 30px;
          background-color: #fff;
        }

        .appointment-history h2,
        .future-appointments h2 {
          margin-bottom: 15px;
          color: var(--blue);
          font-size: 2rem;
        }

        .appointment-list {
          list-style: none;
          padding: 0;
          background-color: #fff;
        }

        .appointment-list li {
          background: #f8f9fa;
          padding: 15px;
          margin: 10px 0;
          border-radius: 8px;
          font-size: 1.5rem;
          border-left: 4px solid var(--blue);
        }

        .close-btn {
          position: absolute;
          top: 15px;
          left: 15px;
          font-size: 24px;
          font-weight: bold;
          cursor: pointer;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          padding: 8px 12px;
          transition: 0.3s;
          z-index: 10;
        }

        .close-btn:hover {
          background: rgba(0, 0, 0, 0.3);
          color: white;
        }

        .button {
          height: 3.5rem;
          width: 15rem;
          background: var(--black);
          color: var(--white);
          font-size: 1.7rem;
          text-transform: capitalize;
          border-radius: .5rem;
          cursor: pointer;
          margin: 1rem 0;
          border: .1rem solid var(--blue);
          display: block;
          margin-left: auto;
          margin-right: auto;
        }

        .button:hover {
          border: .1rem solid var(--blue);
          background: var(--white);
          color: var(--blue);
          letter-spacing: .2rem;
        }

        /* Status colors */
        .status-completed {
          color: green;
          font-weight: bold;
        }
        .status-cancelled {
          color: red;
          font-weight: bold;
        }
        .status-confirmed {
          color: green;
          font-weight: bold;
        }
        .status-pending {
          color: orange;
          font-weight: bold;
        }

        /* Cancel button */
        .cancel-btn {
          background: #ff4444;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1.4rem;
          margin-top: 8px;
          margin-right: 8px;
        }
        .cancel-btn:hover {
          background: #cc0000;
        }

        .chat-btn {
          background-color: var(--blue);
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1.4rem;
          margin-top: 8px;
          margin-right: 8px;
        }

        .chat-btn:hover {
          background-color: #0178c7;
        }

        /* Modal styles */
        .modal {
          display: flex;
          position: fixed;
          z-index: 1000;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0,0,0,0.4);
          align-items: center;
          justify-content: center;
        }

        .modal-content {
          background-color: #fefefe;
          padding: 20px;
          border: 1px solid #888;
          width: 90%;
          max-width: 600px;
          border-radius: 8px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
        }

        .modal-close {
          color: #aaa;
          float: right;
          font-size: 28px;
          font-weight: bold;
          cursor: pointer;
          align-self: flex-end;
        }

        .modal-close:hover {
          color: black;
        }

        .chat-messages {
          height: 300px;
          overflow-y: auto;
          border: 1px solid #ddd;
          padding: 10px;
          margin: 10px 0;
          border-radius: 4px;
          flex: 1;
        }

        .chat-input {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .chat-input input {
          flex: 1;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1.4rem;
        }

        .chat-input button {
          padding: 8px 16px;
          background-color: var(--blue);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1.4rem;
        }

        .message {
          margin: 5px 0;
          padding: 8px 12px;
          border-radius: 8px;
          max-width: 80%;
          font-size: 1.4rem;
        }

        .message.sent {
          background-color: var(--blue);
          color: white;
          margin-left: auto;
        }

        .message.received {
          background-color: #f0f0f0;
          margin-right: auto;
          color: #333;
        }

        .loader {
          border: 4px solid #f3f3f3;
          border-top: 4px solid var(--blue);
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .error-message {
          color: red;
          text-align: center;
          margin: 20px 0;
          font-size: 1.4rem;
        }

        .retry-btn {
          background-color: var(--blue);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          margin: 10px auto;
          display: block;
          font-size: 1.4rem;
        }

        @media (max-width: 768px) {
          header {
            width: 100%;
            top: 0;
            padding: 1rem;
          }

          header .navbar ul {
            flex-direction: column;
            position: fixed;
            top: -100rem;
            left: 0;
            width: 100%;
            background: var(--white);
            opacity: 0;
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

          .patient-profile {
            margin: 80px 10px 10px 10px;
            padding: 15px;
          }

          .profile-header {
            flex-direction: column;
            text-align: center;
          }

          .button {
            margin-left: auto;
            margin-right: auto;
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
            <li><Link to="/patient/form">LogOut</Link></li>
          </ul>
        </nav>
      </header>

      {/* Patient Profile Section */}
      <section className="patient-profile">
        {/* Close Button */}
        <div className="close-btn" onClick={closeProfile}>
          <i className="fas fa-times"></i>
        </div>

        <div className="profile-container">
          <div className="profile-header">
            <div className="profile-picture">
              <img 
                src={patientData.profilePhoto} 
                alt="Patient Profile" 
                onError={(e) => {
                  e.target.src = '/images/default-patient.svg';
                }}
              />
            </div>
            <div className="profile-info">
              {loading.profile ? (
                <div className="loader"></div>
              ) : errors.profile ? (
                <div className="error-message">
                  <p>Error loading profile: {errors.profile}</p>
                  <button className="retry-btn" onClick={loadPatientData}>Retry</button>
                </div>
              ) : (
                <>
                  <h1 id="patientName">{patientData.name}</h1>
                  <p id="patientEmail">Email: {patientData.email}</p>
                  <p id="patientMobile">Mobile: {patientData.mobile}</p>
                  <p id="patientAddress">Address: {patientData.address}</p>
                </>
              )}
            </div>
          </div>

          {/* Previous Appointments */}
          <div className="appointment-history">
            <h2>Previous Appointments</h2>
            <div id="previousAppointments">
              {loading.previous ? (
                <div className="loader"></div>
              ) : errors.previous ? (
                <div className="error-message">
                  <p>Failed to load previous appointments: {errors.previous}</p>
                  <button className="retry-btn" onClick={() => fetchAppointments('previous')}>
                    Retry
                  </button>
                </div>
              ) : previousAppointments.length === 0 ? (
                <p>No previous appointments found.</p>
              ) : (
                <ul className="appointment-list">
                  {previousAppointments.map(appointment => (
                    <li key={appointment.id}>
                      <strong>Dr. {appointment.doctorName}</strong> ({appointment.specialization})<br />
                      <strong>Date:</strong> {appointment.date} at {appointment.time}<br />
                      <strong>Type:</strong> {appointment.type}<br />
                      <strong>Status:</strong>{" "}
                      <span className={getStatusClass(appointment.status)}>
                        {appointment.status}
                      </span>
                      {appointment.notes && (
                        <>
                          <br />
                          <strong>Notes:</strong> {appointment.notes}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="future-appointments">
            <h2>Upcoming Appointments</h2>
            <div id="upcomingAppointments">
              {loading.upcoming ? (
                <div className="loader"></div>
              ) : errors.upcoming ? (
                <div className="error-message">
                  <p>Failed to load upcoming appointments: {errors.upcoming}</p>
                  <button className="retry-btn" onClick={() => fetchAppointments('upcoming')}>
                    Retry
                  </button>
                </div>
              ) : upcomingAppointments.length === 0 ? (
                <p>No upcoming appointments found.</p>
              ) : (
                <ul className="appointment-list">
                  {upcomingAppointments.map(appointment => (
                    <li key={appointment.id}>
                      <strong>Dr. {appointment.doctorName}</strong> ({appointment.specialization})<br />
                      <strong>Date:</strong> {appointment.date} at {appointment.time}<br />
                      <strong>Type:</strong> {appointment.type}<br />
                      <strong>Status:</strong>{" "}
                      <span className={getStatusClass(appointment.status)}>
                        {appointment.status}
                      </span>
                      {appointment.notes && (
                        <>
                          <br />
                          <strong>Notes:</strong> {appointment.notes}
                        </>
                      )}
                      {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                        <div style={{ marginTop: '8px' }}>
                          {appointment.status === 'confirmed' && (
                            <button 
                              onClick={() => openChat(appointment.id)} 
                              className="chat-btn"
                            >
                              Chat with Doctor
                            </button>
                          )}
                          <button 
                            onClick={() => cancelAppointment(appointment.id)} 
                            className="cancel-btn"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <Link to="/patient/edit-profile">
            <button className="button">Edit Profile</button>
          </Link>
        </div>
      </section>

      {/* Chat Modal */}
      {chatModal.isOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="modal-close" onClick={closeChat}>&times;</span>
            <h2>Chat with Doctor</h2>
            <div 
              ref={chatMessagesRef}
              className="chat-messages"
            >
              {chatModal.messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`message ${msg.senderType === 'patient' ? 'sent' : 'received'}`}
                >
                  {msg.isFile ? (
                    <a 
                      href={`/chat/download/${msg.fileName}`}
                      style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                      📎 {msg.fileName} (Download)
                    </a>
                  ) : (
                    msg.message
                  )}
                </div>
              ))}
            </div>
            <div className="chat-input">
              <input 
                ref={messageInputRef}
                type="text" 
                placeholder="Type your message..." 
                onKeyPress={handleMessageKeyPress}
              />
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif" 
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                title="Upload File"
              >
                📎
              </button>
              <button onClick={sendMessage}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientProfile;
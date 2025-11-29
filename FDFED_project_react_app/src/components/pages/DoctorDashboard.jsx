import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import '../../assets/css/DoctorDashboard.css';
import { Link } from 'react-router-dom';
import { useDoctor } from '../../context/DoctorContext';
import {
  fetchDoctorAppointments,
  updateAppointmentStatus,
  fetchBookedSlots,
  blockSlot
} from '../../store/slices/appointmentSlice';

const DoctorDashboard = () => {
  const { doctor } = useDoctor();
  const dispatch = useDispatch();
  
  // Redux state
  const {
    doctorAppointments,
    doctorAppointmentsLoading,
    bookedSlots,
    slotsLoading: loadingSlots
  } = useSelector((state) => state.appointments);

  const upcomingAppointments = doctorAppointments.upcoming;
  const previousAppointments = doctorAppointments.previous;
  
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [financeData, setFinanceData] = useState([]);
  const [showChatModal, setShowChatModal] = useState(false);
  const [currentAppointmentId, setCurrentAppointmentId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [fileInput, setFileInput] = useState(null);

  const chatMessagesRef = useRef(null);
  const messagePollingIntervalRef = useRef(null);

  const allSlots = {
    morning: ["09:00 AM", "09:15 AM", "09:30 AM", "09:45 AM", "10:00 AM", "10:15 AM", "10:30 AM", "10:45 AM", "11:00 AM", "11:15 AM", "11:30 AM"],
    afternoon: ["02:00 PM", "02:15 PM", "02:30 PM", "02:45 PM", "03:00 PM", "03:15 PM", "03:30 PM", "03:45 PM"],
    evening: ["06:00 PM", "06:15 PM", "06:30 PM", "06:45 PM", "07:00 PM", "07:15 PM", "07:30 PM", "07:45 PM"]
  };

  const fetchConfig = {
    credentials: 'include'
  };

  useEffect(() => {
    loadDoctorData();
    dispatch(fetchDoctorAppointments());
    loadFinanceData();
    initializeSlotManagement();

    return () => {
      if (messagePollingIntervalRef.current) {
        clearInterval(messagePollingIntervalRef.current);
      }
    };
  }, [dispatch]);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    if (selectedDate && doctor?._id) {
      console.log('useEffect triggered with selectedDate:', selectedDate, 'doctor._id:', doctor?._id);
      loadBookedSlots(selectedDate);
    } else {
      console.log('useEffect skipped - selectedDate:', selectedDate, 'doctor?._id:', doctor?._id);
    }
  }, [selectedDate, doctor]);

  const loadDoctorData = async () => {
    try {
      const response = await fetch('http://localhost:3002/doctor/api/profile', fetchConfig);
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/doctor/form?error=login_required';
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Doctor data received:', data);
      setDoctor(data.doctor || { _id: data._id }); // Fallback to root _id if doctor object is missing
    } catch (error) {
      console.error('Error loading doctor data:', error);
    }
  };

  // Removed - now using Redux fetchDoctorAppointments

  const loadFinanceData = async () => {
    try {
      const response = await fetch('http://localhost:3002/appointment/doctor/appointments', fetchConfig);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      const completedAppointments = [...(data.upcoming || []), ...(data.previous || [])].filter(
        appt => appt.status === 'completed'
      );

      setFinanceData(completedAppointments);
    } catch (error) {
      console.error('Error loading finance data:', error);
    }
  };

  const loadBookedSlots = async (date) => {
    if (!doctor?._id) {
      console.log('No doctor ID available, skipping loadBookedSlots');
      return;
    }
    
    console.log('Fetching booked slots for date:', date, 'doctorId:', doctor._id);
    dispatch(fetchBookedSlots({ doctorId: doctor._id, date }));
  };

  const handleUpdateAppointment = async (appointmentId, status) => {
    try {
      await dispatch(updateAppointmentStatus({ appointmentId, status })).unwrap();
      alert(`Appointment ${status} successfully`);
      dispatch(fetchDoctorAppointments());
      loadFinanceData();
      if (selectedDate) {
        loadBookedSlots(selectedDate);
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert(error || 'Failed to update appointment. Please try again.');
    }
  };

  const initializeSlotManagement = () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    setSelectedDate(dateStr);
    console.log('Initialized selectedDate:', dateStr);
  };

  const generateDateButtons = () => {
    const today = new Date();
    const dates = [];

    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        display: `${date.toLocaleString('en-US', { weekday: 'short' })} ${date.getDate()}`,
        isToday: i === 0,
        isPast: i < 0
      });
    }

    return dates;
  };

  const getAvailableSlots = () => {
    const now = new Date();
    const isToday = selectedDate === new Date().toISOString().split('T')[0];
    const key = doctor?._id ? `${doctor._id}-${selectedDate}` : selectedDate;
    const bookedSlotsForDate = bookedSlots[key] || [];
    console.log('Checking slots for date:', selectedDate, 'Booked slots:', bookedSlotsForDate);

    const filterSlots = (slots) => {
      return slots.map(slot => {
        const isBooked = bookedSlotsForDate.includes(slot);
        let isPast = false;
        
        if (isToday) {
          const [time, period] = slot.split(' ');
          let [hours, minutes] = time.split(':').map(Number);
          
          if (period === 'PM' && hours !== 12) hours += 12;
          if (period === 'AM' && hours === 12) hours = 0;
          
          const slotTime = new Date(selectedDate);
          slotTime.setHours(hours, minutes, 0, 0);
          isPast = slotTime <= now;
        }
        
        return {
          time: slot,
          booked: isBooked,
          past: isPast,
          disabled: isBooked || isPast
        };
      });
    };

    return {
      morning: filterSlots(allSlots.morning),
      afternoon: filterSlots(allSlots.afternoon),
      evening: filterSlots(allSlots.evening)
    };
  };

  const handleDateSelect = (dateValue) => {
    setSelectedDate(dateValue);
    setSelectedTime('');
    console.log('Date selected:', dateValue);
  };

  const handleTimeSelect = (time) => {
    if (!time.disabled) {
      setSelectedTime(time.time);
      console.log('Time selected:', time.time);
    }
  };

  const handleBlockSlot = async () => {
    if (!selectedDate || !selectedTime) {
      alert('Please select both a date and time slot');
      return;
    }

    const availableSlots = getAvailableSlots();
    const allSlots = [...availableSlots.morning, ...availableSlots.afternoon, ...availableSlots.evening];
    const selectedSlot = allSlots.find(slot => slot.time === selectedTime);
    
    if (selectedSlot?.disabled) {
      alert(`Cannot block this slot. It is already ${selectedSlot.booked ? 'booked' : 'in the past'}.`);
      return;
    }

    if (confirm(`Are you sure you want to block the slot on ${selectedDate} at ${selectedTime}?`)) {
      try {
        await dispatch(blockSlot({
          date: selectedDate,
          time: selectedTime,
          doctorId: doctor?._id
        })).unwrap();
        alert('Slot blocked successfully');
        loadBookedSlots(selectedDate);
        setSelectedTime('');
      } catch (error) {
        console.error('Error blocking slot:', error);
        alert(error || 'Failed to block slot. Please try again.');
      }
    }
  };

  const openChat = (appointmentId) => {
    setCurrentAppointmentId(appointmentId);
    setShowChatModal(true);
    loadMessages(appointmentId);
    startMessagePolling(appointmentId);
  };

  const closeChat = () => {
    setShowChatModal(false);
    setCurrentAppointmentId(null);
    setChatMessages([]);
    stopMessagePolling();
  };

  const loadMessages = async (appointmentId = currentAppointmentId) => {
    if (!appointmentId) return;

    try {
      const response = await fetch(`http://localhost:3002/chat/${appointmentId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      setChatMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !currentAppointmentId) return;

    try {
      const response = await fetch('http://localhost:3002/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appointmentId: currentAppointmentId,
          message: messageInput,
          senderType: 'doctor'
        }),
        credentials: 'include'
      });

      if (response.ok) {
        setMessageInput('');
        loadMessages();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  const sendFile = async (file) => {
    if (!file || !currentAppointmentId) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('appointmentId', currentAppointmentId);
    formData.append('senderType', 'doctor');

    try {
      const response = await fetch('http://localhost:3002/chat/send-file', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (response.ok) {
        setFileInput(null);
        loadMessages();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send file');
      }
    } catch (error) {
      console.error('Error sending file:', error);
      alert('Failed to send file');
    }
  };

  const startMessagePolling = (appointmentId) => {
    messagePollingIntervalRef.current = setInterval(() => {
      loadMessages(appointmentId);
    }, 5000);
  };

  const stopMessagePolling = () => {
    if (messagePollingIntervalRef.current) {
      clearInterval(messagePollingIntervalRef.current);
      messagePollingIntervalRef.current = null;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      sendFile(file);
    }
  };

  const financeTotals = financeData.reduce(
    (totals, appt) => {
      const fee = appt.consultationFee || 0;
      const revenue = fee * 0.9;
      return {
        totalFees: totals.totalFees + fee,
        totalRevenue: totals.totalRevenue + revenue,
        totalAppointments: totals.totalAppointments + 1
      };
    },
    { totalFees: 0, totalRevenue: 0, totalAppointments: 0 }
  );

  const availableSlots = getAvailableSlots();

  const getProfileImageUrl = () => {
    if (!doctor?.profilePhoto) return '/images/default-doctor.svg';
    const photo = doctor.profilePhoto;
    if (/^(https?:|data:|blob:)/i.test(photo)) return photo;
    if (photo.startsWith('/')) return `http://localhost:3002${photo}`;
    return `http://localhost:3002/${photo}`;
  };

  return (
    <div className="doctor-dashboard">
      <header>
        <a href="#" className="logo">
          <span>M</span>edi<span>Q</span>uick
        </a>
        <nav className="navbar">
          <ul>
            <li><a href="#upcoming">Upcoming Appointments</a></li>
            <li><a href="#previous">Previous Appointments</a></li>
            <li><Link to="/doctor/generate-prescriptions">Generate Prescriptions</Link></li>
            <li><Link to="/doctor/prescriptions">See Prescriptions</Link></li>
            <li><a href="#slot">Slot Management</a></li>
            <li><a href="#finance">Finance</a></li>
            <li><a href="/logout">LogOut</a></li>
          </ul>
        </nav>
        {doctor && (
          <Link to="/doctor/profile" className="profile-link">
            <img 
              src={getProfileImageUrl()} 
              alt={doctor.name || 'Doctor'} 
              className="header-profile-image"
              onError={(e) => { e.target.src = '/images/default-doctor.svg'; }}
            />
          </Link>
        )}
        <div className="fas fa-bars"></div>
      </header>
      
      <section id="upcoming" className="about">
         {doctor && doctor.name && (
        <h1 className="welcome-message">Welcome, {doctor.name}!</h1>
      )}
        <div className="close-btn" onClick={() => window.location.href = "/doctor/dashboard"}>
          <i className="fas fa-times"></i>
        </div>
        <h1 className="heading">Upcoming Appointments</h1>
        <br />
        <div className="box-container" id="upcoming-appointments">
          {upcomingAppointments.length === 0 ? (
            <p>No upcoming appointments found</p>
          ) : (
            upcomingAppointments.map(appt => (
              <div key={appt._id} className="box">
                <h3>{appt.patientId?.name || 'Unknown Patient'}</h3>
                <p><strong>Date:</strong> {new Date(appt.date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {appt.time}</p>
                <p><strong>Status:</strong> {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}</p>
                <div className="action-buttons">
                  {appt.status === 'pending' && (
                    <>
                      <button onClick={() => handleUpdateAppointment(appt._id, 'confirmed')}>Confirm</button>
                      <button onClick={() => handleUpdateAppointment(appt._id, 'cancelled')}>Cancel</button>
                    </>
                  )}
                  {appt.status === 'confirmed' && (
                    <>
                      <button onClick={() => handleUpdateAppointment(appt._id, 'completed')}>Mark Complete</button>
                      <button onClick={() => openChat(appt._id)} className="chat-btn">Chat with Patient</button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

     <section id="previous" className="about">
    <h1 className="heading">Previous Appointments</h1>
    <br />
    <div className="box-container" id="previous-appointments">
        {previousAppointments.length === 0 ? (
            <p>No previous appointments found</p>
        ) : (
            previousAppointments.map(appt => (
                <div key={appt._id} className="box">
                    <h3>{appt.patientId?.name || 'Unknown Patient'}</h3>
                    <p><strong>Date:</strong> {new Date(appt.date).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> {appt.time}</p>
                    <p>
                        <strong>Status:</strong> 
                        <span className={`status ${appt.status}`}>
                            {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                        </span>
                    </p>
                    {appt.status === 'confirmed' && (
                        <div className="action-buttons">
                            <button onClick={() => handleUpdateAppointment(appt._id, 'completed')}>
                                Mark Complete
                            </button>
                            <button onClick={() => openChat(appt._id)} className="chat-btn">
                                Chat with Patient
                            </button>
                        </div>
                    )}
                </div>
            ))
        )}
    </div>
</section>

      <section className="about" id="slot">
        <h1 className="heading">Slot Management</h1>
        <br />
        <div className="right-section">
          <div className="appointment-slots">
            <div className="slot-info">
              <div className="slot-legend">
                <div className="legend-item">
                  <div className="legend-color available"></div>
                  <span>Available</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color booked"></div>
                  <span>Booked</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color past"></div>
                  <span>Past</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color selected"></div>
                  <span>Selected</span>
                </div>
              </div>
              {selectedDate && selectedTime && (
                <div className="current-selection">
                  Selected: {selectedDate} at {selectedTime}
                </div>
              )}
            </div>

            <div className="date-selection" id="date-buttons">
              {generateDateButtons().map(date => (
                <button
                  key={date.value}
                  className={selectedDate === date.value ? 'selected' : ''}
                  onClick={() => handleDateSelect(date.value)}
                >
                  {date.display}
                </button>
              ))}
            </div>
            
            {loadingSlots && <div className="loading-slots">Loading slots...</div>}
            
            <div className="slots" id="morning-slots">
              <h3>Morning Slots</h3>
              <div className="slot-buttons">
                {availableSlots.morning.map((slot, index) => (
                  <button
                    key={index}
                    className={`${selectedTime === slot.time ? 'selected' : ''} ${slot.booked ? 'booked' : ''} ${slot.past ? 'past' : ''}`}
                    disabled={slot.disabled}
                    onClick={() => handleTimeSelect(slot)}
                    title={slot.booked ? 'Booked' : slot.past ? 'Past' : 'Available'}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>

            <div className="slots" id="afternoon-slots">
              <h3>Afternoon Slots</h3>
              <div className="slot-buttons">
                {availableSlots.afternoon.map((slot, index) => (
                  <button
                    key={index}
                    className={`${selectedTime === slot.time ? 'selected' : ''} ${slot.booked ? 'booked' : ''} ${slot.past ? 'past' : ''}`}
                    disabled={slot.disabled}
                    onClick={() => handleTimeSelect(slot)}
                    title={slot.booked ? 'Booked' : slot.past ? 'Past' : 'Available'}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>

            <div className="slots" id="evening-slots">
              <h3>Evening Slots</h3>
              <div className="slot-buttons">
                {availableSlots.evening.map((slot, index) => (
                  <button
                    key={index}
                    className={`${selectedTime === slot.time ? 'selected' : ''} ${slot.booked ? 'booked' : ''} ${slot.past ? 'past' : ''}`}
                    disabled={slot.disabled}
                    onClick={() => handleTimeSelect(slot)}
                    title={slot.booked ? 'Booked' : slot.past ? 'Past' : 'Available'}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>

            <button 
              className="button block-slot-btn" 
              onClick={handleBlockSlot}
              disabled={!selectedDate || !selectedTime}
            >
              Block Selected Slot
            </button>
          </div>
        </div>
      </section>

      <section id="finance" className="about">
        <h1 className="heading">Finance</h1>
        <br />
        <div className="table-container">
          <table id="financeTable">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Date</th>
                <th>Time</th>
                <th>Fee</th>
                <th>Revenue (90%)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="financeBody">
              {financeData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="loading">No completed appointments found</td>
                </tr>
              ) : (
                financeData.map(appt => {
                  const fee = appt.consultationFee || 0;
                  const revenue = fee * 0.9;
                  return (
                    <tr key={appt._id}>
                      <td>{appt.patientId?.name || 'Unknown Patient'}</td>
                      <td>{new Date(appt.date).toLocaleDateString()}</td>
                      <td>{appt.time}</td>
                      <td>${fee.toFixed(2)}</td>
                      <td>${revenue.toFixed(2)}</td>
                      <td>Completed</td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3">Total</td>
                <td id="totalFees">${financeTotals.totalFees.toFixed(2)}</td>
                <td id="totalRevenue">${financeTotals.totalRevenue.toFixed(2)}</td>
                <td id="totalAppointments">{financeTotals.totalAppointments}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {showChatModal && (
        <div id="chatModal" className="modal" style={{ display: 'block' }}>
          <div className="modal-content">
            <span className="close" onClick={closeChat}>&times;</span>
            <h2>Chat with Patient</h2>
            <div id="chatMessages" className="chat-messages" ref={chatMessagesRef}>
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`message ${msg.senderType === 'doctor' ? 'sent' : 'received'}`}
                >
                  {msg.isFile ? (
                    <a
                      href={`http://localhost:3002/chat/download/${msg.fileName}`}
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
                type="text"
                id="messageInput"
                placeholder="Type your message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <input
                type="file"
                id="fileInput"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <button onClick={() => document.getElementById('fileInput').click()} title="Upload File">
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

export default DoctorDashboard;
import React, { useState, useEffect, useRef } from 'react';
import '../../assets/css/DoctorDashboard.css';

const DoctorDashboard = () => {
  const [doctor, setDoctor] = useState(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [previousAppointments, setPreviousAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [financeData, setFinanceData] = useState([]);
  const [showChatModal, setShowChatModal] = useState(false);
  const [currentAppointmentId, setCurrentAppointmentId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [fileInput, setFileInput] = useState(null);
  const [bookedSlots, setBookedSlots] = useState({});
  const [loadingSlots, setLoadingSlots] = useState(false);

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
    loadAppointments();
    loadFinanceData();
    initializeSlotManagement();

    return () => {
      if (messagePollingIntervalRef.current) {
        clearInterval(messagePollingIntervalRef.current);
      }
    };
  }, []);

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

  const loadAppointments = async () => {
    try {
      const response = await fetch('http://localhost:3002/appointment/doctor/appointments', fetchConfig);
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/doctor/form?error=login_required';
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setUpcomingAppointments(data.upcoming || []);
      setPreviousAppointments(data.previous || []);
      
      // Fallback: Extract doctorId from appointments if doctor not set
      if (!doctor && (data.upcoming?.length > 0 || data.previous?.length > 0)) {
        const firstAppt = data.upcoming[0] || data.previous[0];
        if (firstAppt.doctorId) {
          setDoctor({ _id: firstAppt.doctorId });
          console.log('Doctor ID extracted from appointments:', firstAppt.doctorId);
        }
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

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
    
    try {
      setLoadingSlots(true);
      console.log('Fetching booked slots for date:', date, 'doctorId:', doctor._id);
      const response = await fetch(
        `http://localhost:3002/appointment/api/booked-slots?doctorId=${doctor._id}&date=${date}`,
        fetchConfig
      );
      
      console.log('Booked slots response status:', response.status);
      if (response.ok) {
        const bookedSlotsForDate = await response.json();
        console.log('Booked slots received:', bookedSlotsForDate);
        setBookedSlots(prev => ({
          ...prev,
          [date]: bookedSlotsForDate || []
        }));
      } else {
        console.error('Failed to fetch booked slots:', response.status);
        setBookedSlots(prev => ({
          ...prev,
          [date]: []
        }));
      }
    } catch (error) {
      console.error('Error loading booked slots:', error);
      setBookedSlots(prev => ({
        ...prev,
        [date]: []
      }));
    } finally {
      setLoadingSlots(false);
    }
  };

  const updateAppointment = async (appointmentId, status) => {
    try {
      const response = await fetch(`http://localhost:3002/appointment/${appointmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status }),
        credentials: 'include'
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Appointment ${status} successfully`);
        loadAppointments();
        loadFinanceData();
        if (selectedDate) {
          loadBookedSlots(selectedDate);
        }
      } else {
        alert(result.error || 'Failed to update appointment');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Failed to update appointment. Please try again.');
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
    const bookedSlotsForDate = bookedSlots[selectedDate] || [];
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

  const blockSlot = async () => {
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
        const response = await fetch('http://localhost:3002/appointment/api/block-slot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            date: selectedDate,
            time: selectedTime,
            doctorId: doctor?._id
          }),
          credentials: 'include'
        });

        const result = await response.json();

        if (response.ok) {
          alert('Slot blocked successfully');
          loadBookedSlots(selectedDate);
          setSelectedTime('');
        } else {
          alert(result.error || 'Failed to block slot');
        }
      } catch (error) {
        console.error('Error blocking slot:', error);
        alert('Failed to block slot. Please try again.');
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

  return (
    <div className="doctor-dashboard">
      <header className="dashboard-header">
        <a href="#" className="logo">
          <span>M</span>edi<span>Q</span>uick
        </a>
        <nav className="navbar">
          <ul>
            <li><a href="#upcoming">Upcoming Appointments</a></li>
            <li><a href="#previous">Previous Appointments</a></li>
            <li><a href="/doctor/generate-prescriptions">Generate Prescriptions</a></li>
            <li><a href="/doctor/prescriptions">See Prescriptions</a></li>
            <li><a href="#slot">Slot Management</a></li>
            <li><a href="#finance">Finance</a></li>
            <li><a href="/logout">LogOut</a></li>
            <a href="/doctor/profile">
              <img
                id="dashboardProfilePhotoImg"
                src={doctor?.profilePhoto || '/images/default-doctor.svg'}
                alt="Profile Image"
                height="30px"
                width="30px"
                style={{ borderRadius: '50%', objectFit: 'cover' }}
              />
            </a>
          </ul>
        </nav>
        <div className="fas fa-bars"></div>
      </header>

      <section id="upcoming" className="about">
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
                      <button onClick={() => updateAppointment(appt._id, 'confirmed')}>Confirm</button>
                      <button onClick={() => updateAppointment(appt._id, 'cancelled')}>Cancel</button>
                    </>
                  )}
                  {appt.status === 'confirmed' && (
                    <>
                      <button onClick={() => updateAppointment(appt._id, 'completed')}>Mark Complete</button>
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
                            <button onClick={() => updateAppointment(appt._id, 'completed')}>
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
              onClick={blockSlot}
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
        <div id="chatModal" className="modal">
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
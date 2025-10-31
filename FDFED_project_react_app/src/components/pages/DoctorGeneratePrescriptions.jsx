import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../assets/css/DoctorDashboard.css';

const DoctorGeneratePrescriptions = () => {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    appointmentId: '',
    age: '',
    gender: '',
    weight: '',
    symptoms: '',
    additionalNotes: '',
    medicines: [
      {
        medicineName: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: ''
      }
    ]
  });

  const fetchConfig = {
    credentials: 'include'
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('http://localhost:3002/doctor/api/appointments', fetchConfig);
      
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/doctor/form?error=login_required';
          return;
        }
        throw new Error('Failed to fetch appointments');
      }
      
      const data = await response.json();
      
      // Filter completed appointments from both upcoming and previous
      const completedAppointments = [
        ...(data.upcoming || []).filter(appt => appt.status === 'completed'),
        ...(data.previous || []).filter(appt => appt.status === 'completed')
      ];
      
      setAppointments(completedAppointments);
      
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setFormData(prev => ({
      ...prev,
      appointmentId: appointment._id
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMedicineChange = (index, field, value) => {
    const updatedMedicines = [...formData.medicines];
    updatedMedicines[index][field] = value;
    setFormData(prev => ({
      ...prev,
      medicines: updatedMedicines
    }));
  };

  const addMedicine = () => {
    setFormData(prev => ({
      ...prev,
      medicines: [
        ...prev.medicines,
        {
          medicineName: '',
          dosage: '',
          frequency: '',
          duration: '',
          instructions: ''
        }
      ]
    }));
  };

  const removeMedicine = (index) => {
    if (formData.medicines.length > 1) {
      const updatedMedicines = formData.medicines.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        medicines: updatedMedicines
      }));
    }
  };

 // In DoctorGeneratePrescriptions.jsx, update the handleSubmit function:

const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!selectedAppointment) {
    alert('Please select an appointment first');
    return;
  }

  // Validate required fields
  if (!formData.age || !formData.gender || !formData.weight || !formData.symptoms) {
    alert('Please fill all required fields');
    return;
  }

  // Validate medicines
  const hasEmptyMedicine = formData.medicines.some(med => 
    !med.medicineName || !med.dosage || !med.frequency || !med.duration
  );
  
  if (hasEmptyMedicine) {
    alert('Please fill all required medicine fields');
    return;
  }

  try {
    const prescriptionData = {
      appointmentId: formData.appointmentId,
      age: parseInt(formData.age),
      gender: formData.gender,
      weight: parseFloat(formData.weight),
      symptoms: formData.symptoms,
      medicines: formData.medicines,
      additionalNotes: formData.additionalNotes
    };

    console.log('Sending prescription data:', prescriptionData);

    // Try different endpoint variations
    const response = await fetch('http://localhost:3002/prescription/doctor/prescriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(prescriptionData),
      credentials: 'include'
    });

    // Check if response is HTML (error page)
    const contentType = response.headers.get('content-type');
    let result;
    
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      const text = await response.text();
      console.error('Server returned HTML instead of JSON:', text.substring(0, 500));
      throw new Error('Server error - received HTML response');
    }

    if (response.ok) {
      alert('Prescription created successfully!');
      // Reset form
      setFormData({
        appointmentId: '',
        age: '',
        gender: '',
        weight: '',
        symptoms: '',
        additionalNotes: '',
        medicines: [
          {
            medicineName: '',
            dosage: '',
            frequency: '',
            duration: '',
            instructions: ''
          }
        ]
      });
      setSelectedAppointment(null);
      
      // Redirect to prescriptions page
      window.location.href = '/doctor/prescriptions';
    } else {
      alert(result.error || 'Failed to create prescription');
    }
  } catch (err) {
    console.error('Error creating prescription:', err);
    alert('Failed to create prescription. Please check the console for details.');
  }
};

  return (
    <div className="doctor-dashboard">
      <header>
        <a href="#" className="logo">
          <span>M</span>edi<span>Q</span>uick
        </a>
        <nav className="navbar">
          <ul>
            <li><Link to="/doctor/dashboard">Dashboard</Link></li>
            <li><Link to="/doctor/appointments">Appointments</Link></li>
            <li><Link to="/doctor/generate-prescriptions" className="active">Prescriptions</Link></li>
            <li><Link to="/doctor/profile">Profile</Link></li>
            <li><a href="/doctor/form">LogOut</a></li>
          </ul>
        </nav>
        <div className="fas fa-bars"></div>
      </header>

      <section className="about">
        <div className="prescription-container">
          <h1 className="heading">Generate Prescription</h1>
          
          <div className="appointment-list">
            <h3 style={{ textAlign: 'center', marginBottom: '2rem', color: '#333' }}>
              Select Completed Appointment
            </h3>
            
            {loading && (
              <div className="loading">
                <div className="loading-spinner"></div>
                <p>Loading appointments...</p>
              </div>
            )}

            {error && (
              <div className="error-message">
                <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem', marginBottom: '1rem' }}></i>
                <p>{error}</p>
                <button 
                  onClick={fetchAppointments}
                  style={{ 
                    marginTop: '1rem', 
                    padding: '0.5rem 1rem', 
                    background: '#007bff', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '0.3rem', 
                    cursor: 'pointer' 
                  }}
                >
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && appointments.length === 0 && (
              <div className="no-appointments">
                <i className="fas fa-calendar-times" style={{ fontSize: '4rem', marginBottom: '1rem' }}></i>
                <p>No completed appointments available for prescription generation.</p>
              </div>
            )}

            {!loading && !error && appointments.length > 0 && (
              <div>
                {appointments.map(appointment => (
                  <div 
                    key={appointment._id}
                    className={`appointment-card ${selectedAppointment?._id === appointment._id ? 'selected' : ''}`}
                    onClick={() => selectAppointment(appointment)}
                  >
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">Patient:</span>
                        <span className="info-value">{appointment.patientId?.name || 'Unknown Patient'}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Date:</span>
                        <span className="info-value">
                          {new Date(appointment.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Time:</span>
                        <span className="info-value">{appointment.time}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Contact:</span>
                        <span className="info-value">{appointment.patientId?.email || 'No email'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedAppointment && (
            <div id="prescriptionForm" className="prescription-form">
              <div className="patient-info">
                <h4>Patient Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Name:</span>
                    <span className="info-value">
                      {selectedAppointment.patientId?.name || 'Unknown Patient'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email:</span>
                    <span className="info-value">
                      {selectedAppointment.patientId?.email || 'No email'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Appointment Date:</span>
                    <span className="info-value">
                      {new Date(selectedAppointment.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Appointment Time:</span>
                    <span className="info-value">{selectedAppointment.time}</span>
                  </div>
                </div>
              </div>

              <form id="createPrescriptionForm" onSubmit={handleSubmit}>
                <input type="hidden" id="appointmentId" name="appointmentId" value={formData.appointmentId} />
                
                <div className="form-group">
                  <label htmlFor="age">Age *</label>
                  <input 
                    type="number" 
                    id="age" 
                    name="age" 
                    value={formData.age}
                    onChange={handleInputChange}
                    required 
                    min="1" 
                    max="120"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="gender">Gender *</label>
                  <select 
                    id="gender" 
                    name="gender" 
                    value={formData.gender}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="weight">Weight (kg) *</label>
                  <input 
                    type="number" 
                    id="weight" 
                    name="weight" 
                    value={formData.weight}
                    onChange={handleInputChange}
                    required 
                    step="0.1" 
                    min="1" 
                    max="300"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="symptoms">Symptoms & Diagnosis *</label>
                  <textarea 
                    id="symptoms" 
                    name="symptoms" 
                    value={formData.symptoms}
                    onChange={handleInputChange}
                    placeholder="Describe the patient's symptoms and your diagnosis..." 
                    required
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>Medicines Prescribed *</label>
                  <div id="medicinesContainer">
                    {formData.medicines.map((medicine, index) => (
                      <div key={index} className="medicine-entry">
                        <div className="medicine-row">
                          <input 
                            type="text" 
                            value={medicine.medicineName}
                            onChange={(e) => handleMedicineChange(index, 'medicineName', e.target.value)}
                            placeholder="Medicine Name" 
                            required 
                          />
                          <input 
                            type="text" 
                            value={medicine.dosage}
                            onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                            placeholder="Dosage" 
                            required 
                          />
                          <input 
                            type="text" 
                            value={medicine.frequency}
                            onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                            placeholder="Frequency" 
                            required 
                          />
                          <input 
                            type="text" 
                            value={medicine.duration}
                            onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                            placeholder="Duration" 
                            required 
                          />
                          <input 
                            type="text" 
                            value={medicine.instructions}
                            onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)}
                            placeholder="Instructions" 
                          />
                          <button 
                            type="button" 
                            className="remove-medicine" 
                            onClick={() => removeMedicine(index)}
                            disabled={formData.medicines.length === 1}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="add-medicine" onClick={addMedicine}>
                    <i className="fas fa-plus"></i> Add Medicine
                  </button>
                </div>

                <div className="form-group">
                  <label htmlFor="additionalNotes">Additional Notes & Instructions</label>
                  <textarea 
                    id="additionalNotes" 
                    name="additionalNotes" 
                    value={formData.additionalNotes}
                    onChange={handleInputChange}
                    placeholder="Any additional instructions for the patient..."
                  ></textarea>
                </div>

                <button type="submit" className="submit-btn">
                  <i className="fas fa-file-medical"></i> Generate Prescription
                </button>
              </form>
            </div>
          )}
        </div>
      </section>

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
          <a href="/about">About Us</a>
          <a href="/faqs">FAQ's</a>
          <a href="/contact">Contact Us</a>
          <a href="/blogs">Blog</a>
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms & Conditions</a>
        </div>
        <h1 className="credit">Created by <span>Team MediQuick</span> all rights reserved.</h1>
      </section>

      <style jsx>{`
        .prescription-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 2rem;
        }

        .appointment-list {
          margin-bottom: 2rem;
        }

        .appointment-card {
          background: #fff;
          border-radius: 0.5rem;
          box-shadow: 0 0.3rem 0.5rem rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
          margin-bottom: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .appointment-card:hover {
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.2);
        }

        .appointment-card.selected {
          border-left: 4px solid #007bff;
          background: #f8f9fa;
        }

        .prescription-form {
          background: #fff;
          border-radius: 0.5rem;
          box-shadow: 0 0.3rem 0.5rem rgba(0, 0, 0, 0.1);
          padding: 2rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: bold;
          color: #333;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 0.8rem;
          border: 1px solid #ddd;
          border-radius: 0.5rem;
          font-size: 1.4rem;
        }

        .form-group textarea {
          resize: vertical;
          min-height: 80px;
        }

        .medicine-entry {
          border: 1px solid #ddd;
          padding: 1rem;
          margin-bottom: 1rem;
          border-radius: 0.5rem;
          background: #f9f9f9;
        }

        .medicine-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr auto;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          align-items: end;
        }

        .medicine-row input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #ccc;
          border-radius: 0.3rem;
          font-size: 1.3rem;
        }

        .remove-medicine {
          background: #dc3545;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.3rem;
          cursor: pointer;
          font-size: 1.2rem;
        }

        .remove-medicine:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .add-medicine {
          background: #007bff;
          color: white;
          border: none;
          padding: 0.8rem 1.5rem;
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 1.4rem;
          margin-bottom: 1rem;
        }

        .submit-btn {
          background: #28a745;
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 1.6rem;
          width: 100%;
          margin-top: 1rem;
        }

        .submit-btn:hover {
          background: #218838;
        }

        .no-appointments {
          text-align: center;
          padding: 3rem;
          color: #666;
          font-size: 1.6rem;
        }

        .patient-info {
          background: #e9ecef;
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .info-item {
          display: flex;
          flex-direction: column;
        }

        .info-label {
          font-weight: bold;
          color: #333;
          font-size: 1.2rem;
        }

        .info-value {
          color: #666;
          font-size: 1.4rem;
        }

        .loading {
          text-align: center;
          padding: 2rem;
          color: #666;
        }

        .loading-spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #007bff;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 2s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-message {
          text-align: center;
          padding: 2rem;
          color: #dc3545;
          background: #f8d7da;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
};

export default DoctorGeneratePrescriptions;
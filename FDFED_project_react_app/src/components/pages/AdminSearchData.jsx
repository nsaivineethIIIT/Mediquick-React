import React, { useState, useEffect } from 'react';
import Footer from '../common/Footer';
import '../../assets/css/AdminSearchData.css';

const AdminSearchData = () => {
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [doctorEarnings, setDoctorEarnings] = useState([]);
  const [specializationEarnings, setSpecializationEarnings] = useState([]);
  const [dateRangeAppointments, setDateRangeAppointments] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState({
    doctors: false,
    specializations: false,
    doctorEarnings: false,
    specializationEarnings: false,
    dateRange: false
  });
  const [error, setError] = useState('');
  const [isNavOpen, setIsNavOpen] = useState(false);

  // Calculate totals
  const doctorTotals = doctorEarnings.reduce((acc, day) => ({
    totalFees: acc.totalFees + (day.totalFees || 0),
    totalRevenue: acc.totalRevenue + (day.totalRevenue || 0)
  }), { totalFees: 0, totalRevenue: 0 });

  const specializationTotals = specializationEarnings.reduce((acc, day) => ({
    totalFees: acc.totalFees + (day.totalFees || 0),
    totalRevenue: acc.totalRevenue + (day.totalRevenue || 0)
  }), { totalFees: 0, totalRevenue: 0 });

  const dateRangeTotals = dateRangeAppointments.reduce((acc, appt) => ({
    totalFees: acc.totalFees + (appt.fee || 0),
    totalRevenue: acc.totalRevenue + (appt.revenue || 0)
  }), { totalFees: 0, totalRevenue: 0 });

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // Load doctors and specializations on component mount
  useEffect(() => {
    loadDoctors();
    loadSpecializations();
  }, []);

  // Load available doctors
  const loadDoctors = async () => {
    try {
      setLoading(prev => ({ ...prev, doctors: true }));
      setError('');

      const response = await fetch('http://localhost:3002/admin/api/appointments', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const appointments = await response.json();
      
      // Extract unique doctors
      const doctorMap = new Map();
      appointments.forEach(appt => {
        if (appt.doctorId && appt.doctorName) {
          if (!doctorMap.has(appt.doctorId)) {
            doctorMap.set(appt.doctorId, {
              id: appt.doctorId,
              name: appt.doctorName,
              specialization: appt.specialization || 'General Physician'
            });
          }
        }
      });

      setDoctors(Array.from(doctorMap.values()));
    } catch (error) {
      console.error('Error loading doctors:', error);
      setError(`Failed to load doctors: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, doctors: false }));
    }
  };

  // Load available specializations
  const loadSpecializations = async () => {
    try {
      setLoading(prev => ({ ...prev, specializations: true }));
      setError('');

      const response = await fetch('http://localhost:3002/admin/api/appointments', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const appointments = await response.json();
      
      // Extract unique specializations
      const specSet = new Set();
      appointments.forEach(appt => {
        const spec = appt.specialization || 'General Physician';
        specSet.add(spec);
      });

      setSpecializations(Array.from(specSet).sort());
    } catch (error) {
      console.error('Error loading specializations:', error);
      setError(`Failed to load specializations: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, specializations: false }));
    }
  };

  // Search doctor earnings
  const searchDoctorEarnings = async () => {
    if (!selectedDoctor) {
      alert('Please select a doctor');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, doctorEarnings: true }));
      setError('');

      const response = await fetch('http://localhost:3002/admin/api/appointments', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const appointments = await response.json();

      // Filter appointments for selected doctor
      const doctorAppointments = appointments.filter(appt => 
        appt.doctorId === selectedDoctor
      );

      // Group by date
      const earningsByDate = {};
      doctorAppointments.forEach(appt => {
        const date = appt.date;
        if (!earningsByDate[date]) {
          earningsByDate[date] = {
            date: date,
            count: 0,
            totalFees: 0,
            totalRevenue: 0
          };
        }
        
        earningsByDate[date].count++;
        earningsByDate[date].totalFees += appt.fee || 0;
        earningsByDate[date].totalRevenue += appt.revenue || 0;
      });

      // Convert to array and sort by date (newest first)
      const earningsArray = Object.values(earningsByDate).sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );

      setDoctorEarnings(earningsArray);
    } catch (error) {
      console.error('Error searching doctor earnings:', error);
      setError(`Failed to load doctor earnings: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, doctorEarnings: false }));
    }
  };

  // Search specialization earnings
  const searchSpecializationEarnings = async () => {
    if (!selectedSpecialization) {
      alert('Please select a specialization');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, specializationEarnings: true }));
      setError('');

      const response = await fetch('http://localhost:3002/admin/api/appointments', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const appointments = await response.json();

      // Filter appointments for selected specialization
      const specAppointments = appointments.filter(appt => 
        (appt.specialization || 'General Physician') === selectedSpecialization
      );

      // Group by date
      const earningsByDate = {};
      specAppointments.forEach(appt => {
        const date = appt.date;
        if (!earningsByDate[date]) {
          earningsByDate[date] = {
            date: date,
            count: 0,
            totalFees: 0,
            totalRevenue: 0
          };
        }
        
        earningsByDate[date].count++;
        earningsByDate[date].totalFees += appt.fee || 0;
        earningsByDate[date].totalRevenue += appt.revenue || 0;
      });

      // Convert to array and sort by date (newest first)
      const earningsArray = Object.values(earningsByDate).sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );

      setSpecializationEarnings(earningsArray);
    } catch (error) {
      console.error('Error searching specialization earnings:', error);
      setError(`Failed to load specialization earnings: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, specializationEarnings: false }));
    }
  };

  // Search by date range
  const searchByDateRange = async () => {
    if (!startDate || !endDate) {
      alert('Please select both start date and end date');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert('Start date cannot be after end date');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, dateRange: true }));
      setError('');

      const response = await fetch('http://localhost:3002/admin/api/appointments', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const appointments = await response.json();

      // Filter appointments by date range
      const filteredAppointments = appointments.filter(appt => {
        const appointmentDate = new Date(appt.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return appointmentDate >= start && appointmentDate <= end;
      });

      setDateRangeAppointments(filteredAppointments);
    } catch (error) {
      console.error('Error searching by date range:', error);
      setError(`Failed to load appointments: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, dateRange: false }));
    }
  };

  // Toggle mobile navigation
  const toggleMobileNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  return (
    <div className="admin-search-data">
      {/* Header */}
      <header>
        <a href="/" className="logo"><span>M</span>edi<span>Q</span>uick</a>
        <nav className={`navbar ${isNavOpen ? 'nav-toggle' : ''}`}>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/admin/dashboard">Dashboard</a></li>
            <li><a href="/admin/search-data">Search Data</a></li>
            <li>
              <a href="/admin/profile">
                <img 
                  src="https://static.thenounproject.com/png/638636-200.png" 
                  alt="Profile Image" 
                  height="30px" 
                  width="30px" 
                />
              </a>
            </li>
          </ul>
        </nav>
        <div 
          className={`fas ${isNavOpen ? 'fa-times' : 'fa-bars'}`} 
          onClick={toggleMobileNav}
        ></div>
      </header>

      <div className="container">
        <h1 className="heading">Search Data</h1>

        {/* Error Display */}
        {error && (
          <div className="error-banner">
            <p>{error}</p>
            <button onClick={() => setError('')} className="retry-btn">
              Dismiss
            </button>
          </div>
        )}

        {/* Doctor Earnings Search Section */}
        <section className="search-section">
          <h2 className="section-title">Search Doctor Earnings</h2>
          <div className="search-form">
            <select 
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              disabled={loading.doctors}
            >
              <option value="">Select a Doctor</option>
              {doctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name} - {doctor.specialization}
                </option>
              ))}
            </select>
            <button 
              className="search-btn" 
              onClick={searchDoctorEarnings}
              disabled={loading.doctorEarnings}
            >
              <i className="fas fa-search"></i> 
              {loading.doctorEarnings ? ' Searching...' : ' Search'}
            </button>
          </div>
          
          {doctorEarnings.length > 0 && (
            <div className="summary-card">
              <h3>Total Earnings</h3>
              <p>{formatCurrency(doctorTotals.totalFees)}</p>
              <p style={{fontSize: '1rem', marginTop: '5px'}}>
                MediQuick Revenue: {formatCurrency(doctorTotals.totalRevenue)}
              </p>
            </div>
          )}

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Appointments Count</th>
                  <th>Total Fees</th>
                  <th>MediQuick Revenue (10%)</th>
                </tr>
              </thead>
              <tbody>
                {loading.doctorEarnings ? (
                  <tr>
                    <td colSpan="4" className="loading">Loading doctor earnings...</td>
                  </tr>
                ) : doctorEarnings.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty">Select a doctor to view earnings</td>
                  </tr>
                ) : (
                  doctorEarnings.map((day, index) => (
                    <tr key={index}>
                      <td>{day.date}</td>
                      <td>{day.count}</td>
                      <td>{formatCurrency(day.totalFees)}</td>
                      <td>{formatCurrency(day.totalRevenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Specialization Earnings Search Section */}
        <section className="search-section">
          <h2 className="section-title">Search Specialization Earnings</h2>
          <div className="search-form">
            <select 
              value={selectedSpecialization}
              onChange={(e) => setSelectedSpecialization(e.target.value)}
              disabled={loading.specializations}
            >
              <option value="">Select a Specialization</option>
              {specializations.map(spec => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
            <button 
              className="search-btn" 
              onClick={searchSpecializationEarnings}
              disabled={loading.specializationEarnings}
            >
              <i className="fas fa-search"></i> 
              {loading.specializationEarnings ? ' Searching...' : ' Search'}
            </button>
          </div>

          {specializationEarnings.length > 0 && (
            <div className="summary-card">
              <h3>Total Earnings</h3>
              <p>{formatCurrency(specializationTotals.totalFees)}</p>
              <p style={{fontSize: '1rem', marginTop: '5px'}}>
                MediQuick Revenue: {formatCurrency(specializationTotals.totalRevenue)}
              </p>
            </div>
          )}

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Appointments Count</th>
                  <th>Total Fees</th>
                  <th>MediQuick Revenue (10%)</th>
                </tr>
              </thead>
              <tbody>
                {loading.specializationEarnings ? (
                  <tr>
                    <td colSpan="4" className="loading">Loading specialization earnings...</td>
                  </tr>
                ) : specializationEarnings.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty">Select a specialization to view earnings</td>
                  </tr>
                ) : (
                  specializationEarnings.map((day, index) => (
                    <tr key={index}>
                      <td>{day.date}</td>
                      <td>{day.count}</td>
                      <td>{formatCurrency(day.totalFees)}</td>
                      <td>{formatCurrency(day.totalRevenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Date Range Search Section */}
        <section className="search-section">
          <h2 className="section-title">Search Appointments by Date Range</h2>
          <div className="search-form date-range-form">
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start Date"
            />
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End Date"
            />
            <button 
              className="search-btn" 
              onClick={searchByDateRange}
              disabled={loading.dateRange}
            >
              <i className="fas fa-search"></i> 
              {loading.dateRange ? ' Searching...' : ' Search'}
            </button>
          </div>

          {dateRangeAppointments.length > 0 && (
            <div className="summary-card">
              <h3>Total Earnings for Selected Period</h3>
              <p>{formatCurrency(dateRangeTotals.totalFees)}</p>
              <p style={{fontSize: '1rem', marginTop: '5px'}}>
                MediQuick Revenue: {formatCurrency(dateRangeTotals.totalRevenue)}
              </p>
            </div>
          )}

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Specialization</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Fee</th>
                  <th>MediQuick Revenue (10%)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading.dateRange ? (
                  <tr>
                    <td colSpan="8" className="loading">Loading appointments...</td>
                  </tr>
                ) : dateRangeAppointments.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty">Select date range to view appointments</td>
                  </tr>
                ) : (
                  dateRangeAppointments.map(appt => (
                    <tr key={appt._id}>
                      <td>{appt.patientName}</td>
                      <td>{appt.doctorName}</td>
                      <td>{appt.specialization}</td>
                      <td>{appt.date}</td>
                      <td>{appt.time}</td>
                      <td>{formatCurrency(appt.fee)}</td>
                      <td>{formatCurrency(appt.revenue)}</td>
                      <td>
                        <span className={`status ${appt.status}`}>
                          {appt.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {dateRangeAppointments.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan="5"><strong>Total</strong></td>
                    <td><strong>{formatCurrency(dateRangeTotals.totalFees)}</strong></td>
                    <td><strong>{formatCurrency(dateRangeTotals.totalRevenue)}</strong></td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default AdminSearchData;
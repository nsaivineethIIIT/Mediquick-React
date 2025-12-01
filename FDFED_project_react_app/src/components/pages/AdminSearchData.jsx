import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchAdminAppointments,
  selectAdminAppointments,
  selectUniqueDoctors,
  selectUniqueSpecializations,
  selectDoctorEarnings,
  selectSpecializationEarnings,
  selectAppointmentsByDateRange,
  selectAdminLoading
} from '../../store/slices/adminSlice';
import Footer from '../common/Footer';
import '../../assets/css/AdminSearchData.css';

const AdminSearchData = () => {
  const dispatch = useDispatch();
  
  // Redux state
  const appointments = useSelector(selectAdminAppointments);
  const doctors = useSelector(selectUniqueDoctors);
  const specializations = useSelector(selectUniqueSpecializations);
  const adminLoading = useSelector(selectAdminLoading);
  
  // Local state for selections and filters
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [isNavOpen, setIsNavOpen] = useState(false);
  
  // Compute derived data using Redux selectors
  const doctorEarnings = useSelector(state => selectDoctorEarnings(state, selectedDoctor));
  const specializationEarnings = useSelector(state => selectSpecializationEarnings(state, selectedSpecialization));
  const dateRangeAppointments = useSelector(state => selectAppointmentsByDateRange(state, startDate, endDate));

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

  // Load appointments on component mount (doctors and specializations are derived from appointments)
  useEffect(() => {
    dispatch(fetchAdminAppointments());
  }, [dispatch]);

  // Load available doctors
  // Validation functions (data now comes from Redux selectors)
  const validateDoctorSearch = () => {
    if (!selectedDoctor) {
      alert('Please select a doctor');
      return false;
    }
    return true;
  };

  const validateSpecializationSearch = () => {
    if (!selectedSpecialization) {
      alert('Please select a specialization');
      return false;
    }
    return true;
  };

  const validateDateRange = () => {
    if (!startDate || !endDate) {
      alert('Please select both start date and end date');
      return false;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert('Start date cannot be after end date');
      return false;
    }
    
    return true;
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
              disabled={adminLoading.appointments}
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
              onClick={validateDoctorSearch}
              disabled={adminLoading.appointments}
            >
              <i className="fas fa-search"></i> 
              {adminLoading.appointments ? ' Loading...' : ' Search'}
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
                {adminLoading.appointments ? (
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
              disabled={adminLoading.appointments}
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
              onClick={validateSpecializationSearch}
              disabled={adminLoading.appointments}
            >
              <i className="fas fa-search"></i> 
              {adminLoading.appointments ? ' Loading...' : ' Search'}
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
                {adminLoading.appointments ? (
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
              onClick={validateDateRange}
              disabled={adminLoading.appointments}
            >
              <i className="fas fa-search"></i> 
              {adminLoading.appointments ? ' Loading...' : ' Search'}
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
                {adminLoading.appointments ? (
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
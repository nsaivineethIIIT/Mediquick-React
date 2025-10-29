import React, { useState, useEffect } from 'react';
import '../../assets/css/AdminDashboard.css';
import Footer from '../common/Footer';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('users');
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [filterValue, setFilterValue] = useState('');
  const [signins, setSignins] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [financeData, setFinanceData] = useState([]);
  const [earningsData, setEarningsData] = useState({});
  const [revenueSummary, setRevenueSummary] = useState({});
  const [loading, setLoading] = useState({
    users: true,
    signins: true,
    appointments: true,
    finance: true,
    earnings: true
  });
  const [error, setError] = useState('');
  const [isNavOpen, setIsNavOpen] = useState(false);

  // Check if response is JSON before parsing
  const parseResponse = async (response) => {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      const text = await response.text();
      throw new Error(`Expected JSON but got: ${text.substring(0, 100)}...`);
    }
  };

  // Fetch all data on component mount
  useEffect(() => {
    fetchUsers();
    fetchSignins();
    fetchAppointments();
    fetchFinanceData();
    fetchEarningsData();
    fetchRevenueSummary();
  }, []);

  // Filter users when filters change
  useEffect(() => {
    filterUsers();
  }, [allUsers, userTypeFilter, filterValue]);

  // Handle scroll for header
  useEffect(() => {
    const handleScroll = () => {
      const header = document.querySelector('header');
      if (window.scrollY > 30) {
        header.classList.add('header-active');
      } else {
        header.classList.remove('header-active');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // API Functions with better error handling
  const fetchUsers = async () => {
    try {
      setLoading(prev => ({ ...prev, users: true }));
      setError('');
      
      const response = await fetch('http://localhost:3002/admin/users', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/admin/form?error=login_required';
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await parseResponse(response);
      setAllUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(`Failed to load users: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  };

  const fetchSignins = async () => {
    try {
      setLoading(prev => ({ ...prev, signins: true }));
      setError('');
      
      const response = await fetch('http://localhost:3002/admin/api/signins', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          return; // Already handled by fetchUsers
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await parseResponse(response);
      setSignins(data);
    } catch (error) {
      console.error('Error fetching signins:', error);
      setError(`Failed to load signins: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, signins: false }));
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(prev => ({ ...prev, appointments: true }));
      setError('');
      
      const response = await fetch('http://localhost:3002/admin/api/appointments', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          return; // Already handled by fetchUsers
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await parseResponse(response);
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError(`Failed to load appointments: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, appointments: false }));
    }
  };

  const fetchFinanceData = async () => {
    try {
      setLoading(prev => ({ ...prev, finance: true }));
      setError('');
      
      const response = await fetch('http://localhost:3002/admin/api/finance', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          return; // Already handled by fetchUsers
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await parseResponse(response);
      setFinanceData(data);
    } catch (error) {
      console.error('Error fetching finance data:', error);
      setError(`Failed to load finance data: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, finance: false }));
    }
  };

  const fetchEarningsData = async () => {
    try {
      setLoading(prev => ({ ...prev, earnings: true }));
      setError('');
      
      const response = await fetch('http://localhost:3002/admin/api/earnings', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          return; // Already handled by fetchUsers
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await parseResponse(response);
      setEarningsData(data);
    } catch (error) {
      console.error('Error fetching earnings data:', error);
      setError(`Failed to load earnings data: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, earnings: false }));
    }
  };

  const fetchRevenueSummary = async () => {
    try {
      setError('');
      
      const response = await fetch('http://localhost:3002/admin/api/revenue-summary', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          return; // Already handled by fetchUsers
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await parseResponse(response);
      setRevenueSummary(data);
    } catch (error) {
      console.error('Error fetching revenue summary:', error);
      setError(`Failed to load revenue summary: ${error.message}`);
    }
  };

  // User Management Functions
  const filterUsers = () => {
    let filtered = allUsers;

    if (userTypeFilter !== 'all') {
      filtered = filtered.filter(user => user.type.toLowerCase() === userTypeFilter);
    }

    if (filterValue) {
      filtered = filtered.filter(user => {
        const searchValue = filterValue.toLowerCase();
        switch (user.type.toLowerCase()) {
          case 'patient':
          case 'employee':
          case 'admin':
            return user.email?.toLowerCase().includes(searchValue);
          case 'doctor':
            return user.registrationNumber?.toLowerCase().includes(searchValue);
          case 'supplier':
            return user.supplierID?.toLowerCase().includes(searchValue);
          default:
            return true;
        }
      });
    }

    setFilteredUsers(filtered);
  };

 

  const clearFilters = () => {
    setUserTypeFilter('all');
    setFilterValue('');
  };

  const getFilterPlaceholder = () => {
    switch (userTypeFilter) {
      case 'patient':
      case 'employee':
        return 'Filter by email...';
      case 'doctor':
        return 'Filter by registration number...';
      case 'supplier':
        return 'Filter by supplier ID...';
      default:
        return 'Enter filter value...';
    }
  };

  const getFilterDisplayValue = (user) => {
    switch (user.type.toLowerCase()) {
      case 'patient':
      case 'employee':
      case 'admin':
        return user.email;
      case 'doctor':
        return user.registrationNumber || 'N/A';
      case 'supplier':
        return user.supplierID || 'N/A';
      default:
        return 'N/A';
    }
  };

  // Calculate totals for finance data
  const calculateFinanceTotals = () => {
    const totals = financeData.reduce((acc, transaction) => ({
      totalFees: acc.totalFees + (transaction.fee || 0),
      totalRevenue: acc.totalRevenue + (transaction.revenue || 0)
    }), { totalFees: 0, totalRevenue: 0 });

    return totals;
  };

  const financeTotals = calculateFinanceTotals();

  // Retry all data fetching
  const retryFetchData = () => {
    setError('');
    fetchUsers();
    fetchSignins();
    fetchAppointments();
    fetchFinanceData();
    fetchEarningsData();
    fetchRevenueSummary();
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US');
  };

  // Toggle mobile navigation
  const toggleMobileNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  // Scroll to section
  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    setIsNavOpen(false);
  };

  return (
    <div className="admin-dashboard">
      {/* Custom Header from EJS file */}
      <header>
        <a href="/" className="logo"><span>M</span>edi<span>Q</span>uick</a>
        <nav className={`navbar ${isNavOpen ? 'nav-toggle' : ''}`}>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/about">About Us</a></li>
            <li><a href="/faqs">FAQs</a></li>
            <li><a href="/blogs">Blog</a></li>
            <li><a href="/contact">Contact Us</a></li>
            <li><a href="/logout">LogOut</a></li>
            <li><a href="#appointments" onClick={() => scrollToSection('appointments')}>Appointments</a></li>
            <li><a href="#signins" onClick={() => scrollToSection('signins')}>Recent SignIns</a></li>
            <li><a href="#finance" onClick={() => scrollToSection('finance')}>Finance</a></li>
            <li><a href="#users" onClick={() => scrollToSection('users')}>Manage Users</a></li>
            <Link to="/admin/search-data">Search data</Link>
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

      <div className="dashboard-container">
        {/* Navigation Sidebar */}
        <nav className="dashboard-nav">
          <ul>
            <li>
              <button 
                className={activeSection === 'users' ? 'active' : ''}
                onClick={() => setActiveSection('users')}
              >
                Manage Users
              </button>
            </li>
            <li>
              <button 
                className={activeSection === 'signins' ? 'active' : ''}
                onClick={() => setActiveSection('signins')}
              >
                Recent SignIns
              </button>
            </li>
            <li>
              <button 
                className={activeSection === 'appointments' ? 'active' : ''}
                onClick={() => setActiveSection('appointments')}
              >
                Appointments
              </button>
            </li>
            <li>
              <button 
                className={activeSection === 'finance' ? 'active' : ''}
                onClick={() => setActiveSection('finance')}
              >
                Finance
              </button>
            </li>
            <li>
              <button 
                className={activeSection === 'earnings' ? 'active' : ''}
                onClick={() => setActiveSection('earnings')}
              >
                Earnings Reports
              </button>
            </li>
            <li>
              <a href="/admin/search-data" className="nav-link">
                Search Data
              </a>
            </li>
            <li>
              <a href="/admin/profile" className="nav-link">
                <img 
                  src="https://static.thenounproject.com/png/638636-200.png" 
                  alt="Profile" 
                  className="profile-icon"
                />
                Profile
              </a>
            </li>
            <li>
              <a href="/logout" className="nav-link logout">
                Logout
              </a>
            </li>
          </ul>
        </nav>

        {/* Main Content */}
        <main className="dashboard-content">
          {/* Error Display */}
          {error && (
            <div className="error-banner">
              <p>{error}</p>
              <button onClick={retryFetchData} className="retry-btn">
                Retry
              </button>
              <button onClick={() => window.location.href = '/admin/form'} className="login-btn">
                Go to Login
              </button>
            </div>
          )}

          {/* Users Section */}
          {activeSection === 'users' && (
            <section className="section users-section">
              <h1 className="heading">Manage Users</h1>
              <div className="table-container">
                <div className="filter-container">
                  <select 
                    value={userTypeFilter}
                    onChange={(e) => setUserTypeFilter(e.target.value)}
                  >
                    <option value="all">All Users</option>
                    <option value="patient">Patients</option>
                    <option value="doctor">Doctors</option>
                    <option value="supplier">Suppliers</option>
                    <option value="employee">Employees</option>
                    <option value="admin">Admins</option>
                  </select>
                  <input 
                    type="text"
                    placeholder={getFilterPlaceholder()}
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                  />
                  <button onClick={clearFilters}>Clear Filters</button>
                </div>
                
               
              </div>
            </section>
          )}

          {/* Signins Section */}
          {activeSection === 'signins' && (
            <section className="section signins-section">
              <h1 className="heading">Recent SignIns</h1>
              <div className="table-container">
                <table className="signins-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Email</th>
                      <th>Date</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading.signins ? (
                      <tr>
                        <td colSpan="5" className="loading">Loading data...</td>
                      </tr>
                    ) : signins.length === 0 ? (
                      <tr>
                        <td colSpan="5">No signins found</td>
                      </tr>
                    ) : (
                      signins.map((signin, index) => (
                        <tr key={index}>
                          <td>{signin.name}</td>
                          <td>{signin.type}</td>
                          <td>{signin.email}</td>
                          <td>{signin.date}</td>
                          <td>{signin.time}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Appointments Section */}
          {activeSection === 'appointments' && (
            <section className="section appointments-section">
              <h1 className="heading">Appointments</h1>
              <div className="table-container">
                <table className="appointments-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Doctor</th>
                      <th>Specialization</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Fee</th>
                      <th>Revenue (10%)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading.appointments ? (
                      <tr>
                        <td colSpan="8" className="loading">Loading appointments...</td>
                      </tr>
                    ) : appointments.length === 0 ? (
                      <tr>
                        <td colSpan="8">No appointments found</td>
                      </tr>
                    ) : (
                      appointments.map(appt => (
                        <tr key={appt._id}>
                          <td>{appt.patientName || 'Unknown Patient'}</td>
                          <td>{appt.doctorName || 'Unknown Doctor'}</td>
                          <td>{appt.specialization || 'General Physician'}</td>
                          <td>{formatDate(appt.date)}</td>
                          <td>{appt.time || 'N/A'}</td>
                          <td>{formatCurrency(appt.fee)}</td>
                          <td>{formatCurrency(appt.revenue)}</td>
                          <td>
                            <span className={`status ${appt.status || 'pending'}`}>
                              {appt.status || 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Finance Section */}
          {activeSection === 'finance' && (
            <section className="section finance-section">
              <h1 className="heading">Finance</h1>
              <div className="table-container">
                <div className="finance-summary">
                  <div className="summary-cards">
                    <div className="card">
                      <h3>Total Appointments</h3>
                      <p>{revenueSummary.summary?.totalAppointments || 0}</p>
                    </div>
                    <div className="card">
                      <h3>Total Fees</h3>
                      <p>{formatCurrency(revenueSummary.summary?.totalFees)}</p>
                    </div>
                    <div className="card">
                      <h3>Total Revenue</h3>
                      <p>{formatCurrency(revenueSummary.summary?.totalRevenue)}</p>
                    </div>
                  </div>
                </div>

                <table className="finance-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Doctor</th>
                      <th>Specialization</th>
                      <th>Date</th>
                      <th>Fee</th>
                      <th>Revenue (10%)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading.finance ? (
                      <tr>
                        <td colSpan="7" className="loading">Loading finance data...</td>
                      </tr>
                    ) : financeData.length === 0 ? (
                      <tr>
                        <td colSpan="7">No financial data found</td>
                      </tr>
                    ) : (
                      financeData.map(transaction => (
                        <tr key={transaction._id}>
                          <td>{transaction.patientName || 'Unknown Patient'}</td>
                          <td>{transaction.doctorName || 'Unknown Doctor'}</td>
                          <td>{transaction.specialization || 'General Physician'}</td>
                          <td>{formatDate(transaction.date)}</td>
                          <td>{formatCurrency(transaction.fee)}</td>
                          <td>{formatCurrency(transaction.revenue)}</td>
                          <td>
                            <span className={`status ${transaction.status || 'pending'}`}>
                              {transaction.status || 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="4"><strong>Total</strong></td>
                      <td><strong>{formatCurrency(financeTotals.totalFees)}</strong></td>
                      <td><strong>{formatCurrency(financeTotals.totalRevenue)}</strong></td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
          )}

          {/* Earnings Section */}
          {activeSection === 'earnings' && (
            <section className="section earnings-section">
              <h1 className="heading">Earnings Reports</h1>
              <div className="table-container">
                
                {/* Daily Earnings */}
                <h2>Daily Earnings Summary (Since Jan 2025)</h2>
                <table className="earnings-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Total Appointments</th>
                      <th>Total Fees</th>
                      <th>MediQuick Revenue (10%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading.earnings ? (
                      <tr>
                        <td colSpan="4" className="loading">Loading daily earnings data...</td>
                      </tr>
                    ) : !earningsData.daily || earningsData.daily.length === 0 ? (
                      <tr>
                        <td colSpan="4">No daily earnings data found</td>
                      </tr>
                    ) : (
                      earningsData.daily.map(day => (
                        <tr key={day.date}>
                          <td>{formatDate(day.date)}</td>
                          <td>{day.count || 0}</td>
                          <td>{formatCurrency(day.totalFees)}</td>
                          <td>{formatCurrency(day.totalRevenue)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Monthly Earnings */}
                <h2>Monthly Earnings Summary (Since Jan 2025)</h2>
                <table className="earnings-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Total Appointments</th>
                      <th>Total Fees</th>
                      <th>MediQuick Revenue (10%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading.earnings ? (
                      <tr>
                        <td colSpan="4" className="loading">Loading monthly earnings data...</td>
                      </tr>
                    ) : !earningsData.monthly || earningsData.monthly.length === 0 ? (
                      <tr>
                        <td colSpan="4">No monthly earnings data found</td>
                      </tr>
                    ) : (
                      earningsData.monthly.map(month => (
                        <tr key={month.month}>
                          <td>{month.month}</td>
                          <td>{month.count || 0}</td>
                          <td>{formatCurrency(month.totalFees)}</td>
                          <td>{formatCurrency(month.totalRevenue)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Yearly Earnings */}
                <h2>Yearly Earnings Summary (Since Jan 2025)</h2>
                <table className="earnings-table">
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th>Total Appointments</th>
                      <th>Total Fees</th>
                      <th>MediQuick Revenue (10%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading.earnings ? (
                      <tr>
                        <td colSpan="4" className="loading">Loading yearly earnings data...</td>
                      </tr>
                    ) : !earningsData.yearly || earningsData.yearly.length === 0 ? (
                      <tr>
                        <td colSpan="4">No yearly earnings data found</td>
                      </tr>
                    ) : (
                      earningsData.yearly.map(year => (
                        <tr key={year.year}>
                          <td>{year.year}</td>
                          <td>{year.count || 0}</td>
                          <td>{formatCurrency(year.totalFees)}</td>
                          <td>{formatCurrency(year.totalRevenue)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Specialization Earnings */}
                <h2>Earnings by Doctor Specialization</h2>
                <table className="earnings-table">
                  <thead>
                    <tr>
                      <th>Specialization</th>
                      <th>Total Appointments</th>
                      <th>Total Fees</th>
                      <th>MediQuick Revenue (10%)</th>
                      <th>Average Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading.earnings ? (
                      <tr>
                        <td colSpan="5" className="loading">Loading specialization data...</td>
                      </tr>
                    ) : !revenueSummary.bySpecialization || revenueSummary.bySpecialization.length === 0 ? (
                      <tr>
                        <td colSpan="5">No specialization data found</td>
                      </tr>
                    ) : (
                      revenueSummary.bySpecialization.map(spec => {
                        const avgFee = spec.count > 0 ? spec.totalFees / spec.count : 0;
                        return (
                          <tr key={spec.specialization}>
                            <td>{spec.specialization}</td>
                            <td>{spec.count}</td>
                            <td>{formatCurrency(spec.totalFees)}</td>
                            <td>{formatCurrency(spec.totalRevenue)}</td>
                            <td>{formatCurrency(avgFee)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>

                {/* Overall Revenue Summary */}
                <h2>Overall Revenue Summary</h2>
                <div className="revenue-overview">
                  <div className="revenue-cards">
                    <div className="revenue-card">
                      <h3>Total Appointments</h3>
                      <p className="revenue-number">{revenueSummary.summary?.totalAppointments || 0}</p>
                    </div>
                    <div className="revenue-card">
                      <h3>Total Consultation Fees</h3>
                      <p className="revenue-number">{formatCurrency(revenueSummary.summary?.totalFees)}</p>
                    </div>
                    <div className="revenue-card">
                      <h3>Platform Revenue (10%)</h3>
                      <p className="revenue-number highlight">{formatCurrency(revenueSummary.summary?.totalRevenue)}</p>
                    </div>
                  </div>
                </div>

              </div>
            </section>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
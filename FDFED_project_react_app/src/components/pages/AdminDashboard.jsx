import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import '../../assets/css/AdminDashboard.css';
// import Footer from '../common/Footer';
import { Link, useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { 
  fetchAdminAppointments, 
  fetchAdminFinance, 
  fetchAdminEarnings, 
  fetchAdminRevenueSummary,
  selectAdminAppointments,
  selectAdminFinance,
  selectAdminEarnings,
  selectAdminRevenueSummary,
  selectAdminLoading,
  selectAdminErrors
} from '../../store/slices/adminSlice';
const AdminDashboard = () => {
  const { admin } = useAdmin();
  const dispatch = useDispatch();
  
  // Redux state for appointment/financial sections
  const appointments = useSelector(selectAdminAppointments);
  const financeData = useSelector(selectAdminFinance);
  const earningsData = useSelector(selectAdminEarnings);
  const revenueSummary = useSelector(selectAdminRevenueSummary);
  const adminLoading = useSelector(selectAdminLoading);
  const adminErrors = useSelector(selectAdminErrors);
  
  // Local state for other sections
  const [activeSection, setActiveSection] = useState('users');
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [filterValue, setFilterValue] = useState('');
  const [signins, setSignins] = useState([]);
  const [medicineOrders, setMedicineOrders] = useState([]);
  const [medicineFinance, setMedicineFinance] = useState({ rows: [], totals: { totalAmount: 0, totalCommission: 0 } }); 
  const [loading, setLoading] = useState({
    users: true,
    signins: true,
    medicineOrders: true,
    medicineFinance: true, 
  });
  const [error, setError] = useState('');
  const [isNavOpen, setIsNavOpen] = useState(false);
  const navigate = useNavigate();
  const BASE_URL = 'http://localhost:3002';

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

  // Fetch Redux data on component mount
  useEffect(() => {
    dispatch(fetchAdminAppointments());
    dispatch(fetchAdminFinance());
    dispatch(fetchAdminEarnings());
    dispatch(fetchAdminRevenueSummary());
  }, [dispatch]);

  // Fetch all data on component mount
  useEffect(() => {
    // Fetch local state data
    fetchUsers();
    fetchSignins();
    fetchMedicineFinanceData();
    fetchMedicineOrders(); 
  }, []);

  // Filter users when filters change
  useEffect(() => {
    filterUsers();
  }, [allUsers, userTypeFilter, filterValue]);

  // Header scroll handler removed since header is not present

  // API Functions with better error handling
  const fetchUsers = async () => {
    try {
      setLoading(prev => ({ ...prev, users: true }));
      setError('');
      
      const response = await fetch(`${BASE_URL}/admin/users`, {
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
      
      const response = await fetch(`${BASE_URL}/admin/api/signins`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          return;
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

  // Redux now handles fetching appointments, finance, earnings, and revenue summary

  // Fetch Medicine Orders
  const fetchMedicineOrders = async () => {
    try {
      setLoading(prev => ({ ...prev, medicineOrders: true }));
      setError('');
      
      const response = await fetch(`${BASE_URL}/admin/api/medicine-orders`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await parseResponse(response);
      // Extract the data array from the response
      const ordersData = responseData.data || [];
      setMedicineOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (error) {
      console.error('Error fetching medicine orders:', error);
      setError(`Failed to load medicine orders: ${error.message}`);
      setMedicineOrders([]); // Reset to empty array on error
    } finally {
      setLoading(prev => ({ ...prev, medicineOrders: false }));
    }
  };

  // NEW: Fetch Medicine Finance Data
  const fetchMedicineFinanceData = async () => {
    setLoading(prev => ({ ...prev, medicineFinance: true }));
    try {
      const response = await fetch(`${BASE_URL}/admin/api/medicine-finance`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await parseResponse(response);
      // Ensure proper structure for medicine finance data
      const financeData = data || { rows: [], totals: { totalAmount: 0, totalCommission: 0 } };
      setMedicineFinance(financeData);
    } catch (error) {
      console.error('Error fetching medicine finance data:', error);
      setMedicineFinance({ rows: [], totals: { totalAmount: 0, totalCommission: 0 } }); // Reset on error
    } finally {
      setLoading(prev => ({ ...prev, medicineFinance: false }));
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

  const deleteUser = async (type, id) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/admin/users/${type}/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await parseResponse(response);

      if (response.ok) {
        alert(result.message);
        await fetchUsers(); // Refresh users list
      } else {
        alert(result.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. Please try again.');
    }
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
    fetchMedicineFinanceData();
    fetchMedicineOrders();
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // Format currency (INR) for Medicine Finance
  const formatCurrencyINR = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
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
      {/* Header removed to avoid duplicate header */}

      <div className="dashboard-container">
        {/* Navigation Sidebar */}
        <nav className="dashboard-nav">
          <ul>
            <li>
              <Link to="/" className="nav-link home-link">
                🏠 Home
              </Link>
            </li>
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
                Appointment Finance
              </button>
            </li>
             <li>
              <button 
                className={activeSection === 'medicine-finance' ? 'active' : ''}
                onClick={() => setActiveSection('medicine-finance')}
              >
                Medicine Finance
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
              <button 
                className={activeSection === 'medicineOrders' ? 'active' : ''}
                onClick={() => setActiveSection('medicineOrders')}
              >
                Medicine Orders
              </button>
            </li>
            <li>
              <Link to="/admin/search-data" className="nav-link">
                Search Data
              </Link>
            </li>
            <li>
              <Link to="/admin/profile" className="nav-link">
                <img 
                  src="https://static.thenounproject.com/png/638636-200.png" 
                  alt="Profile" 
                  className="profile-icon"
                />
                Profile
              </Link>
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
              <button onClick={() => navigate('/admin/form')} className="login-btn">
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
                
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Filter Value</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading.users ? (
                      <tr>
                        <td colSpan="4" className="loading">Loading data...</td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="4">No users found</td>
                      </tr>
                    ) : (
                      filteredUsers.map(user => (
                        <tr key={`${user.type}-${user._id}`}>
                          <td>{user.name}</td>
                          <td>{user.type}</td>
                          <td>{getFilterDisplayValue(user)}</td>
                          <td>
                            <button 
                              className="delete-btn"
                              onClick={() => deleteUser(user.type, user._id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
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
                    {adminLoading.appointments ? (
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

          {/* Appointment Finance Section */}
          {activeSection === 'finance' && (
            <section className="section finance-section">
              <h1 className="heading">Appointment Finance</h1>
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
                    {adminLoading.finance ? (
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
          
          {/* Medicine Orders Finance Section */}
          {activeSection === 'medicine-finance' && (
            <section className="section finance-section">
              <h1 className="heading">Medicine Orders Finance (5% Commission)</h1>
              <div className="table-container">
                <table className="finance-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Medicine</th>
                      <th>Supplier</th>
                      <th>Date</th>
                      <th>Total Amount (₹)</th>
                      <th>MediQuick Commission (5%) (₹)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading.medicineFinance ? (
                      <tr>
                        <td colSpan="7" className="loading">Loading medicine finance data...</td>
                      </tr>
                    ) : medicineFinance.rows.length === 0 ? (
                      <tr>
                        <td colSpan="7">No confirmed medicine orders found</td>
                      </tr>
                    ) : (
                      medicineFinance.rows.map(row => (
                        <tr key={row._id}>
                          <td>{row.patientName}</td>
                          <td>{row.medicineName}</td>
                          <td>{row.supplierName}</td>
                          <td>{row.date}</td>
                          <td>{formatCurrencyINR(row.totalAmount)}</td>
                          <td>{formatCurrencyINR(row.mediQuickCommission)}</td>
                          <td>
                            <span className={`status ${row.status}`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="4"><strong>Totals</strong></td>
                      <td><strong>{formatCurrencyINR(medicineFinance.totals.totalAmount)}</strong></td>
                      <td><strong>{formatCurrencyINR(medicineFinance.totals.totalCommission)}</strong></td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
          )}

          {/* Medicine Orders Section */}
          {activeSection === 'medicineOrders' && (
            <section className="section orders-section">
              <h1 className="heading">Medicine Orders</h1>
              <div className="table-container">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Patient</th>
                      <th>Medicine</th>
                      <th>Supplier</th>
                      <th>Date</th>
                      <th>Total Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading.medicineOrders ? (
                      <tr>
                        <td colSpan="7" className="loading">Loading orders...</td>
                      </tr>
                    ) : (!Array.isArray(medicineOrders) || medicineOrders.length === 0) ? (
                      <tr>
                        <td colSpan="7">No medicine orders found</td>
                      </tr>
                    ) : (
                      (Array.isArray(medicineOrders) ? medicineOrders : []).map(order => (
                        <tr key={order._id}>
                          <td>{order.orderId}</td>
                          <td>{order.patientName || 'Unknown Patient'}</td>
                          <td>{order.medicineName}</td>
                          <td>{order.supplierName || 'Unknown Supplier'}</td>
                          <td>{formatDate(order.date)}</td>
                          <td>{formatCurrencyINR(order.totalAmount)}</td>
                          <td>
                            <span className={`status ${order.status || 'pending'}`}>
                              {order.status || 'Pending'}
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
                    {adminLoading.earnings ? (
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
                    {adminLoading.earnings ? (
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
                    {adminLoading.earnings ? (
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
                    {adminLoading.earnings ? (
                      <tr>
                        <td colSpan="4" className="loading">Loading specialization data...</td>
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

      {/* Footer removed to avoid duplicate footer */}
    </div>
  );
};

export default AdminDashboard;
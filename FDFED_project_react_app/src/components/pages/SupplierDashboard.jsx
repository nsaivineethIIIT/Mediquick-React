import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { showMessage } from '../../utils/alerts';
import '../../assets/css/SupplierDashboard.css';

const BASE_URL = 'http://localhost:3002';

const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
        case 'pending': return 'status-pending';
        case 'confirmed': return 'status-confirmed';
        case 'shipped': return 'status-shipped';
        case 'delivered': return 'status-delivered';
        case 'cancelled': return 'status-cancelled'; 
        case 'in_cart': return 'status-in_cart'; 
        default: return 'status-pending';
    }
};

const getStatusDisplayText = (status) => {
    switch (status?.toLowerCase()) {
        case 'in_cart': return 'In Cart';
        default: return status?.charAt(0).toUpperCase() + status?.slice(1) || 'N/A';
    }
};

const SupplierDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [stats, setStats] = useState({ totalMedicines: 0, pendingOrders: 0, totalRevenue: 0, cartItems: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(''); // Keep error state for API calls
    const [activeOrderFilter, setActiveOrderFilter] = useState('all'); // Keep for order filtering
    const [newMedicine, setNewMedicine] = useState({
        name: '',
        description: '',
        price: '',
        quantity: '',
        image: null
    });
    const navigate = useNavigate();
    const fetchConfig = { credentials: 'include' };

    useEffect(() => {
        Promise.all([fetchMedicines(true), fetchOrders(true)]) // Initial fetch
            .then(() => setLoading(false))
            .catch((err) => {
                setLoading(false);
                if (err.message.includes('Unauthorized')) navigate('/supplier/form');
            });

        const interval = setInterval(() => { // Polling for updates
            fetchOrders(false); 
            fetchDashboardStats();
        }, 30000); 

        return () => clearInterval(interval);
    }, []);

    const fetchOrders = async (initialLoad = false) => {
        if (initialLoad) setError('');
        try {
            const response = await fetch(`${BASE_URL}/supplier/api/orders`, fetchConfig);
            if (!response.ok) throw new Error('Unauthorized or failed to fetch orders');
            const data = await response.json();
            setOrders(data);
            if (initialLoad) fetchDashboardStats(data);
        } catch (err) {
            console.error('Error fetching orders:', err);
            if (initialLoad) setError('Failed to load orders.');
        }
    };

    const fetchMedicines = async (initialLoad = false) => {
        if (initialLoad) setError('');
        try {
            const response = await fetch(`${BASE_URL}/supplier/api/medicines`, fetchConfig);
            if (!response.ok) throw new Error('Unauthorized or failed to fetch medicines');
            const data = await response.json();
            setMedicines(data);
            if (initialLoad) {
                setStats(prev => ({ ...prev, totalMedicines: data.length }));
            }
            return data;
        } catch (err) {
            console.error('Error fetching medicines:', err);
            if (initialLoad) setError('Failed to load medicines.');
            throw err;
        }
    };

    const fetchDashboardStats = (currentOrders) => {
        const orderList = Array.isArray(currentOrders) ? currentOrders : orders;
        
        const pendingOrders = orderList.filter(
            (order) => order.status === "pending" || order.status === "confirmed"
        ).length;

        const cartItems = orderList.filter(
            (order) => order.status === "in_cart"
        ).length;

        const totalRevenue = orderList
            .filter((order) => order.status === "delivered")
            .reduce((sum, order) => sum + (order.totalCost || 0), 0);

        setStats(prev => ({ 
            ...prev,
            pendingOrders,
            cartItems,
            totalRevenue
        }));
    }

    const addMedicine = async (event) => {
        event.preventDefault();
        const form = event.target;
        const formData = {
            name: form.medicineName.value.trim(),
            medicineID: form.medicineID.value.trim(),
            quantity: parseInt(form.quantity.value),
            cost: parseFloat(form.cost.value),
            manufacturer: form.manufacturer.value.trim(),
            expiryDate: form.expiryDate.value,
        };

        const expiryDate = new Date(formData.expiryDate);
        const today = new Date();
        if (expiryDate <= today) {
            showMessage("Expiry date must be in the future", "error");
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/supplier/api/add-medicine`, { 
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok) {
                showMessage(data.message || 'Medicine added successfully!', 'success');
                form.reset();
                fetchMedicines(true);
                fetchDashboardStats();
            } else {
                showMessage(`${data.error}: ${data.details || ''}`, "error");
            }
        } catch (xhr) {
            showMessage("Failed to add medicine", "error");
        }
    };

    const removeMedicine = async (medicineId) => {
        if (!window.confirm("Are you sure you want to remove this medicine?")) {
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/supplier/api/medicines/${medicineId}`, { method: "DELETE", credentials: 'include' }); 
            const data = await response.json();

            if (response.ok) {
                showMessage(data.message || 'Medicine removed successfully', 'success');
                fetchMedicines(true);
                fetchDashboardStats();
            } else {
                showMessage(data.error || "Failed to remove medicine", "error");
            }
        } catch (xhr) {
            showMessage("Failed to remove medicine. Try again.", "error");
        }
    };

    const updateOrderStatus = async (orderId, status) => {
        if (!window.confirm(`Are you sure you want to update order status to ${status}?`)) {
            return;
        }
        
        // Simple visual feedback (buttons disabled)
        const row = document.querySelector(`tr[data-id="${orderId}"]`);
        const buttons = row.querySelectorAll('.action-btn');
        buttons.forEach(btn => btn.disabled = true);

        try {
            const response = await fetch(`${BASE_URL}/supplier/api/orders/${orderId}/status`, { 
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: status }),
                credentials: 'include'
            });

            if (response.ok) {
                showMessage("Order status updated successfully", 'success');
                fetchOrders(true);
                fetchDashboardStats();
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update order status');
            }
        } catch (error) {
            showMessage(error.message, "error");
        } finally {
            buttons.forEach(btn => btn.disabled = false);
        }
    };

    const viewOrderDetails = (orderId) => {
        navigate(`/supplier/orders/${orderId}`);
    };

    const getMedicineIncome = (medicineID) => {
        const deliveredOrders = orders.filter(o => o.status === 'delivered');
        return deliveredOrders.reduce((sum, order) => {
            if (order.medicineId === medicineID) {
                return sum + (order.totalCost || 0);
            }
            return sum;
        }, 0);
    };
    
    const filteredOrdersList = activeOrderFilter === 'all' 
        ? orders 
        : orders.filter(o => o.status === activeOrderFilter);

    if (loading) return <div style={{paddingTop: '80px', textAlign: 'center'}}>Loading Supplier Dashboard...</div>;

    return (
        <div className="supplier-dashboard">
            <header className="dashboard-header"> {/* Keep this header as it's supplier-specific */}
                <Link to="/" className="logo"><span>M</span>edi<span>Q</span>uick</Link>
                <nav className={`navbar`}> {/* Removed isNavOpen and toggleNav as they are no longer used */}
                    <ul>
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/supplier/profile">Profile</Link></li>
                        <li><a href="/logout">Logout</a></li>
                    </ul>
                </nav>
                {/* Removed fas fa-bars as toggleNav is no longer used */}
            </header>

            {/* Removed the <main className="dashboard-content"> block (the tabbed interface) */}
            {/* as the second block appears to be the more complete and functional implementation. */}

            <div className="dashboard" style={{ paddingTop: '100px', fontSize: '1.5rem' }}>
                <div className="nav-links" style={{display: 'flex', justifyContent: 'center', backgroundColor: '#444d53', padding: '10px'}}>
                    <a href="#medicine-list" style={{margin: '0 10px', color: 'white', backgroundColor: '#0188df', padding: '10px 20px', borderRadius: '5px'}}>Medicine List</a>
                    <a href="#add-medicine" style={{margin: '0 10px', color: 'white', backgroundColor: '#0188df', padding: '10px 20px', borderRadius: '5px'}}>Add New Medicine</a>
                    <a href="#orders-list" style={{margin: '0 10px', color: 'white', backgroundColor: '#0188df', padding: '10px 20px', borderRadius: '5px'}}>Orders & Cart Items</a>
                </div>
                <div className="main-content" style={{padding: '20px', backgroundColor: 'white'}}>
                    
                    {/* Dashboard Stats */}
                    <div className="dashboard-stats" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
                        <StatCard title="Total Medicines" value={stats.totalMedicines} id="totalMedicines" />
                        <StatCard title="Pending/Confirmed Orders" value={stats.pendingOrders} id="pendingOrders" />
                        <StatCard title="Total Revenue (Delivered)" value={`₹${stats.totalRevenue.toFixed(2)}`} id="totalRevenue" />
                        <StatCard title="Items in Carts" value={stats.cartItems} id="cartItems" />
                    </div>

                    {/* Medicine List */}
                    <div id="medicine-list" className="medicine-list">
                        <h2>Available Medicines</h2>
                        <table className="data-table">
                            <thead>
                                <tr style={{backgroundColor: '#0188df', color: 'white'}}>
                                    <th>Name</th>
                                    <th>ID</th>
                                    <th>Quantity</th>
                                    <th>Cost (₹)</th>
                                    <th>Manufacturer</th>
                                    <th>Expiry Date</th>
                                    <th>Total Income (₹)</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="medicineTableBody">
                                {medicines.length === 0 ? 
                                    <tr><td colSpan="8">No medicines found</td></tr> : 
                                    medicines.map(med => (
                                        <tr key={med.id}>
                                            <td>{med.name}</td>
                                            <td>{med.medicineID}</td>
                                            <td>{med.quantity}</td>
                                            <td>₹{med.cost}</td>
                                            <td>{med.manufacturer}</td>
                                            <td>{med.expiryDate}</td>
                                            <td>₹{getMedicineIncome(med.medicineID).toFixed(2)}</td>
                                            <td>
                                                <button className="remove-btn" onClick={() => removeMedicine(med.id)} style={{backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px'}}>Remove</button>
                                            </td>
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Add New Medicine Form */}
                    <div id="add-medicine" className="add-medicine-form" style={{marginTop: '20px'}}>
                        <h2>Add New Medicine</h2>
                        <form onSubmit={addMedicine} id="addMedicineForm" encType="multipart/form-data">
                            <FormGroup label="Medicine Name" name="medicineName" type="text" required />
                            <FormGroup label="Medicine ID" name="medicineID" type="text" required />
                            <FormGroup label="Quantity" name="quantity" type="number" min="0" required />
                            <FormGroup label="Cost per unit (₹)" name="cost" type="number" min="0" step="0.01" required />
                            <FormGroup label="Manufacturer" name="manufacturer" type="text" required />
                            <FormGroup label="Expiry Date" name="expiryDate" type="date" required />
                            <div className="form-group">
                                <label htmlFor="image" style={{display: 'block', marginBottom: '5px'}}>Medicine Image</label>
                                <input type="file" id="image" name="image" accept="image/*" style={{padding: '8px', border: '1px solid #ccc', borderRadius: '5px'}}/>
                            </div>
                            <button type="submit" className="button" style={{padding: '10px 20px', backgroundColor: '#0188df', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '10px'}}>Add Medicine</button>
                        </form>
                    </div>

                    {/* Orders & Cart Items List */}
                    <div className="orders-list" id="orders-list" style={{margin: '2rem 0'}}>
                        <h2>Orders & Cart Items</h2>
                        <div className="order-filters" style={{marginBottom: '15px'}}>
                            {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'in_cart'].map(filter => (
                                <button 
                                    key={filter} 
                                    className={`filter-btn ${activeOrderFilter === filter ? 'active' : ''}`}
                                    data-filter={filter}
                                    onClick={() => setActiveOrderFilter(filter)}
                                    style={{padding: '8px 12px', margin: '4px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', backgroundColor: activeOrderFilter === filter ? '#0188df' : 'white', color: activeOrderFilter === filter ? 'white' : '#444d53'}}
                                >
                                    {getStatusDisplayText(filter)}
                                </button>
                            ))}
                        </div>
                        <table className="data-table orders-table">
                            <thead>
                                <tr style={{backgroundColor: '#0188df', color: 'white'}}>
                                    <th>Order ID</th>
                                    <th>Medicine</th>
                                    <th>Patient</th>
                                    <th>Quantity</th>
                                    <th>Total Cost</th>
                                    <th>Status</th>
                                    <th>Order Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="ordersTableBody">
                                {filteredOrdersList.length === 0 ? 
                                    <tr><td colSpan="8" style={{textAlign: 'center'}}>No orders found matching filter</td></tr> : 
                                    filteredOrdersList.map(order => (
                                        <tr key={order.id} data-id={order.id} data-status={order.status}>
                                            <td>{order.status === 'in_cart' ? 'CART-' : 'ORD-'}{order.id.toString().substring(0, 8)}</td>
                                            <td>{order.medicine || "Unknown"} ({order.medicineId || "N/A"})</td>
                                            <td>{order.patient || "Unknown"}</td>
                                            <td>{order.quantity || 0}</td>
                                            <td>₹{order.totalCost?.toFixed(2) || "0.00"}</td>
                                            <td><span className={`status-badge ${getStatusBadgeClass(order.status)}`}>{getStatusDisplayText(order.status)}</span></td>
                                            <td>{order.orderDate || "N/A"}</td>
                                            <td>
                                                <button className="action-btn btn-view" onClick={() => viewOrderDetails(order.id)} style={{padding: '8px 12px', borderRadius: '4px', backgroundColor: '#0188df', color: 'white', border: 'none'}}>View</button>
                                                
                                                {order.status === 'confirmed' && (
                                                    <button className="action-btn btn-ship" onClick={() => updateOrderStatus(order.id, 'shipped')} style={{padding: '8px 12px', borderRadius: '4px', backgroundColor: '#ffc107', color: 'black', border: 'none', marginLeft: '5px'}}>Ship</button>
                                                )}
                                                {order.status === 'shipped' && (
                                                    <button className="action-btn btn-deliver" onClick={() => updateOrderStatus(order.id, 'delivered')} style={{padding: '8px 12px', borderRadius: '4px', backgroundColor: '#28a745', color: 'white', border: 'none', marginLeft: '5px'}}>Deliver</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, id }) => (
    <div className="stat-card" style={{ background: 'white', padding: '2rem', borderRadius: '0.8rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', flex: 1, textAlign: 'center' }}>
        <h3 style={{fontSize: '1.6rem', marginBottom: '1rem'}}>{title}</h3>
        <p className="value" id={id} style={{fontSize: '2.4rem', fontWeight: 600, color: '#0188df'}}>{value}</p>
    </div>
);

const FormGroup = ({ label, name, type, ...props }) => (
    <div className="form-group" style={{marginBottom: '15px'}}>
        <label htmlFor={name} style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>{label}</label>
        <input type={type} id={name} name={name} style={{width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '5px'}} {...props} />
    </div>
);


export default SupplierDashboard;
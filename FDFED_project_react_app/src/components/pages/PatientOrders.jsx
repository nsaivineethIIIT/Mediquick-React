import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MedicineHeader from '../common/MedicineHeader';
import '../../assets/css/PatientOrders.css';

const PatientOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:3002/patient/api/orders', {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch orders');
            }

            const data = await response.json();
            if (data.success) {
                setOrders(data.orders);
            } else {
                throw new Error(data.message || 'Failed to fetch orders');
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'status-pending';
            case 'processing': return 'status-processing';
            case 'shipped': return 'status-shipped';
            case 'delivered': return 'status-delivered';
            case 'cancelled': return 'status-cancelled';
            default: return 'status-pending';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <>
                <MedicineHeader />
                <div className="orders-container" style={{ paddingTop: '80px' }}>
                    <div className="loading">
                        <div className="loading-spinner"></div>
                        <p>Loading your orders...</p>
                    </div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <div className="orders-container" style={{ paddingTop: '80px' }}>
                <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i>
                    <h3>Error Loading Orders</h3>
                    <p>{error}</p>
                    <button onClick={fetchOrders} className="retry-btn">
                        <i className="fas fa-redo"></i> Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="patient-orders-page">
            <MedicineHeader />
            <div className="orders-container" style={{ paddingTop: '80px' }}>
                <h1 className="orders-title">My Orders</h1>

                {orders.length === 0 ? (
                    <div className="no-orders">
                        <i className="fas fa-shopping-bag"></i>
                        <h3>No Orders Found</h3>
                        <p>You haven't placed any orders yet.</p>
                        <Link to="/patient/order-medicines" className="shop-now-btn">
                            Shop Now
                        </Link>
                    </div>
                ) : (
                    <div className="orders-list">
                        {orders.map(order => (
                            <div key={order.id} className="order-card">
                                <div className="order-header">
                                    <div className="order-info">
                                        <h3>Order #{order.id.substring(0, 8)}</h3>
                                        <p className="order-date">
                                            <i className="far fa-calendar"></i>
                                            {formatDate(order.orderDate)}
                                        </p>
                                    </div>
                                    <div className={`order-status ${getStatusBadgeClass(order.status)}`}>
                                        {order.status}
                                    </div>
                                </div>

                                <div className="order-items">
                                    <div className="order-item">
                                        <div className="item-info">
                                            <h4>{order.medicineName}</h4>
                                            <p className="item-details">
                                                Quantity: {order.quantity}
                                            </p>
                                        </div>
                                        <div className="item-total">
                                            ₹{order.totalCost.toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                <div className="order-footer">
                                    <div className="order-total">
                                        <strong>Total Amount:</strong>
                                        <span>₹{order.totalCost.toFixed(2)}</span>
                                    </div>
                                    <div className="order-actions">
                                        <Link 
                                            to={`/patient/orders/${order.id}`}
                                            className="view-details-btn"
                                        >
                                            View Details
                                        </Link>
                                        {order.status === 'pending' && (
                                            <button 
                                                onClick={() => handleCancelOrder(order.id)}
                                                className="cancel-btn"
                                            >
                                                Cancel Order
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientOrders;
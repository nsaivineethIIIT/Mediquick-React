import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import MedicineHeader from '../common/MedicineHeader';
import { showMessage, getToastClass } from '../../utils/alerts';

const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
        case 'pending': return 'status-pending';
        case 'confirmed': return 'status-confirmed';
        case 'shipped': return 'status-shipped';
        case 'delivered': return 'status-delivered';
        case 'cancelled': return 'status-cancelled';
        default: return '';
    }
};

const OrderDetails = () => {
    const [orderDetails, setOrderDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const { id: orderId } = useParams(); 
    const navigate = useNavigate();
    const fetchConfig = { credentials: 'include' };
    
    useEffect(() => {
        if (orderId) {
            fetchPlacedOrder(orderId);
        } else {
            fetchSessionOrder();
        }
    }, [orderId]);

    const fetchSessionOrder = async () => {
        setLoading(true);
        try {
            // Fetch session order details (pre-payment review)
            const response = await fetch('/patient/api/session-order-details', fetchConfig); 
            
            if (response.status === 404) {
                 navigate('/patient/order-medicines');
                 return;
            }

            const data = await response.json();
            
            if (data.orderDetails) {
                setOrderDetails(data.orderDetails);
            } else {
                 throw new Error('No pending order found. Please checkout again.');
            }

        } catch (err) {
            console.error('Error fetching session order details:', err);
            navigate('/patient/order-medicines');
            showMessage('Failed to load order. Continue shopping.', getToastClass('danger'));
        } finally {
            setLoading(false);
        }
    };
    
    const fetchPlacedOrder = async (id) => {
         setLoading(true);
        try {
            // Fetch placed order details (post-payment review)
            const response = await fetch(`/patient/orders/${id}`, fetchConfig);
            if (!response.ok) throw new Error('Order not found or access denied.');
            
            const data = await response.json(); 
            setOrderDetails({
                 ...data.orderDetails, 
                 status: data.orderDetails.status, 
                 isPlaced: true 
            });
        } catch (err) {
             console.error('Error fetching placed order details:', err);
             navigate('/patient/orders');
             showMessage('Failed to load placed order details.', getToastClass('danger'));
        } finally {
            setLoading(false);
        }
    };

    const proceedToPayment = () => {
        navigate('/patient/payment');
    };

    if (loading) return <div style={{paddingTop: '80px', textAlign: 'center'}}>Loading...</div>;
    if (!orderDetails) return <div style={{paddingTop: '80px', textAlign: 'center'}}>Order details unavailable.</div>;

    const isPlacedOrder = !!orderDetails.status; 

    return (
        <>
            <MedicineHeader />
            <div className="order-details-section" style={{ paddingTop: '100px' }}>
                <div className="container order-container">
                    <div className="order-header">
                        <h2><i className="fas fa-shopping-bag me-2"></i>Order Summary</h2>
                        <p className="text-muted">Review your order details</p>
                        {isPlacedOrder && (
                            <div className="status-container">
                                <span className={`status-badge ${getStatusBadgeClass(orderDetails.status)}`}>
                                    <i className="fas fa-circle me-2"></i>{orderDetails.status.toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="order-card">
                        <h4 className="section-title">Order Items</h4>
                        <div className="order-items-container">
                            {orderDetails.items?.map((item, index) => (
                                <div key={index} className="order-item">
                                    <div className="order-item-info">
                                        {item.medicine?.image && (
                                            <div className="medicine-image">
                                                <img src={`/uploads/medicines/${item.medicine.image}`} alt={item.medicineName} />
                                            </div>
                                        )}
                                        <div className="medicine-details">
                                            <h6>{item.medicineName}</h6>
                                            <small>Quantity: {item.quantity}</small>
                                        </div>
                                    </div>
                                    <div className="text-end">
                                        <div className="unit-price">₹{item.unitPrice.toFixed(2)} × {item.quantity}</div>
                                        <strong className="total-price">₹{item.total.toFixed(2)}</strong>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="order-card">
                        <h4 className="mb-3">Delivery Address</h4>
                        <div className="row">
                            <div className="col-12">
                                <p className="mb-1">{orderDetails.deliveryAddress.street}</p>
                                <p className="mb-1">{orderDetails.deliveryAddress.city}, {orderDetails.deliveryAddress.state}</p>
                                <p className="mb-1">{orderDetails.deliveryAddress.zip}</p>
                                <p className="mb-0">{orderDetails.deliveryAddress.country}</p>
                            </div>
                        </div>
                    </div>

                    <div className="order-card">
                        <h4 className="mb-3">Price Details</h4>
                        <div className="price-breakdown">
                            <div className="d-flex justify-content-between mb-2">
                                <span>Subtotal:</span>
                                <span>₹{orderDetails.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Delivery Charges:</span>
                                <span>₹{orderDetails.deliveryCharge.toFixed(2)}</span>
                            </div>
                            <hr/>
                            <div className="d-flex justify-content-between total-amount">
                                <span>Total Amount:</span>
                                <span>₹{orderDetails.finalTotal.toFixed(2)}</span>
                            </div>
                        </div>
                        {isPlacedOrder && (
                            <div className="mt-3">
                                <p><strong>Payment Method:</strong> {orderDetails.paymentMethod?.toUpperCase()}</p>
                            </div>
                        )}
                    </div>

                    {!isPlacedOrder && (
                        <div className="text-center mt-4">
                            <button className="btn btn-payment" onClick={proceedToPayment} style={{background: '#27ae60', color: 'white', padding: '12px 30px', border: 'none', borderRadius: '8px'}}>
                                <i className="fas fa-credit-card me-2"></i>Proceed to Payment
                            </button>
                            <Link to="/patient/order-medicines" className="btn btn-outline-secondary ms-2">Cancel Order</Link>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default OrderDetails;
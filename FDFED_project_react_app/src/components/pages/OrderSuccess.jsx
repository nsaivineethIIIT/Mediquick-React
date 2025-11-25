import React, { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import MedicineHeader from '../common/MedicineHeader';

const OrderSuccess = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const paymentMethod = searchParams.get('paymentMethod') || 'cod';
    
    useEffect(() => {
        if (window.updateCartCount) window.updateCartCount();
    }, []);

    return (
        <>
            <MedicineHeader />
            <div className="container success-container" style={{ paddingTop: '80px' }}>
                <div className="success-icon">
                    <i className="fas fa-check-circle"></i>
                </div>
                
                <h2 className="text-success mb-3">Order Placed Successfully!</h2>
                
                <p className="lead mb-4">
                    Thank you for your order. Your medicines will be delivered to your address shortly.
                </p>
                
                <div className="alert alert-success mb-4">
                    <i className="fas fa-check-circle me-2"></i>
                    <strong>Order Status:</strong> 
                    {paymentMethod === 'cod' ? (
                        'Order Placed Successfully - Cash on Delivery'
                    ) : (
                        'Order Placed Successfully - Payment Completed'
                    )}
                </div>

                <div className="row mb-4">
                    <div className="col-md-6">
                        <div className="card">
                            <div className="card-body">
                                <h6><i className="fas fa-shipping-fast me-2"></i>Delivery</h6>
                                <p className="mb-0">Expected delivery: 2-3 business days</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="card">
                            <div className="card-body">
                                <h6><i className="fas fa-headset me-2"></i>Support</h6>
                                <p className="mb-0">Need help? Contact our support team</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="d-grid gap-2 d-md-block">
                    <Link to="/patient/dashboard" className="btn btn-continue me-2" style={{ backgroundColor: '#0188df', color: 'white', padding: '12px 30px', border: 'none', borderRadius: '8px' }}>
                        <i className="fas fa-home me-2"></i>Go to Dashboard
                    </Link>
                    <Link to="/patient/order-medicines" className="btn btn-outline-primary">
                        <i className="fas fa-shopping-cart me-2"></i>Continue Shopping
                    </Link>
                </div>
            </div>
        </>
    );
};

export default OrderSuccess;
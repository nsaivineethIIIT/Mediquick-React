import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MedicineHeader from '../common/MedicineHeader'; // Already present, which is good.
import { showMessage } from '../../utils/alerts';

const PatientCart = () => {
    const [cartData, setCartData] = useState({ items: [] });
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const fetchConfig = { credentials: 'include' };

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        setLoading(true);
        try {
            // Assuming a dedicated API endpoint to return cart data as JSON
            const response = await fetch('http://localhost:3002/patient/api/cart-data', fetchConfig); 
            
            if (!response.ok) throw new Error('Failed to load cart');
            
            const data = await response.json();
            
            let fetchedItems = data.cart?.items || [];
            // Calculate total client-side based on the returned data structure
            let calculatedTotal = fetchedItems.reduce((sum, i) => sum + (i.quantity * i.medicineId.cost), 0).toFixed(2); 
            
            setCartData({ items: fetchedItems }); 
            setTotal(calculatedTotal); 
            
        } catch (err) {
            console.error('Error fetching cart:', err); 
            showMessage('Failed to load cart. Please try logging in again.', 'danger');
        } finally {
            setLoading(false);
        }
    };
    
    const updateQuantity = async (medicineId, change) => {
        const input = document.querySelector(`.quantity-input[data-id="${medicineId}"]`);
        let newQuantity = (change === 0 ? parseInt(input?.value) : parseInt(input?.value) + change);

        if (newQuantity < 1) {
            showMessage('Quantity cannot be less than 1', 'warning');
            return;
        }
        
        try {
            const response = await fetch('http://localhost:3002/patient/api/cart/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ medicineId: medicineId, quantity: newQuantity }),
                credentials: 'include'
            });

            const data = await response.json();
            
            if (data.success) {
                fetchCart(); // Reload the cart data
                if (window.updateCartCount) window.updateCartCount(); // Update header count
            } else {
                showMessage(data.error || 'Failed to update quantity', 'danger');
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('Failed to update quantity. Please try again.', 'danger');
        }
    };

    const removeItem = async (medicineId) => {
        if (!window.confirm('Are you sure you want to remove this item from your cart?')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3002/patient/api/cart/item/${medicineId}`, { method: 'DELETE', credentials: 'include' });
            const data = await response.json();
            
            if (data.success) {
                showMessage('Item removed from cart', 'success');
                fetchCart();
                if (window.updateCartCount) window.updateCartCount();
            } else {
                showMessage(data.error || 'Failed to remove item', 'danger');
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('Failed to remove item. Please try again.', 'danger');
        }
    };

    if (loading) return <div style={{paddingTop: '80px', textAlign: 'center'}}>Loading...</div>;

    return (
        <div className="patient-cart-page">
            <MedicineHeader />
            <div className="container cart-container" style={{ paddingTop: '80px' }}>
                <h2 className="mb-4"><i className="fas fa-shopping-cart me-2"></i>Your Shopping Cart</h2>
                
                {cartData.items.length === 0 ? (
                    <div className="empty-cart">
                        <i className="fas fa-shopping-cart fa-3x mb-3" style={{ color: '#bdc3c7' }}></i>
                        <h3>Your cart is empty</h3>
                        <p className="text-muted">Add some medicines to get started</p>
                        <Link to="/patient/order-medicines" className="btn btn-primary mt-3">
                            <i className="fas fa-pills me-2"></i>Browse Medicines
                        </Link>
                    </div>
                ) : (
                    <>
                        <div id="cartItems">
                            {cartData.items.map(item => (
                                <div key={item.medicineId._id} className="cart-item" data-medicine-id={item.medicineId._id}>
                                    <div className="cart-item-details">
                                        <div className="medicine-name">{item.medicineId.name}</div>
                                        <div className="medicine-details">
                                            ID: {item.medicineId.medicineID} | Manufacturer: {item.medicineId.manufacturer}
                                        </div>
                                        <div className="price-info">
                                            ₹{item.medicineId.cost.toFixed(2)} per unit
                                        </div>
                                    </div>
                                    
                                    <div className="cart-item-actions">
                                        <div className="quantity-controls">
                                            <button className="btn btn-outline-secondary btn-sm" onClick={() => updateQuantity(item.medicineId._id, -1)}>-</button>
                                            <input 
                                                type="number" 
                                                className="form-control quantity-input" 
                                                defaultValue={item.quantity} 
                                                min="1" 
                                                data-id={item.medicineId._id}
                                                style={{ width: '70px', textAlign: 'center' }}
                                                onChange={(e) => updateQuantity(item.medicineId._id, 0)}
                                            />
                                            <button className="btn btn-outline-secondary btn-sm" onClick={() => updateQuantity(item.medicineId._id, 1)}>+</button>
                                        </div>
                                        
                                        <div className="item-total">
                                            ₹{(item.quantity * item.medicineId.cost).toFixed(2)}
                                        </div>
                                        <button className="btn-remove" onClick={() => removeItem(item.medicineId._id)}>
                                            <i className="fas fa-trash"></i> Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="total">
                            Total: ₹{total}
                        </div>
                        
                        <div className="d-grid gap-2">
                            <Link to="/patient/checkout" className="btn btn-checkout">
                                <i className="fas fa-credit-card me-2"></i>Proceed to Checkout
                            </Link>
                            <Link to="/patient/order-medicines" className="btn btn-outline-secondary">
                                <i className="fas fa-arrow-left me-2"></i>Continue Shopping
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PatientCart;
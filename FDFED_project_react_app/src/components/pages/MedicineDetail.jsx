import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MedicineHeader from '../common/MedicineHeader';
import { showMessage, getToastClass } from '../../utils/alerts';

const MedicineDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [medicine, setMedicine] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const fetchConfig = { credentials: 'include' };

    useEffect(() => {
        fetchMedicineDetails();
    }, [id]);

    const fetchMedicineDetails = async () => {
        setLoading(true);
        try {
            // Assuming a dedicated API endpoint to return medicine details as JSON
            const response = await fetch(`http://localhost:3005/patient/api/medicines/${id}`, fetchConfig); 
            
            if (!response.ok) throw new Error('Failed to fetch medicine details');
            
            const data = await response.json(); 
            setMedicine(data.medicine); 
            setQuantity(1);
            
        } catch (err) {
            console.error('Error fetching medicine details:', err);
            // Fallback mock data structure for detail page based on EJS content
            setMedicine({
                _id: id,
                name: "Medicine Detail",
                medicineID: "M-001",
                manufacturer: "Manufacturer X",
                formattedExpiryDate: "01 Jan 2026",
                returnPolicy: "3 DAYS RETURNABLE",
                consumeType: "ORAL",
                cost: 150.50,
                quantity: 5,
                imageUrl: "https://th.bing.com/th/id/OIP.1N_r8UyW1bIoHyb_YCmcaAHaHa?w=250&h=250&c=8&rs=1&qlt=90&o=6&dpr=1.3&pid=3.1&rm=2"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleBuyNow = () => {
        if (quantity < 1 || quantity > medicine.quantity) {
             showMessage(`Please select a valid quantity (1-${medicine.quantity})`, getToastClass('warning'));
             return;
        }
        // Redirect to checkout page for single medicine purchase
        navigate(`/patient/checkout?type=single&medicineId=${id}&quantity=${quantity}`);
    };

    const handleAddToCart = async () => {
        if (quantity < 1 || quantity > medicine.quantity) {
             showMessage(`Please select a valid quantity (1-${medicine.quantity})`, getToastClass('warning'));
             return;
        }

        try {
            const response = await fetch("/patient/api/add-to-cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ medicineId: id, quantity: quantity }),
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok) {
                showMessage(data.message || "Item added to cart successfully!", getToastClass('success'));
                if (window.updateCartCount) window.updateCartCount();
            } else {
                if (data.available !== undefined) {
                    showMessage(`Only ${data.available} units available in stock`, getToastClass('warning'));
                    setMedicine(prev => ({...prev, quantity: data.available}));
                    if (quantity > data.available) setQuantity(data.available);
                } else {
                    showMessage(data.error || "Failed to add to cart", getToastClass('danger'));
                }
            }
        } catch (error) {
            console.error("Add to cart error:", error);
            showMessage("Failed to add to cart. Please try again.", getToastClass('danger'));
        }
    };

    if (loading) return <div style={{paddingTop: '80px', textAlign: 'center'}}>Loading...</div>;
    if (!medicine) return <div style={{paddingTop: '80px', textAlign: 'center'}}>Medicine details not found.</div>;

    const stockAvailable = medicine.quantity > 0;

    return (
        <>
            <MedicineHeader />
            <div className="container medicine-container" style={{ paddingTop: '80px' }}>
                <div className="row">
                    <div className="col-md-6">
                        <img
                            src={medicine.imageUrl}
                            alt={medicine.name}
                            className="medicine-image"
                        />
                    </div>

                    <div className="col-md-6">
                        <h1>{medicine.name}</h1>
                        <p><strong>Medicine ID:</strong> {medicine.medicineID}</p>
                        <p><strong>Manufacturer:</strong> {medicine.manufacturer}</p>
                        <p><strong>Expiry Date:</strong> {medicine.formattedExpiryDate}</p>
                        <p><strong>Return Policy:</strong> {medicine.returnPolicy}</p>
                        <p><strong>Consume Type:</strong> {medicine.consumeType}</p>

                        <div className="mt-4">
                            <p className="price">₹{medicine.cost.toFixed(2)}</p>

                            {stockAvailable ? (
                                <>
                                    <p className="stock-info">
                                        In Stock: {medicine.quantity} units available
                                    </p>

                                    <div className="quantity-controls">
                                        <button className="btn btn-outline-secondary" onClick={() => setQuantity(q => q > 1 ? q - 1 : 1)}>-</button>
                                        <input
                                            type="number"
                                            id="quantityInput"
                                            className="form-control"
                                            value={quantity}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                if (val < 1 || isNaN(val)) setQuantity(1);
                                                else if (val > medicine.quantity) setQuantity(medicine.quantity);
                                                else setQuantity(val);
                                            }}
                                            min="1"
                                            max={medicine.quantity}
                                        />
                                        <button className="btn btn-outline-secondary" onClick={() => setQuantity(q => q < medicine.quantity ? q + 1 : medicine.quantity)}>+</button>
                                    </div>

                                    <div className="action-buttons mt-3">
                                        <button
                                            className="btn btn-buy-now"
                                            onClick={handleBuyNow}
                                        >
                                            <i className="fas fa-bolt"></i> Buy Now
                                        </button>
                                        <button
                                            className="btn btn-add-to-cart"
                                            onClick={handleAddToCart}
                                        >
                                            <i className="fas fa-shopping-cart"></i> Add to Cart
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="out-of-stock">Currently Out of Stock</p>
                                    <button className="btn btn-secondary" disabled>Not Available</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MedicineDetail;
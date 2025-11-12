import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MedicineHeader from '../common/MedicineHeader';
import { showMessage, getToastClass } from '../../utils/alerts';

const OrderMedicines = () => {
    const [allMedicines, setAllMedicines] = useState([]);
    const [filteredMedicines, setFilteredMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const fetchConfig = { credentials: 'include' };

    useEffect(() => {
        fetchMedicines();
    }, []);

    useEffect(() => {
        filterMedicines(searchQuery, allMedicines);
    }, [searchQuery, allMedicines]);

    const fetchMedicines = async () => {
        setLoading(true);
        try {
            // Using the API endpoint for searching all medicines
            const response = await fetch('http://localhost:3002/medicine/search?query=', fetchConfig);
            const data = await response.json();

            if (data.success && data.medicines) {
                setAllMedicines(data.medicines);
            } else {
                setAllMedicines([]);
                showMessage(data.message || 'No medicines found.', getToastClass('info'));
            }

        } catch (err) {
            console.error('Error fetching medicines:', err);
            showMessage('Failed to load medicines. Please try again.', getToastClass('danger'));
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const filterMedicines = (query, medicinesList) => {
        if (!query) {
            setFilteredMedicines(medicinesList);
            return;
        }

        const lowerCaseQuery = query.toLowerCase();
        const filtered = medicinesList.filter(m => 
            (m.name || '').toLowerCase().includes(lowerCaseQuery) ||
            (m.medicineID || '').toLowerCase().includes(lowerCaseQuery) ||
            (m.manufacturer || '').toLowerCase().includes(lowerCaseQuery)
        ); 

        setFilteredMedicines(filtered);
    };

    const handleAddToCart = async (medicineId) => {
        const quantityInput = document.getElementById(`qty-${medicineId}`);
        const quantity = parseInt(quantityInput?.value || 1);
        const max = parseInt(quantityInput?.max || 1);

        if (quantity < 1 || quantity > max) {
            showMessage(`Please enter a valid quantity (1-${max})`, getToastClass('warning'));
            return;
        }

        try {
            const response = await fetch('http://localhost:3002/patient/api/add-to-cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ medicineId, quantity }),
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok) {
                showMessage(data.message || `${quantity} item(s) added to cart`, getToastClass('success'));
                if (window.updateCartCount) window.updateCartCount();
            } else {
                if (data.available !== undefined) {
                    showMessage(`Only ${data.available} available in stock`, getToastClass('warning'));
                } else {
                    showMessage(`Failed to add to cart: ${data.error || "Unknown error"}`, getToastClass('danger'));
                }
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            showMessage('Failed to add to cart. Please try again.', getToastClass('danger'));
        }
    };
    
    const renderLoading = () => (
        <div style={{ display: 'block', margin: '20px auto', textAlign: 'center' }}>
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );

    return (
        <>
            <MedicineHeader />

            <div className="container mt-5" style={{ paddingTop: '50px' }}>
                <h1 className="mb-4">Order Medicines</h1>

                <div className="row mb-4">
                    <div className="col-md-6">
                        <div className="input-group">
                            <input 
                                type="text" 
                                id="searchInput" 
                                className="form-control" 
                                placeholder="Search medicines by name, ID, or manufacturer..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                            />
                            <button className="btn btn-outline-primary" type="button" id="searchBtn" onClick={() => filterMedicines(searchQuery, allMedicines)}>
                                <i className="fas fa-search"></i>
                            </button>
                        </div>
                    </div>
                </div>

                {loading ? renderLoading() : (
                    <div className="row" id="medicineGrid">
                        {filteredMedicines.length === 0 ? (
                            <div className="text-center py-5">
                                <h3>No medicines found</h3> 
                                <p className="text-muted">Try a different keyword or check back later for new stock.</p>
                            </div>
                        ) : (
                            filteredMedicines.map(medicine => (
                                <div key={medicine._id} className="col-md-4 col-lg-3 mb-4">
                                    <div className="card medicine-card">
                                        <div className="card-body"> 
                                            <h5 className="card-title">{medicine.name}</h5>
                                            <p className="card-text">
                                                <small className="text-muted">ID: {medicine.medicineID}</small><br/>
                                                <small className="text-muted">Manufacturer: {medicine.manufacturer}</small>
                                            </p>
                                            
                                            <p className="price mb-2">₹{medicine.cost.toFixed(2)}</p>
                                            
                                            {medicine.quantity > 0 ? (
                                                <>
                                                    <p className="stock-info mb-3">In Stock: {medicine.quantity}</p>
                                                    <div className="quantity-controls mb-3" style={{display: 'flex', justifyContent: 'center'}}>
                                                        <input 
                                                            type="number" 
                                                            id={`qty-${medicine._id}`} 
                                                            className="form-control form-control-sm" 
                                                            defaultValue="1" 
                                                            min="1" 
                                                            max={medicine.quantity} 
                                                            style={{ width: '60px', textAlign: 'center' }}
                                                            onChange={(e) => {
                                                                const val = parseInt(e.target.value);
                                                                if (val < 1) e.target.value = 1;
                                                                else if (val > medicine.quantity) e.target.value = medicine.quantity;
                                                            }}
                                                        />
                                                    </div>
                                                    
                                                    <button 
                                                        className="btn btn-sm btn-add-to-cart w-100 mb-2" 
                                                        onClick={() => handleAddToCart(medicine._id)}
                                                        style={{ backgroundColor: '#e74c3c', color: 'white' }}
                                                    >
                                                        Add to Cart
                                                    </button>
                                                </>
                                            ) : (
                                                <p className="out-of-stock mb-3">Out of Stock</p>
                                            )}

                                            <Link to={`/patient/medicines/${medicine._id}`} className="btn btn-view-details">
                                                View Details & Order
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
            {/* You should ensure a common Footer component is rendered in your App.jsx */}
        </>
    );
};

export default OrderMedicines;
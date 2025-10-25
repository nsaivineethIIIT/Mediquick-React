import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../assets/css/PatientBooking.css';
const BookDocOnline = () => {
    const [allDoctors, setAllDoctors] = useState([]);
    const [filteredDoctors, setFilteredDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [specializationFilter, setSpecializationFilter] = useState('');
    
    // Available specializations
    const [specializations, setSpecializations] = useState([]);

    useEffect(() => {
        fetchDoctors();
    }, []);

    useEffect(() => {
        filterDoctors();
    }, [searchQuery, specializationFilter, allDoctors]);

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            setError('');
            
            const response = await fetch('http://localhost:3002/patient/api/doctors/online', {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const doctors = await response.json();
            setAllDoctors(doctors);
            
            // Extract unique specializations
            const uniqueSpecializations = [...new Set(
                doctors.map(doc => doc.specialization || 'General Physician')
            )];
            setSpecializations(uniqueSpecializations);
            
        } catch (err) {
            console.error('Error fetching doctors:', err);
            setError('Failed to load doctors. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const filterDoctors = () => {
        let filtered = allDoctors;

        // Apply specialization filter
        if (specializationFilter) {
            filtered = filtered.filter(doctor => 
                (doctor.specialization || 'General Physician') === specializationFilter
            );
        }

        // Apply search query filter
        if (searchQuery) {
            filtered = filtered.filter(doctor => 
                doctor.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredDoctors(filtered);
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleSpecializationChange = (e) => {
        setSpecializationFilter(e.target.value);
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSpecializationFilter('');
    };

    return (
        <div className="book-doc-online">
            <header>
                <Link to="/" className="logo">
                    <span>M</span>edi<span>Q</span>uick
                </Link>
                <nav className="navbar">
                    <ul>
                        <li><Link to="/about">About Us</Link></li>
                        <li><Link to="/faqs">FAQs</Link></li>
                        <li><Link to="/blogs">Blog</Link></li>
                        <li><Link to="/contact">Contact Us</Link></li>
                        <li>
                            <Link to="/patient/profile">
                                <img 
                                    src="https://static.thenounproject.com/png/638636-200.png" 
                                    alt="Profile" 
                                    height="30" 
                                    width="30" 
                                />
                            </Link>
                        </li>
                    </ul>
                </nav>
            </header>

            <section className="search-doctor">
                <h1 className="heading">Book Online Appointment</h1>
                <div className="search-bar">
                    <input 
                        type="text" 
                        placeholder="Search doctors by name..." 
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                    <select 
                        className="filter-dropdown"
                        value={specializationFilter}
                        onChange={handleSpecializationChange}
                    >
                        <option value="">All Specializations</option>
                        {specializations.map(spec => (
                            <option key={spec} value={spec}>{spec}</option>
                        ))}
                    </select>
                    <button className="button" onClick={clearFilters}>
                        Clear Filters
                    </button>
                </div>
            </section>

            <section className="doctor-list">
                <h2 className="title">Available Doctors (Online)</h2>
                <br />
                
                {loading && (
                    <div className="loading">
                        <i className="fas fa-spinner fa-spin"></i> Loading doctors...
                    </div>
                )}
                
                {error && (
                    <div className="error-message">{error}</div>
                )}
                
                <div className="scroll-container">
                    {!loading && !error && filteredDoctors.length === 0 && (
                        <div className="error-message">
                            No doctors available at the moment.
                        </div>
                    )}
                    
                    {!loading && !error && filteredDoctors.map(doctor => (
                        <div key={doctor.id} className="doctor-card">
                            <img 
                                src="https://icons.veryicon.com/png/o/healthcate-medical/orange-particle/doctor-20.png" 
                                alt="Doctor" 
                            />
                            <div>
                                <h3>
                                    Dr. {doctor.name} 
                                    <span className="online-badge">Online</span>
                                </h3>
                                <p><strong>Specialist:</strong> {doctor.specialization || 'General Physician'}</p>
                                <p><strong>Email:</strong> {doctor.email}</p>
                                <p><strong>Available:</strong> {doctor.availability || '9:00 AM - 5:00 PM'}</p>
                                <p><strong>Experience:</strong> {doctor.experience || '5+ years'}</p>
                                <Link to={`/patient/doctor-profile-patient/${doctor.id}?type=online`}>
                                    <button className="book-now">Consult Now</button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <footer className="footer">
                <div className="box">
                    <Link to="/" className="logo">
                        <span>M</span>edi<span>Q</span>uick
                    </Link>
                    <p>Your trusted healthcare partner for quick and reliable medical services.</p>
                </div>
                
                <div className="box">
                    <h3>Quick Links</h3>
                    <Link to="/">Home</Link>
                    <Link to="/about">About Us</Link>
                    <Link to="/faqs">FAQs</Link>
                    <Link to="/blogs">Blog</Link>
                </div>
                
                <div className="box">
                    <h3>Contact Us</h3>
                    <a href="tel:+1234567890">+123-456-7890</a>
                    <a href="mailto:support@mediquick.com">support@mediquick.com</a>
                    <a href="#">123 Health Street, Medical City</a>
                </div>
                
                <div className="credit">
                    &copy; {new Date().getFullYear()} by <span>MediQuick</span> | all rights reserved!
                </div>
            </footer>
        </div>
    );
};

export default BookDocOnline;
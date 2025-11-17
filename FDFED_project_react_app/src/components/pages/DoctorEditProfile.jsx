import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDoctor } from '../../context/DoctorContext';
import axios from 'axios';

const DoctorEditProfile = () => {
  const { doctor, loading: contextLoading, error: contextError, refetch } = useDoctor();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    address: '',
    specialization: '',
    college: '',
    yearOfPassing: '',
    location: '',
    onlineStatus: 'Online',
    consultationFee: 0,
    profilePhoto: null
  });
  const [previewPhoto, setPreviewPhoto] = useState('/images/default-doctor.svg');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (doctor) {
      setFormData({
        name: doctor.name || '',
        email: doctor.email || '',
        mobile: doctor.mobile || '',
        address: doctor.address || '',
        specialization: doctor.specialization || '',
        college: doctor.college || '',
        yearOfPassing: doctor.yearOfPassing || '',
        location: doctor.location || '',
        onlineStatus: doctor.onlineStatus || 'Online',
        consultationFee: doctor.consultationFee || 0,
        profilePhoto: null // Reset file input on load
      });
      if (doctor.profilePhoto) {
        setPreviewPhoto(`http://localhost:3002/${doctor.profilePhoto}`);
      } else {
        setPreviewPhoto('/images/default-doctor.svg');
      }
    }
  }, [doctor]);

  // Validation functions
  const validateName = () => {
    const name = formData.name.trim();
    if (name.length < 2 || name.length > 500) {
      setErrors(prev => ({ ...prev, name: 'Name must be between 2 and 500 characters' }));
      return false;
    }
    setErrors(prev => ({ ...prev, name: '' }));
    return true;
  };

  const validateEmail = () => {
    const email = formData.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      return false;
    }
    setErrors(prev => ({ ...prev, email: '' }));
    return true;
  };

  const validateMobile = () => {
    const mobile = formData.mobile.trim();
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobile)) {
      setErrors(prev => ({ ...prev, mobile: 'Mobile number must be 10 digits' }));
      return false;
    }
    setErrors(prev => ({ ...prev, mobile: '' }));
    return true;
  };

  const validateAddress = () => {
    const address = formData.address.trim();
    if (address.length < 5) {
      setErrors(prev => ({ ...prev, address: 'Address must be at least 5 characters' }));
      return false;
    }
    setErrors(prev => ({ ...prev, address: '' }));
    return true;
  };

  const validateConsultationFee = () => {
    const fee = formData.consultationFee;
    if (isNaN(fee) || fee < 0) {
      setErrors(prev => ({ ...prev, consultationFee: 'Consultation fee must be a non-negative number' }));
      return false;
    }
    setErrors(prev => ({ ...prev, consultationFee: '' }));
    return true;
  };

  const validateForm = () => {
    const isNameValid = validateName();
    const isEmailValid = validateEmail();
    const isMobileValid = validateMobile();
    const isAddressValid = validateAddress();
    const isFeeValid = validateConsultationFee();

    return isNameValid && isEmailValid && isMobileValid && isAddressValid && isFeeValid;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, profilePhoto: file }));
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewPhoto(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfilePhoto = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return;
    
    try {
        const { data } = await axios.post('http://localhost:3002/doctor/profile-photo/remove', {}, {
            withCredentials: true
        });

        if (data.success) {
            setPreviewPhoto('/images/default-doctor.svg');
            setFormData(prev => ({ ...prev, profilePhoto: null }));
            refetch(); // Refetch doctor data to update context
            setSuccess('Profile photo removed successfully.');
        } else {
            setErrors(prev => ({ ...prev, photo: data.message || 'Failed to remove photo' }));
        }
    } catch (error) {
        console.error('Error removing profile photo:', error);
        setErrors(prev => ({ ...prev, photo: error.response?.data?.message || 'Server error while removing photo.' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccess('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const data = new FormData();
      // Append all form fields to FormData
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null) {
          data.append(key, formData[key]);
        }
      });

      const response = await axios.post('http://localhost:3002/doctor/update-profile', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      });

      if (response.data.success) {
        await refetch(); // Refetch data to update context
        setSuccess('Profile updated successfully! Redirecting...');
        setTimeout(() => {
          navigate('/doctor/profile');
        }, 2000);
      } else {
        setErrors(prev => ({ ...prev, submit: response.data.message || 'Error updating profile' }));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors(prev => ({ ...prev, submit: error.response?.data?.message || 'An error occurred while updating the profile' }));
    } finally {
      setLoading(false);
    }
  };

  const getInputClass = (fieldName) => {
    return errors[fieldName] ? 'error-input' : '';
  };

  if (contextLoading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (contextError) {
    return <div className="error-message">Error: {contextError}. Please try logging in again.</div>;
  }

  return (
    <div className="doctor-edit-profile-container">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap');

        :root {
          --blue: #0188df;
          --black: #444d53;
          --white: #fff;
        }

        * {
          font-family: "Roboto", sans-serif;
          margin: 0;
          padding: 0;
          text-decoration: none;
          outline: none;
          box-sizing: border-box;
          transition: all linear .2s;
        }

        .doctor-edit-profile-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        header {
          width: 96%;
          background: var(--white);
          position: fixed;
          top: 2rem;
          left: 50%;
          transform: translate(-50%);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 2rem;
          z-index: 1000;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        header a {
          color: var(--black);
        }

        header a:hover {
          color: var(--blue);
        }

        header .logo {
          font-size: 3rem;
          font-weight: bold;
        }

        header .logo span {
          color: var(--blue);
        }

        header .navbar ul {
          display: flex;
          align-items: center;
          justify-content: space-between;
          list-style: none;
        }

        header .navbar ul li {
          margin: 0 1rem;
        }

        header .navbar ul li a {
          font-size: 1.6rem;
          color: var(--black);
          padding: 0.5rem 1rem;
          border-radius: 4px;
        }

        header .navbar ul li a:hover {
          color: var(--blue);
          background-color: rgba(1, 136, 223, 0.1);
        }

        .container {
          width: 96%;
          max-width: 800px;
          margin: 120px auto 40px auto;
          background: var(--white);
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
        }

        h2 {
          font-size: 3rem;
          color: var(--black);
          margin-bottom: 2rem;
          text-align: center;
        }

        .form-group {
          margin-bottom: 2rem;
        }

        .form-group label {
          display: block;
          font-size: 1.6rem;
          color: var(--blue);
          margin-bottom: 0.8rem;
          font-weight: 500;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 1.2rem;
          font-size: 1.6rem;
          border: 1px solid #ddd;
          border-radius: 5px;
          color: var(--black);
          background-color: #fff;
        }

        .form-group input:focus,
        .form-group select:focus {
          border-color: var(--blue);
          outline: none;
          box-shadow: 0 0 5px rgba(1, 136, 223, 0.3);
        }

        .error-input {
          border: 1px solid red !important;
        }

        .error-message {
          color: red;
          font-size: 1.4rem;
          margin: 8px 0 0 0;
          display: block;
        }

        .success-message {
          color: green;
          font-size: 1.6rem;
          margin: 15px 0;
          text-align: center;
          padding: 10px;
          background-color: #f0fff0;
          border: 1px solid #d4edda;
          border-radius: 5px;
        }

        .photo-section {
          text-align: center;
          margin: 2rem 0;
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 8px;
        }

        .profile-photo-preview {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid var(--blue);
          margin-bottom: 15px;
        }

        .photo-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-top: 15px;
        }

        .button {
          height: 4rem;
          width: 16rem;
          background: var(--black);
          color: var(--white);
          font-size: 1.6rem;
          text-transform: capitalize;
          border-radius: 5px;
          cursor: pointer;
          margin: 1rem 0;
          border: 1px solid var(--blue);
          display: block;
        }

        .button:hover {
          border: 1px solid var(--blue);
          background: var(--white);
          color: var(--blue);
          letter-spacing: 0.1rem;
        }

        .button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .button-secondary {
          background: var(--white);
          color: var(--black);
          border: 1px solid var(--black);
        }

        .button-secondary:hover {
          background: var(--black);
          color: var(--white);
        }

        .button-danger {
          background: #dc3545;
          color: var(--white);
          border: 1px solid #dc3545;
        }

        .button-danger:hover {
          background: var(--white);
          color: #dc3545;
        }

        .form-actions {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin-top: 3rem;
        }

        @media (max-width: 768px) {
          header {
            width: 100%;
            top: 0;
            padding: 1rem;
          }

          header .navbar ul {
            flex-direction: column;
            position: fixed;
            top: -100rem;
            left: 0;
            width: 100%;
            background: var(--white);
            opacity: 0;
            padding: 2rem 0;
          }

          header .navbar ul li {
            margin: 1rem 0;
            width: 100%;
            text-align: center;
          }

          header .navbar ul li a {
            font-size: 2rem;
            display: block;
            padding: 1rem;
          }

          .container {
            margin: 100px 10px 20px 10px;
            padding: 20px;
          }

          .photo-actions {
            flex-direction: column;
            align-items: center;
          }

          .form-actions {
            flex-direction: column;
            align-items: center;
          }

          .button {
            width: 100%;
            max-width: 250px;
          }
        }
      `}</style>

      {/* Header */}
      <header>
        <Link to="/" className="logo">
          <span>M</span>edi<span>Q</span>uick
        </Link>
        <nav className="navbar">
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/faqs">FAQs</Link></li>
            <li><Link to="/blogs">Blog</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
            <li><Link to="/doctor/form">Logout</Link></li>
          </ul>
        </nav>
      </header>

      {/* Edit Profile Section */}
      <div className="container">
        <h2>Edit Doctor Profile</h2>

        <form onSubmit={handleSubmit}>
          {errors.submit && <div className="error-message" style={{textAlign: 'center', marginBottom: '15px'}}>{errors.submit}</div>}
          {success && <div className="success-message">{success}</div>}

          {/* Profile Photo Section */}
          <div className="photo-section">
            <img 
              src={previewPhoto} 
              alt="Profile Preview" 
              className="profile-photo-preview"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/default-doctor.svg';
              }}
            />
            
            <input 
              type="file" 
              id="profilePhoto" 
              name="profilePhoto" 
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ marginBottom: '15px' }}
            />
            
            <div className="photo-actions">
              <button 
                type="button" 
                className="button button-danger"
                onClick={removeProfilePhoto}
              >
                Remove Photo
              </button>
            </div>
            {errors.photo && <div className="error-message">{errors.photo}</div>}
          </div>

          {/* Form Fields */}
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              value={formData.name}
              onChange={handleInputChange}
              onBlur={validateName}
              className={getInputClass('name')}
              required
            />
            {errors.name && <div className="error-message">{errors.name}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              value={formData.email}
              onChange={handleInputChange}
              onBlur={validateEmail}
              className={getInputClass('email')}
              required
            />
            {errors.email && <div className="error-message">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="mobile">Mobile:</label>
            <input 
              type="text" 
              id="mobile" 
              name="mobile" 
              value={formData.mobile}
              onChange={handleInputChange}
              onBlur={validateMobile}
              className={getInputClass('mobile')}
              pattern="[0-9]{10}"
              required
            />
            {errors.mobile && <div className="error-message">{errors.mobile}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="address">Address:</label>
            <input 
              type="text" 
              id="address" 
              name="address" 
              value={formData.address}
              onChange={handleInputChange}
              onBlur={validateAddress}
              className={getInputClass('address')}
              required
            />
            {errors.address && <div className="error-message">{errors.address}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="specialization">Specialization:</label>
            <input 
              type="text" 
              id="specialization" 
              name="specialization" 
              value={formData.specialization}
              onChange={handleInputChange}
              className={getInputClass('specialization')}
              required
            />
            {errors.specialization && <div className="error-message">{errors.specialization}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="college">College:</label>
            <input 
              type="text" 
              id="college" 
              name="college" 
              value={formData.college}
              onChange={handleInputChange}
              className={getInputClass('college')}
              required
            />
            {errors.college && <div className="error-message">{errors.college}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="yearOfPassing">Year of Passing:</label>
            <input 
              type="text" 
              id="yearOfPassing" 
              name="yearOfPassing" 
              value={formData.yearOfPassing}
              onChange={handleInputChange}
              className={getInputClass('yearOfPassing')}
              required
            />
            {errors.yearOfPassing && <div className="error-message">{errors.yearOfPassing}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="location">Location:</label>
            <input 
              type="text" 
              id="location" 
              name="location" 
              value={formData.location}
              onChange={handleInputChange}
              className={getInputClass('location')}
              required
            />
            {errors.location && <div className="error-message">{errors.location}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="onlineStatus">Online Status:</label>
            <select 
              id="onlineStatus" 
              name="onlineStatus" 
              value={formData.onlineStatus}
              onChange={handleInputChange}
              className={getInputClass('onlineStatus')}
              required
            >
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
            </select>
            {errors.onlineStatus && <div className="error-message">{errors.onlineStatus}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="consultationFee">Consultation Fee:</label>
            <input 
              type="number" 
              id="consultationFee" 
              name="consultationFee" 
              value={formData.consultationFee}
              onChange={handleInputChange}
              onBlur={validateConsultationFee}
              className={getInputClass('consultationFee')}
              min="0"
              step="0.01"
              required
            />
            {errors.consultationFee && <div className="error-message">{errors.consultationFee}</div>}
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button 
              type="submit" 
              className="button"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
            
            <Link 
              to="/doctor/profile" 
              className="button button-secondary"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorEditProfile;
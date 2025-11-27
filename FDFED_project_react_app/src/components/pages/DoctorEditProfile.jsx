import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDoctor } from '../../context/DoctorContext';
import axios from 'axios';

// Yup validation schema
const doctorEditSchema = yup.object().shape({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(500, 'Name must not exceed 500 characters')
    .matches(/^(?=.*[A-Za-z])[A-Za-z0-9\s\-'.]+$/, 'Name must contain at least one letter and can include letters, numbers, spaces, hyphens, apostrophes, and periods'),
  email: yup
    .string()
    .required('Email is required')
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'),
  mobile: yup
    .string()
    .required('Mobile number is required')
    .matches(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits'),
  address: yup
    .string()
    .required('Address is required')
    .min(5, 'Address must be at least 5 characters'),
  specialization: yup
    .string()
    .required('Specialization is required'),
  college: yup
    .string()
    .required('College is required'),
  yearOfPassing: yup
    .string()
    .required('Year of passing is required'),
  location: yup
    .string()
    .required('Location is required'),
  onlineStatus: yup
    .string()
    .required('Online status is required'),
  consultationFee: yup
    .number()
    .required('Consultation fee is required')
    .min(0, 'Consultation fee must be a non-negative number')
    .typeError('Consultation fee must be a number'),
  dateOfBirth: yup
    .date()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === '' ? null : value;
    })
    .max(new Date(), 'Date of birth cannot be in the future')
    .test('age', 'Doctor must be at least 21 years old', function(value) {
      if (!value) return true; // Allow empty
      const age = Math.floor((new Date() - new Date(value)) / 31557600000); // ms in a year
      return age >= 21;
    }),
  gender: yup
    .string()
    .nullable()
    .oneOf(['male', 'female', 'other', null], 'Please select a valid gender')
});

const DoctorEditProfile = () => {
  const { doctor, loading: contextLoading, error: contextError, refetch } = useDoctor();
  const [previewPhoto, setPreviewPhoto] = useState('/images/default-doctor.svg');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [photoError, setPhotoError] = useState('');
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Initialize react-hook-form with yup resolver
  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: yupResolver(doctorEditSchema),
    mode: 'onChange',
    defaultValues: {
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
      dateOfBirth: '',
      gender: ''
    }
  });

  useEffect(() => {
    if (doctor) {
      // Update form values with doctor data from context
      setValue('name', doctor.name || '');
      setValue('email', doctor.email || '');
      setValue('mobile', doctor.mobile || '');
      setValue('address', doctor.address || '');
      setValue('specialization', doctor.specialization || '');
      setValue('college', doctor.college || '');
      setValue('yearOfPassing', doctor.yearOfPassing || '');
      setValue('location', doctor.location || '');
      setValue('onlineStatus', doctor.onlineStatus || 'Online');
      setValue('consultationFee', doctor.consultationFee || 0);
      
      // Format date for input field (YYYY-MM-DD)
      if (doctor.dateOfBirth) {
        const date = new Date(doctor.dateOfBirth);
        const formatted = date.toISOString().split('T')[0];
        setValue('dateOfBirth', formatted);
      } else {
        setValue('dateOfBirth', '');
      }
      setValue('gender', doctor.gender || '');
      
      if (doctor.profilePhoto) {
        setPreviewPhoto(`http://localhost:3002/${doctor.profilePhoto}`);
      } else {
        setPreviewPhoto('/images/default-doctor.svg');
      }
    }
  }, [doctor, setValue]);

  // File change handler

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
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
            refetch(); // Refetch doctor data to update context
            setSuccess('Profile photo removed successfully.');
        } else {
            setPhotoError(data.message || 'Failed to remove photo');
        }
    } catch (error) {
        console.error('Error removing profile photo:', error);
        setPhotoError(error.response?.data?.message || 'Server error while removing photo.');
    }
  };

  const onSubmit = async (formValues) => {
    setLoading(true);
    setSuccess('');
    setPhotoError('');

    try {
      const data = new FormData();
      // Append all form fields to FormData
      data.append('name', formValues.name);
      data.append('email', formValues.email);
      data.append('mobile', formValues.mobile);
      data.append('address', formValues.address);
      data.append('specialization', formValues.specialization);
      data.append('college', formValues.college);
      data.append('yearOfPassing', formValues.yearOfPassing);
      data.append('location', formValues.location);
      data.append('onlineStatus', formValues.onlineStatus);
      data.append('consultationFee', formValues.consultationFee);
      
      // Add optional fields if provided
      if (formValues.dateOfBirth) {
        data.append('dateOfBirth', formValues.dateOfBirth);
      }
      if (formValues.gender) {
        data.append('gender', formValues.gender);
      }
      
      // Add profile photo if a new one was selected
      if (fileInputRef.current?.files[0]) {
        data.append('profilePhoto', fileInputRef.current.files[0]);
      }

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
        setPhotoError(response.data.message || 'Error updating profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setPhotoError(error.response?.data?.message || 'An error occurred while updating the profile');
    } finally {
      setLoading(false);
    }
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
          transition: color 0.2s ease;
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
          transition: color 0.2s ease, background-color 0.2s ease;
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
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
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
          transition: background 0.2s ease, color 0.2s ease, border 0.2s ease;
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

        <form onSubmit={handleSubmit(onSubmit)}>
          {photoError && <div className="error-message" style={{textAlign: 'center', marginBottom: '15px'}}>{photoError}</div>}
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
          </div>

          {/* Form Fields */}
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input 
              type="text" 
              id="name" 
              {...register('name')}
              className={errors.name ? 'error-input' : ''}
            />
            {errors.name && <div className="error-message">{errors.name.message}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input 
              type="email" 
              id="email" 
              {...register('email')}
              className={errors.email ? 'error-input' : ''}
            />
            {errors.email && <div className="error-message">{errors.email.message}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="mobile">Mobile:</label>
            <input 
              type="text" 
              id="mobile" 
              {...register('mobile')}
              className={errors.mobile ? 'error-input' : ''}
            />
            {errors.mobile && <div className="error-message">{errors.mobile.message}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="address">Address:</label>
            <input 
              type="text" 
              id="address" 
              {...register('address')}
              className={errors.address ? 'error-input' : ''}
            />
            {errors.address && <div className="error-message">{errors.address.message}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="specialization">Specialization:</label>
            <input 
              type="text" 
              id="specialization" 
              {...register('specialization')}
              className={errors.specialization ? 'error-input' : ''}
            />
            {errors.specialization && <div className="error-message">{errors.specialization.message}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="college">College:</label>
            <input 
              type="text" 
              id="college" 
              {...register('college')}
              className={errors.college ? 'error-input' : ''}
            />
            {errors.college && <div className="error-message">{errors.college.message}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="yearOfPassing">Year of Passing:</label>
            <input 
              type="text" 
              id="yearOfPassing" 
              {...register('yearOfPassing')}
              className={errors.yearOfPassing ? 'error-input' : ''}
            />
            {errors.yearOfPassing && <div className="error-message">{errors.yearOfPassing.message}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="location">Location:</label>
            <input 
              type="text" 
              id="location" 
              {...register('location')}
              className={errors.location ? 'error-input' : ''}
            />
            {errors.location && <div className="error-message">{errors.location.message}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="onlineStatus">Online Status:</label>
            <select 
              id="onlineStatus" 
              {...register('onlineStatus')}
              className={errors.onlineStatus ? 'error-input' : ''}
            >
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
            </select>
            {errors.onlineStatus && <div className="error-message">{errors.onlineStatus.message}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="consultationFee">Consultation Fee:</label>
            <input 
              type="number" 
              id="consultationFee" 
              {...register('consultationFee')}
              className={errors.consultationFee ? 'error-input' : ''}
              step="0.01"
            />
            {errors.consultationFee && <div className="error-message">{errors.consultationFee.message}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="dateOfBirth">Date of Birth (Optional):</label>
            <input 
              type="date" 
              id="dateOfBirth" 
              {...register('dateOfBirth')}
              className={errors.dateOfBirth ? 'error-input' : ''}
              max={new Date().toISOString().split('T')[0]}
            />
            {errors.dateOfBirth && <div className="error-message">{errors.dateOfBirth.message}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="gender">Gender (Optional):</label>
            <select 
              id="gender" 
              {...register('gender')}
              className={errors.gender ? 'error-input' : ''}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {errors.gender && <div className="error-message">{errors.gender.message}</div>}
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
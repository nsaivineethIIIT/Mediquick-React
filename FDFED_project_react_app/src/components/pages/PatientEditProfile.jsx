import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { usePatient } from '../../context/PatientContext';

// Yup validation schema
const patientEditSchema = yup.object().shape({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(500, 'Name must not exceed 500 characters')
    .matches(/^(?=.*[A-Za-z])[A-Za-z0-9\s\-'.]+$/, 'Name must contain at least one letter and can include letters, numbers, spaces, hyphens, apostrophes, and periods')
    .trim(),
  email: yup
    .string()
    .required('Email is required')
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address')
    .trim(),
  mobile: yup
    .string()
    .required('Mobile number is required')
    .matches(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits')
    .trim(),
  address: yup
    .string()
    .required('Address is required')
    .min(5, 'Address must be at least 5 characters')
    .trim(),
  dateOfBirth: yup
    .date()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === '' ? null : value;
    })
    .max(new Date(), 'Date of birth cannot be in the future')
    .test('age', 'Patient must be at least 1 year old', function(value) {
      if (!value) return true; // Allow empty
      const age = Math.floor((new Date() - new Date(value)) / 31557600000); // ms in a year
      return age >= 1;
    }),
  gender: yup
    .string()
    .nullable()
    .oneOf(['male', 'female', 'other', null], 'Please select a valid gender')
});

const PatientEditProfile = () => {
  const { patient, loading: patientLoading, error: patientError, refetch } = usePatient();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('/images/default-patient.svg');
  const [photoError, setPhotoError] = useState('');
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Initialize react-hook-form with yup resolver
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    resolver: yupResolver(patientEditSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      mobile: '',
      address: '',
      dateOfBirth: '',
      gender: ''
    }
  });

  useEffect(() => {
    if (patient) {
      // Update form values with patient data from context
      setValue('name', patient.name || '');
      setValue('email', patient.email || '');
      setValue('mobile', patient.mobile || '');
      setValue('address', patient.address || '');
      // Format date for input field (YYYY-MM-DD)
      if (patient.dateOfBirth) {
        const date = new Date(patient.dateOfBirth);
        const formatted = date.toISOString().split('T')[0];
        setValue('dateOfBirth', formatted);
      } else {
        setValue('dateOfBirth', '');
      }
      setValue('gender', patient.gender || '');
      
      // Format profile photo URL
      if (patient.profilePhoto) {
        const photo = patient.profilePhoto;
        if (/^(https?:|data:|blob:)/i.test(photo)) {
          setProfilePhoto(photo);
        } else if (photo.startsWith('/')) {
          setProfilePhoto(`http://localhost:3002${photo}`);
        } else {
          setProfilePhoto(`http://localhost:3002/${photo}`);
        }
      } else {
        setProfilePhoto('/images/default-patient.svg');
      }
    }
  }, [patient, setValue]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfilePhoto(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfilePhoto = async () => {
    if (!confirm('Are you sure you want to remove your profile photo?')) return;
    
    try {
      const response = await fetch('http://localhost:3002/patient/profile-photo/remove', {
        method: 'POST',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setProfilePhoto('/images/default-patient.svg');
        setSuccess('Profile photo removed successfully');
        refetch(); // Refetch data in context
      } else {
        setPhotoError(data.error || 'Failed to remove photo');
      }
    } catch (error) {
      console.error('Error removing profile photo:', error);
      setPhotoError('Failed to remove photo');
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setSuccess('');
    setPhotoError('');

    try {
      const submissionData = new FormData();
      submissionData.append('name', data.name);
      submissionData.append('email', data.email);
      submissionData.append('mobile', data.mobile);
      submissionData.append('address', data.address);
      
      // Add optional fields if provided
      if (data.dateOfBirth) {
        submissionData.append('dateOfBirth', data.dateOfBirth);
      }
      if (data.gender) {
        submissionData.append('gender', data.gender);
      }

      // Add profile photo if a new one was selected
      if (fileInputRef.current?.files[0]) {
        submissionData.append('profilePhoto', fileInputRef.current.files[0]);
      }

      const response = await fetch('http://localhost:3002/patient/update-profile', {
        method: 'POST',
        body: submissionData,
        credentials: 'include'
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(result.message || 'Profile updated successfully');
        refetch(); // Refetch data in context
        // Redirect after successful update
        setTimeout(() => {
          navigate('/patient/profile');
        }, 2000);
      } else {
        setPhotoError(result.error || 'Error updating profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setPhotoError('An error occurred while updating the profile');
    } finally {
      setLoading(false);
    }
  };

  const closeProfile = () => {
    navigate('/patient/profile');
  };

  if (patientLoading) {
    return <div>Loading...</div>;
  }

  if (patientError) {
    return <div>Error: {patientError}</div>;
  }

  return (
    <div className="patient-edit-profile-container">
      <style>{`
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

        .patient-edit-profile-container {
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

        .patient-profile {
          flex: 1;
          padding: 20px;
          background-color: white;
          margin: 100px 20px 20px 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          position: relative;
        }

        .close-btn {
          position: absolute;
          top: 15px;
          left: 15px;
          font-size: 24px;
          font-weight: bold;
          cursor: pointer;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          padding: 8px 12px;
          transition: background 0.3s ease, color 0.3s ease;
          z-index: 10;
        }

        .close-btn:hover {
          background: rgba(0, 0, 0, 0.3);
          color: white;
        }

        .profile-form {
          max-width: 600px;
          margin: 0 auto;
        }

        .profile-form input {
          width: 100%;
          padding: 12px;
          margin: 10px 0;
          border: 1px solid #ccc;
          border-radius: 5px;
          font-size: 1.6rem;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .profile-form input:focus {
          border-color: var(--blue);
          box-shadow: 0 0 5px rgba(1, 136, 223, 0.3);
        }

        .error-input {
          border: 1px solid red !important;
        }

        .error-message {
          color: red;
          font-size: 1.4rem;
          margin: 5px 0;
        }

        .success-message {
          color: green;
          font-size: 1.4rem;
          margin: 10px 0;
          text-align: center;
        }

        .photo-section {
          text-align: center;
          margin: 2rem 0;
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
          margin-top: 10px;
        }

        .button {
          height: 3.5rem;
          width: 15rem;
          background: var(--black);
          color: var(--white);
          font-size: 1.7rem;
          text-transform: capitalize;
          border-radius: .5rem;
          cursor: pointer;
          margin: 1rem 0;
          border: .1rem solid var(--blue);
          display: block;
          transition: background 0.2s ease, color 0.2s ease, border 0.2s ease;
        }

        .button:hover {
          border: .1rem solid var(--blue);
          background: var(--white);
          color: var(--blue);
          letter-spacing: .2rem;
        }

        .button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .button-secondary {
          background: var(--white);
          color: var(--black);
          border: .1rem solid var(--black);
          transition: background 0.2s ease, color 0.2s ease;
        }

        .button-secondary:hover {
          background: var(--black);
          color: var(--white);
        }

        .button-danger {
          background: #dc3545;
          color: var(--white);
          border: .1rem solid #dc3545;
          transition: background 0.2s ease, color 0.2s ease;
        }

        .button-danger:hover {
          background: var(--white);
          color: #dc3545;
        }

        .form-actions {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin-top: 2rem;
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

          .patient-profile {
            margin: 80px 10px 10px 10px;
            padding: 15px;
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
            max-width: 200px;
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
          </ul>
        </nav>
      </header>

      {/* Edit Profile Section */}
      <section className="patient-profile">
        <div className="close-btn" onClick={closeProfile}>
          <i className="fas fa-times"></i>
        </div>

        <form className="profile-form" onSubmit={handleSubmit(onSubmit)}>
          {photoError && <div className="error-message">{photoError}</div>}
          {success && <div className="success-message">{success}</div>}

          {/* Profile Photo Section */}
          <div className="photo-section">
            <img 
              src={profilePhoto} 
              alt="Profile Preview" 
              className="profile-photo-preview"
              onError={(e) => {
                e.target.src = '/images/default-patient.svg';
              }}
            />
            
            <input 
              type="file" 
              id="profilePhoto" 
              name="profilePhoto" 
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ marginBottom: '10px' }}
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
          <div>
            <input 
              type="text" 
              placeholder="Full Name" 
              {...register('name')}
              className={errors.name ? 'error-input' : ''}
            />
            {errors.name && <div className="error-message">{errors.name.message}</div>}
          </div>

          <div>
            <input 
              type="email" 
              placeholder="Email" 
              {...register('email')}
              className={errors.email ? 'error-input' : ''}
            />
            {errors.email && <div className="error-message">{errors.email.message}</div>}
          </div>

          <div>
            <input 
              type="text" 
              placeholder="Mobile" 
              {...register('mobile')}
              className={errors.mobile ? 'error-input' : ''}
            />
            {errors.mobile && <div className="error-message">{errors.mobile.message}</div>}
          </div>

          <div>
            <input 
              type="text" 
              placeholder="Address" 
              {...register('address')}
              className={errors.address ? 'error-input' : ''}
            />
            {errors.address && <div className="error-message">{errors.address.message}</div>}
          </div>

          <div>
            <input 
              type="date" 
              placeholder="Date of Birth" 
              {...register('dateOfBirth')}
              className={errors.dateOfBirth ? 'error-input' : ''}
              max={new Date().toISOString().split('T')[0]}
            />
            {errors.dateOfBirth && <div className="error-message">{errors.dateOfBirth.message}</div>}
          </div>

          <div>
            <select 
              {...register('gender')}
              className={errors.gender ? 'error-input' : ''}
            >
              <option value="">Select Gender (Optional)</option>
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
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            
            <button 
              type="button" 
              className="button button-secondary"
              onClick={closeProfile}
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default PatientEditProfile;
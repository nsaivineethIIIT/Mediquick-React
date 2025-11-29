import React, { useState, useRef } from 'react';
import { useSupplier } from '../../context/SupplierContext';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import '../../assets/css/supplier_profile.css';

// --- Yup Validation Schema ---
const supplierEditSchema = yup.object().shape({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be between 2 and 500 characters')
    .max(500, 'Name must be between 2 and 500 characters')
    .matches(/^(?=.*[A-Za-z])[A-Za-z0-9\s\-'.]+$/, 'Name must contain at least one letter and can include letters, numbers, spaces, hyphens, apostrophes, and periods'),
  email: yup
    .string()
    .required('Email is required')
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'),
  mobile: yup
    .string()
    .required('Mobile number is required')
    .matches(/^[0-9]{10}$/, 'Mobile number must be 10 digits'),
  address: yup
    .string()
    .required('Address is required')
    .min(5, 'Address must be at least 5 characters')
});

// --- Component ---
const SupplierEditProfile = () => {
  // Context integration
  const { supplier, updateSupplier, refetch } = useSupplier();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const navigate = useNavigate();
  
  // Ref for the file input since RHF doesn't manage file values directly in the schema
  const fileInputRef = useRef(null); 

  // Initialize react-hook-form
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    setValue, 
    watch, 
    reset 
  } = useForm({
    resolver: yupResolver(supplierEditSchema),
    mode: 'onChange',
    // Set default values, but these will be overwritten by useEffect from context
    defaultValues: {
      name: supplier?.name || '',
      email: supplier?.email || '',
      mobile: supplier?.mobile || '',
      address: supplier?.address || '',
      supplierID: supplier?.supplierID || '',
    }
  });

  // Use watch to monitor the file input separately for preview
  const fileToUpload = watch("profilePhoto"); 

  // Effect to load data from context into RHF fields on component mount or supplier change
  React.useEffect(() => {
    if (supplier) {
      setValue('name', supplier.name || '');
      setValue('email', supplier.email || '');
      setValue('mobile', supplier.mobile || '');
      setValue('address', supplier.address || '');
      // supplierID is read-only, but still set in RHF for completeness if needed elsewhere
      setValue('supplierID', supplier.supplierID || '');
    }
    // Reset file preview if supplier data refetches
    setPhotoPreview('');
  }, [supplier, setValue, reset]);


  // File change handler (remains manual for preview generation)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview('');
    }
    // RHF will handle file state via the register prop, but we use the ref for submission
  };

  // RHF Submission Handler
  const onSubmit = async (data) => {
    setLoading(true);
    setSuccess('');
    setGeneralError('');
    
    try {
      // Create FormData for file upload (MANDATORY for multipart/form-data)
      const form = new FormData();
      
      // Append validated data from RHF
      form.append('name', data.name.trim());
      form.append('email', data.email.trim());
      form.append('mobile', data.mobile.trim());
      form.append('address', data.address.trim());
      
      // Append read-only ID
      form.append('supplierID', data.supplierID);
      
      // Add photo if a new one was selected (using the ref for the file object)
      if (fileInputRef.current && fileInputRef.current.files.length > 0) {
        form.append('profilePhoto', fileInputRef.current.files[0]);
      }

      const response = await fetch('http://localhost:3002/supplier/update-profile', {
        method: 'POST',
        body: form,
        credentials: 'include',
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        setGeneralError(result.message || 'Update failed.');
      } else {
        setSuccess('Profile updated successfully!');
        // Context Update
        updateSupplier(result.supplier);
        refetch();
        setTimeout(() => navigate('/supplier/profile'), 1200);
      }
    } catch (err) {
      setGeneralError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = (e) => {
    e.preventDefault();
    fetch('/logout', { method: 'POST', credentials: 'include' })
      .finally(() => {
        window.localStorage.clear();
        navigate('/');
      });
  };

  if (!supplier) {
    // Basic loading state derived from context being null
    return (
      <div className="supplier-dashboard">
        <div className="main-content" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>Loading supplier data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="supplier-dashboard">
      {/* Sidebar with logo, welcome, and navigation */}
      <aside className="supplier-sidebar enhanced-sidebar">
        <div className="sidebar-logo">MediQuick</div>
        {supplier && supplier.name && (
          <div className="sidebar-welcome">Welcome, {supplier.name}!</div>
        )}
        <nav>
          <ul>
            <li><Link to="/supplier/dashboard">Dashboard</Link></li>
            <li><Link to="/supplier/profile">Profile</Link></li>
            <li><button className="logout-link" onClick={handleLogout}>Logout</button></li>
          </ul>
        </nav>
      </aside>
      {/* Main Content */}
      <div className="main-content" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* RHF handleSubmit wraps the onSubmit function */}
        <form onSubmit={handleSubmit(onSubmit)} className="profile-card edit-profile-form" style={{ width: '100%', maxWidth: 400 }}>
          <h2 className="profile-name">Edit Profile</h2>
          
          {/* Messages */}
          {generalError && <div className="error">{generalError}</div>}
          {success && <div className="success">{success}</div>}

          {/* Current Photo Display */}
          {supplier?.profilePhoto && !photoPreview && (
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <p style={{ color: '#0188df', fontSize: '12px', marginBottom: '5px' }}>Current Photo</p>
              <img 
                src={supplier.profilePhoto} 
                alt="Current Profile" 
                onError={(e) => { e.target.src = '/images/default-supplier.png'; }}
                style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '50%', 
                  objectFit: 'cover', 
                  border: '2px solid #0188df' 
                }} 
              />
            </div>
          )}

          {/* Profile Photo Change Section (RHF is used for validation only, not value management) */}
          <div style={{ margin: '20px 0', textAlign: 'center' }}>
            <label 
              htmlFor="profilePhoto" 
              style={{ 
                display: 'block', 
                marginBottom: '10px', 
                color: '#0188df', 
                fontWeight: 'bold' 
              }}
            >
              Change Profile Photo (Optional)
            </label>
            <input
              type="file"
              id="profilePhoto"
              accept="image/*"
              // RHF registers the input but we use ref for the actual file submission
              {...register('profilePhoto')} 
              ref={(e) => {
                // Assign the ref for file access
                fileInputRef.current = e; 
                // Call RHF's registered ref function
                register('profilePhoto').ref(e); 
              }}
              onChange={(e) => {
                handleFileChange(e);
                // Call RHF's registered onChange function
                register('profilePhoto').onChange(e); 
              }}
              style={{ 
                width: '80%', 
                padding: '10px', 
                border: '1px solid #ccc', 
                borderRadius: '5px' 
              }}
            />
            
            {photoPreview && (
              <div id="photoPreview" style={{ marginTop: '10px' }}>
                <img 
                  id="previewImg" 
                  src={photoPreview} 
                  alt="New Profile Preview" 
                  style={{ 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '50%', 
                    objectFit: 'cover', 
                    border: '2px solid #0188df' 
                  }} 
                />
                <p style={{ marginTop: '5px', color: '#0188df', fontSize: '12px' }}>
                  New Photo Preview
                </p>
              </div>
            )}
          </div>

          <div className="profile-info-list">
            <div className="form-group profile-info-item">
              <span>Name:</span>
              <input 
                type="text" 
                {...register('name')}
                autoComplete="off" 
                className={errors.name ? 'error-input' : ''}
                style={{ textTransform: 'none', width: '70%' }} 
              />
              {errors.name && <span className="error">{errors.name.message}</span>}
            </div>

            <div className="form-group profile-info-item">
              <span>Supplier ID:</span>
              <input 
                type="text" 
                {...register('supplierID')}
                readOnly 
                style={{ background: '#f0f0f0', color: '#888', textTransform: 'none', width: '70%' }} 
              />
            </div>
            
            <div className="form-group profile-info-item">
              <span>Email:</span>
              <input 
                type="email" 
                {...register('email')}
                autoComplete="off" 
                className={errors.email ? 'error-input' : ''}
                style={{ textTransform: 'none', width: '70%' }} 
              />
              {errors.email && <span className="error">{errors.email.message}</span>}
            </div>

            <div className="form-group profile-info-item">
              <span>Mobile:</span>
              <input 
                type="text" 
                {...register('mobile')}
                autoComplete="off" 
                className={errors.mobile ? 'error-input' : ''}
                style={{ textTransform: 'none', width: '70%' }} 
              />
              {errors.mobile && <span className="error">{errors.mobile.message}</span>}
            </div>

            <div className="form-group profile-info-item">
              <span>Address:</span>
              <input 
                type="text" 
                {...register('address')}
                autoComplete="off" 
                className={errors.address ? 'error-input' : ''}
                style={{ textTransform: 'none', width: '70%' }} 
              />
              {errors.address && <span className="error">{errors.address.message}</span>}
            </div>
          </div>
          
          <button type="submit" className="button" disabled={loading} style={{ marginTop: '1.5rem' }}>{loading ? 'Saving...' : 'Save Changes'}</button>
          <button type="button" onClick={() => navigate('/supplier/profile')} className="cancel-btn button" style={{ background: '#eee', color: '#0188df', border: '1px solid #0188df', marginTop: '1rem' }}>Cancel</button>
        </form>
      </div>
    </div>
  );
};

export default SupplierEditProfile;
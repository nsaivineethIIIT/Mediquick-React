import React, { useState } from 'react';
import '../../assets/css/AdminForm.css'; 

const AdminForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    // Login form data
    email: '',
    password: '',
    securityCode: '',
    
    // Signup form data
    name: '',
    signupEmail: '',
    mobile: '',
    address: '',
    signupPassword: '',
    signupSecurityCode: ''
  });
  
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    return passwordRegex.test(password);
  };

  const validateName = (name) => {
    return name.length >= 2 && name.length <= 500;
  };

  const validateMobile = (mobile) => {
    const mobileRegex = /^\d{10}$/;
    return mobileRegex.test(mobile);
  };

  const validateAddress = (address) => {
    return address.length >= 5;
  };

  // Form validation
  const validateLoginForm = () => {
    const newErrors = {};
    
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 6 characters with at least one letter and one number';
    }
    
    if (!formData.securityCode) {
      newErrors.securityCode = 'Security code is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignupForm = () => {
    const newErrors = {};
    
    if (!validateName(formData.name)) {
      newErrors.name = 'Name must be between 2 and 500 characters';
    }
    
    if (!validateEmail(formData.signupEmail)) {
      newErrors.signupEmail = 'Please enter a valid email address';
    }
    
    if (!validateMobile(formData.mobile)) {
      newErrors.mobile = 'Mobile number must be 10 digits';
    }
    
    if (!validateAddress(formData.address)) {
      newErrors.address = 'Address must be at least 5 characters';
    }
    
    if (!validatePassword(formData.signupPassword)) {
      newErrors.signupPassword = 'Password must be at least 6 characters with at least one letter and one number';
    }
    
    if (!formData.signupSecurityCode) {
      newErrors.signupSecurityCode = 'Security code is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    if (!validateLoginForm()) {
      setErrorMessage('Please correct the errors in the form. Note that the password should be at least 6 characters long and contain at least one letter and one number, with no spaces.');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:3002/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          securityCode: formData.securityCode
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccessMessage('Login successful! Redirecting...');
        setTimeout(() => {
          window.location.href = data.redirect || '/admin/dashboard';
        }, 1000);
      } else {
        setErrorMessage(data.error + (data.details ? `: ${data.details}` : ''));
      }
    } catch (error) {
      setErrorMessage('Network error. Please check your connection and try again.');
      console.error('Login error:', error);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    if (!validateSignupForm()) {
      setErrorMessage('Please correct the errors in the form. Note that the password should be at least 6 characters long and contain at least one letter and one number, with no spaces.');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:3002/admin/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.signupEmail,
          mobile: formData.mobile,
          address: formData.address,
          password: formData.signupPassword,
          securityCode: formData.signupSecurityCode
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccessMessage(data.message || 'Signup successful! Please login.');
        setIsLogin(true);
        // Reset signup form
        setFormData(prev => ({
          ...prev,
          name: '',
          signupEmail: '',
          mobile: '',
          address: '',
          signupPassword: '',
          signupSecurityCode: ''
        }));
      } else {
        setErrorMessage(data.error + (data.details ? `: ${data.details}` : ''));
      }
    } catch (error) {
      setErrorMessage('Network error. Please check your connection and try again.');
      console.error('Signup error:', error);
    }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setErrorMessage('');
    setSuccessMessage('');
    setErrors({});
  };

  const closeProfile = () => {
    window.location.href = "/";
  };

  return (
    <div className="admin-profile">
      <div className="close-btn" onClick={closeProfile}>
        <i className="fas fa-times"></i>
      </div>
      
      <h2 style={{ color: '#0188df', fontSize: '2rem', textAlign: 'center' }}>
        {isLogin ? 'Admin Login' : 'Admin Sign Up'}
      </h2>

      {errorMessage && (
        <div className="error-message" id="errlogin">
          {errorMessage}
        </div>
      )}
      
      {successMessage && (
        <div className="success-message" id="successlogin">
          {successMessage}
        </div>
      )}

      {isLogin ? (
        <form className="profile-form" onSubmit={handleLogin}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            onBlur={() => {
              if (formData.email && !validateEmail(formData.email)) {
                setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
              }
            }}
            className={errors.email ? 'error-input' : ''}
            required
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
          
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            onBlur={() => {
              if (formData.password && !validatePassword(formData.password)) {
                setErrors(prev => ({ ...prev, password: 'Password must be at least 6 characters with at least one letter and one number' }));
              }
            }}
            className={errors.password ? 'error-input' : ''}
            required
          />
          {errors.password && <span className="field-error">{errors.password}</span>}
          
          <input
            type="password"
            name="securityCode"
            placeholder="Security Code"
            value={formData.securityCode}
            onChange={handleInputChange}
            className={errors.securityCode ? 'error-input' : ''}
            autoComplete="off"
            required
          />
          {errors.securityCode && <span className="field-error">{errors.securityCode}</span>}
          
          <button type="submit" className="button">Login</button>
          <p className="toggle" onClick={toggleForm}>
            <ins>Don't have an account? Sign Up</ins>
          </p>
        </form>
      ) : (
        <form className="profile-form" onSubmit={handleSignup}>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleInputChange}
            onBlur={() => {
              if (formData.name && !validateName(formData.name)) {
                setErrors(prev => ({ ...prev, name: 'Name must be between 2 and 500 characters' }));
              }
            }}
            className={errors.name ? 'error-input' : ''}
            required
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
          
          <input
            type="email"
            name="signupEmail"
            placeholder="Email"
            value={formData.signupEmail}
            onChange={handleInputChange}
            onBlur={() => {
              if (formData.signupEmail && !validateEmail(formData.signupEmail)) {
                setErrors(prev => ({ ...prev, signupEmail: 'Please enter a valid email address' }));
              }
            }}
            className={errors.signupEmail ? 'error-input' : ''}
            required
          />
          {errors.signupEmail && <span className="field-error">{errors.signupEmail}</span>}
          
          <input
            type="tel"
            name="mobile"
            placeholder="Mobile"
            value={formData.mobile}
            onChange={handleInputChange}
            onBlur={() => {
              if (formData.mobile && !validateMobile(formData.mobile)) {
                setErrors(prev => ({ ...prev, mobile: 'Mobile number must be 10 digits' }));
              }
            }}
            className={errors.mobile ? 'error-input' : ''}
            pattern="[0-9]{10}"
            required
          />
          {errors.mobile && <span className="field-error">{errors.mobile}</span>}
          
          <input
            type="text"
            name="address"
            placeholder="Address"
            value={formData.address}
            onChange={handleInputChange}
            onBlur={() => {
              if (formData.address && !validateAddress(formData.address)) {
                setErrors(prev => ({ ...prev, address: 'Address must be at least 5 characters' }));
              }
            }}
            className={errors.address ? 'error-input' : ''}
            required
          />
          {errors.address && <span className="field-error">{errors.address}</span>}
          
          <input
            type="password"
            name="signupPassword"
            placeholder="Create your password"
            value={formData.signupPassword}
            onChange={handleInputChange}
            onBlur={() => {
              if (formData.signupPassword && !validatePassword(formData.signupPassword)) {
                setErrors(prev => ({ ...prev, signupPassword: 'Password must be at least 6 characters with at least one letter and one number' }));
              }
            }}
            className={errors.signupPassword ? 'error-input' : ''}
            minLength="6"
            required
          />
          {errors.signupPassword && <span className="field-error">{errors.signupPassword}</span>}
          
          <input
            type="password"
            name="signupSecurityCode"
            placeholder="Security Code"
            value={formData.signupSecurityCode}
            onChange={handleInputChange}
            className={errors.signupSecurityCode ? 'error-input' : ''}
            autoComplete="off"
            required
          />
          {errors.signupSecurityCode && <span className="field-error">{errors.signupSecurityCode}</span>}
          
          <button type="submit" className="button">Sign Up</button>
          <p className="toggle" onClick={toggleForm}>
            <ins>Already have an account? Sign In</ins>
          </p>
        </form>
      )}
    </div>
  );
};

export default AdminForm;
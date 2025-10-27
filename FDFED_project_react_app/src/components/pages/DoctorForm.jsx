import React, { useState } from 'react';
import '../../assets/css/DoctorForm.css';

const DoctorForm = () => {
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
    registrationNumber: '',
    specialization: '',
    college: '',
    yearOfPassing: '',
    location: '',
    onlineStatus: 'Online',
    consultationFee: '',
    signupSecurityCode: '',
    signupPassword: '',
    document: null
  });
  
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'file' ? files[0] : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateMobile = (mobile) => {
    const mobileRegex = /^\d{10}$/;
    return mobileRegex.test(mobile);
  };

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    return passwordRegex.test(password);
  };

  const validateName = (name) => {
    return name.length >= 2 && name.length <= 500;
  };

  const validateAddress = (address) => {
    return address.length >= 5;
  };

  const validateRegistrationNumber = (regNum) => {
    const regNumRegex = /^[a-zA-Z0-9]{6,20}$/;
    return regNumRegex.test(regNum);
  };

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
    
    if (!validateRegistrationNumber(formData.registrationNumber)) {
      newErrors.registrationNumber = 'Registration number must be 6-20 alphanumeric characters';
    }
    
    if (!validatePassword(formData.signupPassword)) {
      newErrors.signupPassword = 'Password must be at least 6 characters with at least one letter and one number';
    }
    
    if (!formData.document) {
      newErrors.document = 'Document is required';
    }
    
    if (!formData.signupSecurityCode) {
      newErrors.signupSecurityCode = 'Security code is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // In DoctorForm.jsx - Update the handleLogin function
const handleLogin = async (e) => {
  e.preventDefault();
  setErrorMessage('');
  setSuccessMessage('');
  
  if (!validateLoginForm()) {
    return;
  }
  
  try {
    const response = await fetch('http://localhost:3002/doctor/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // Change to JSON
      },
      credentials: 'include', // This is crucial for cookies
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
        securityCode: formData.securityCode
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      setSuccessMessage('Login successful! Redirecting...');
      // Don't store in localStorage - session is handled by cookies
      setTimeout(() => {
        window.location.href = '/doctor/dashboard';
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
      return;
    }
    
    const signupData = new FormData();
    signupData.append('name', formData.name);
    signupData.append('email', formData.signupEmail);
    signupData.append('mobile', formData.mobile);
    signupData.append('address', formData.address);
    signupData.append('registrationNumber', formData.registrationNumber);
    signupData.append('specialization', formData.specialization);
    signupData.append('college', formData.college);
    signupData.append('yearOfPassing', formData.yearOfPassing);
    signupData.append('location', formData.location);
    signupData.append('onlineStatus', formData.onlineStatus);
    signupData.append('consultationFee', formData.consultationFee);
    signupData.append('securityCode', formData.signupSecurityCode);
    signupData.append('password', formData.signupPassword);
    if (formData.document) {
      signupData.append('document', formData.document);
    }
    
    try {
      const response = await fetch('http://localhost:3002/doctor/signup', {
        method: 'POST',
        body: signupData
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccessMessage(data.message || 'Signup successful. Await approval.');
        setIsLogin(true);
        // Reset form
        setFormData(prev => ({
          ...prev,
          name: '',
          signupEmail: '',
          mobile: '',
          address: '',
          registrationNumber: '',
          specialization: '',
          college: '',
          yearOfPassing: '',
          location: '',
          consultationFee: '',
          signupSecurityCode: '',
          signupPassword: '',
          document: null
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
    <div className="doctor-profile">
      <div className="close-btn" onClick={closeProfile}>
        <i className="fas fa-times"></i>
      </div>
      
      <h2 style={{ color: '#007bff', fontSize: '2rem', textAlign: 'center' }}>
        {isLogin ? 'Doctor Login' : 'Doctor Sign Up'}
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
            Don't have an account? Sign Up
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
            className={errors.address ? 'error-input' : ''}
            required
          />
          {errors.address && <span className="field-error">{errors.address}</span>}
          
          <input
            type="text"
            name="registrationNumber"
            placeholder="Registration Number"
            value={formData.registrationNumber}
            onChange={handleInputChange}
            className={errors.registrationNumber ? 'error-input' : ''}
            pattern="[a-zA-Z0-9]{6,20}"
            required
          />
          {errors.registrationNumber && <span className="field-error">{errors.registrationNumber}</span>}
          
          <input
            type="text"
            name="specialization"
            placeholder="Specialization"
            value={formData.specialization}
            onChange={handleInputChange}
            required
          />
          
          <input
            type="text"
            name="college"
            placeholder="College of latest degree"
            value={formData.college}
            onChange={handleInputChange}
            required
          />
          
          <input
            type="number"
            name="yearOfPassing"
            placeholder="Year of passing (UG)"
            value={formData.yearOfPassing}
            onChange={handleInputChange}
            min="1970"
            max="2025"
            required
          />
          
          <input
            type="text"
            name="location"
            placeholder="Location"
            value={formData.location}
            onChange={handleInputChange}
            required
          />
          
          <input
            type="file"
            name="document"
            accept=".pdf,.doc,.docx"
            onChange={handleInputChange}
            className={errors.document ? 'error-input' : ''}
            required
          />
          {errors.document && <span className="field-error">{errors.document}</span>}
          
          <select
            name="onlineStatus"
            value={formData.onlineStatus}
            onChange={handleInputChange}
            required
          >
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
          </select>
          
          <input
            type="number"
            name="consultationFee"
            placeholder="Consultation Fee"
            value={formData.consultationFee}
            onChange={handleInputChange}
            min="0"
            step="1"
            required
          />
          
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
          
          <input
            type="password"
            name="signupPassword"
            placeholder="Create your password"
            value={formData.signupPassword}
            onChange={handleInputChange}
            className={errors.signupPassword ? 'error-input' : ''}
            minLength="6"
            required
          />
          {errors.signupPassword && <span className="field-error">{errors.signupPassword}</span>}
          
          <button type="submit" className="button">Sign Up</button>
          <p className="toggle" onClick={toggleForm}>
            Already have an account? Sign In
          </p>
        </form>
      )}
    </div>
  );
};

export default DoctorForm;
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../assets/css/PatientForm.css';

const PatientForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    address: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setMessage({ type: '', text: '' });
    setFormData({
      name: '',
      email: '',
      mobile: '',
      address: '',
      password: ''
    });
  };

  const handleChange = (e) => {
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

  const validateName = (name) => {
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!name || name.length < 2 || name.length > 500 || !nameRegex.test(name)) {
      return 'Name must be 2-500 characters long and contain only letters and spaces';
    }
    return '';
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validateMobile = (mobile) => {
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobile || !mobileRegex.test(mobile)) {
      return 'Mobile number must be exactly 10 digits';
    }
    return '';
  };

  const validateAddress = (address) => {
    if (!address || address.length < 5) {
      return 'Address must be at least 5 characters long';
    }
    return '';
  };

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    if (!password || !passwordRegex.test(password)) {
      return 'Password must be at least 6 characters long and contain at least one letter and one number';
    }
    return '';
  };

  const validateForm = () => {
    const newErrors = {};

    if (isLogin) {
      const emailError = validateEmail(formData.email);
      const passwordError = validatePassword(formData.password);
      
      if (emailError) newErrors.email = emailError;
      if (passwordError) newErrors.password = passwordError;
    } else {
      const nameError = validateName(formData.name);
      const emailError = validateEmail(formData.email);
      const mobileError = validateMobile(formData.mobile);
      const addressError = validateAddress(formData.address);
      const passwordError = validatePassword(formData.password);

      if (nameError) newErrors.name = nameError;
      if (emailError) newErrors.email = emailError;
      if (mobileError) newErrors.mobile = mobileError;
      if (addressError) newErrors.address = addressError;
      if (passwordError) newErrors.password = passwordError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setMessage({ type: 'error', text: 'Please correct the errors in the form' });
      return;
    }

    try {
      const endpoint = isLogin ? '/patient/login' : '/patient/signup';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await fetch(`http://localhost:3002${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for sessions
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        if (isLogin) {
          setMessage({ type: 'success', text: 'Login successful! Redirecting...' });
          // Redirect to dashboard
          setTimeout(() => {
            window.location.href = result.redirect || '/patient/dashboard';
          }, 1000);
        } else {
          setMessage({ type: 'success', text: 'Registration successful! Please login with your credentials.' });
          setTimeout(() => {
            setIsLogin(true);
            setFormData({
              name: '',
              email: '',
              mobile: '',
              address: '',
              password: ''
            });
          }, 2000);
        }
      } else {
        setMessage({ 
          type: 'error', 
          text: `${result.error}${result.details ? `: ${result.details}` : ''}` 
        });
      }
    } catch (error) {
      console.error(`${isLogin ? 'Login' : 'Signup'} Error:`, error);
      setMessage({ 
        type: 'error', 
        text: `An error occurred during ${isLogin ? 'login' : 'signup'}. Please try again.` 
      });
    }
  };

  return (
    <div className="patient-form-container">
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
        <div className="fas fa-bars"></div>
      </header>

      <div className="patient-profile">
        <div className="close-btn" onClick={() => window.history.back()}>
          <i className="fas fa-times"></i>
        </div>
        
        <h2 style={{ color: '#007bff', fontSize: '2rem', textAlign: 'center' }}>
          {isLogin ? 'Patient Login' : 'Patient Sign Up'}
        </h2>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {isLogin ? (
          <form id="loginForm" className="profile-form" onSubmit={handleSubmit}>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error-input' : ''}
              required
            />
            {errors.email && <span className="error-text">{errors.email}</span>}

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'error-input' : ''}
              required
            />
            {errors.password && <span className="error-text">{errors.password}</span>}

            <button type="submit" className="button">Login</button>
            <p className="toggle" onClick={toggleForm}>
              <ins>Don't have an account?</ins> <ins>Sign Up</ins>
            </p>
          </form>
        ) : (
          <form id="signupForm" className="profile-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'error-input' : ''}
              required
            />
            {errors.name && <span className="error-text">{errors.name}</span>}

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error-input' : ''}
              required
            />
            {errors.email && <span className="error-text">{errors.email}</span>}

            <input
              type="tel"
              name="mobile"
              placeholder="Mobile"
              value={formData.mobile}
              onChange={handleChange}
              className={errors.mobile ? 'error-input' : ''}
              required
            />
            {errors.mobile && <span className="error-text">{errors.mobile}</span>}

            <input
              type="text"
              name="address"
              placeholder="Address"
              value={formData.address}
              onChange={handleChange}
              className={errors.address ? 'error-input' : ''}
              required
            />
            {errors.address && <span className="error-text">{errors.address}</span>}

            <input
              type="password"
              name="password"
              placeholder="Create your password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'error-input' : ''}
              minLength="6"
              required
            />
            {errors.password && <span className="error-text">{errors.password}</span>}

            <button type="submit" className="button">Sign Up</button>
            <p className="toggle" onClick={toggleForm}>
              <ins>Already have an account?</ins> <ins>Sign In</ins>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default PatientForm;
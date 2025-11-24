import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import '../../assets/css/PatientForm.css';

// Yup validation schemas
const loginSchema = yup.object().shape({
  email: yup
    .string()
    .required('Email is required')
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters long')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/, 'Password must contain at least one letter and one number')
});

const signupSchema = yup.object().shape({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters long')
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
    .min(5, 'Address must be at least 5 characters long'),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters long')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/, 'Password must contain at least one letter and one number')
});

const PatientForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Initialize react-hook-form with yup resolver
  const loginForm = useForm({
    resolver: yupResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const signupForm = useForm({
    resolver: yupResolver(signupSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      mobile: '',
      address: '',
      password: ''
    }
  });

  // Use the appropriate form based on isLogin state
  const { register, handleSubmit, formState: { errors }, reset } = isLogin ? loginForm : signupForm;

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setMessage({ type: '', text: '' });
    loginForm.reset();
    signupForm.reset();
  };

  const onSubmit = async (data) => {
    try {
      const endpoint = isLogin ? '/patient/login' : '/patient/signup';
      const payload = isLogin 
        ? { email: data.email, password: data.password }
        : data;

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
            signupForm.reset();
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
          <form id="loginForm" className="profile-form" onSubmit={handleSubmit(onSubmit)}>
            <input
              type="email"
              placeholder="Email"
              {...register('email')}
              className={errors.email ? 'error-input' : ''}
            />
            {errors.email && <span className="error-text">{errors.email.message}</span>}

            <input
              type="password"
              placeholder="Password"
              {...register('password')}
              className={errors.password ? 'error-input' : ''}
            />
            {errors.password && <span className="error-text">{errors.password.message}</span>}

            <button type="submit" className="button">Login</button>
            <p className="toggle" onClick={toggleForm}>
              <ins>Don't have an account?</ins> <ins>Sign Up</ins>
            </p>
          </form>
        ) : (
          <form id="signupForm" className="profile-form" onSubmit={handleSubmit(onSubmit)}>
            <input
              type="text"
              placeholder="Full Name"
              {...register('name')}
              className={errors.name ? 'error-input' : ''}
            />
            {errors.name && <span className="error-text">{errors.name.message}</span>}

            <input
              type="email"
              placeholder="Email"
              {...register('email')}
              className={errors.email ? 'error-input' : ''}
            />
            {errors.email && <span className="error-text">{errors.email.message}</span>}

            <input
              type="tel"
              placeholder="Mobile"
              {...register('mobile')}
              className={errors.mobile ? 'error-input' : ''}
            />
            {errors.mobile && <span className="error-text">{errors.mobile.message}</span>}

            <input
              type="text"
              placeholder="Address"
              {...register('address')}
              className={errors.address ? 'error-input' : ''}
            />
            {errors.address && <span className="error-text">{errors.address.message}</span>}

            <input
              type="password"
              placeholder="Create your password"
              {...register('password')}
              className={errors.password ? 'error-input' : ''}
            />
            {errors.password && <span className="error-text">{errors.password.message}</span>}

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
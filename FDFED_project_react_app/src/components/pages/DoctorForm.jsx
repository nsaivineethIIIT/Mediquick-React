import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import '../../assets/css/DoctorForm.css';

// Yup validation schemas
const loginSchema = yup.object().shape({
  email: yup
    .string()
    .required('Email is required')
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/, 'Password must contain at least one letter and one number'),
  securityCode: yup
    .string()
    .required('Security code is required')
});

const signupSchema = yup.object().shape({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(500, 'Name must not exceed 500 characters')
    .matches(/^(?=.*[A-Za-z])[A-Za-z0-9\s\-'.]+$/, 'Name must contain at least one letter and can include letters, numbers, spaces, hyphens, apostrophes, and periods'),
  signupEmail: yup
    .string()
    .required('Email is required')
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'),
  mobile: yup
    .string()
    .required('Mobile number is required')
    .matches(/^\d{10}$/, 'Mobile number must be exactly 10 digits'),
  dateOfBirth: yup
    .date()
    .nullable()
    .max(new Date(), 'Date of birth cannot be in the future')
    .test('age', 'Doctor must be at least 21 years old', function(value) {
      if (!value) return true;
      const today = new Date();
      const birthDate = new Date(value);
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 21;
    })
    .typeError('Please enter a valid date'),
  gender: yup
    .string()
    .nullable()
    .oneOf(['male', 'female', 'other', null, ''], 'Please select a valid gender'),
  address: yup
    .string()
    .required('Address is required')
    .min(5, 'Address must be at least 5 characters'),
  registrationNumber: yup
    .string()
    .required('Registration number is required')
    .matches(/^[a-zA-Z0-9]{6,20}$/, 'Registration number must be 6-20 alphanumeric characters'),
  specialization: yup
    .string()
    .required('Specialization is required'),
  college: yup
    .string()
    .required('College is required'),
  yearOfPassing: yup
    .number()
    .required('Year of passing is required')
    .min(1970, 'Year must be 1970 or later')
    .max(2025, 'Year cannot exceed 2025')
    .typeError('Year of passing must be a number'),
  location: yup
    .string()
    .required('Location is required'),
  onlineStatus: yup
    .string()
    .required('Online status is required'),
  consultationFee: yup
    .number()
    .required('Consultation fee is required')
    .min(0, 'Consultation fee must be a positive number')
    .typeError('Consultation fee must be a number'),
  signupSecurityCode: yup
    .string()
    .required('Security code is required'),
  signupPassword: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/, 'Password must contain at least one letter and one number'),
  document: yup
    .mixed()
    .required('Document is required')
    .test('fileType', 'Only PDF, DOC, and DOCX files are allowed', (value) => {
      if (!value || !value[0]) return false;
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      return validTypes.includes(value[0].type);
    })
});

const DoctorForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Initialize react-hook-form with yup resolver
  const loginForm = useForm({
    resolver: yupResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      securityCode: ''
    }
  });

  const signupForm = useForm({
    resolver: yupResolver(signupSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      signupEmail: '',
      mobile: '',
      dateOfBirth: '',
      gender: '',
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
    }
  });

  // Use the appropriate form based on isLogin state
  const { register, handleSubmit, formState: { errors }, reset } = isLogin ? loginForm : signupForm;

  const onLoginSubmit = async (data) => {
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const response = await fetch('http://localhost:3002/doctor/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          securityCode: data.securityCode
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setSuccessMessage('Login successful! Redirecting...');
        setTimeout(() => {
          window.location.href = '/doctor/dashboard';
        }, 1000);
      } else {
        setErrorMessage(result.error + (result.details ? `: ${result.details}` : ''));
      }
    } catch (error) {
      setErrorMessage('Network error. Please check your connection and try again.');
      console.error('Login error:', error);
    }
  };

  const onSignupSubmit = async (data) => {
    setErrorMessage('');
    setSuccessMessage('');
    
    const signupData = new FormData();
    signupData.append('name', data.name);
    signupData.append('email', data.signupEmail);
    signupData.append('mobile', data.mobile);
    signupData.append('address', data.address);
    signupData.append('registrationNumber', data.registrationNumber);
    signupData.append('specialization', data.specialization);
    signupData.append('college', data.college);
    signupData.append('yearOfPassing', data.yearOfPassing);
    signupData.append('location', data.location);
    signupData.append('onlineStatus', data.onlineStatus);
    signupData.append('consultationFee', data.consultationFee);
    signupData.append('securityCode', data.signupSecurityCode);
    signupData.append('password', data.signupPassword);
    if (data.document && data.document[0]) {
      signupData.append('document', data.document[0]);
    }
    
    try {
      const response = await fetch('http://localhost:3002/doctor/signup', {
        method: 'POST',
        body: signupData
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setSuccessMessage(result.message || 'Signup successful. Await approval.');
        setIsLogin(true);
        signupForm.reset();
      } else {
        setErrorMessage(result.error + (result.details ? `: ${result.details}` : ''));
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
    loginForm.reset();
    signupForm.reset();
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
        <form className="profile-form" onSubmit={handleSubmit(onLoginSubmit)}>
          <input
            type="email"
            placeholder="Email"
            {...register('email')}
            className={errors.email ? 'error-input' : ''}
          />
          {errors.email && <span className="field-error">{errors.email.message}</span>}
          
          <input
            type="password"
            placeholder="Password"
            {...register('password')}
            className={errors.password ? 'error-input' : ''}
          />
          {errors.password && <span className="field-error">{errors.password.message}</span>}
          
          <input
            type="password"
            placeholder="Security Code"
            {...register('securityCode')}
            className={errors.securityCode ? 'error-input' : ''}
            autoComplete="off"
          />
          {errors.securityCode && <span className="field-error">{errors.securityCode.message}</span>}
          
          <button type="submit" className="button">Login</button>
          <p className="toggle" onClick={toggleForm}>
            Don't have an account? Sign Up
          </p>
        </form>
      ) : (
        <form className="profile-form" onSubmit={handleSubmit(onSignupSubmit)}>
          <input
            type="text"
            placeholder="Full Name"
            {...register('name')}
            className={errors.name ? 'error-input' : ''}
          />
          {errors.name && <span className="field-error">{errors.name.message}</span>}
          
          <input
            type="email"
            placeholder="Email"
            {...register('signupEmail')}
            className={errors.signupEmail ? 'error-input' : ''}
          />
          {errors.signupEmail && <span className="field-error">{errors.signupEmail.message}</span>}
          
          <input
            type="tel"
            placeholder="Mobile"
            {...register('mobile')}
            className={errors.mobile ? 'error-input' : ''}
          />
          {errors.mobile && <span className="field-error">{errors.mobile.message}</span>}
          
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <label style={{ fontSize: '1.4rem', color: '#666', marginBottom: '0.5rem' }}>Date of Birth (Optional)</label>
            <input
              type="date"
              {...register('dateOfBirth')}
              className={errors.dateOfBirth ? 'error-input' : ''}
              max={new Date().toISOString().split('T')[0]}
            />
            {errors.dateOfBirth && <span className="field-error">{errors.dateOfBirth.message}</span>}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <label style={{ fontSize: '1.4rem', color: '#666', marginBottom: '0.5rem' }}>Gender (Optional)</label>
            <select
              {...register('gender')}
              className={errors.gender ? 'error-input' : ''}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {errors.gender && <span className="field-error">{errors.gender.message}</span>}
          </div>
          
          <input
            type="text"
            placeholder="Address"
            {...register('address')}
            className={errors.address ? 'error-input' : ''}
          />
          {errors.address && <span className="field-error">{errors.address.message}</span>}
          
          <input
            type="text"
            placeholder="Registration Number"
            {...register('registrationNumber')}
            className={errors.registrationNumber ? 'error-input' : ''}
          />
          {errors.registrationNumber && <span className="field-error">{errors.registrationNumber.message}</span>}
          
          <input
            type="text"
            placeholder="Specialization"
            {...register('specialization')}
          />
          {errors.specialization && <span className="field-error">{errors.specialization.message}</span>}
          
          <input
            type="text"
            placeholder="College of latest degree"
            {...register('college')}
          />
          {errors.college && <span className="field-error">{errors.college.message}</span>}
          
          <input
            type="number"
            placeholder="Year of passing (UG)"
            {...register('yearOfPassing')}
            className={errors.yearOfPassing ? 'error-input' : ''}
          />
          {errors.yearOfPassing && <span className="field-error">{errors.yearOfPassing.message}</span>}
          
          <input
            type="text"
            placeholder="Location"
            {...register('location')}
          />
          {errors.location && <span className="field-error">{errors.location.message}</span>}
          
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            {...register('document')}
            className={errors.document ? 'error-input' : ''}
          />
          {errors.document && <span className="field-error">{errors.document.message}</span>}
          
          <select
            {...register('onlineStatus')}
          >
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
          </select>
          {errors.onlineStatus && <span className="field-error">{errors.onlineStatus.message}</span>}
          
          <input
            type="number"
            placeholder="Consultation Fee"
            {...register('consultationFee')}
            className={errors.consultationFee ? 'error-input' : ''}
          />
          {errors.consultationFee && <span className="field-error">{errors.consultationFee.message}</span>}
          
          <input
            type="password"
            placeholder="Security Code"
            {...register('signupSecurityCode')}
            className={errors.signupSecurityCode ? 'error-input' : ''}
            autoComplete="off"
          />
          {errors.signupSecurityCode && <span className="field-error">{errors.signupSecurityCode.message}</span>}
          
          <input
            type="password"
            placeholder="Create your password"
            {...register('signupPassword')}
            className={errors.signupPassword ? 'error-input' : ''}
          />
          {errors.signupPassword && <span className="field-error">{errors.signupPassword.message}</span>}
          
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
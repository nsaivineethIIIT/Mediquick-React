import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';

const DoctorContext = createContext(null);

export const DoctorProvider = ({ children }) => {
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDoctorProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3002/doctor/api/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch doctor profile' }));
        throw new Error(errorData.message || 'Failed to fetch doctor profile');
      }

      const data = await response.json();
      if (data.success) {
        setDoctor(data.doctor);
      } else {
        throw new Error(data.message || 'Failed to get doctor data');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctorProfile();
  }, [fetchDoctorProfile]);

  const refetch = () => {
    fetchDoctorProfile();
  };

  return (
    <DoctorContext.Provider value={{ doctor, loading, error, refetch }}>
      {children}
    </DoctorContext.Provider>
  );
};

export const useDoctor = () => {
  const context = useContext(DoctorContext);
  if (!context) {
    throw new Error('useDoctor must be used within a DoctorProvider');
  }
  return context;
};

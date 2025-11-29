import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';

const EmployeeContext = createContext(null);

export const useEmployee = () => {
    const context = useContext(EmployeeContext);
    if (!context) {
        throw new Error('useEmployee must be used within an EmployeeProvider');
    }
    return context;
};

const normalizeProfilePhoto = (photoPath) => {
    if (!photoPath) return '/images/default-employee.svg';
    if (/^(https?:|data:|blob:)/i.test(photoPath)) return photoPath;
    if (photoPath.startsWith('/')) {
        return `http://localhost:3002${photoPath}`;
    }
    return `http://localhost:3002/${photoPath}`;
};

export const EmployeeProvider = ({ children }) => {
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [registrationData, setRegistrationData] = useState({
        previousRegistrations: [],
        pendingRegistrations: []
    });

    const fetchEmployeeProfile = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:3002/employee/profile-data', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.message || data.error || 'Failed to fetch employee profile. Please log in.');
            }
            
            const normalizedEmployee = {
                ...data.employee,
                profilePhoto: normalizeProfilePhoto(data.employee?.profilePhoto)
            };

            setEmployee(normalizedEmployee);
            setRegistrationData({
                previousRegistrations: data.previousRegistrations || [],
                pendingRegistrations: data.pendingRegistrations || []
            });
        } catch (err) {
            setError(err.message);
            setEmployee(null);
            setRegistrationData({
                previousRegistrations: [],
                pendingRegistrations: []
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEmployeeProfile();
    }, [fetchEmployeeProfile]);
    
    // Function for optimistic updates after editing profile
    const updateEmployee = useCallback((updatedData) => {
        setEmployee(prevEmployee => {
            const merged = { ...prevEmployee, ...updatedData };
            if (updatedData && Object.prototype.hasOwnProperty.call(updatedData, 'profilePhoto')) {
                merged.profilePhoto = normalizeProfilePhoto(updatedData.profilePhoto);
            }
            return merged;
        });
    }, []);

    const value = {
        employee,
        loading,
        error,
        previousRegistrations: registrationData.previousRegistrations,
        pendingRegistrations: registrationData.pendingRegistrations,
        refetch: fetchEmployeeProfile,
        updateEmployee,
    };

    return (
        <EmployeeContext.Provider value={value}>
            {children}
        </EmployeeContext.Provider>
    );
};
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';

const AdminContext = createContext(null);

export const useAdmin = () => {
    const context = useContext(AdminContext);
    if (!context) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
};

export const AdminProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [profileData, setProfileData] = useState({
        completedConsultations: [],
        pendingConsultations: []
    });

    const fetchAdminProfile = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:3002/admin/profile-data', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                // If the response is not ok (e.g., 401 Unauthorized), the error message should reflect it.
                // Redirect logic for 401 should ideally be handled at the component level or a central router guard.
                throw new Error(data.message || 'Failed to fetch admin profile. Please log in.');
            }

            setAdmin(data.admin);
            setProfileData({
                completedConsultations: data.completedConsultations || [],
                pendingConsultations: data.pendingConsultations || []
            });
        } catch (err) {
            setError(err.message);
            setAdmin(null);
            setProfileData({
                completedConsultations: [],
                pendingConsultations: []
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAdminProfile();
    }, [fetchAdminProfile]);
    
    // Function for optimistic updates after editing profile
    const updateAdmin = (updatedData) => {
        setAdmin(prevAdmin => ({ ...prevAdmin, ...updatedData }));
    };

    const value = {
        admin,
        loading,
        error,
        completedConsultations: profileData.completedConsultations,
        pendingConsultations: profileData.pendingConsultations,
        refetch: fetchAdminProfile,
        updateAdmin,
    };

    return (
        <AdminContext.Provider value={value}>
            {children}
        </AdminContext.Provider>
    );
};
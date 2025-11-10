import React, { createContext, useState, useEffect, useContext } from 'react';

const PatientContext = createContext();

export const usePatient = () => useContext(PatientContext);

export const PatientProvider = ({ children }) => {
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPatientProfile = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:3002/patient/profile-data', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to fetch patient profile. Please log in.');
            }
            
            setPatient(data.patient);
        } catch (err) {
            setError(err.message);
            setPatient(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatientProfile();
    }, []);

    const updatePatient = (updatedData) => {
        setPatient(prevPatient => ({ ...prevPatient, ...updatedData }));
    };

    const value = {
        patient,
        loading,
        error,
        refetch: fetchPatientProfile,
        updatePatient, // Expose for optimistic updates
    };

    return (
        <PatientContext.Provider value={value}>
            {children}
        </PatientContext.Provider>
    );
};

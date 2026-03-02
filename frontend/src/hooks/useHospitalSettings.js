import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Custom hook to fetch and provide hospital settings
 * @returns {Object} { settings, loading, error }
 */
const useHospitalSettings = () => {
    const [settings, setSettings] = useState({
        hospitalName: '',
        hospitalLogo: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        reportHeader: '',
        reportFooter: '',
        currencySymbol: '₦'
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setLoading(true);
                const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/settings`);
                setSettings(data);
                setError(null);
            } catch (err) {
                console.error('Error fetching hospital settings:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    return { settings, loading, error };
};

export default useHospitalSettings;

import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import LoadingOverlay from '../components/loadingOverlay';
import useInactivityTimeout from '../hooks/useInactivityTimeout';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (userInfo) {
            setUser(userInfo);
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            const { data } = await axios.post('http://localhost:5000/api/users/login', { email, password }, config);

            localStorage.setItem('userInfo', JSON.stringify(data));
            setUser(data);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response && error.response.data.message
                    ? error.response.data.message
                    : error.message
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('userInfo');
        setUser(null);
    };

    // Enable inactivity timeout only when user is logged in
    useInactivityTimeout(
        user ? logout : null,
        5 * 60 * 1000 // 5 minutes in milliseconds
    );

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {loading && <LoadingOverlay />}
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;

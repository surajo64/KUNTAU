import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const ProtectedRoute = () => {
    const { user, loading } = useContext(AuthContext);

    // If loading, do nothing (the AuthContext overlay is showing)
    if (loading) {
        return null;
    }

    // If not loading, check user
    return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;

import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { FaBell, FaExclamationTriangle, FaCalendarTimes, FaBoxOpen } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { AppContext } from '../context/AppContext';

const PharmacyNotification = () => {
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const { user } = useContext(AuthContext);
    const { backendUrl } = useContext(AppContext);
    const navigate = useNavigate();

    // Close dropdown if clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showDropdown && !event.target.closest('.pharmacy-notification')) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDropdown]);

    useEffect(() => {
        const fetchInventory = async () => {
            if (!user || !['pharmacist', 'pharmacy technician', 'admin'].includes(user.role)) return;
            
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                // Fetch inventory drugs
                let inventoryUrl = `${backendUrl}/api/inventory`;
                if (user.role === 'pharmacist' && user.assignedPharmacy) {
                    inventoryUrl += `?pharmacy=${user.assignedPharmacy._id || user.assignedPharmacy}`;
                }
                const { data } = await axios.get(inventoryUrl, config);
                
                const now = new Date();
                const in30Days = new Date();
                in30Days.setDate(now.getDate() + 30);
                
                const expired = data.filter(d => d.expiryDate && new Date(d.expiryDate) < now);
                const expiringSoon = data.filter(d => d.expiryDate && new Date(d.expiryDate) >= now && new Date(d.expiryDate) <= in30Days);
                const lowStock = data.filter(d => d.quantity <= (d.reorderLevel || 10));

                const alerts = [];
                if (expired.length > 0) {
                    alerts.push({ id: 'expired', type: 'error', text: `${expired.length} drug(s) expired.`, icon: <FaCalendarTimes className="text-red-500" /> });
                }
                if (expiringSoon.length > 0) {
                    alerts.push({ id: 'expiring', type: 'warning', text: `${expiringSoon.length} drug(s) expiring within 30 days.`, icon: <FaExclamationTriangle className="text-yellow-500" /> });
                }
                if (lowStock.length > 0) {
                    alerts.push({ id: 'lowstock', type: 'info', text: `${lowStock.length} drug(s) at or below reorder level.`, icon: <FaBoxOpen className="text-blue-500" /> });
                }
                
                setNotifications(alerts);
            } catch (error) {
                console.error("Error fetching inventory for notifications", error);
            }
        };

        fetchInventory();
    }, [user, backendUrl]);

    if (!user || !['pharmacist', 'pharmacy technician', 'admin'].includes(user.role)) {
        return null;
    }

    return (
        <div className="relative pharmacy-notification">
            <button 
                className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full focus:outline-none focus:ring transition-colors"
                onClick={() => setShowDropdown(!showDropdown)}
                title="Pharmacy Notifications"
            >
                <FaBell size={20} />
                {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full border-2 border-white pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                        {notifications.length}
                    </span>
                )}
            </button>

            {showDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-100">
                    <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <span className="font-semibold text-gray-700 text-sm">Inventory Alerts</span>
                    </div>
                    {notifications.length > 0 ? notifications.map(note => (
                        <div 
                            key={note.id} 
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex gap-3 items-start border-b border-gray-50 last:border-b-0"
                            onClick={() => {
                                setShowDropdown(false);
                                navigate('/pharmacy/inventory');
                            }}
                        >
                            <div className="mt-0.5">{note.icon}</div>
                            <p className="text-sm text-gray-700">{note.text}</p>
                        </div>
                    )) : (
                        <div className="px-4 py-4 text-center text-gray-500 text-sm">
                            No inventory alerts right now.
                        </div>
                    )}
                    <div className="px-4 py-2 text-center border-t border-gray-100">
                        <button 
                            className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
                            onClick={() => {
                                setShowDropdown(false);
                                navigate('/pharmacy/inventory');
                            }}
                        >
                            View Full Inventory
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PharmacyNotification;

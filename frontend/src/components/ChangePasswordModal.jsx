import React, { useState, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContext } from '../context/AppContext';
import AuthContext from '../context/AuthContext';
import { FaTimes, FaLock, FaSave } from 'react-icons/fa';

const ChangePasswordModal = ({ isOpen, onClose }) => {
    const { backendUrl } = useContext(AppContext);
    const { user } = useContext(AuthContext);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('New password must be at least 6 characters');
            return;
        }

        try {
            setLoading(true);
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const { data } = await axios.put(
                `${backendUrl}/api/users/profile/password`,
                { currentPassword, newPassword },
                config
            );

            toast.success(data.message || 'Password changed successfully');
            
            // Clear form and close
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error changing password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                <div className="bg-green-700 text-white p-4 flex justify-between items-center">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <FaLock /> Change Password
                    </h3>
                    <button onClick={onClose} className="hover:text-red-300 transition">
                        <FaTimes size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold mb-1 text-gray-700">Current Password</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full border border-gray-300 bg-white text-gray-900 p-2 rounded focus:ring-2 focus:ring-green-500 outline-none"
                            placeholder="Enter current password"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1 text-gray-700">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full border border-gray-300 bg-white text-gray-900 p-2 rounded focus:ring-2 focus:ring-green-500 outline-none"
                            placeholder="Enter new password (min. 6 chars)"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1 text-gray-700">Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full border border-gray-300 bg-white text-gray-900 p-2 rounded focus:ring-2 focus:ring-green-500 outline-none"
                            placeholder="Confirm new password"
                            required
                        />
                    </div>

                    <div className="mt-6 flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition flex items-center gap-2"
                            disabled={loading}
                        >
                            <FaSave /> {loading ? 'Saving...' : 'Change Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;

import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { FaTimes, FaUserPlus, FaUserFriends } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { nigeriaData } from '../data/nigeriaData';

const RegisterPatientModal = ({ isOpen, onClose, onSuccess, userToken }) => {
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        gender: 'male',
        contact: '',
        address: '',
        state: '',
        lga: '',
        provider: 'Standard',
        hmo: '',
        insuranceNumber: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        isFamilyMember: false,
        familyFileId: ''
    });
    const { backendUrl } = useContext(AppContext);
    const [loading, setLoading] = useState(false);
    const [hmos, setHmos] = useState([]);
    const [familyFiles, setFamilyFiles] = useState([]);
    const [availableLgas, setAvailableLgas] = useState([]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'state') {
            const selectedState = nigeriaData.find(item => item.state === value);
            setAvailableLgas(selectedState ? selectedState.lgas : []);
            setFormData(prev => ({
                ...prev,
                state: value,
                lga: ''
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    // Fetch active HMOs and Family Files when component mounts
    useEffect(() => {
        if (userToken && isOpen) {
            fetchHMOs();
            fetchFamilyFiles();
        }
    }, [userToken, isOpen]);

    const fetchHMOs = async () => {
        if (!userToken) return;
        try {
            const config = { headers: { Authorization: `Bearer ${userToken}` } };
            const { data } = await axios.get(`${backendUrl}/api/hmos?active=true`, config);
            setHmos(data);
        } catch (error) {
            console.error('Error fetching HMOs:', error);
        }
    };

    const fetchFamilyFiles = async () => {
        if (!userToken) return;
        try {
            const config = { headers: { Authorization: `Bearer ${userToken}` } };
            // Fetching all files to be sure
            const { data } = await axios.get(`${backendUrl}/api/family-files`, config);
            console.log('API Response (Family Files):', data);
            
            if (Array.isArray(data)) {
                // Filter active ones locally if needed
                const activeFiles = data.filter(f => f.active !== false);
                setFamilyFiles(activeFiles);
            } else {
                console.warn('Family File API did not return an array');
                setFamilyFiles([]);
            }
        } catch (error) {
            console.error('Error fetching family files:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate HMO field for Retainership, NHIA and KSCHMA
        if ((formData.provider === 'Retainership' || formData.provider === 'NHIA' || formData.provider === 'KSCHMA') && !formData.hmo) {
            toast.error('HMO is required for Retainership, NHIA and KSCHMA providers');
            return;
        }

        // Validate Family File if checked
        if (formData.isFamilyMember && !formData.familyFileId) {
            toast.error('Please select a Family File');
            return;
        }

        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${userToken}` } };

            const dataToSend = { ...formData };
            if (formData.provider === 'Standard') {
                delete dataToSend.hmo;
            }

            const { data: newPatient } = await axios.post(`${backendUrl}/api/patients`, dataToSend, config);
            toast.success('Patient registered successfully!');

            // Reset form
            setFormData({
                name: '',
                age: '',
                gender: 'male',
                contact: '',
                address: '',
                state: '',
                lga: '',
                provider: 'Standard',
                hmo: '',
                insuranceNumber: '',
                emergencyContactName: '',
                emergencyContactPhone: '',
                isFamilyMember: false,
                familyFileId: ''
            });
            setAvailableLgas([]);

            if (onSuccess) onSuccess(newPatient);
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error registering patient');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="bg-green-600 text-white p-4 rounded-t-lg flex justify-between items-center sticky top-0 z-10">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <FaUserPlus /> Register New Patient
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-gray-200"
                        type="button"
                    >
                        <FaTimes size={24} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Family File Section */}
                        <div className="bg-blue-50 p-4 rounded border border-blue-100">
                            <div className="flex items-center gap-2 mb-3">
                                <input
                                    type="checkbox"
                                    name="isFamilyMember"
                                    id="isFamilyMemberModal"
                                    checked={formData.isFamilyMember}
                                    onChange={handleChange}
                                    className="w-5 h-5 text-blue-600"
                                />
                                <label htmlFor="isFamilyMemberModal" className="font-bold text-blue-800 cursor-pointer flex items-center gap-2">
                                    <FaUserFriends /> Belong to Family File?
                                </label>
                            </div>

                            {formData.isFamilyMember && (
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                                    <div className="md:col-span-3">
                                        <label className="block text-sm font-semibold text-blue-700 mb-1">Select Family File *</label>
                                        <select
                                            name="familyFileId"
                                            required={formData.isFamilyMember}
                                            value={formData.familyFileId}
                                            onChange={handleChange}
                                            className="w-full border p-2 rounded bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">-- Choose Family --</option>
                                            {familyFiles.length === 0 ? (
                                                <option disabled>No families found</option>
                                            ) : (
                                                familyFiles.map(file => (
                                                    <option key={file._id} value={file._id} disabled={file.type === 'Family of 5' && file.memberCount >= 5}>
                                                        {file.familyName} ({file.fileNumber}) - {file.memberCount}/{file.type === 'Family of 5' ? '5' : '∞'}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={fetchFamilyFiles}
                                        className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 text-sm h-[42px] flex items-center justify-center"
                                        title="Refresh List"
                                    >
                                        ↻ Refresh
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-semibold mb-1">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded"
                                    required
                                />
                            </div>

                            {/* Age */}
                            <div>
                                <label className="block text-sm font-semibold mb-1">
                                    Age <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded"
                                    required
                                    min="0"
                                />
                            </div>

                            {/* Gender */}
                            <div>
                                <label className="block text-sm font-semibold mb-1">
                                    Gender <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded"
                                >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            {/* Contact */}
                            <div>
                                <label className="block text-sm font-semibold mb-1">
                                    Contact Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="contact"
                                    value={formData.contact}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded"
                                    required
                                />
                            </div>
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-sm font-semibold mb-1">Address</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="w-full border p-2 rounded"
                            />
                        </div>

                        {/* State and LGA */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold mb-1">State</label>
                                <select
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded"
                                >
                                    <option value="">Select State</option>
                                    {nigeriaData.map((item) => (
                                        <option key={item.state} value={item.state}>{item.state}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">LGA</label>
                                <select
                                    name="lga"
                                    value={formData.lga}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded"
                                    disabled={!formData.state}
                                >
                                    <option value="">Select LGA</option>
                                    {availableLgas.map((lga) => (
                                        <option key={lga} value={lga}>{lga}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Provider & Insurance Section */}
                        <div className="border-t pt-4">
                            <h4 className="font-semibold text-gray-700 mb-3 border-b pb-1">Provider Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Provider */}
                                <div>
                                    <label className="block text-sm font-semibold mb-1">
                                        Provider <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="provider"
                                        value={formData.provider}
                                        onChange={handleChange}
                                        className="w-full border p-2 rounded"
                                    >
                                        <option value="Standard">Standard</option>
                                        <option value="Retainership">Retainership</option>
                                        <option value="NHIA">NHIA</option>
                                        <option value="KSCHMA">KSCHMA</option>
                                    </select>
                                </div>

                                {/* HMO - Shown for Retainership, NHIA and KSCHMA */}
                                {(formData.provider === 'Retainership' || formData.provider === 'NHIA' || formData.provider === 'KSCHMA') && (
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">
                                            HMO <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="hmo"
                                            value={formData.hmo}
                                            onChange={handleChange}
                                            className="w-full border p-2 rounded"
                                            required={formData.provider === 'Retainership' || formData.provider === 'NHIA' || formData.provider === 'KSCHMA'}
                                        >
                                            <option value="">Select HMO *</option>
                                            {hmos
                                                .filter(hmo => {
                                                    // Strict filtering based on category for NHIA and Retainership
                                                    if (formData.provider === 'NHIA' || formData.provider === 'Retainership') {
                                                        return hmo.category === formData.provider;
                                                    }
                                                    // For KSCHMA, show only KSCHMA HMO
                                                    if (formData.provider === 'KSCHMA') {
                                                        return hmo.name.toUpperCase() === 'KSCHMA';
                                                    }
                                                    return true;
                                                })
                                                .map(hmo => (
                                                    <option key={hmo._id} value={hmo.name}>
                                                        {hmo.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                )}

                                {/* Insurance Number - Visible & Required only for NHIA and KSCHMA */}
                                {(formData.provider === 'NHIA' || formData.provider === 'KSCHMA') && (
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">
                                            Insurance Number <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="insuranceNumber"
                                            value={formData.insuranceNumber}
                                            onChange={handleChange}
                                            className="w-full border p-2 rounded"
                                            required
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Emergency Contact Section */}
                        <div className="border-t pt-4">
                            <h4 className="font-semibold text-gray-700 mb-3 border-b pb-1">Emergency Contact</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Emergency Contact Name */}
                                <div>
                                    <label className="block text-sm font-semibold mb-1">
                                        Emergency Contact Name
                                    </label>
                                    <input
                                        type="text"
                                        name="emergencyContactName"
                                        value={formData.emergencyContactName}
                                        onChange={handleChange}
                                        className="w-full border p-2 rounded"
                                    />
                                </div>

                                {/* Emergency Contact Phone */}
                                <div>
                                    <label className="block text-sm font-semibold mb-1">
                                        Emergency Contact Phone
                                    </label>
                                    <input
                                        type="text"
                                        name="emergencyContactPhone"
                                        value={formData.emergencyContactPhone}
                                        onChange={handleChange}
                                        className="w-full border p-2 rounded"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex gap-3 pt-4 sticky bottom-0 bg-white py-2 z-10 border-t">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-2 font-bold shadow"
                            >
                                <FaUserPlus /> {loading ? 'Registering...' : 'Register Patient'}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 bg-gray-400 text-white py-2 rounded hover:bg-gray-500 font-bold"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RegisterPatientModal;

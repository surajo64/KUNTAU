import { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import LoadingOverlay from '../components/loadingOverlay';
import { toast } from 'react-toastify';

const RegisterPatient = () => {
    const [loading, setLoading] = useState(false);
    const [familyFiles, setFamilyFiles] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        gender: 'male',
        contact: '',
        address: '',
        medicalHistory: '',
        isFamilyMember: false,
        familyFileId: ''
    });
    const { user } = useContext(AuthContext);
    const { backendUrl } = useContext(AppContext);
    const navigate = useNavigate();

    useEffect(() => {
        fetchFamilyFiles();
    }, []);

    const fetchFamilyFiles = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${backendUrl}/api/family-files?active=true`, config);
            setFamilyFiles(data);
        } catch (error) {
            console.error('Error fetching family files:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ 
            ...formData, 
            [name]: type === 'checkbox' ? checked : value 
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            
            const payload = {
                ...formData,
                medicalHistory: formData.medicalHistory ? formData.medicalHistory.split(',') : []
            };

            await axios.post(`${backendUrl}/api/patients`, payload, config);
            toast.success('Patient Registered Successfully');
            navigate('/patients');
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error registering patient');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            {loading && <LoadingOverlay />}
            <div className="max-w-2xl mx-auto bg-white p-8 rounded shadow">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Register New Patient</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded mb-4">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                name="isFamilyMember"
                                id="isFamilyMember"
                                checked={formData.isFamilyMember}
                                onChange={handleChange}
                                className="w-5 h-5 text-green-600"
                            />
                            <label htmlFor="isFamilyMember" className="font-semibold text-gray-700 cursor-pointer">
                                Belong to Family File?
                            </label>
                        </div>

                        {formData.isFamilyMember && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Select Family File *</label>
                                <select
                                    name="familyFileId"
                                    required={formData.isFamilyMember}
                                    value={formData.familyFileId}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded bg-white shadow-sm focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="">-- Choose Family --</option>
                                    {familyFiles.map(file => (
                                        <option key={file._id} value={file._id} disabled={file.type === 'Family of 5' && file.memberCount >= 5}>
                                            {file.familyName} ({file.fileNumber}) - {file.memberCount}/{file.type === 'Family of 5' ? '5' : '∞'}
                                        </option>
                                    ))}
                                </select>
                                {formData.familyFileId && familyFiles.find(f => f._id === formData.familyFileId)?.type === 'Family of 5' && (
                                    <p className="text-xs text-blue-600 mt-1 italic">
                                        This is a Family of 5 file.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-gray-700 font-semibold mb-1">Full Name *</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-700 font-semibold mb-1">Age *</label>
                            <input type="number" name="age" value={formData.age} onChange={handleChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500" required />
                        </div>
                        <div>
                            <label className="block text-gray-700 font-semibold mb-1">Gender *</label>
                            <select name="gender" value={formData.gender} onChange={handleChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500">
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-700 font-semibold mb-1">Contact *</label>
                        <input type="text" name="contact" value={formData.contact} onChange={handleChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500" required />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-semibold mb-1">Address</label>
                        <textarea name="address" value={formData.address} onChange={handleChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500"></textarea>
                    </div>
                    <div>
                        <label className="block text-gray-700 font-semibold mb-1">Medical History (comma separated)</label>
                        <input type="text" name="medicalHistory" value={formData.medicalHistory} onChange={handleChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500" />
                    </div>
                    <button type="submit" className="w-full bg-green-600 text-white p-3 rounded hover:bg-green-700 font-bold shadow-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] mt-4">
                        Register Patient
                    </button>
                </form>
            </div>
        </Layout>
    );
};

export default RegisterPatient;

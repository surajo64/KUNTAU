import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import AuthContext from '../context/AuthContext';
import Layout from '../components/Layout';
import { FaHospital, FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaDownload, FaUpload, FaSearch, FaEye, FaUsers } from 'react-icons/fa';
import { toast } from 'react-toastify';
import LoadingOverlay from '../components/loadingOverlay';
import * as XLSX from 'xlsx';
import { Link } from 'react-router-dom';

const HMOManagement = () => {
    const [loading, setLoading] = useState(false);
    const [hmos, setHmos] = useState([]);
    const [filteredHMOs, setFilteredHMOs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterRetainershipType, setFilterRetainershipType] = useState('all');
    
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [retainershipCharges, setRetainershipCharges] = useState([]);
    const [currentHMO, setCurrentHMO] = useState({
        name: '',
        code: '',
        category: 'Retainership',
        retainershipType: '',
        registrationCharge: 0,
        registrationChargeRef: '',
        description: '',
        contactPerson: '',
        contactPhone: '',
        contactEmail: ''
    });

    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedHMOForDetail, setSelectedHMOForDetail] = useState(null);
    const [hmoPatients, setHmoPatients] = useState([]);

    const { user } = useContext(AuthContext);
    const { backendUrl } = useContext(AppContext);

    useEffect(() => {
        if (user && (user.role === 'admin' || user.role === 'super_admin' || user.role === 'receptionist')) {
            fetchHMOs();
            fetchRetainershipCharges();
        }
    }, [user]);

    useEffect(() => {
        filterHMOData();
    }, [searchTerm, filterCategory, filterRetainershipType, hmos]);

    const filterHMOData = () => {
        let filtered = hmos;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(hmo =>
                hmo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (hmo.code && hmo.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (hmo.contactPerson && hmo.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Category filter
        if (filterCategory !== 'all') {
            filtered = filtered.filter(hmo => hmo.category === filterCategory);
        }

        // Retainership Type filter
        if (filterCategory === 'Retainership' && filterRetainershipType !== 'all') {
            filtered = filtered.filter(hmo => hmo.retainershipType === filterRetainershipType);
        }

        setFilteredHMOs(filtered);
    };

    const fetchHMOs = async () => {
        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${backendUrl}/api/hmos`, config);
            setHmos(data);
            setFilteredHMOs(data);
        } catch (error) {
            console.error(error);
            toast.error('Error fetching HMOs');
        } finally {
            setLoading(false);
        }
    };

    const fetchRetainershipCharges = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${backendUrl}/api/charges`, config);
            const filtered = data.filter(c => c.type === 'retainership' && c.active);
            setRetainershipCharges(filtered);
        } catch (error) {
            console.error(error);
            toast.error('Error fetching retainership charges');
        }
    };

    const handleOpenModal = async (hmo = null) => {
        if (hmo) {
            setEditMode(true);
            setCurrentHMO({
                ...hmo,
                registrationChargeRef: hmo.registrationChargeRef?._id || hmo.registrationChargeRef || ''
            });
        } else {
            setEditMode(false);
            try {
                setLoading(true);
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const { data } = await axios.get(`${backendUrl}/api/hmos/next-code?category=Retainership`, config);
                setCurrentHMO({
                    name: '',
                    code: data.nextCode,
                    category: 'Retainership',
                    retainershipType: '',
                    registrationCharge: 0,
                    registrationChargeRef: '',
                    description: '',
                    contactPerson: '',
                    contactPhone: '',
                    contactEmail: ''
                });
            } catch (error) {
                console.error('Error fetching next code:', error);
                setCurrentHMO({
                    name: '',
                    code: 'AUTO-GENERATED',
                    category: 'Retainership',
                    retainershipType: '',
                    registrationCharge: 0,
                    registrationChargeRef: '',
                    description: '',
                    contactPerson: '',
                    contactPhone: '',
                    contactEmail: ''
                });
            } finally {
                setLoading(false);
            }
        }
        setShowModal(true);
    };

    const handleCategoryChange = async (category) => {
        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${backendUrl}/api/hmos/next-code?category=${category}`, config);
            setCurrentHMO({
                ...currentHMO,
                category,
                code: data.nextCode,
                retainershipType: category !== 'Retainership' ? '' : currentHMO.retainershipType,
                registrationCharge: category !== 'Retainership' ? 0 : currentHMO.registrationCharge,
                registrationChargeRef: category !== 'Retainership' ? '' : currentHMO.registrationChargeRef
            });
        } catch (error) {
            console.error('Error fetching next code:', error);
            setCurrentHMO({
                ...currentHMO,
                category,
                code: 'AUTO-GENERATED',
                retainershipType: category !== 'Retainership' ? '' : currentHMO.retainershipType,
                registrationCharge: category !== 'Retainership' ? 0 : currentHMO.registrationCharge,
                registrationChargeRef: category !== 'Retainership' ? '' : currentHMO.registrationChargeRef
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditMode(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (currentHMO.category === 'Retainership' && !currentHMO.registrationChargeRef) {
            toast.error('Please select a registration charge plan');
            return;
        }

        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const payload = { ...currentHMO };
            
            if (!editMode && payload.code === 'AUTO-GENERATED') {
                delete payload.code;
            }

            if (editMode) {
                await axios.put(`${backendUrl}/api/hmos/${currentHMO._id}`, payload, config);
                toast.success('HMO updated successfully');
            } else {
                await axios.post(`${backendUrl}/api/hmos`, payload, config);
                toast.success('HMO created successfully');
            }

            handleCloseModal();
            fetchHMOs();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error saving HMO');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (hmo) => {
        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.patch(`${backendUrl}/api/hmos/${hmo._id}/toggle-status`, {}, config);
            toast.success(`HMO ${hmo.active ? 'deactivated' : 'activated'} successfully`);
            fetchHMOs();
        } catch (error) {
            console.error(error);
            toast.error('Error toggling HMO status');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this HMO?')) return;

        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.delete(`${backendUrl}/api/hmos/${id}`, config);
            toast.success('HMO deleted successfully');
            fetchHMOs();
        } catch (error) {
            console.error(error);
            toast.error('Error deleting HMO');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetail = async (hmo) => {
        try {
            setLoading(true);
            setSelectedHMOForDetail(hmo);
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            
            // Fetch all patients and filter by this HMO
            const { data } = await axios.get(`${backendUrl}/api/patients`, config);
            
            // Patients are linked by provider (Retainership, NHIA, KSCHMA) 
            // and hmo (which stores the name of the HMO/Entity)
            const filtered = data.filter(p => 
                (p.provider === hmo.category || (hmo.category === 'State Scheme' && p.provider === 'KSCHMA')) && 
                p.hmo === hmo.name
            );
            
            setHmoPatients(filtered);
            setShowDetailModal(true);
        } catch (error) {
            console.error(error);
            toast.error('Error fetching patient list');
        } finally {
            setLoading(false);
        }
    };

    const handleExportToExcel = () => {
        const exportData = filteredHMOs.map(hmo => ({
            'Name': hmo.name,
            'Category': hmo.category,
            'Type': hmo.retainershipType || 'N/A',
            'Code': hmo.code || '',
            'Description': hmo.description || '',
            'Contact Person': hmo.contactPerson || '',
            'Contact Phone': hmo.contactPhone || '',
            'Contact Email': hmo.contactEmail || '',
            'Status': hmo.active ? 'Active' : 'Inactive'
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'HMOs');
        XLSX.writeFile(wb, `HMOs_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success('HMO list exported');
    };

    const handleDownloadTemplate = () => {
        const templateData = [{
            'HMO Name': 'Example HMO',
            'Category': 'Retainership',
            'Code': 'RTN001',
            'Description': 'Example description',
            'Contact Person': 'John Doe',
            'Contact Phone': '08012345678',
            'Contact Email': 'contact@hmo.com'
        }];

        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, 'HMO_Import_Template.xlsx');
        toast.success('Template downloaded');
    };

    const handleImportExcel = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const formData = new FormData();
            formData.append('file', file);

            const importConfig = {
                headers: {
                    ...config.headers,
                    'Content-Type': 'multipart/form-data'
                }
            };

            const { data } = await axios.post(`${backendUrl}/api/hmos/import-excel`, formData, importConfig);
            toast.success(data.message);
            fetchHMOs();
            e.target.value = '';
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error importing HMOs');
        } finally {
            setLoading(false);
        }
    };

    if (!user || (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'receptionist')) {
        return (
            <Layout>
                <div className="bg-red-50 border border-red-200 p-6 rounded">
                    <h2 className="text-xl font-bold text-red-800">Access Denied</h2>
                    <p className="text-red-600">You do not have permission to access HMO management.</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            {loading && <LoadingOverlay />}
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-lg">
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                        <FaHospital /> HMO / Retainership Management
                    </h1>
                    <p className="text-blue-100">Manage Health Maintenance Organizations and Corporate / Family Retainerships</p>
                </div>

                {/* Actions Bar & Filters */}
                <div className="bg-white p-6 rounded-lg shadow space-y-4">
                    <div className="flex flex-wrap gap-4 items-center justify-between border-b pb-4">
                        <div className="flex-1 min-w-[300px]">
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by Name, Code or Contact..."
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                            <button onClick={() => handleOpenModal()} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2">
                                <FaPlus /> Add New
                            </button>
                            <button onClick={handleDownloadTemplate} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 flex items-center gap-2">
                                <FaDownload /> Template
                            </button>
                            <label className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2 cursor-pointer">
                                <FaUpload /> Import
                                <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="hidden" />
                            </label>
                            <button onClick={handleExportToExcel} className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center gap-2">
                                <FaDownload /> Export
                            </button>
                        </div>
                    </div>

                    {/* Quick Filters */}
                    <div className="flex flex-wrap gap-4 items-center bg-gray-50 p-3 rounded">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-bold text-gray-600">Category:</label>
                            <select 
                                value={filterCategory} 
                                onChange={(e) => {
                                    setFilterCategory(e.target.value);
                                    setFilterRetainershipType('all');
                                }}
                                className="border p-1.5 rounded text-sm bg-white"
                            >
                                <option value="all">All Categories</option>
                                <option value="Retainership">Retainership</option>
                                <option value="NHIA">NHIA</option>
                                <option value="State Scheme">State Scheme</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        {filterCategory === 'Retainership' && (
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-bold text-gray-600">Type:</label>
                                <select 
                                    value={filterRetainershipType} 
                                    onChange={(e) => setFilterRetainershipType(e.target.value)}
                                    className="border p-1.5 rounded text-sm bg-white"
                                >
                                    <option value="all">All Types</option>
                                    <option value="Family">Family</option>
                                    <option value="Corporate">Corporate</option>
                                </select>
                            </div>
                        )}

                        <div className="ml-auto text-sm text-gray-500 font-medium">
                            Showing {filteredHMOs.length} of {hmos.length} entries
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name / Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reg. Fee</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredHMOs.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No records found</td>
                                    </tr>
                                ) : (
                                    filteredHMOs.map((hmo) => (
                                        <tr key={hmo._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-gray-900">{hmo.name}</div>
                                                <div className="flex items-center gap-1">
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                                                        hmo.category === 'Retainership' ? 'bg-purple-100 text-purple-700' :
                                                        hmo.category === 'NHIA' ? 'bg-green-100 text-green-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        {hmo.category}
                                                    </span>
                                                    {hmo.retainershipType && (
                                                        <span className="text-[10px] text-gray-500 italic">({hmo.retainershipType})</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono font-bold">
                                                {hmo.code || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                                                {hmo.registrationCharge > 0 ? `₦${hmo.registrationCharge.toLocaleString()}` : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div>{hmo.contactPerson || '-'}</div>
                                                <div className="text-xs">{hmo.contactPhone}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${hmo.active
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {hmo.active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleViewDetail(hmo)}
                                                        className="text-indigo-600 hover:text-indigo-900 border border-indigo-200 p-1.5 rounded bg-indigo-50"
                                                        title="View Attached Patients"
                                                    >
                                                        <FaUsers />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenModal(hmo)}
                                                        className="text-blue-600 hover:text-blue-900 border border-blue-200 p-1.5 rounded bg-blue-50"
                                                        title="Edit"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(hmo)}
                                                        className={hmo.active ? 'text-orange-600 hover:text-orange-900 border border-orange-200 p-1.5 rounded bg-orange-50' : 'text-green-600 hover:text-green-900 border border-green-200 p-1.5 rounded bg-green-50'}
                                                        title={hmo.active ? 'Deactivate' : 'Activate'}
                                                    >
                                                        {hmo.active ? <FaToggleOn /> : <FaToggleOff />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(hmo._id)}
                                                        className="text-red-600 hover:text-red-900 border border-red-200 p-1.5 rounded bg-red-50"
                                                        title="Delete"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Detail Modal (Patient List) */}
            {showDetailModal && selectedHMOForDetail && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                        <div className="bg-indigo-600 text-white p-4 rounded-t-lg flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <FaUsers /> {selectedHMOForDetail.name} - Attached Patients
                                </h3>
                                <p className="text-xs text-indigo-100">{selectedHMOForDetail.category} {selectedHMOForDetail.retainershipType ? `(${selectedHMOForDetail.retainershipType})` : ''}</p>
                            </div>
                            <button onClick={() => setShowDetailModal(false)} className="text-white hover:text-gray-200 text-2xl">×</button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto">
                            {hmoPatients.length === 0 ? (
                                <div className="text-center py-12">
                                    <FaUsers className="text-gray-200 text-6xl mx-auto mb-4" />
                                    <p className="text-gray-500 font-medium">No patients currently attached to this entity.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm font-bold text-gray-600 border-b pb-2">
                                        <span>Showing {hmoPatients.length} Patients</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {hmoPatients.map(patient => (
                                            <div key={patient._id} className="border rounded-lg p-4 flex justify-between items-center hover:shadow-md transition-shadow">
                                                <div>
                                                    <p className="font-bold text-gray-900">{patient.name}</p>
                                                    <p className="text-xs font-mono text-blue-600 font-bold">{patient.mrn}</p>
                                                    <div className="flex gap-2 text-[10px] mt-1">
                                                        <span className="text-gray-500">{patient.gender} | {patient.age}yrs</span>
                                                        <span className="text-gray-500">{patient.contact}</span>
                                                    </div>
                                                </div>
                                                <Link 
                                                    to={`/patient/${patient._id}`}
                                                    className="bg-indigo-50 text-indigo-600 p-2 rounded hover:bg-indigo-600 hover:text-white transition-colors"
                                                    title="Go to Profile"
                                                >
                                                    <FaEye />
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t bg-gray-50 flex justify-end">
                            <button 
                                onClick={() => setShowDetailModal(false)}
                                className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 font-bold text-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Creation/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <FaHospital /> {editMode ? 'Edit Record' : 'Add New Record'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-white hover:text-gray-200 text-2xl">×</button>
                        </div>

                        <div className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Category *</label>
                                        <select
                                            value={currentHMO.category}
                                            onChange={(e) => handleCategoryChange(e.target.value)}
                                            className="w-full border p-2 rounded"
                                            required
                                        >
                                            <option value="Retainership">Retainership</option>
                                            <option value="NHIA">NHIA</option>
                                            <option value="State Scheme">State Scheme</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Code (Auto-generated)</label>
                                        <input
                                            type="text"
                                            disabled
                                            className="w-full border p-2 rounded bg-gray-100 font-mono text-blue-700 font-bold"
                                            value={currentHMO.code}
                                        />
                                    </div>
                                </div>

                                {currentHMO.category === 'Retainership' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-purple-50 p-4 rounded-lg border border-purple-100">
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Retainership Type *</label>
                                            <select
                                                value={currentHMO.retainershipType}
                                                onChange={(e) => setCurrentHMO({ 
                                                    ...currentHMO, 
                                                    retainershipType: e.target.value,
                                                    registrationChargeRef: '',
                                                    registrationCharge: 0
                                                })}
                                                className="w-full border p-2 rounded"
                                                required
                                            >
                                                <option value="">-- Select Type --</option>
                                                <option value="Family">Family</option>
                                                <option value="Corporate">Corporate</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">File Opening Charge *</label>
                                            <select
                                                required
                                                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                                                value={currentHMO.registrationChargeRef}
                                                onChange={(e) => {
                                                    const selectedCharge = retainershipCharges.find(c => c._id === e.target.value);
                                                    if (selectedCharge) {
                                                        setCurrentHMO({
                                                            ...currentHMO,
                                                            registrationChargeRef: selectedCharge._id,
                                                            registrationCharge: selectedCharge.standardFee || selectedCharge.basePrice || 0
                                                        });
                                                    } else {
                                                        setCurrentHMO({ ...currentHMO, registrationChargeRef: '', registrationCharge: 0 });
                                                    }
                                                }}
                                                disabled={!currentHMO.retainershipType}
                                            >
                                                <option value="">-- Select a Charge --</option>
                                                {retainershipCharges
                                                    .filter(charge => 
                                                        !currentHMO.retainershipType || 
                                                        charge.name.toLowerCase().includes(currentHMO.retainershipType.toLowerCase())
                                                    )
                                                    .map(charge => (
                                                        <option key={charge._id} value={charge._id}>
                                                            {charge.name} (₦{(charge.standardFee || charge.basePrice).toLocaleString()})
                                                        </option>
                                                    ))
                                                }
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-semibold mb-1">
                                        {currentHMO.category === 'Retainership' ? 'Retainership Name' : 'HMO Name'} *
                                    </label>
                                    <input
                                        type="text"
                                        value={currentHMO.name}
                                        onChange={(e) => setCurrentHMO({ ...currentHMO, name: e.target.value })}
                                        className="w-full border p-2 rounded"
                                        placeholder={currentHMO.category === 'Retainership' ? 'e.g. Dangote Family Retainership' : 'e.g. Hygeia HMO'}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-1">Description</label>
                                    <textarea
                                        value={currentHMO.description}
                                        onChange={(e) => setCurrentHMO({ ...currentHMO, description: e.target.value })}
                                        className="w-full border p-2 rounded"
                                        rows="3"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Contact Person</label>
                                        <input
                                            type="text"
                                            value={currentHMO.contactPerson}
                                            onChange={(e) => setCurrentHMO({ ...currentHMO, contactPerson: e.target.value })}
                                            className="w-full border p-2 rounded"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Contact Phone</label>
                                        <input
                                            type="text"
                                            value={currentHMO.contactPhone}
                                            onChange={(e) => setCurrentHMO({ ...currentHMO, contactPhone: e.target.value })}
                                            className="w-full border p-2 rounded"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-1">Contact Email</label>
                                    <input
                                        type="email"
                                        value={currentHMO.contactEmail}
                                        onChange={(e) => setCurrentHMO({ ...currentHMO, contactEmail: e.target.value })}
                                        className="w-full border p-2 rounded"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-bold">
                                        {editMode ? 'Update' : 'Create'}
                                    </button>
                                    <button type="button" onClick={handleCloseModal} className="flex-1 bg-gray-400 text-white py-2 rounded hover:bg-gray-500 font-bold">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default HMOManagement;

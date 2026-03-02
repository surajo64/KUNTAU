import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import Layout from '../components/Layout';
import { FaUserInjured, FaSearch, FaEdit, FaTrash, FaEye, FaCalendar, FaDownload, FaHospital, FaCalendarCheck, FaTimes, FaBed } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import LoadingOverlay from '../components/loadingOverlay';
import RegisterPatientModal from '../components/RegisterPatientModal';

const PatientManagement = () => {
    const [loading, setLoading] = useState(false);
    const [patients, setPatients] = useState([]);
    const [filteredPatients, setFilteredPatients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const PATIENTS_PER_PAGE = 5;
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [encounters, setEncounters] = useState([]);
    const [showEncountersModal, setShowEncountersModal] = useState(false);
    const [showEditPatientModal, setShowEditPatientModal] = useState(false);
    const [showRegisterPatientModal, setShowRegisterPatientModal] = useState(false);
    const [editPatient, setEditPatient] = useState(null);
    const [hmos, setHMOs] = useState([]);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Create Encounter Modal State
    const [showEncounterModal, setShowEncounterModal] = useState(false);
    const [encounterPatient, setEncounterPatient] = useState(null);
    const [encounterType, setEncounterType] = useState('Outpatient');
    const [selectedClinic, setSelectedClinic] = useState('');
    const [reasonForVisit, setReasonForVisit] = useState('');
    const [charges, setCharges] = useState([]);
    const [clinics, setClinics] = useState([]);
    const [selectedCharges, setSelectedCharges] = useState([]);
    const [wards, setWards] = useState([]);
    const [availableBeds, setAvailableBeds] = useState([]);
    const [selectedWard, setSelectedWard] = useState('');
    const [selectedBed, setSelectedBed] = useState('');
    const [pendingEncounterPatient, setPendingEncounterPatient] = useState(null);

    // Watch for pending encounter patient and register modal closing
    useEffect(() => {
        if (pendingEncounterPatient && !showRegisterPatientModal) {
            setEncounterPatient(pendingEncounterPatient);
            setEncounterType('Outpatient');
            setSelectedClinic('');
            setReasonForVisit('');
            setSelectedCharges([]);
            setSelectedWard('');
            setSelectedBed('');
            setShowEncounterModal(true);
            setPendingEncounterPatient(null);
        }
    }, [pendingEncounterPatient, showRegisterPatientModal]);

    useEffect(() => {
        if (user && (user.role === 'admin' || user.role === 'receptionist')) {
            fetchPatients();
            fetchHMOs();
            fetchClinics();
            fetchCharges();
            fetchWards();
        }
    }, [user]);

    useEffect(() => {
        if (selectedWard) {
            const ward = wards.find(w => w._id === selectedWard);
            if (ward) setAvailableBeds(ward.beds.filter(b => !b.isOccupied));
        } else {
            setAvailableBeds([]);
        }
    }, [selectedWard, wards]);

    useEffect(() => {
        filterPatients();
    }, [searchTerm, startDate, endDate, patients]);

    const fetchPatients = async () => {
        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get('http://localhost:5000/api/patients', config);
            setPatients(data);
            setFilteredPatients(data);
        } catch (error) {
            console.error(error);
            toast.error('Error fetching patients');
        } finally {
            setLoading(false);
        }
    };

    const fetchHMOs = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get('http://localhost:5000/api/hmos?active=true', config);
            setHMOs(data);
        } catch (error) {
            console.error('Error fetching HMOs:', error);
        }
    };

    const fetchClinics = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get('http://localhost:5000/api/clinics?active=true', config);
            setClinics(data);
        } catch (error) {
            console.error('Error fetching clinics:', error);
        }
    };

    const fetchCharges = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get('http://localhost:5000/api/charges?active=true', config);
            setCharges(data.filter(c => c.type === 'consultation'));
        } catch (error) {
            console.error('Error fetching charges:', error);
        }
    };

    const fetchWards = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get('http://localhost:5000/api/wards', config);
            setWards(data);
        } catch (error) {
            console.error('Error fetching wards:', error);
        }
    };

    const closeEncounterModal = () => {
        setShowEncounterModal(false);
        setEncounterPatient(null);
        setEncounterType('Outpatient');
        setSelectedClinic('');
        setReasonForVisit('');
        setSelectedCharges([]);
        setSelectedWard('');
        setSelectedBed('');
    };

    const handleChargeToggle = (chargeId) => {
        setSelectedCharges(prev =>
            prev.includes(chargeId) ? prev.filter(id => id !== chargeId) : [...prev, chargeId]
        );
    };

    const handleCreateEncounter = async () => {
        if (!encounterPatient) return;
        if (encounterType !== 'External Investigation' && encounterType !== 'Inpatient' && selectedCharges.length === 0) {
            toast.error('Please select at least one charge');
            return;
        }
        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const visitData = {
                patientId: encounterPatient._id,
                doctorId: user._id,
                type: encounterType,
                encounterType: encounterType,
                clinic: selectedClinic || undefined,
                subjective: 'Encounter created at Front Desk',
                reasonForVisit,
                encounterStatus: 'registered',
                ward: encounterType === 'Inpatient' ? selectedWard : undefined,
                bed: encounterType === 'Inpatient' ? selectedBed : undefined
            };
            const visitResponse = await axios.post('http://localhost:5000/api/visits', visitData, config);
            for (const chargeId of selectedCharges) {
                await axios.post('http://localhost:5000/api/encounter-charges', {
                    encounterId: visitResponse.data._id,
                    patientId: encounterPatient._id,
                    chargeId,
                    quantity: 1,
                    notes: 'Added at registration'
                }, config);
            }
            const total = charges.filter(c => selectedCharges.includes(c._id)).reduce((s, c) => s + c.basePrice, 0);
            if (encounterType !== 'External Investigation' && encounterType !== 'Inpatient') {
                await axios.put(`http://localhost:5000/api/visits/${visitResponse.data._id}`,
                    { encounterStatus: total > 0 ? 'payment_pending' : 'in_nursing' }, config);
            }
            toast.success('Encounter created successfully!');
            closeEncounterModal();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error creating encounter');
        } finally {
            setLoading(false);
        }
    };

    const filterPatients = () => {
        let filtered = patients;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.mrn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.contact?.includes(searchTerm)
            );
        }

        // Date range filter (by registration date)
        if (startDate) {
            filtered = filtered.filter(p => new Date(p.createdAt) >= new Date(startDate));
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            filtered = filtered.filter(p => new Date(p.createdAt) <= end);
        }

        // Sort: newest first
        filtered = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setFilteredPatients(filtered);
        setCurrentPage(1); // reset to first page on any filter change
    };

    const fetchPatientEncounters = async (patientId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`http://localhost:5000/api/visits/patient/${patientId}`, config);
            setEncounters(data);
            setShowEncountersModal(true);
        } catch (error) {
            console.error(error);
            toast.error('Error fetching encounters');
        }
    };

    const handleDeleteEncounter = async (encounterId) => {
        if (!window.confirm('Are you sure you want to delete this encounter? This will permanently remove all associated data (orders, charges, vitals).')) {
            return;
        }

        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.delete(`http://localhost:5000/api/visits/${encounterId}`, config);
            toast.success('Encounter deleted successfully!');
            // Refresh encounters
            fetchPatientEncounters(selectedPatient._id);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error deleting encounter');
        }
    };

    const handleUpdateEncounterStatus = async (encounterId, newStatus) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(`http://localhost:5000/api/visits/${encounterId}`,
                { encounterStatus: newStatus },
                config
            );
            toast.success('Encounter status updated!');
            fetchPatientEncounters(selectedPatient._id);
        } catch (error) {
            console.error(error);
            toast.error('Error updating encounter status');
        }
    };

    const handleUpdatePatient = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(`http://localhost:5000/api/patients/${editPatient._id}`, editPatient, config);
            toast.success('Patient updated successfully!');
            setShowEditPatientModal(false);
            setEditPatient(null);
            fetchPatients();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error updating patient');
        }
    };

    const handleDeletePatient = async (patientId) => {
        if (!window.confirm('Are you sure you want to delete this patient? This will permanently remove all patient data including encounters, orders, and charges.')) {
            return;
        }

        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.delete(`http://localhost:5000/api/patients/${patientId}`, config);
            toast.success('Patient deleted successfully!');
            fetchPatients();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error deleting patient');
        }
    };

    const exportToExcel = () => {
        const worksheetData = filteredPatients.map(patient => ({
            'MRN': patient.mrn || 'N/A',
            'Name': patient.name,
            'Age': patient.age || 'N/A',
            'Gender': patient.gender || 'N/A',
            'Phone': patient.contact || 'N/A',
            'Address': patient.address || 'N/A',
            'Registration Date': new Date(patient.createdAt).toLocaleDateString()
        }));

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Patients');

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        const filename = startDate && endDate
            ? `Patients_${startDate}_to_${endDate}.xlsx`
            : `All_Patients_${new Date().toISOString().split('T')[0]}.xlsx`;

        saveAs(data, filename);
        toast.success('Patient list exported successfully!');
    };

    if (user?.role !== 'admin' && user?.role !== 'receptionist') {
        return (
            <Layout>
                <div className="bg-red-50 border border-red-200 p-6 rounded">
                    <h2 className="text-xl font-bold text-red-800">Access Denied</h2>
                    <p className="text-red-600">You do not have permission to access patient management.</p>
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
                        <FaUserInjured /> Patient Management
                    </h1>
                    <p className="text-blue-100">Manage patients, encounters, and view patient history</p>
                </div>

                {/* Search and Filters */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-xl font-bold mb-4">Search & Filter Patients</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name, MRN, or phone..."
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1">From Date</label>
                            <input
                                type="date"
                                className="w-full border p-2 rounded"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1">To Date</label>
                            <input
                                type="date"
                                className="w-full border p-2 rounded"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <button
                            onClick={() => setShowRegisterPatientModal(true)}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                            <FaUserInjured /> Register Patient
                        </button>
                        <button
                            onClick={exportToExcel}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                            <FaDownload /> Export to Excel
                        </button>
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setStartDate('');
                                setEndDate('');
                            }}
                            className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <p className="text-gray-600 text-sm font-semibold mb-2">Total Patients</p>
                        <p className="text-3xl font-bold text-blue-600">{patients.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <p className="text-gray-600 text-sm font-semibold mb-2">Filtered Results</p>
                        <p className="text-3xl font-bold text-green-600">{filteredPatients.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <p className="text-gray-600 text-sm font-semibold mb-2">Male Patients</p>
                        <p className="text-3xl font-bold text-purple-600">
                            {patients.filter(p => p.gender?.toLowerCase() === 'male').length}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <p className="text-gray-600 text-sm font-semibold mb-2">Female Patients</p>
                        <p className="text-3xl font-bold text-pink-600">
                            {patients.filter(p => p.gender?.toLowerCase() === 'female').length}
                        </p>
                    </div>
                </div>

                {/* Patients Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-4 text-left">MRN</th>
                                <th className="p-4 text-left">Name</th>
                                <th className="p-4 text-left">Age/Gender</th>
                                <th className="p-4 text-left">Phone</th>
                                <th className="p-4 text-left">Registered</th>
                                <th className="p-4 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPatients
                                .slice((currentPage - 1) * PATIENTS_PER_PAGE, currentPage * PATIENTS_PER_PAGE)
                                .map((patient) => (
                                    <tr key={patient._id} className="border-b hover:bg-gray-50">
                                        <td className="p-4 font-semibold text-blue-600">{patient.mrn || 'N/A'}</td>
                                        <td className="p-4 font-semibold">{patient.name}</td>
                                        <td className="p-4">
                                            {patient.age || 'N/A'} / {patient.gender || 'N/A'}
                                        </td>
                                        <td className="p-4 text-gray-600">{patient.contact || 'N/A'}</td>
                                        <td className="p-4 text-sm text-gray-600">
                                            {new Date(patient.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => navigate(`/patient/${patient._id}`)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                    title="View Details"
                                                >
                                                    <FaEye />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedPatient(patient);
                                                        fetchPatientEncounters(patient._id);
                                                    }}
                                                    className="text-purple-600 hover:text-purple-800"
                                                    title="View Encounters"
                                                >
                                                    <FaHospital />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditPatient(patient);
                                                        setShowEditPatientModal(true);
                                                    }}
                                                    className="text-green-600 hover:text-green-800"
                                                    title="Edit Patient"
                                                >
                                                    <FaEdit />
                                                </button>
                                                {user.role === 'admin' && (
                                                    <button
                                                        onClick={() => handleDeletePatient(patient._id)}
                                                        className="text-red-600 hover:text-red-800"
                                                        title="Delete Patient"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                    {filteredPatients.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            No patients found
                        </div>
                    )}
                    {/* Pagination */}
                    {filteredPatients.length > PATIENTS_PER_PAGE && (
                        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                            <p className="text-sm text-gray-600">
                                Showing {Math.min((currentPage - 1) * PATIENTS_PER_PAGE + 1, filteredPatients.length)}–{Math.min(currentPage * PATIENTS_PER_PAGE, filteredPatients.length)} of {filteredPatients.length} patients
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 text-sm border rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    ← Prev
                                </button>
                                {Array.from({ length: Math.ceil(filteredPatients.length / PATIENTS_PER_PAGE) }, (_, i) => i + 1)
                                    .filter(page => page === 1 || page === Math.ceil(filteredPatients.length / PATIENTS_PER_PAGE) || Math.abs(page - currentPage) <= 1)
                                    .reduce((acc, page, idx, arr) => {
                                        if (idx > 0 && arr[idx - 1] !== page - 1) acc.push('...');
                                        acc.push(page);
                                        return acc;
                                    }, [])
                                    .map((item, idx) =>
                                        item === '...' ? (
                                            <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">…</span>
                                        ) : (
                                            <button
                                                key={item}
                                                onClick={() => setCurrentPage(item)}
                                                className={`px-3 py-1.5 text-sm border rounded ${currentPage === item
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'hover:bg-gray-100'
                                                    }`}
                                            >
                                                {item}
                                            </button>
                                        )
                                    )
                                }
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredPatients.length / PATIENTS_PER_PAGE), p + 1))}
                                    disabled={currentPage === Math.ceil(filteredPatients.length / PATIENTS_PER_PAGE)}
                                    className="px-3 py-1.5 text-sm border rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Encounters Modal */}
            {showEncountersModal && selectedPatient && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">
                                Encounters for {selectedPatient.name}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowEncountersModal(false);
                                    setSelectedPatient(null);
                                    setEncounters([]);
                                }}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        {encounters.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No encounters found</p>
                        ) : (
                            <div className="space-y-4">
                                {encounters.map((encounter) => (
                                    <div key={encounter._id} className="border rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="font-semibold text-lg">
                                                    {new Date(encounter.createdAt).toLocaleString()}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    Created By: {encounter.doctor?.name || 'N/A'}
                                                </p>
                                            </div>
                                            <div className="flex gap-2 items-center">
                                                <select
                                                    value={encounter.encounterStatus}
                                                    onChange={(e) => handleUpdateEncounterStatus(encounter._id, e.target.value)}
                                                    className="border p-1 rounded text-sm"
                                                >
                                                    <option value="registered">Registered</option>
                                                    <option value="admitted">Admitted</option>
                                                    <option value="in_nursing">In Nursing</option>
                                                    <option value="with_doctor">With Doctor</option>
                                                    <option value="in_ward">In Ward</option>
                                                    <option value="discharged">Discharged</option>
                                                    <option value="completed">Completed</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                                {user.role === 'admin' && (
                                                    <button
                                                        onClick={() => handleDeleteEncounter(encounter._id)}
                                                        className="text-red-600 hover:text-red-800"
                                                        title="Delete Encounter"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {encounter.ward && (
                                            <div className="bg-blue-50 p-4 rounded mb-4 border border-blue-200">
                                                <p className="font-semibold text-blue-800">

                                                    Admitted In:
                                                </p>
                                                <p className="text-sm text-gray-700 ml-6">
                                                    Ward: {typeof encounter.ward === 'object' && encounter.ward?.name ? encounter.ward.name : (typeof encounter.ward === 'string' ? `ID: ${encounter.ward}` : 'N/A')} |
                                                    Bed: {encounter.bed || 'N/A'} |
                                                    Admitted On: {encounter.admissionDate ? new Date(encounter.admissionDate).toLocaleString() : 'N/A'}
                                                </p>

                                                {/* Discharge information - only show when discharged */}
                                                {encounter.encounterStatus === 'discharged' && (
                                                    <div className="mt-3 pt-3 border-t border-blue-200">
                                                        <p className="font-semibold text-green-800">
                                                            Discharged On: {encounter.dischargeDate ? new Date(encounter.dischargeDate).toLocaleString() : (encounter.updatedAt ? new Date(encounter.updatedAt).toLocaleString() : 'N/A')}
                                                        </p>
                                                        {encounter.dischargeNotes && (
                                                            <div className="mt-2 p-3 bg-white rounded border">
                                                                <p className="text-sm font-semibold text-gray-700 mb-1">Discharge Summary:</p>
                                                                <p className="text-sm text-gray-600">{encounter.dischargeNotes}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}


                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="font-semibold">Status:</p>
                                                <span className={`px-2 py-1 rounded text-xs ${encounter.encounterStatus === 'active' ? 'bg-green-100 text-green-800' :
                                                    encounter.encounterStatus === 'completed' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {encounter.encounterStatus}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-semibold">Reason:</p>
                                                <p className="text-gray-600">{encounter.reasonForVisit || 'N/A'}</p>
                                            </div>
                                        </div>


                                        {encounter.subjective && (
                                            <div className="mt-3 p-3 bg-gray-50 rounded">
                                                <p className="font-semibold text-sm">SOAP Notes:</p>
                                                <p className="text-sm text-gray-700 mt-1">
                                                    <strong>S:</strong> {encounter.subjective}
                                                </p>
                                                {encounter.objective && (
                                                    <p className="text-sm text-gray-700">
                                                        <strong>O:</strong> {encounter.objective}
                                                    </p>
                                                )}
                                                {encounter.assessment && (
                                                    <p className="text-sm text-gray-700">
                                                        <strong>A:</strong> {encounter.assessment}
                                                    </p>
                                                )}
                                                {encounter.plan && (
                                                    <p className="text-sm text-gray-700">
                                                        <strong>P:</strong> {encounter.plan}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Edit Patient Modal */}
            {showEditPatientModal && editPatient && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Edit Patient</h3>
                            <button
                                onClick={() => {
                                    setShowEditPatientModal(false);
                                    setEditPatient(null);
                                }}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleUpdatePatient} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Name</label>
                                    <input
                                        type="text"
                                        className="w-full border p-2 rounded"
                                        value={editPatient.name}
                                        onChange={(e) => setEditPatient({ ...editPatient, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">MRN</label>
                                    <input
                                        type="text"
                                        className="w-full border p-2 rounded"
                                        value={editPatient.mrn || ''}
                                        onChange={(e) => setEditPatient({ ...editPatient, mrn: e.target.value })}
                                        disabled
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Age</label>
                                    <input
                                        type="number"
                                        className="w-full border p-2 rounded"
                                        value={editPatient.age || ''}
                                        onChange={(e) => setEditPatient({ ...editPatient, age: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Gender</label>
                                    <select
                                        className="w-full border p-2 rounded"
                                        value={editPatient.gender || ''}
                                        onChange={(e) => setEditPatient({ ...editPatient, gender: e.target.value })}
                                    >
                                        <option value="">Select</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Phone</label>
                                    <input
                                        type="text"
                                        className="w-full border p-2 rounded"
                                        value={editPatient.contact || ''}
                                        onChange={(e) => setEditPatient({ ...editPatient, contact: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">Address</label>
                                <textarea
                                    className="w-full border p-2 rounded"
                                    rows="2"
                                    value={editPatient.address || ''}
                                    onChange={(e) => setEditPatient({ ...editPatient, address: e.target.value })}
                                />
                            </div>

                            {/* Provider & Insurance Section */}
                            <div className="border-t pt-4">
                                <h4 className="font-semibold text-gray-700 mb-3">Provider Information</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Provider</label>
                                        <select
                                            className="w-full border p-2 rounded"
                                            value={editPatient.provider || 'Standard'}
                                            onChange={(e) => setEditPatient({ ...editPatient, provider: e.target.value })}
                                        >
                                            <option value="Standard">Standard</option>
                                            <option value="Retainership">Retainership</option>
                                            <option value="NHIA">NHIA</option>
                                            <option value="KSCHMA">KSCHMA</option>
                                        </select>
                                    </div>

                                    {/* HMO - Shown for Retainership, NHIA and KSCHMA */}
                                    {(editPatient.provider === 'Retainership' || editPatient.provider === 'NHIA' || editPatient.provider === 'KSCHMA') && (
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">
                                                HMO <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                className="w-full border p-2 rounded"
                                                value={editPatient.hmo || ''}
                                                onChange={(e) => setEditPatient({ ...editPatient, hmo: e.target.value })}
                                                required={editPatient.provider === 'Retainership' || editPatient.provider === 'NHIA' || editPatient.provider === 'KSCHMA'}
                                            >
                                                <option value="">Select HMO *</option>
                                                {hmos
                                                    .filter(hmo => {
                                                        // Strict filtering based on category for NHIA and Retainership
                                                        if (editPatient.provider === 'NHIA' || editPatient.provider === 'Retainership') {
                                                            return hmo.category === editPatient.provider;
                                                        }
                                                        // For KSCHMA, show only KSCHMA HMO
                                                        if (editPatient.provider === 'KSCHMA') {
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

                                    {(editPatient.provider === 'NHIA' || editPatient.provider === 'KSCHMA') && (
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Insurance Number <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                className="w-full border p-2 rounded"
                                                value={editPatient.insuranceNumber || ''}
                                                onChange={(e) => setEditPatient({ ...editPatient, insuranceNumber: e.target.value })}
                                                required
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Emergency Contact Section */}
                            <div className="border-t pt-4">
                                <h4 className="font-semibold text-gray-700 mb-3">Emergency Contact</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Contact Name</label>
                                        <input
                                            type="text"
                                            className="w-full border p-2 rounded"
                                            value={editPatient.emergencyContactName || ''}
                                            onChange={(e) => setEditPatient({ ...editPatient, emergencyContactName: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Contact Phone</label>
                                        <input
                                            type="text"
                                            className="w-full border p-2 rounded"
                                            value={editPatient.emergencyContactPhone || ''}
                                            onChange={(e) => setEditPatient({ ...editPatient, emergencyContactPhone: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                                >
                                    Update Patient
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditPatientModal(false);
                                        setEditPatient(null);
                                    }}
                                    className="flex-1 bg-gray-400 text-white py-2 rounded hover:bg-gray-500"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Register Patient Modal */}
            <RegisterPatientModal
                isOpen={showRegisterPatientModal}
                onClose={() => setShowRegisterPatientModal(false)}
                onSuccess={(newPatient) => {
                    fetchPatients();
                    setPendingEncounterPatient(newPatient);
                    setShowRegisterPatientModal(false);
                }}
                userToken={user.token}
            />

            {/* Create Encounter Modal */}
            {showEncounterModal && encounterPatient && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center sticky top-0">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <FaCalendarCheck /> Create Encounter
                            </h3>
                            <button onClick={closeEncounterModal} className="text-white hover:text-gray-200">
                                <FaTimes size={24} />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Patient Info */}
                            <div className="bg-gray-50 p-4 rounded mb-6">
                                <h4 className="font-bold text-lg mb-2">Patient Information</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Name</p>
                                        <p className="font-semibold">{encounterPatient.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">MRN</p>
                                        <p className="font-semibold">{encounterPatient.mrn}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Age</p>
                                        <p className="font-semibold">{encounterPatient.age} years</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Gender</p>
                                        <p className="font-semibold capitalize">{encounterPatient.gender}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Encounter Type */}
                            <div className="mb-6">
                                <label className="block text-gray-700 font-semibold mb-2">
                                    Encounter Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    className="w-full border p-2 rounded"
                                    value={encounterType}
                                    onChange={(e) => setEncounterType(e.target.value)}
                                >
                                    <option value="Outpatient">Outpatient</option>
                                    <option value="Inpatient">Inpatient</option>
                                    <option value="Emergency">Emergency</option>
                                    <option value="Follow-up">Follow-up</option>
                                    <option value="External Investigation">External Investigation</option>
                                    <option value="Consultation">Consultation</option>
                                </select>
                            </div>

                            {/* Clinic */}
                            <div className="mb-6">
                                <label className="block text-gray-700 font-semibold mb-2">Clinic (Optional)</label>
                                <select
                                    className="w-full border p-2 rounded"
                                    value={selectedClinic}
                                    onChange={(e) => setSelectedClinic(e.target.value)}
                                >
                                    <option value="">-- No Clinic --</option>
                                    {clinics.map(clinic => (
                                        <option key={clinic._id} value={clinic._id}>
                                            {clinic.name} ({clinic.department})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Reason for Visit */}
                            <div className="mb-6">
                                <label className="block text-gray-700 font-semibold mb-2">Reason for Visit</label>
                                <textarea
                                    className="w-full border p-2 rounded"
                                    rows="3"
                                    placeholder="Enter reason for visit..."
                                    value={reasonForVisit}
                                    onChange={(e) => setReasonForVisit(e.target.value)}
                                />
                            </div>

                            {/* Inpatient Ward/Bed */}
                            {encounterType === 'Inpatient' && (
                                <div className="bg-blue-50 p-4 rounded mb-6 border border-blue-200">
                                    <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                                        <FaBed /> Inpatient Admission
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Select Ward</label>
                                            <select
                                                className="w-full border p-2 rounded"
                                                value={selectedWard}
                                                onChange={(e) => { setSelectedWard(e.target.value); setSelectedBed(''); }}
                                            >
                                                <option value="">-- Select Ward --</option>
                                                {wards.map(ward => (
                                                    <option key={ward._id} value={ward._id}>
                                                        {ward.name} ({ward.type}) - ₦{ward.dailyRate}/day
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Select Bed</label>
                                            <select
                                                className="w-full border p-2 rounded"
                                                value={selectedBed}
                                                onChange={(e) => setSelectedBed(e.target.value)}
                                                disabled={!selectedWard}
                                            >
                                                <option value="">-- Select Bed --</option>
                                                {availableBeds.map(bed => (
                                                    <option key={bed._id} value={bed.number}>
                                                        {bed.number}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Charges */}
                            {encounterType !== 'External Investigation' && encounterType !== 'Inpatient' && (
                                <div className="mb-6">
                                    <label className="block text-gray-700 font-semibold mb-2">
                                        Consultation Charges <span className="text-red-500">*</span>
                                    </label>
                                    {charges.length === 0 ? (
                                        <p className="text-gray-500 text-sm">No consultation charges available</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {charges.map(charge => (
                                                <label key={charge._id} className={`flex items-center gap-3 p-3 border rounded cursor-pointer ${selectedCharges.includes(charge._id) ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                                                    }`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedCharges.includes(charge._id)}
                                                        onChange={() => handleChargeToggle(charge._id)}
                                                        className="w-4 h-4"
                                                    />
                                                    <span className="flex-1">{charge.name}</span>
                                                    <span className="font-semibold text-green-600">₦{charge.basePrice?.toLocaleString()}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                    {selectedCharges.length > 0 && (
                                        <p className="mt-2 text-right font-bold text-blue-700">
                                            Total: ₦{charges.filter(c => selectedCharges.includes(c._id)).reduce((s, c) => s + c.basePrice, 0).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t">
                                <button
                                    onClick={handleCreateEncounter}
                                    disabled={loading}
                                    className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
                                >
                                    <FaCalendarCheck /> {loading ? 'Creating...' : 'Create Encounter'}
                                </button>
                                <button
                                    onClick={closeEncounterModal}
                                    className="flex-1 bg-gray-400 text-white py-2 rounded hover:bg-gray-500"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default PatientManagement;

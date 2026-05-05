import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { AppContext } from '../context/AppContext';
import Layout from '../components/Layout';
import { FaHospital, FaBed, FaSearch, FaFilter, FaInfoCircle, FaUser } from 'react-icons/fa';
import LoadingOverlay from '../components/loadingOverlay';
import { toast } from 'react-toastify';

const WardManagement = () => {
    const [wards, setWards] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const { user } = useContext(AuthContext);
    const { backendUrl } = useContext(AppContext);

    useEffect(() => {
        fetchWards();
    }, [user]);

    const fetchWards = async () => {
        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${backendUrl}/api/wards`, config);
            setWards(data);
        } catch (error) {
            console.error('Error fetching wards:', error);
            toast.error('Error loading ward data');
        } finally {
            setLoading(false);
        }
    };

    const filteredWards = wards.filter(ward => {
        const matchesSearch = ward.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'All' || ward.type === filterType;
        return matchesSearch && matchesFilter;
    });

    const wardTypes = ['All', 'General', 'Private', 'ICU', 'Emergency', 'Maternity', 'Pediatric', 'Surgical'];

    return (
        <Layout>
            {loading && <LoadingOverlay />}
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <FaHospital className="text-blue-600" /> Ward Availability & Bed Management
                </h2>
                <p className="text-gray-600 mt-2">Monitor hospital ward occupancy and bed availability in real-time.</p>
            </div>

            {/* Controls */}
            <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search wards..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <FaFilter className="text-gray-400" />
                    <select
                        className="flex-1 md:w-48 border border-gray-200 rounded-lg py-2 px-3 outline-none focus:ring-2 focus:ring-blue-500 transition"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        {wardTypes.map(type => (
                            <option key={type} value={type}>{type} Wards</option>
                        ))}
                    </select>
                    <button 
                        onClick={fetchWards}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition font-medium"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-600 p-4 rounded-xl text-white shadow-lg shadow-blue-200">
                    <p className="text-blue-100 text-sm font-semibold uppercase tracking-wider">Total Wards</p>
                    <p className="text-3xl font-bold mt-1">{wards.length}</p>
                </div>
                <div className="bg-green-600 p-4 rounded-xl text-white shadow-lg shadow-green-200">
                    <p className="text-green-100 text-sm font-semibold uppercase tracking-wider">Available Beds</p>
                    <p className="text-3xl font-bold mt-1">
                        {wards.reduce((sum, w) => sum + w.beds.filter(b => !b.isOccupied).length, 0)}
                    </p>
                </div>
                <div className="bg-red-600 p-4 rounded-xl text-white shadow-lg shadow-red-200">
                    <p className="text-red-100 text-sm font-semibold uppercase tracking-wider">Occupied Beds</p>
                    <p className="text-3xl font-bold mt-1">
                        {wards.reduce((sum, w) => sum + w.beds.filter(b => b.isOccupied).length, 0)}
                    </p>
                </div>
                <div className="bg-indigo-600 p-4 rounded-xl text-white shadow-lg shadow-indigo-200">
                    <p className="text-indigo-100 text-sm font-semibold uppercase tracking-wider">Occupancy Rate</p>
                    <p className="text-3xl font-bold mt-1">
                        {wards.length > 0 ? (
                            Math.round((wards.reduce((sum, w) => sum + w.beds.filter(b => b.isOccupied).length, 0) / 
                            wards.reduce((sum, w) => sum + w.beds.length, 0)) * 100)
                        ) : 0}%
                    </p>
                </div>
            </div>

            {/* Wards Grid */}
            <div className="grid grid-cols-1 gap-8">
                {filteredWards.map(ward => {
                    const occupiedCount = ward.beds.filter(b => b.isOccupied).length;
                    const totalCount = ward.beds.length;
                    const percent = Math.round((occupiedCount / totalCount) * 100);

                    return (
                        <div key={ward._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner ${
                                        percent > 90 ? 'bg-red-50 text-red-600' :
                                        percent > 70 ? 'bg-orange-50 text-orange-600' :
                                        'bg-green-50 text-green-600'
                                    }`}>
                                        <FaHospital />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">{ward.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-bold uppercase tracking-tighter">{ward.type}</span>
                                            <span className="text-gray-400 text-xs">•</span>
                                            <span className="text-gray-500 text-xs">{ward.description || 'No description'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col md:items-end gap-2">
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400 font-bold uppercase">Occupancy</p>
                                            <p className="text-lg font-black text-gray-800">{occupiedCount} / {totalCount}</p>
                                        </div>
                                        <div className="w-16 h-16 relative">
                                            <svg className="w-full h-full" viewBox="0 0 36 36">
                                                <path
                                                    className="text-gray-100 stroke-current"
                                                    strokeWidth="4"
                                                    fill="none"
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                />
                                                <path
                                                    className={`${percent > 90 ? 'text-red-500' : percent > 70 ? 'text-orange-500' : 'text-green-500'} stroke-current`}
                                                    strokeWidth="4"
                                                    strokeDasharray={`${percent}, 100`}
                                                    strokeLinecap="round"
                                                    fill="none"
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                />
                                                <text x="18" y="20.35" className="text-[8px] font-bold fill-current text-gray-700" textAnchor="middle">{percent}%</text>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-6 bg-gray-50/50">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <FaBed /> Bed Layout
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                                    {ward.beds.map((bed, idx) => (
                                        <div 
                                            key={idx}
                                            className={`relative group p-3 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-1 ${
                                                bed.isOccupied 
                                                ? 'bg-red-50 border-red-100 text-red-600' 
                                                : 'bg-white border-white hover:border-green-400 text-green-600 hover:shadow-md cursor-help shadow-sm'
                                            }`}
                                        >
                                            <FaBed className={`text-xl ${bed.isOccupied ? 'animate-pulse opacity-40' : ''}`} />
                                            <span className="text-[10px] font-bold uppercase">{bed.number}</span>
                                            
                                            {/* Tooltip on Hover */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white p-3 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
                                                <div className="flex justify-between items-center mb-1 border-b border-gray-700 pb-1">
                                                    <span className="font-bold">{bed.number}</span>
                                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${bed.isOccupied ? 'bg-red-500' : 'bg-green-500'}`}>
                                                        {bed.isOccupied ? 'Occupied' : 'Available'}
                                                    </span>
                                                </div>
                                                {bed.isOccupied ? (
                                                    <div className="space-y-1 mt-2">
                                                        <div className="flex items-center gap-2">
                                                            <FaUser className="text-red-400" />
                                                            <span className="font-bold text-red-100">{bed.occupiedBy?.name || 'Unknown Patient'}</span>
                                                        </div>
                                                        <p className="text-gray-400 text-[10px]">MRN: {bed.occupiedBy?.mrn || 'N/A'}</p>
                                                    </div>
                                                ) : (
                                                    <p className="text-green-300 font-medium">Ready for admission</p>
                                                )}
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredWards.length === 0 && (
                <div className="p-12 text-center">
                    <p className="text-gray-400 italic">No wards match your current filter settings.</p>
                </div>
            )}
        </Layout>
    );
};

export default WardManagement;

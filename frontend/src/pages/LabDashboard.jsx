import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { AppContext } from '../context/AppContext';
import Layout from '../components/Layout';
import { FaFlask, FaSearch, FaCheckCircle, FaEdit, FaSave, FaTimes, FaFileAlt, FaCog } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { parseRange, checkRange, getRangeColorClass } from '../utils/labUtils';

const LabDashboard = () => {
    const resultRef = useRef();
    const navigate = useNavigate();
    const [labOrders, setLabOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [completedSearchTerm, setCompletedSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [results, setResults] = useState('');
    const [tableResults, setTableResults] = useState([]);
    const [isTableFormat, setIsTableFormat] = useState(false);
    const [viewResultModal, setViewResultModal] = useState(null);
    const [editResultModal, setEditResultModal] = useState(null);
    const [editResults, setEditResults] = useState('');
    const [editTableResults, setEditTableResults] = useState([]);
    const [isEditTableFormat, setIsEditTableFormat] = useState(false);
    const [systemSettings, setSystemSettings] = useState(null);
    const { user } = useContext(AuthContext);
    const { backendUrl } = useContext(AppContext);



    // Parse text-based template into table format
    const parseTextTemplate = (template) => {
        if (!template) return [];

        const lines = template.split('\n');
        const params = [];

        for (const line of lines) {
            // Match patterns like "- WBC: _____ x10^3/μL (Normal: 4.0-11.0)"
            const match = line.match(/^\s*-\s*([^:]+):\s*_+\s*([^(]*)\(?(?:Normal:\s*)?([^)]*)\)?/);
            if (match) {
                const name = match[1].trim();
                const unit = match[2].trim();
                const normalRange = match[3].trim();

                params.push({
                    name,
                    value: '',
                    unit,
                    normalRange
                });
            }
        }

        return params;
    };

    useEffect(() => {
        const fetchSystemSettings = async () => {
            try {
                const { data } = await axios.get(`${backendUrl}/api/settings`);
                setSystemSettings(data);
            } catch (error) {
                console.error('Error fetching system settings:', error);
            }
        };
        fetchSystemSettings();
        fetchLabOrders();
    }, []);

    const fetchLabOrders = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${backendUrl}/api/lab`, config);
            setLabOrders(data);
        } catch (error) {
            console.error(error);
            toast.error('Error fetching lab orders');
        }
    };

    const searchPatients = () => {
        if (!searchTerm) {
            fetchLabOrders();
            return;
        }
        const filtered = labOrders.filter(order =>
            order.patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.patient?.mrn?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setLabOrders(filtered);
    };

    const handleSelectOrder = async (order) => {
        setSelectedOrder(order);

        if (order.result) {
            // Check if result is in table format (JSON) or text format
            try {
                const parsedResult = JSON.parse(order.result);
                if (parsedResult.format === 'table' && Array.isArray(parsedResult.parameters)) {
                    setIsTableFormat(true);
                    setTableResults(parsedResult.parameters);
                    setResults('');
                } else {
                    setIsTableFormat(false);
                    setResults(order.result);
                    setTableResults([]);
                }
            } catch (e) {
                // Not JSON, treat as text
                setIsTableFormat(false);
                setResults(order.result);
                setTableResults([]);
            }
        } else {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const { data } = await axios.get(`${backendUrl}/api/charges?type=lab&active=true`, config);
                const matchingCharge = data.find(c => c.name === order.testName);
                const template = matchingCharge?.resultTemplate || '';

                // Try to parse as JSON table format
                try {
                    const parsedTemplate = JSON.parse(template);
                    if (parsedTemplate.format === 'table' && Array.isArray(parsedTemplate.parameters)) {
                        setIsTableFormat(true);
                        setTableResults(parsedTemplate.parameters.map(p => ({ ...p, value: '' })));
                        setResults('');
                    } else {
                        throw new Error('Not table format');
                    }
                } catch (e) {
                    // Text-based template - try to parse it into table format
                    const parsedParams = parseTextTemplate(template);
                    if (parsedParams.length > 0) {
                        setIsTableFormat(true);
                        setTableResults(parsedParams);
                        setResults('');
                    } else {
                        setIsTableFormat(false);
                        setResults(template);
                        setTableResults([]);
                    }
                }
            } catch (error) {
                console.error('Error fetching template:', error);
                setIsTableFormat(false);
                setResults('');
                setTableResults([]);
            }
        }
    };

    const handleSaveResults = async () => {
        let resultData;

        if (isTableFormat) {
            // Validate that at least one value is entered
            const hasValues = tableResults.some(param => param.value && param.value.trim());
            if (!hasValues) {
                toast.error('Please enter at least one lab result value');
                return;
            }

            // Save as JSON
            resultData = JSON.stringify({
                format: 'table',
                parameters: tableResults
            });
        } else {
            if (!results.trim()) {
                toast.error('Please enter lab results');
                return;
            }
            resultData = results;
        }

        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(
                `${backendUrl}/api/lab/${selectedOrder._id}/result`,
                {
                    status: 'completed',
                    result: resultData,
                    signedBy: user._id,
                    resultDate: new Date()
                },
                config
            );

            toast.success('Lab results saved and signed!');
            setSelectedOrder(null);
            setResults('');
            setTableResults([]);
            setIsTableFormat(false);
            fetchLabOrders();
        } catch (error) {
            console.error(error);
            toast.error('Error saving results');
        }
    };

    const handleApproveResult = async (orderId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(
                `${backendUrl}/api/lab/${orderId}/approve`,
                {},
                config
            );

            toast.success('Lab result approved!');
            fetchLabOrders();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error approving result');
        }
    };

    const handleEditResult = async () => {
        let resultData;

        if (isEditTableFormat) {
            const hasValues = editTableResults.some(param => param.value && param.value.trim());
            if (!hasValues) {
                toast.error('Please enter at least one lab result value');
                return;
            }
            resultData = JSON.stringify({
                format: 'table',
                parameters: editTableResults
            });
        } else {
            if (!editResults.trim()) {
                toast.error('Please enter lab results');
                return;
            }
            resultData = editResults;
        }

        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(
                `${backendUrl}/api/lab/${editResultModal._id}/result`,
                {
                    status: 'completed',
                    result: resultData,
                    signedBy: user._id,
                    resultDate: new Date()
                },
                config
            );

            toast.success('Lab results updated and re-signed!');
            setEditResultModal(null);
            setEditResults('');
            setEditTableResults([]);
            setIsEditTableFormat(false);
            fetchLabOrders();
        } catch (error) {
            console.error(error);
            toast.error('Error updating results');
        }
    };

    const handleUniversalPrint = (order) => {
        const printWindow = window.open("", "_blank");

        const printContent = `
            <html>
                <head>
                    <title>Laboratory Report - ${order.testName}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                        .header h1 { font-size: 28px; margin: 0; }
                        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; font-size: 14px; }
                        .info-grid p { margin: 5px 0; }
                        .results-section { border-top: 1px solid #333; border-bottom: 1px solid #333; padding: 20px 0; margin-bottom: 30px; }
                        .results-section h3 { font-size: 18px; margin-bottom: 15px; }
                        .results-content { background: #f9f9f9; padding: 15px; white-space: pre-wrap; font-family: monospace; font-size: 13px; }
                        .signature-section { margin-top: 40px; padding-top: 20px; border-top: 1px solid #333; }
                        .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
                        .signature-grid p { margin: 5px 0; font-size: 13px; }
                        .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #666; }
                        @media print {
                            body { padding: 0; }
                            .results-content { background: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        ${systemSettings?.hospitalLogo ? `<img src="${systemSettings.hospitalLogo}" style="height: 150px; max-width: 250px; object-fit: contain; margin-bottom: 0;" />` : ''}
                        <h1 style="margin: 0 0 5px 0;">${systemSettings?.reportHeader || 'LABORATORY REPORT'}</h1>
                        <p style="margin: 5px 0; font-size: 14px;">${systemSettings?.address || ''}</p>
                        <p style="margin: 2px 0; font-size: 12px;">
                            ${systemSettings?.phone ? `Phone: ${systemSettings.phone}` : ''}
                            ${systemSettings?.phone && systemSettings?.email ? ' | ' : ''}
                            ${systemSettings?.email ? `Email: ${systemSettings.email}` : ''}
                        </p>
                        <h2 style="font-size: 20px; border-top: 1px solid #eee; pt-2; mt-2;">Laboratory Report</h2>
                    </div>

                    <div class="info-grid">
                        <div>
                            <p><strong>Patient Name:</strong> ${order.patient?.name}</p>
                            <p><strong>MRN:</strong> ${order.patient?.mrn}</p>
                        </div>
                        <div>
                            <p><strong>Test Name:</strong> ${order.testName}</p>
                            <p><strong>Date Ordered:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div class="results-section">
                        <h3>Test Results:</h3>
                        ${(() => {
                try {
                    const parsed = JSON.parse(order.result);
                    if (parsed.format === 'table' && Array.isArray(parsed.parameters)) {
                        return `
                                        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                                            <thead>
                                                <tr style="background: #f3f4f6;">
                                                    <th style="text-align: left; padding: 12px; border: 1px solid #d1d5db; font-weight: 600;">Parameter</th>
                                                    <th style="text-align: left; padding: 12px; border: 1px solid #d1d5db; font-weight: 600; width: 120px;">Value</th>
                                                    <th style="text-align: left; padding: 12px; border: 1px solid #d1d5db; font-weight: 600; width: 100px;">Unit</th>
                                                    <th style="text-align: left; padding: 12px; border: 1px solid #d1d5db; font-weight: 600; width: 150px;">Normal Range</th>
                                                    <th style="text-align: center; padding: 12px; border: 1px solid #d1d5db; font-weight: 600; width: 80px;">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${parsed.parameters.map(param => {
                            const rangeStatus = checkRange(param.value, param.normalRange);
                            let bgColor = '#f9fafb';
                            let statusText = '';
                            let statusColor = '';

                            if (param.value) {
                                if (rangeStatus === 'low') {
                                    bgColor = '#fed7aa';
                                    statusText = '↓ LOW';
                                    statusColor = '#9a3412';
                                } else if (rangeStatus === 'high') {
                                    bgColor = '#fecaca';
                                    statusText = '↑ HIGH';
                                    statusColor = '#991b1b';
                                } else {
                                    bgColor = '#d1fae5';
                                    statusText = '✓ Normal';
                                    statusColor = '#065f46';
                                }
                            }

                            return `
                                                        <tr style="background: ${bgColor};">
                                                            <td style="padding: 10px; border: 1px solid #d1d5db; font-weight: 500;">${param.name}</td>
                                                            <td style="padding: 10px; border: 1px solid #d1d5db; font-weight: 600;">${param.value || '-'}</td>
                                                            <td style="padding: 10px; border: 1px solid #d1d5db; color: #6b7280;">${param.unit || ''}</td>
                                                            <td style="padding: 10px; border: 1px solid #d1d5db; color: #6b7280;">${param.normalRange || ''}</td>
                                                            <td style="padding: 10px; border: 1px solid #d1d5db; text-align: center;">
                                                                ${param.value ? `<span style="color: ${statusColor}; font-weight: 600; font-size: 11px;">${statusText}</span>` : ''}
                                                            </td>
                                                        </tr>
                                                    `;
                        }).join('')}
                                            </tbody>
                                        </table>
                                    `;
                    }
                } catch (e) {
                    // Not JSON or not table format
                }
                return `<div class="results-content">${order.result}</div>`;
            })()}
                    </div>

                    <div class="signature-section">
                        <div class="signature-grid">
                            <div>
                                ${order.signedBy ? `
                                    <p><strong>Performed by:</strong> ${order.signedBy.name}</p>
                                    <p><strong>Date:</strong> ${new Date(order.signedAt).toLocaleString()}</p>
                                ` : ''}
                            </div>
                            <div>
                                ${order.approvedBy ? `
                                    <p style="color: green;"><strong>Reviewed and Approved by:</strong> ${order.approvedBy.name}</p>
                                    <p style="color: green;"><strong>Date:</strong> ${new Date(order.approvedAt).toLocaleString()}</p>
                                ` : ''}
                                ${order.lastModifiedBy ? `
                                    <p style="color: orange;"><strong>Last Modified by:</strong> ${order.lastModifiedBy.name}</p>
                                    <p style="color: orange;"><strong>Date:</strong> ${new Date(order.lastModifiedAt).toLocaleString()}</p>
                                ` : ''}
                            </div>
                        </div>
                    </div>

                    <div class="footer">
                        <p>This is an electronically signed document. No handwritten signature is required.</p>
                    </div>
                </body>
            </html>
        `;

        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 250);
    };

    const pendingOrders = labOrders
        .filter(o => o.status === 'pending')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const completedOrders = labOrders
        .filter(o => o.status === 'completed')
        .filter(o => {
            if (!completedSearchTerm) return true;
            const searchLower = completedSearchTerm.toLowerCase();
            return (
                o.testName?.toLowerCase().includes(searchLower) ||
                o.patient?.name?.toLowerCase().includes(searchLower) ||
                o.patient?.mrn?.toLowerCase().includes(searchLower)
            );
        })
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FaFlask className="text-purple-600" /> Laboratory Dashboard
                </h2>
                <button
                    onClick={() => navigate('/lab/manage-tests')}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center gap-2"
                >
                    <FaCog /> Manage Lab Tests
                </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-yellow-50 p-6 rounded shadow">
                    <p className="text-yellow-700 text-sm font-semibold">Pending Tests</p>
                    <p className="text-3xl font-bold text-yellow-800">{pendingOrders.length}</p>
                </div>
                <div className="bg-green-50 p-6 rounded shadow">
                    <p className="text-green-700 text-sm font-semibold">Completed Today</p>
                    <p className="text-3xl font-bold text-green-800">
                        {completedOrders.filter(o => new Date(o.updatedAt).toDateString() === new Date().toDateString()).length}
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white p-6 rounded shadow mb-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <FaSearch /> Search Lab Orders
                </h3>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Search by Patient Name or MRN..."
                        className="flex-1 border p-2 rounded"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && searchPatients()}
                    />
                    <button
                        onClick={searchPatients}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                    >
                        Search
                    </button>
                </div>
            </div>

            {/* Pending Orders */}
            {!selectedOrder && (
                <div className="bg-white p-6 rounded shadow mb-6">
                    <h3 className="text-xl font-bold mb-4">Pending Lab Tests</h3>
                    {pendingOrders.length === 0 ? (
                        <p className="text-gray-500">No pending tests</p>
                    ) : (
                        <div className="space-y-2">
                            {pendingOrders.map(order => (
                                <div
                                    key={order._id}
                                    className="border p-4 rounded hover:bg-gray-50 cursor-pointer"
                                    onClick={() => handleSelectOrder(order)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-lg">{order.testName}</p>
                                            <p className="text-gray-600">
                                                Patient: {order.patient?.name} (MRN: {order.patient?.mrn})
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Ordered: {new Date(order.createdAt).toLocaleString()}
                                            </p>
                                            {order.labSpecialization && (
                                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded mt-1 inline-block">
                                                    {order.labSpecialization}
                                                </span>
                                            )}
                                        </div>
                                        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-sm">
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Selected Order - Results Entry */}
            {selectedOrder && (
                <div className="bg-white p-6 rounded shadow">
                    <div className="bg-purple-50 p-4 rounded mb-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-lg">{selectedOrder.testName}</p>
                                <p className="text-gray-700">Patient: {selectedOrder.patient?.name}</p>
                                <p className="text-sm text-gray-600">MRN: {selectedOrder.patient?.mrn}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedOrder(null);
                                }}
                                className="text-blue-600 hover:underline text-sm"
                            >
                                ← Back to List
                            </button>
                        </div>
                    </div>

                    {/* Payment Status Check */}
                    {selectedOrder.charge?.status !== 'paid' ? (
                        <div className="border-2 border-red-300 bg-red-50 p-6 rounded mb-6">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-800">
                                <FaCheckCircle /> Payment Pending
                            </h3>
                            <p className="text-sm text-gray-700 mb-4">
                                This test has not been paid for yet. Please ask the patient to pay at the cashier.
                            </p>
                            <div className="flex gap-2 items-center">
                                <span className="font-bold text-red-600">Status: Unpaid</span>
                                <button
                                    onClick={fetchLabOrders}
                                    className="text-blue-600 hover:underline text-sm ml-4"
                                >
                                    Refresh Status
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="bg-green-50 p-4 rounded mb-6">
                                <p className="text-green-700 font-semibold flex items-center gap-2">
                                    <FaCheckCircle /> Payment Verified
                                </p>
                            </div>

                            <div className="mb-6">
                                <label className="block text-gray-700 mb-2 font-semibold flex items-center gap-2">
                                    <FaEdit /> Lab Results
                                </label>

                                {isTableFormat ? (
                                    <div className="border rounded overflow-hidden">
                                        <table className="w-full">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="text-left p-3 font-semibold border-b">Parameter</th>
                                                    <th className="text-left p-3 font-semibold border-b w-32">Value</th>
                                                    <th className="text-left p-3 font-semibold border-b w-24">Unit</th>
                                                    <th className="text-left p-3 font-semibold border-b w-40">Normal Range</th>
                                                    <th className="text-left p-3 font-semibold border-b w-24">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tableResults.map((param, index) => {
                                                    const rangeStatus = checkRange(param.value, param.normalRange);
                                                    const colorClass = getRangeColorClass(rangeStatus);

                                                    return (
                                                        <tr key={index} className={`border-b ${param.value ? colorClass : ''}`}>
                                                            <td className="p-3 font-medium">{param.name}</td>
                                                            <td className="p-2">
                                                                <input
                                                                    type="text"
                                                                    value={param.value}
                                                                    onChange={(e) => {
                                                                        const newResults = [...tableResults];
                                                                        newResults[index].value = e.target.value;
                                                                        setTableResults(newResults);
                                                                    }}
                                                                    className="w-full border p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                                    placeholder="Enter value"
                                                                />
                                                            </td>
                                                            <td className="p-3 text-sm text-gray-600">{param.unit}</td>
                                                            <td className="p-3 text-sm text-gray-600">{param.normalRange}</td>
                                                            <td className="p-3">
                                                                {param.value && (
                                                                    <span className={`text-xs px-2 py-1 rounded font-semibold ${rangeStatus === 'low' ? 'bg-orange-200 text-orange-900' :
                                                                        rangeStatus === 'high' ? 'bg-red-200 text-red-900' :
                                                                            'bg-green-200 text-green-900'
                                                                        }`}>
                                                                        {rangeStatus === 'low' ? '↓ LOW' :
                                                                            rangeStatus === 'high' ? '↑ HIGH' :
                                                                                '✓ Normal'}
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <textarea
                                        className="w-full border p-3 rounded font-mono text-sm"
                                        rows="20"
                                        value={results}
                                        onChange={(e) => setResults(e.target.value)}
                                        placeholder="Enter lab test results here..."
                                    ></textarea>
                                )}

                                {/* Signature Display */}
                                {selectedOrder.signedBy && (
                                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                                        <p className="text-sm font-semibold text-blue-900">
                                            Signed by: {selectedOrder.signedBy.name}
                                        </p>
                                        <p className="text-xs text-blue-700">
                                            Date: {new Date(selectedOrder.signedAt).toLocaleString()}
                                        </p>
                                        {selectedOrder.lastModifiedBy && (
                                            <p className="text-xs text-orange-700 mt-1">
                                                Last modified by: {selectedOrder.lastModifiedBy.name} on {new Date(selectedOrder.lastModifiedAt).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {selectedOrder.result && (
                                <div className="flex gap-2 mb-4">
                                    <button
                                        onClick={() => setViewResultModal(selectedOrder)}
                                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2"
                                    >
                                        <FaFileAlt /> View Result
                                    </button>
                                    <button
                                        onClick={() => handleUniversalPrint(selectedOrder)}
                                        className="flex-1 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center justify-center gap-2"
                                    >
                                        <FaFileAlt /> Print Result
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={handleSaveResults}
                                className="w-full bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 font-bold flex items-center justify-center gap-2"
                            >
                                <FaSave /> {selectedOrder.result ? 'Update & Re-sign Results' : 'Save & Sign Results'}
                            </button>
                            <p className="text-xs text-gray-600 mt-2 text-center">
                                {selectedOrder.result ? (
                                    <span className="text-orange-600 font-semibold">⚠️ Editing will update the signature timestamp</span>
                                ) : (
                                    <span>By saving, you are electronically signing these results as {user.name}</span>
                                )}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Completed Tests */}
            {!selectedOrder && (
                <div className="bg-white p-6 rounded shadow">
                    <h3 className="text-xl font-bold mb-4">Completed Tests</h3>

                    {/* Search Bar for Completed Tests */}
                    <div className="mb-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Search by Test Name, Patient Name, or MRN..."
                                className="flex-1 border p-2 rounded"
                                value={completedSearchTerm}
                                onChange={(e) => setCompletedSearchTerm(e.target.value)}
                            />
                            {completedSearchTerm && (
                                <button
                                    onClick={() => setCompletedSearchTerm('')}
                                    className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {completedSearchTerm ? `Showing ${completedOrders.length} result(s)` : `Showing ${Math.min(5, completedOrders.length)} of ${completedOrders.length} completed test(s)`}
                        </p>
                    </div>

                    {completedOrders.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No completed tests found</p>
                    ) : (
                        <div className="space-y-2">
                            {(completedSearchTerm ? completedOrders : completedOrders.slice(0, 5)).map(order => (
                                <div key={order._id} className="border p-3 rounded bg-green-50">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <p className="font-semibold">{order.testName}</p>
                                            <p className="text-sm text-gray-600">
                                                Patient: {order.patient?.name} | Completed: {new Date(order.updatedAt).toLocaleString()}
                                            </p>
                                            {order.labSpecialization && (
                                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded mt-1 inline-block">
                                                    {order.labSpecialization}
                                                </span>
                                            )}
                                            {order.signedBy && (
                                                <p className="text-xs text-blue-700 mt-1">
                                                    Signed by: {order.signedBy.name}
                                                </p>
                                            )}
                                            {order.approvedBy && (
                                                <p className="text-xs text-green-600 mt-1 font-semibold">
                                                    Approved by: {order.approvedBy.name}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <button
                                                onClick={() => setViewResultModal(order)}
                                                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm flex items-center gap-1"
                                            >
                                                <FaFileAlt /> View
                                            </button>
                                            <button
                                                onClick={() => handleUniversalPrint(order)}
                                                className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 text-sm flex items-center gap-1"
                                            >
                                                <FaFileAlt /> Print
                                            </button>
                                            {/* Edit button - Lab Tech can edit if not approved, Scientist can always edit */}
                                            {((user.role === 'lab_technician' && !order.approvedBy) || user.role === 'lab_scientist') && (
                                                <button
                                                    onClick={() => {
                                                        setEditResultModal(order);
                                                        try {
                                                            const parsed = JSON.parse(order.result);
                                                            if (parsed.format === 'table' && Array.isArray(parsed.parameters)) {
                                                                setIsEditTableFormat(true);
                                                                setEditTableResults(parsed.parameters);
                                                                setEditResults('');
                                                            } else {
                                                                setIsEditTableFormat(false);
                                                                setEditResults(order.result);
                                                                setEditTableResults([]);
                                                            }
                                                        } catch (e) {
                                                            setIsEditTableFormat(false);
                                                            setEditResults(order.result);
                                                            setEditTableResults([]);
                                                        }
                                                    }}
                                                    className="bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700 text-sm flex items-center gap-1"
                                                >
                                                    <FaEdit /> Edit
                                                </button>
                                            )}
                                            {/* Approve button - Only for scientists on unapproved results */}
                                            {user.role === 'lab_scientist' && !order.approvedBy && (
                                                <button
                                                    onClick={() => handleApproveResult(order._id)}
                                                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm flex items-center gap-1"
                                                >
                                                    <FaCheckCircle /> Approve
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* View Result Modal */}
            {viewResultModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 no-print">
                    <div className="bg-white rounded-lg p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold">Lab Result</h3>
                            <button onClick={() => setViewResultModal(null)} className="text-gray-500 hover:text-gray-700">
                                <FaTimes size={24} />
                            </button>
                        </div>

                        {/* PRINT AREA START */}
                        <div ref={resultRef} className="print-area">
                            <div className="text-center mb-6">
                                {systemSettings?.hospitalLogo && (
                                    <img src={systemSettings.hospitalLogo} alt="Logo" className="h-32 mx-auto mb-0 object-contain" />
                                )}
                                <h1 className="text-3xl font-bold text-gray-800 m-0">{systemSettings?.reportHeader || 'Laboratory Report'}</h1>
                                <p className="text-sm text-gray-600 mt-2">{systemSettings?.address || 'Hospital Name'}</p>
                                <p className="text-sm text-gray-600">
                                    {systemSettings?.phone ? `Phone: ${systemSettings.phone}` : ''}
                                    {systemSettings?.phone && systemSettings?.email ? ' | ' : ''}
                                    {systemSettings?.email ? `Email: ${systemSettings.email}` : ''}
                                </p>
                                <h2 className="text-xl font-semibold mt-4 border-t pt-2">LABORATORY REPORT</h2>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                                <div>
                                    <p><strong>Patient Name:</strong> {viewResultModal.patient?.name}</p>
                                    <p><strong>MRN:</strong> {viewResultModal.patient?.mrn}</p>
                                </div>
                                <div>
                                    <p><strong>Test Name:</strong> {viewResultModal.testName}</p>
                                    <p><strong>Date Ordered:</strong> {new Date(viewResultModal.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="border-t border-b border-gray-300 py-4 mb-6">
                                <h3 className="font-bold text-lg mb-3">Test Results:</h3>
                                {(() => {
                                    try {
                                        const parsed = JSON.parse(viewResultModal.result);
                                        if (parsed.format === 'table' && Array.isArray(parsed.parameters)) {
                                            return (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full border-collapse">
                                                        <thead className="bg-gray-100">
                                                            <tr>
                                                                <th className="text-left p-3 font-semibold border">Parameter</th>
                                                                <th className="text-left p-3 font-semibold border w-32">Value</th>
                                                                <th className="text-left p-3 font-semibold border w-24">Unit</th>
                                                                <th className="text-left p-3 font-semibold border w-40">Normal Range</th>
                                                                <th className="text-center p-3 font-semibold border w-24">Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {parsed.parameters.map((param, index) => {
                                                                const rangeStatus = checkRange(param.value, param.normalRange);
                                                                const colorClass = getRangeColorClass(rangeStatus);

                                                                return (
                                                                    <tr key={index} className={`${param.value ? colorClass : ''} border`}>
                                                                        <td className="p-3 font-medium border">{param.name}</td>
                                                                        <td className="p-3 font-semibold border">{param.value || '-'}</td>
                                                                        <td className="p-3 text-gray-600 border">{param.unit}</td>
                                                                        <td className="p-3 text-gray-600 border">{param.normalRange}</td>
                                                                        <td className="p-3 text-center border">
                                                                            {param.value && (
                                                                                <span className={`text-xs px-2 py-1 rounded font-semibold ${rangeStatus === 'low' ? 'bg-orange-200 text-orange-900' :
                                                                                    rangeStatus === 'high' ? 'bg-red-200 text-red-900' :
                                                                                        'bg-green-200 text-green-900'
                                                                                    }`}>
                                                                                    {rangeStatus === 'low' ? '↓ LOW' :
                                                                                        rangeStatus === 'high' ? '↑ HIGH' :
                                                                                            '✓ Normal'}
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            );
                                        }
                                    } catch (e) {
                                        // Not JSON or not table format
                                    }
                                    return (
                                        <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded">
                                            {viewResultModal.result}
                                        </pre>
                                    );
                                })()}
                            </div>

                            <div className="mt-8 pt-4 border-t border-gray-300">
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        {viewResultModal.signedBy && (
                                            <>
                                                <p className="text-sm mb-1">
                                                    <strong>Performed by:</strong> {viewResultModal.signedBy.name}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    <strong>Date:</strong> {new Date(viewResultModal.signedAt).toLocaleString()}
                                                </p>
                                            </>
                                        )}
                                    </div>

                                    <div>
                                        {viewResultModal.approvedBy && (
                                            <>
                                                <p className="text-sm mb-1 text-green-700">
                                                    <strong>Reviewed and Approved by:</strong> {viewResultModal.approvedBy.name}
                                                </p>
                                                <p className="text-sm text-green-600">
                                                    <strong>Date:</strong> {new Date(viewResultModal.approvedAt).toLocaleString()}
                                                </p>
                                            </>
                                        )}
                                        {viewResultModal.lastModifiedBy && (
                                            <>
                                                <p className="text-sm mb-1 text-orange-700">
                                                    <strong>Last Modified by:</strong> {viewResultModal.lastModifiedBy.name}
                                                </p>
                                                <p className="text-sm text-orange-600">
                                                    <strong>Date:</strong> {new Date(viewResultModal.lastModifiedAt).toLocaleString()}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 text-xs text-gray-500 text-center">
                                <p>This is an electronically signed document. No handwritten signature is required.</p>
                            </div>
                        </div>
                        {/* PRINT AREA END */}

                        <div className="flex gap-2 mt-6 no-print">
                            <button
                                onClick={() => handleUniversalPrint(viewResultModal)}
                                className="flex-1 bg-purple-600 text-white px-6 py-3 rounded hover:bg-purple-700 font-semibold"
                            >
                                Print
                            </button>
                            <button
                                onClick={() => setViewResultModal(null)}
                                className="flex-1 bg-gray-400 text-white px-6 py-3 rounded hover:bg-gray-500 font-semibold"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Result Modal */}
            {editResultModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold">Edit Lab Result</h3>
                            <button onClick={() => setEditResultModal(null)} className="text-gray-500 hover:text-gray-700">
                                <FaTimes size={24} />
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">
                                <strong>Test:</strong> {editResultModal.testName}
                            </p>
                            <p className="text-sm text-gray-600 mb-2">
                                <strong>Patient:</strong> {editResultModal.patient?.name} (MRN: {editResultModal.patient?.mrn})
                            </p>
                            {editResultModal.approvedBy && (
                                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mb-4">
                                    <p className="text-sm text-yellow-800">
                                        ⚠️ <strong>Warning:</strong> This result has been approved by {editResultModal.approvedBy.name}.
                                        Editing will require re-approval.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="mb-6">
                            <label className="block text-gray-700 mb-2 font-semibold flex items-center gap-2">
                                <FaEdit /> Lab Results
                            </label>

                            {isEditTableFormat ? (
                                <div className="border rounded overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="text-left p-3 font-semibold border-b">Parameter</th>
                                                <th className="text-left p-3 font-semibold border-b w-32">Value</th>
                                                <th className="text-left p-3 font-semibold border-b w-24">Unit</th>
                                                <th className="text-left p-3 font-semibold border-b w-40">Normal Range</th>
                                                <th className="text-left p-3 font-semibold border-b w-24">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {editTableResults.map((param, index) => {
                                                const rangeStatus = checkRange(param.value, param.normalRange);
                                                const colorClass = getRangeColorClass(rangeStatus);

                                                return (
                                                    <tr key={index} className={`border-b ${param.value ? colorClass : ''}`}>
                                                        <td className="p-3 font-medium">{param.name}</td>
                                                        <td className="p-2">
                                                            <input
                                                                type="text"
                                                                value={param.value}
                                                                onChange={(e) => {
                                                                    const newResults = [...editTableResults];
                                                                    newResults[index].value = e.target.value;
                                                                    setEditTableResults(newResults);
                                                                }}
                                                                className="w-full border p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                                placeholder="Enter value"
                                                            />
                                                        </td>
                                                        <td className="p-3 text-sm text-gray-600">{param.unit}</td>
                                                        <td className="p-3 text-sm text-gray-600">{param.normalRange}</td>
                                                        <td className="p-3">
                                                            {param.value && (
                                                                <span className={`text-xs px-2 py-1 rounded font-semibold ${rangeStatus === 'low' ? 'bg-orange-200 text-orange-900' :
                                                                    rangeStatus === 'high' ? 'bg-red-200 text-red-900' :
                                                                        'bg-green-200 text-green-900'
                                                                    }`}>
                                                                    {rangeStatus === 'low' ? '↓ LOW' :
                                                                        rangeStatus === 'high' ? 'High' :
                                                                            '✓ Normal'}
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <textarea
                                    className="w-full border p-3 rounded font-mono text-sm"
                                    rows="20"
                                    value={editResults}
                                    onChange={(e) => setEditResults(e.target.value)}
                                    placeholder="Enter lab test results here..."
                                ></textarea>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleEditResult}
                                className="flex-1 bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 font-semibold flex items-center justify-center gap-2"
                            >
                                <FaSave /> Save & Re-sign
                            </button>
                            <button
                                onClick={() => setEditResultModal(null)}
                                className="flex-1 bg-gray-400 text-white px-6 py-3 rounded hover:bg-gray-500 font-semibold"
                            >
                                Cancel
                            </button>
                        </div>

                        <p className="text-xs text-gray-600 mt-2 text-center">
                            <span className="text-orange-600 font-semibold">⚠️ Editing will update the signature timestamp and reset approval status</span>
                        </p>
                    </div>
                </div>
            )}

        </Layout>
    );
};

export default LabDashboard;

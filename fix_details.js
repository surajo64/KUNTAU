const fs = require('fs');
const filePath = 'd:/MY PROJECTS/SUD EMR/frontend/src/pages/PatientDetails.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix Prescription section (2090+)
// Current broken state from view_file:
// 2090:                                                                                         <span className={`text-xs px-3 py-1 rounded text-center ${rx.charge?.status === 'paid' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
// 2091:                                                                                             <FaTrash />
// 2092:                                                                                         </button>
// 2093:                                                                                         )}
// 2094:                                                                                     </div>

const prescriptionBroken = "                                                                                         <span className={`text-xs px-3 py-1 rounded text-center ${rx.charge?.status === 'paid' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>\n                                                                                             <FaTrash />\n                                                                                         </button>\n                                                                                         )}\n                                                                                     </div>";

const prescriptionFixed = `                                                                                         <span className={\`text-xs px-3 py-1 rounded text-center \${rx.charge?.status === 'paid' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}\`}>
                                                                                             {rx.charge?.status === 'paid' ? 'Paid' : 'Unpaid'}
                                                                                         </span>
                                                                                         <span className={\`text-xs px-3 py-1 rounded text-center \${rx.status === 'dispensed' ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'}\`}>
                                                                                             {rx.status}
                                                                                         </span>
                                                                                         {canEdit && (user.role === 'admin' || rx.doctor === user._id || rx.doctor?._id === user._id) && rx.status !== 'dispensed' && rx.charge?.status !== 'paid' && (
                                                                                             <button
                                                                                                 onClick={() => handleDeleteOrder('prescription', rx._id)}
                                                                                                 className="p-1.5 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                                                                                                 title="Delete Prescription"
                                                                                             >
                                                                                                 <FaTrash />
                                                                                             </button>
                                                                                         )}
                                                                                     </div>`;

content = content.replace(prescriptionBroken, prescriptionFixed);

// 2. Update Lab section
const labTarget = "{canEdit && (user.role === 'admin' || order.doctor === user._id || order.doctor?._id === user._id) && order.status !== 'completed' && (";
const labReplace = "{canEdit && (user.role === 'admin' || order.doctor === user._id || order.doctor?._id === user._id) && order.status !== 'completed' && order.charge?.status !== 'paid' && (";

// We need to find the one in Lab section specifically
// It's the first one.
content = content.replace(labTarget, labReplace);

// 3. Update Radiology section
// It's the second one.
content = content.replace(labTarget, labReplace);

fs.writeFileSync(filePath, content);
console.log('Update complete');

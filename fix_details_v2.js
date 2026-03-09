const fs = require('fs');
const filePath = 'd:/MY PROJECTS/SUD EMR/frontend/src/pages/PatientDetails.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// The broken block looks like this:
// <span className={`text-xs px-3 py-1 rounded text-center ${rx.charge?.status === 'paid' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
//     <FaTrash />
// </button>
// )}
// </div>

const regex = /<span className=\{`text-xs px-3 py-1 rounded text-center \$\{rx\.charge\?\.status === 'paid' \? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'\}`\}>\s+<FaTrash \/>\s+<\/button>\s+\)\}\s+<\/div>/;

const fixed = `<span className={\`text-xs px-3 py-1 rounded text-center \${rx.charge?.status === 'paid' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}\`}>
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

if (regex.test(content)) {
    content = content.replace(regex, fixed);
    fs.writeFileSync(filePath, content);
    console.log('Successfully fixed Prescription corruption');
} else {
    console.log('Regex did not match. Checking fallback...');
    // Fallback search with less strict whitespace
    const start = "<span className={`text-xs px-3 py-1 rounded text-center ${rx.charge?.status === 'paid' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>\r\n                                                                                             <FaTrash />\r\n                                                                                         </button>\r\n                                                                                         )}\r\n                                                                                     </div>";
    const start2 = "<span className={`text-xs px-3 py-1 rounded text-center ${rx.charge?.status === 'paid' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>\n                                                                                             <FaTrash />\n                                                                                         </button>\n                                                                                         )}\n                                                                                     </div>";

    if (content.includes(start)) {
        content = content.replace(start, fixed);
        fs.writeFileSync(filePath, content);
        console.log('Fixed using CRLF');
    } else if (content.includes(start2)) {
        content = content.replace(start2, fixed);
        fs.writeFileSync(filePath, content);
        console.log('Fixed using LF');
    } else {
        console.log('Still no match. Printing a slice for debugging:');
        const index = content.indexOf("rx.charge?.status === 'paid' ? 'bg-green-200 text-green-800'");
        console.log(JSON.stringify(content.slice(index, index + 500)));
    }
}

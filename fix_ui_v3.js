const fs = require('fs');
const filePath = 'd:/MY PROJECTS/SUD EMR/frontend/src/pages/PatientDetails.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const labAnchor = "order.status === 'completed' ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'";
const buttonCode = (type) => `{canEdit && (user.role === 'admin' || order.doctor === user._id || order.doctor?._id === user._id) && order.status !== 'completed' && (
                                                                    <button
                                                                        onClick={() => handleDeleteOrder('${type}', order._id)}
                                                                        className="p-1.5 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                                                                        title="Delete Order"
                                                                    >
                                                                        <FaTrash />
                                                                    </button>
                                                                )}`;

// Find Lab occurrence
let labIndex = content.indexOf(labAnchor);
if (labIndex !== -1) {
    let spanEnd = content.indexOf('</span>', labIndex);
    if (spanEnd !== -1) {
        const insert = '\n' + buttonCode('lab');
        content = content.slice(0, spanEnd + 7) + insert + content.slice(spanEnd + 7);
        console.log('Inserted Lab button');

        // Find Radiology occurrence (AFTER Lab)
        // We look for the NEXT occurrence of labAnchor
        let radIndex = content.indexOf(labAnchor, spanEnd + insert.length + 100);
        if (radIndex !== -1) {
            let radSpanEnd = content.indexOf('</span>', radIndex);
            if (radSpanEnd !== -1) {
                content = content.slice(0, radSpanEnd + 7) + '\n' + buttonCode('radiology') + content.slice(radSpanEnd + 7);
                console.log('Inserted Radiology button');
            }
        }
    }
}

fs.writeFileSync(filePath, content);
console.log('Done');

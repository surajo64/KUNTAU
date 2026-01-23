const mongoose = require('mongoose');

const radiologyOrderSchema = mongoose.Schema({
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    visit: { type: mongoose.Schema.Types.ObjectId, ref: 'Visit' },
    charge: { type: mongoose.Schema.Types.ObjectId, ref: 'EncounterCharge' },
    scanType: { type: String, required: true }, // e.g., X-Ray, MRI
    resultImage: { type: String }, // URL to image (deprecated - kept for backward compatibility)
    images: [{
        name: { type: String, required: true },      // Custom name for the image (e.g., "AP View", "Lateral View")
        filename: { type: String, required: true },  // Stored filename
        originalName: { type: String },              // Original uploaded filename
        path: { type: String, required: true },      // File path
        uploadedAt: { type: Date, default: Date.now }
    }],
    report: { type: String },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    signedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reportDate: { type: Date },
}, {
    timestamps: true,
});

const RadiologyOrder = mongoose.model('RadiologyOrder', radiologyOrderSchema);

module.exports = RadiologyOrder;

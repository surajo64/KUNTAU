const RadiologyOrder = require('../models/radiologyOrderModel');
const Visit = require('../models/visitModel');

// @desc    Create new radiology order
// @route   POST /api/radiology
// @access  Private (Doctor or Radiologist for External Investigation)
const createRadiologyOrder = async (req, res) => {
    const { patientId, visitId, chargeId, scanType } = req.body;

    // Check permissions
    if (req.user.role === 'radiologist') {
        const visit = await Visit.findById(visitId);
        if (!visit || visit.type !== 'External Investigation') {
            return res.status(403).json({ message: 'Radiologists can only order for External Investigations.' });
        }
    } else if (req.user.role !== 'doctor') {
        return res.status(403).json({ message: 'Not authorized to order radiology.' });
    }

    const order = await RadiologyOrder.create({
        doctor: req.user._id,
        patient: patientId,
        visit: visitId,
        charge: chargeId,
        scanType,
    });

    res.status(201).json(order);
};

// @desc    Get all radiology orders
// @route   GET /api/radiology
// @access  Private
const getRadiologyOrders = async (req, res) => {
    const orders = await RadiologyOrder.find({})
        .populate('doctor', 'name')
        .populate('patient', 'name mrn')
        .populate('charge', 'status')
        .populate('signedBy', 'name');
    res.json(orders);
};

// @desc    Get radiology orders by visit
// @route   GET /api/radiology/visit/:id
// @access  Private
const getRadiologyOrdersByVisit = async (req, res) => {
    const orders = await RadiologyOrder.find({ visit: req.params.id })
        .populate('doctor', 'name')
        .populate('charge', 'status');
    res.json(orders);
};

// @desc    Update radiology report
// @route   PUT /api/radiology/:id/report
// @access  Private (Radiologist)
const updateRadiologyReport = async (req, res) => {
    const { report, resultImage } = req.body;
    const order = await RadiologyOrder.findById(req.params.id);

    if (order) {
        order.report = report;
        order.resultImage = resultImage;
        order.status = 'completed';
        order.signedBy = req.user._id;
        order.reportDate = new Date();
        const updatedOrder = await order.save();
        await updatedOrder.populate('signedBy', 'name');
        res.json(updatedOrder);
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
};

// @desc    Upload radiology images
// @route   POST /api/radiology/:id/upload-images
// @access  Private (Radiologist)
const uploadRadiologyImages = async (req, res) => {
    try {
        const order = await RadiologyOrder.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // req.files contains the uploaded files from multer
        // req.body.imageNames contains JSON string of image names
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        // Parse image names from request body
        let imageNames = [];
        try {
            imageNames = JSON.parse(req.body.imageNames || '[]');
        } catch (error) {
            return res.status(400).json({ message: 'Invalid image names format' });
        }

        // Create image objects
        const newImages = req.files.map((file, index) => ({
            name: imageNames[index] || `Image ${index + 1}`,
            filename: file.filename,
            originalName: file.originalname,
            path: file.path.replace(/\\/g, '/'), // Normalize path for cross-platform compatibility
            uploadedAt: new Date()
        }));

        // Add new images to existing images array
        order.images = order.images || [];
        order.images.push(...newImages);

        await order.save();
        await order.populate('signedBy', 'name');

        res.json({
            message: 'Images uploaded successfully',
            images: newImages,
            order: order
        });
    } catch (error) {
        console.error('Error uploading images:', error);
        res.status(500).json({ message: 'Error uploading images', error: error.message });
    }
};

// @desc    Delete radiology image
// @route   DELETE /api/radiology/:id/images/:imageId
// @access  Private (Radiologist)
const deleteRadiologyImage = async (req, res) => {
    try {
        const order = await RadiologyOrder.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const imageIndex = order.images.findIndex(img => img._id.toString() === req.params.imageId);

        if (imageIndex === -1) {
            return res.status(404).json({ message: 'Image not found' });
        }

        // Delete file from filesystem
        const fs = require('fs');
        const imagePath = order.images[imageIndex].path;
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        // Remove from array
        order.images.splice(imageIndex, 1);
        await order.save();

        res.json({ message: 'Image deleted successfully', order });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ message: 'Error deleting image', error: error.message });
    }
};

module.exports = {
    createRadiologyOrder,
    getRadiologyOrders,
    getRadiologyOrdersByVisit,
    updateRadiologyReport,
    uploadRadiologyImages,
    deleteRadiologyImage,
};

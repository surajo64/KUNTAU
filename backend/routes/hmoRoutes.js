const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, admin, adminOrReceptionist } = require('../middleware/authMiddleware');
const {
    getHMOs,
    getHMOById,
    getNextHMOCode,
    createHMO,
    updateHMO,
    deleteHMO,
    toggleHMOStatus,
    importHMOsFromExcel
} = require('../controllers/hmoController');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files are allowed'), false);
        }
    }
});

// Routes
router.route('/')
    .get(protect, getHMOs)
    .post(protect, adminOrReceptionist, createHMO);

router.post('/import-excel', protect, adminOrReceptionist, upload.single('file'), importHMOsFromExcel);
router.get('/next-code', protect, getNextHMOCode);

router.route('/:id')
    .get(protect, getHMOById)
    .put(protect, adminOrReceptionist, updateHMO)
    .delete(protect, adminOrReceptionist, deleteHMO);

router.patch('/:id/toggle-status', protect, adminOrReceptionist, toggleHMOStatus);

module.exports = router;

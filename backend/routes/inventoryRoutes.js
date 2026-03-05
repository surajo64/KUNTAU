const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
    getInventory,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    getInventoryAlerts,
    getProfitLossReport,
    importInventoryFromExcel
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');

// Configure multer for Excel file uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (
            file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.mimetype === 'application/vnd.ms-excel'
        ) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files are allowed'), false);
        }
    }
});

router.get("/alerts", protect, getInventoryAlerts);
router.get("/reports/profit-loss", protect, getProfitLossReport);

router.route("/")
    .get(protect, getInventory)
    .post(protect, addInventoryItem);

router.post('/import-excel', protect, upload.single('file'), importInventoryFromExcel);

router.route("/:id")
    .put(protect, updateInventoryItem)
    .delete(protect, deleteInventoryItem);

module.exports = router;

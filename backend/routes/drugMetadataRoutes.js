const express = require('express');
const router = express.Router();
const {
    getDrugMetadata,
    createDrugMetadata,
    updateDrugMetadata,
    deleteDrugMetadata
} = require('../controllers/drugMetadataController');
const { protect, admin, pharmacy } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getDrugMetadata)
    .post(protect, pharmacy, createDrugMetadata);

router.route('/:id')
    .put(protect, pharmacy, updateDrugMetadata)
    .delete(protect, pharmacy, deleteDrugMetadata);

module.exports = router;

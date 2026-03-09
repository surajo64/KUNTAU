const express = require('express');
const router = express.Router();
const {
    createPrescription,
    getPrescriptions,
    getPatientPrescriptions,
    getPrescriptionsByVisit,
    dispensePrescription,
    dispenseWithInventory,
    generatePrescriptionCharge,
    deletePrescription
} = require('../controllers/prescriptionController');
const { protect, pharmacy } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createPrescription)
    .get(protect, getPrescriptions);

router.get('/patient/:id', protect, getPatientPrescriptions);
router.get('/visit/:id', protect, getPrescriptionsByVisit);
router.put('/:id/dispense', protect, dispensePrescription);
router.put('/:id/dispense-with-inventory', protect, dispenseWithInventory);
router.put('/:id/generate-charge', protect, pharmacy, generatePrescriptionCharge);
router.delete('/:id', protect, deletePrescription);

module.exports = router;

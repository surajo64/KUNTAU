const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect, superAdmin } = require('../middleware/authMiddleware');

router.route('/')
    .get(getSettings)
    .put(protect, superAdmin, updateSettings);

module.exports = router;

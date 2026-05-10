const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, getAllUsers, updateUser, deleteUser, activateUser, resetUserPassword, getDoctors, changePassword } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/all', protect, admin, getAllUsers);
router.get('/doctors', protect, getDoctors);
router.post('/', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/:id', protect, admin, updateUser);
router.put('/:id/activate', protect, admin, activateUser);
router.delete('/:id', protect, admin, deleteUser);
router.post('/:id/reset-password', protect, admin, resetUserPassword);
router.put('/profile/password', protect, changePassword);

module.exports = router;

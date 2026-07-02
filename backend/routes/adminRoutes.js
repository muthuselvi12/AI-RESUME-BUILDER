/**
 * routes/adminRoutes.js
 */

const express = require('express');
const router = express.Router();
const { getDashboard, getUsers, updateUserRole, deleteUser } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

// All admin routes require auth + admin role
router.use(protect, adminOnly);

router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

module.exports = router;

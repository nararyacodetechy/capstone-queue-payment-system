const express = require('express');
const adminController = require('../controllers/adminController');
const { getAllReportStudents, updateReportStatus, getHistoryReportsForAdmin } = require('../controllers/adminController');
const authenticate = require('../middlewares/authenticate');
const { verifyToken, authorizeRole } = require('../middlewares/authMiddleware');

const router = express.Router();

// Route untuk mendapatkan daftar mahasiswa hanya untuk admin
router.put('/profile', verifyToken, authorizeRole(['admin']), adminController.updateProfile);

router.get('/students', verifyToken, authorizeRole(['admin']), adminController.getAllStudents);
router.get('/admins', verifyToken, authorizeRole(['admin']), adminController.getAllAdmins);

router.get('/student-reports', authenticate, getAllReportStudents);
router.patch('/student-reports/:reportId/status', authenticate, updateReportStatus);

router.get('/history-reports', verifyToken, authorizeRole(['admin']), getHistoryReportsForAdmin);

module.exports = router;

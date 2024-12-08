const express = require('express');
const multer = require('multer');
const studentController = require('../controllers/studentController');
const { postReport, getMyReports } = require('../controllers/studentController');
const { verifyToken, authorizeRole } = require('../middlewares/authMiddleware');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();

// Konfigurasi Multer untuk menyimpan file lokal
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Folder penyimpanan
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ storage });

// Endpoint untuk mahasiswa mengunggah form laporan
router.get('/my-reports', authenticate, getMyReports);
router.post('/submit-report', verifyToken, authorizeRole(['mahasiswa']), upload.single('transaction_proof'), postReport);
router.put('/profile', verifyToken, authorizeRole(['mahasiswa']), studentController.updateProfile);

module.exports = router;

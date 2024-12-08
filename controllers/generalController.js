const db = require('../models/db');  // Pastikan untuk import koneksi ke database

const getRemainingQueue = (req, res) => {
    // Ambil seluruh laporan dengan status 'pending' dan 'processing'
    const getAllReportsQuery = `
        SELECT id, queue_number, student_id, status
        FROM reports
        WHERE status IN ('pending', 'processing')
        ORDER BY queue_number ASC
    `;

    db.query(getAllReportsQuery, (err, reports) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Failed to fetch reports' });
        }

        if (reports.length === 0) {
            return res.status(404).json({ message: 'No reports found' });
        }

        // Hitung total laporan yang masih dalam antrian (status pending atau processing)
        const remainingQueue = reports.filter(report => report.status === 'pending' || report.status === 'processing').length;

        // Kirimkan statistik sisa antrian
        res.status(200).json({
            message: 'Remaining queue calculated successfully',
            remainingQueue
        });
    });
};

// Statistik Antrean Pembayaran SPP
const getStatisticSPPQueue = (req, res) => {
    const getSPPQueueQuery = `
        SELECT 
            COUNT(*) AS allStatus,
            SUM(CASE WHEN COALESCE(status, '') = 'pending' THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN COALESCE(status, '') = 'processing' THEN 1 ELSE 0 END) AS processing,
            SUM(CASE WHEN COALESCE(status, '') = 'completed' THEN 1 ELSE 0 END) AS completed
        FROM reports
        WHERE report_type = 'pembayaran spp'
    `;

    db.query(getSPPQueueQuery, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Failed to fetch SPP queue statistics' });
        }

        const statistics = result[0];

        res.status(200).json({
            message: 'SPP Queue statistics retrieved successfully',
            statistics
        });
    });
};


// Statistik Antrean Pembayaran Skripsi
const getStatisticSkripsiQueue = (req, res) => {
    const getSkripsiQueueQuery = `
        SELECT 
            COUNT(*) AS allStatus,
            SUM(CASE WHEN COALESCE(status, '') = 'pending' THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN COALESCE(status, '') = 'processing' THEN 1 ELSE 0 END) AS processing,
            SUM(CASE WHEN COALESCE(status, '') = 'completed' THEN 1 ELSE 0 END) AS completed
        FROM reports
        WHERE report_type = 'pembayaran skripsi'
    `;

    db.query(getSkripsiQueueQuery, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Failed to fetch Skripsi queue statistics' });
        }

        const statistics = result[0];

        res.status(200).json({
            message: 'Skripsi Queue statistics retrieved successfully',
            statistics
        });
    });
};

// Statistik Antrean Pembayaran Wisuda
const getStatisticWisudaQueue = (req, res) => {
    const getWisudaQueueQuery = `
        SELECT 
            COUNT(*) AS allStatus,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) AS processing,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed
        FROM reports
        WHERE report_type = 'pembayaran wisuda'
    `;

    db.query(getWisudaQueueQuery, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Failed to fetch Wisuda queue statistics' });
        }

        const statistics = result[0];

        res.status(200).json({
            message: 'Wisuda Queue statistics retrieved successfully',
            statistics
        });
    });
};

module.exports = { getRemainingQueue, getStatisticSPPQueue, getStatisticWisudaQueue, getStatisticSkripsiQueue };

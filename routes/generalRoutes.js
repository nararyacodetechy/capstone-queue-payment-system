const express = require('express');
const router = express.Router();
const { getRemainingQueue, getStatisticSPPQueue, getStatisticWisudaQueue, getStatisticSkripsiQueue } = require('../controllers/generalController');

// Endpoint untuk mendapatkan sisa antrian
router.get('/remaining-queue', getRemainingQueue);

// Statistik Antrean SPP
router.get('/statistic/spp', getStatisticSPPQueue);

// Statistik Antrean Wisuda
router.get('/statistic/wisuda', getStatisticWisudaQueue);

// Statistik Antrean Skripsi
router.get('/statistic/skripsi', getStatisticSkripsiQueue);

module.exports = router;

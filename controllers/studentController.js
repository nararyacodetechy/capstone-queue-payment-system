const db = require('../models/db'); 
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); 

const updateProfile = (req, res) => {
    const { name, nik, email, phone, password } = req.body;
    const userId = req.user.id; // ID admin yang sedang login
  
    // Pastikan ada setidaknya satu data yang ingin diubah
    if (!name && !nik && !email && !phone && !password) {
      return res.status(400).json({ message: 'No data to update' });
    }
  
    // Query untuk mendapatkan data admin
    const query = 'SELECT * FROM users WHERE id = ? AND role = "mahasiswa"';
    
    db.query(query, [userId], (err, results) => {
      if (err || results.length === 0) {
        return res.status(404).json({ message: 'Admin not found' });
      }
  
      const user = results[0];
  
      // Hash password baru jika diberikan
      let hashedPassword = user.password;
      if (password) {
        hashedPassword = bcrypt.hashSync(password, 10); // Encrypt password baru
      }
  
      // Query untuk update data
      const updateQuery = 'UPDATE users SET name = ?, nik = ?, email = ?, phone = ?, password = ? WHERE id = ?';
      
      db.query(updateQuery, [name || user.name, nik || user.nik, email || user.email, phone || user.phone, hashedPassword, userId], (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Failed to update profile' });
        }
  
        res.status(200).json({
          message: 'Profile updated successfully',
          user: {
            id: userId,
            name: name || user.name,
            nik: nik || user.nik,
            email: email || user.email,
            phone: phone || user.phone
          }
        });
      });
    });
  };

  const postReport = (req, res) => {
    const { report_type, description } = req.body;
    const studentId = req.user.id; // Dapatkan ID mahasiswa dari token
    const status = 'pending'; // Status default
    const reportNumber = `REP-${Date.now()}`; // Generate nomor laporan unik
    const transactionProof = req.file ? req.file.path : null; // Path bukti transaksi

    if (!report_type || !transactionProof) {
        return res.status(400).json({ message: 'Report type and transaction proof are required' });
    }

    // Dapatkan nomor antrean terbaru
    const getMaxQueueQuery = `SELECT MAX(queue_number) AS maxQueue FROM reports`;
    db.query(getMaxQueueQuery, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Failed to fetch max queue number' });
        }

        const maxQueue = result[0].maxQueue || 0; // Nomor antrean dimulai dari 1 jika belum ada
        const newQueueNumber = maxQueue + 1;

        // Simpan laporan baru dengan nomor antrean
        const insertReportQuery = `
            INSERT INTO reports (student_id, report_number, report_type, transaction_proof, description, status, queue_number)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(
            insertReportQuery,
            [studentId, reportNumber, report_type, transactionProof, description, status, newQueueNumber],
            (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Failed to submit report' });
                }

                res.status(201).json({
                    message: 'Report submitted successfully',
                    report: {
                        id: result.insertId,
                        report_number: reportNumber,
                        report_type,
                        transaction_proof: transactionProof,
                        description,
                        status,
                        queue_number: newQueueNumber
                    }
                });
            }
        );
    });
};

const getMyReports = (req, res) => {
  const studentId = req.user.id; // Dapatkan ID mahasiswa dari token

  // Query untuk mendapatkan semua laporan mahasiswa berdasarkan student_id
  const query = `
      SELECT report_number, report_type, transaction_proof, description, status, queue_number, replybyadmin, created_at
      FROM reports
      WHERE student_id = ?
      ORDER BY queue_number ASC
  `;

  db.query(query, [studentId], (err, results) => {
      if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Failed to fetch reports' });
      }

      if (results.length === 0) {
          return res.status(404).json({ message: 'No reports found' });
      }

      res.status(200).json({
          message: 'Reports retrieved successfully',
          reports: results
      });
  });
};

module.exports = { updateProfile, postReport, getMyReports };

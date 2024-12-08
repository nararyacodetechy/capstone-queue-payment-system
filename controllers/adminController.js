const db = require('../models/db'); 
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); 


const getAllStudents = (req, res) => {
  const userId = req.user.id;  // Dapatkan id pengguna dari token
  const userRole = req.user.role; // Dapatkan role dari token

  // Pastikan yang mengakses adalah admin
  if (userRole !== 'admin') {
    return res.status(403).json({ message: 'Access denied, admin only' });
  }

  // Query untuk mendapatkan semua mahasiswa
  const query = 'SELECT id, name, nik, email, phone, status, role FROM users WHERE role = "mahasiswa"';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Failed to fetch students' });
    }

    res.status(200).json({
      message: 'List of students retrieved successfully',
      students: results
    });
  });
};

const getAllAdmins = (req, res) => {
  const userId = req.user.id;  // Dapatkan id pengguna dari token
  const userRole = req.user.role; // Dapatkan role dari token

  // Pastikan yang mengakses adalah admin
  if (userRole !== 'admin') {
    return res.status(403).json({ message: 'Access denied, admin only' });
  }

  // Query untuk mendapatkan semua admin
  const query = 'SELECT id, name, nik, email, phone, status, role FROM users WHERE role = "admin"';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Failed to fetch admins' });
    }

    res.status(200).json({
      message: 'List of admins retrieved successfully',
      admins: results
    });
  });
};

const updateProfile = (req, res) => {
    const { name, nik, email, phone, password } = req.body;
    const userId = req.user.id; // ID admin yang sedang login
  
    // Pastikan ada setidaknya satu data yang ingin diubah
    if (!name && !nik && !email && !phone && !password) {
      return res.status(400).json({ message: 'No data to update' });
    }
  
    // Query untuk mendapatkan data admin
    const query = 'SELECT * FROM users WHERE id = ? AND role = "admin"';
    
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

  const getAllReportStudents = (req, res) => {
    const userRole = req.user.role; // Dapatkan role dari token

    // Pastikan hanya admin yang bisa mengakses
    if (userRole !== 'admin') {
        return res.status(403).json({ message: 'Access denied, admin only' });
    }

    // Query untuk mendapatkan semua laporan
    const query = `
        SELECT 
            reports.id, 
            reports.report_number, 
            reports.report_type, 
            reports.transaction_proof, 
            reports.description, 
            reports.status, 
            reports.queue_number, 
            reports.created_at,
            reports.replybyadmin, 
            users.id AS student_id, 
            users.name AS student_name, 
            users.email AS student_email
        FROM reports
        JOIN users ON reports.student_id = users.id
        ORDER BY reports.queue_number ASC, reports.created_at DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Failed to fetch reports' });
        }

        res.status(200).json({
            message: 'All reports retrieved successfully',
            reports: results
        });
    });
};

const updateReportStatus = (req, res) => {
  const { reportId } = req.params; // ID laporan yang ingin diubah statusnya
  const { status, replybyadmin } = req.body; // Status baru dan balasan dari admin

  // Define valid statuses
  const validStatuses = ['processing', 'completed', 'pending'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status. Valid statuses are: processing, completed, pending." });
  }

  // Step 1: Get the current queue_number from the database
  const getQueueNumberQuery = 'SELECT queue_number FROM reports WHERE id = ?';

  db.query(getQueueNumberQuery, [reportId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Failed to fetch report details' });
    }

    if (result.length === 0) {
      // If no report is found with the given ID
      return res.status(404).json({ message: 'Report not found' });
    }

    const currentQueueNumber = result[0].queue_number;

    // Step 2: Set queue_number based on the status
    let queueNumber;
    if (status === 'completed') {
      queueNumber = 0; // Set queue_number to 0 if status is 'completed'

      // Step 3: Shift the queue numbers for subsequent reports (those with a queue_number > currentQueueNumber)
      const shiftQueueQuery = 'UPDATE reports SET queue_number = queue_number - 1 WHERE queue_number > ?';

      db.query(shiftQueueQuery, [currentQueueNumber], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Failed to update queue numbers' });
        }

        // Step 4: Update the status, queue_number, and replybyadmin in the database
        const updateStatusQuery = 'UPDATE reports SET status = ?, queue_number = ?, replybyadmin = ? WHERE id = ?';

        db.query(updateStatusQuery, [status, queueNumber, replybyadmin, reportId], (err, result) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Failed to update report status' });
          }

          if (result.affectedRows === 0) {
            // No rows were affected, meaning the report doesn't exist
            return res.status(404).json({ message: 'Report not found' });
          }

          // Successfully updated the status, queue_number, and replybyadmin
          return res.status(200).json({ message: 'Report status updated successfully' });
        });
      });
    } else {
      // If the status is "processing" or "pending", don't change the queue_number
      queueNumber = currentQueueNumber;

      // Step 3: Update the status and replybyadmin without changing the queue_number
      const updateStatusQuery = 'UPDATE reports SET status = ?, queue_number = ?, replybyadmin = ? WHERE id = ?';

      db.query(updateStatusQuery, [status, queueNumber, replybyadmin, reportId], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Failed to update report status' });
        }

        if (result.affectedRows === 0) {
          // No rows were affected, meaning the report doesn't exist
          return res.status(404).json({ message: 'Report not found' });
        }

        // Successfully updated the status and replybyadmin
        return res.status(200).json({ message: 'Report status updated successfully' });
      });
    }
  });
};

const getHistoryReportsForAdmin = (req, res) => {
  // Query untuk mendapatkan laporan dengan queue_number = 0
  const getHistoryReportsQuery = `
      SELECT id, report_number, student_id, report_type, status, description, transaction_proof, queue_number
      FROM reports
      WHERE queue_number = 0
      ORDER BY report_number ASC
  `;

  db.query(getHistoryReportsQuery, (err, reports) => {
      if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Failed to fetch history reports' });
      }

      if (reports.length === 0) {
          return res.status(404).json({ message: 'No history reports found with queue_number = 0' });
      }

      // Kirimkan data laporan-laporan tersebut
      res.status(200).json({
          message: 'History reports retrieved successfully',
          reports
      });
  });
};

module.exports = { getAllStudents, getAllAdmins, updateProfile, getAllReportStudents, updateReportStatus, getHistoryReportsForAdmin };

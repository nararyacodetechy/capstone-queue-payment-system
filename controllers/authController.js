const db = require('../models/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    const { name, nik, email, phone, password, role } = req.body;
  
    if (!name || !nik || !email || !phone || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }
  
    // Periksa apakah email atau NIK sudah digunakan
    const queryCheck = 'SELECT * FROM users WHERE email = ? OR nik = ?';
    db.query(queryCheck, [email, nik], async (err, results) => {
      if (results && results.length > 0) {
        return res.status(400).json({ message: 'Email or NIK already in use' });
      }
  
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Status default 'active'
      const status = 'active';
  
      // Simpan pengguna baru
      const query = 'INSERT INTO users (name, nik, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)';
      db.query(query, [name, nik, email, phone, hashedPassword, role, status], (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Registration failed' });
        }
        res.status(201).json({ message: 'User registered successfully' });
      });
    });
  };
  

  const login = (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
  
    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
      if (err || results.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
  
      const user = results[0];
  
      // Periksa status pengguna
      if (user.status !== 'active') {
        return res.status(403).json({ message: 'Your account is inactive. Please contact support.' });
      }
  
      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (!isPasswordMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
  
      const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ message: 'Login successful', token });
    });
  };
  
  
  

module.exports = { register, login };

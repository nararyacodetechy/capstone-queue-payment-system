require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes'); 
const generalRoutes = require('./routes/generalRoutes'); 
const studentRoutes = require('./routes/studentRoutes'); 
const db = require('./models/db');

const app = express();
app.use(bodyParser.json());

// Authentication
app.use('/api/auth', authRoutes);

// Admin
app.use('/api/admin', adminRoutes);  

// Students
app.use('/api/student', studentRoutes);  

// Upload Files Local
app.use('/api/uploads', express.static('uploads'));

// Generals
app.use('/api/general', generalRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];  // Mengambil token dari header Authorization
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Verifikasi token
    req.user = decoded; // Menyimpan data user yang terdekripsi
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

// Middleware untuk memeriksa role
const authorizeRole = (roles) => {
    return (req, res, next) => {
      const userRole = req.user.role;
  
      if (!roles.includes(userRole)) {
        return res.status(403).json({ message: 'Access denied, insufficient role' });
      }
  
      next();
    };
  };

module.exports = { verifyToken, authorizeRole };

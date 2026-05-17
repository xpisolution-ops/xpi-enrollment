const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Helper: Verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const connection = await pool.getConnection();
    const [users] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
    connection.release();

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return res.status(401).json({ error: 'User account is inactive' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, client_id: user.client_id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// PARENT PORTAL ENDPOINTS
// ============================================

// Submit parent inquiry
app.post('/api/parent/inquiry', async (req, res) => {
  try {
    const { parent_name, parent_phone, parent_email, child_name, child_age, program_interest, client_id } = req.body;

    const connection = await pool.getConnection();

    // Insert parent
    const [parentResult] = await connection.query(
      'INSERT INTO parents (phone, email, full_name, client_id) VALUES (?, ?, ?, ?)',
      [parent_phone, parent_email, parent_name, client_id]
    );

    const parentId = parentResult.insertId;

    // Insert child
    const [childResult] = await connection.query(
      'INSERT INTO children (parent_id, full_name, age, client_id) VALUES (?, ?, ?, ?)',
      [parentId, child_name, child_age, client_id]
    );

    const childId = childResult.insertId;

    // Insert inquiry
    const [inquiryResult] = await connection.query(
      'INSERT INTO inquiries (parent_id, child_id, program_interest, enrollment_stage, client_id) VALUES (?, ?, ?, ?, ?)',
      [parentId, childId, program_interest, 'inquiry_submitted', client_id]
    );

    // Log activity
    await connection.query(
      'INSERT INTO activity_log (parent_id, action, details, client_id) VALUES (?, ?, ?, ?)',
      [parentId, 'inquiry_submitted', `Parent inquiry for ${child_name}`, client_id]
    );

    connection.release();

    res.json({ success: true, parent_id: parentId, inquiry_id: inquiryResult.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get parent enrollment status
app.get('/api/parent/status/:parentId', async (req, res) => {
  try {
    const { parentId } = req.params;

    const connection = await pool.getConnection();

    const [inquiries] = await connection.query(
      'SELECT * FROM inquiries WHERE parent_id = ? ORDER BY created_at DESC',
      [parentId]
    );

    const [children] = await connection.query(
      'SELECT * FROM children WHERE parent_id = ?',
      [parentId]
    );

    connection.release();

    res.json({ inquiries, children });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// STAFF ENROLLMENT DESK ENDPOINTS
// ============================================

// Search families by phone
app.get('/api/staff/search', verifyToken, async (req, res) => {
  try {
    const { phone } = req.query;
    const clientId = req.user.client_id;

    const connection = await pool.getConnection();

    const [parents] = await connection.query(
      'SELECT * FROM parents WHERE phone = ? AND client_id = ?',
      [phone, clientId]
    );

    if (parents.length === 0) {
      connection.release();
      return res.json({ parents: [], children: [], inquiries: [] });
    }

    const parentId = parents[0].id;

    const [children] = await connection.query(
      'SELECT * FROM children WHERE parent_id = ?',
      [parentId]
    );

    const [inquiries] = await connection.query(
      'SELECT * FROM inquiries WHERE parent_id = ? ORDER BY created_at DESC',
      [parentId]
    );

    connection.release();

    res.json({ parents, children, inquiries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update enrollment stage
app.post('/api/staff/update-stage', verifyToken, async (req, res) => {
  try {
    const { inquiry_id, new_stage } = req.body;
    const userId = req.user.id;
    const clientId = req.user.client_id;

    const connection = await pool.getConnection();

    // Get inquiry to find parent_id
    const [inquiries] = await connection.query(
      'SELECT parent_id FROM inquiries WHERE id = ? AND client_id = ?',
      [inquiry_id, clientId]
    );

    if (inquiries.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    const parentId = inquiries[0].parent_id;

    // Update inquiry
    await connection.query(
      'UPDATE inquiries SET enrollment_stage = ?, updated_at = NOW() WHERE id = ?',
      [new_stage, inquiry_id]
    );

    // Log activity
    await connection.query(
      'INSERT INTO activity_log (parent_id, action, details, user_id, client_id) VALUES (?, ?, ?, ?, ?)',
      [parentId, `stage_updated_to_${new_stage}`, `Enrollment stage updated to ${new_stage}`, userId, clientId]
    );

    connection.release();

    res.json({ success: true, new_stage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all families for staff
app.get('/api/staff/families', verifyToken, async (req, res) => {
  try {
    const clientId = req.user.client_id;

    const connection = await pool.getConnection();

    const [families] = await connection.query(
      `SELECT p.*, GROUP_CONCAT(c.full_name) as children, i.enrollment_stage
       FROM parents p
       LEFT JOIN children c ON p.id = c.parent_id
       LEFT JOIN inquiries i ON p.id = i.parent_id
       WHERE p.client_id = ?
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [clientId]
    );

    connection.release();

    res.json({ families });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// DIRECTOR VIEW ENDPOINTS
// ============================================

// Get dashboard stats
app.get('/api/director/stats', verifyToken, async (req, res) => {
  try {
    const clientId = req.user.client_id;

    const connection = await pool.getConnection();

    const [totalParents] = await connection.query(
      'SELECT COUNT(*) as count FROM parents WHERE client_id = ?',
      [clientId]
    );

    const [inquiryStages] = await connection.query(
      'SELECT enrollment_stage, COUNT(*) as count FROM inquiries WHERE client_id = ? GROUP BY enrollment_stage',
      [clientId]
    );

    const [enrollmentPipeline] = await connection.query(
      `SELECT i.enrollment_stage, COUNT(*) as count
       FROM inquiries i
       WHERE i.client_id = ?
       GROUP BY i.enrollment_stage
       ORDER BY FIELD(i.enrollment_stage, 'inquiry_submitted', 'tour_scheduled', 'application_started', 'documents_needed', 'payment_needed', 'enrolled')`,
      [clientId]
    );

    const [parentRecords] = await connection.query(
      'SELECT id, full_name, phone, email, created_at FROM parents WHERE client_id = ? ORDER BY created_at DESC LIMIT 10',
      [clientId]
    );

    connection.release();

    res.json({
      total_parents: totalParents[0].count,
      inquiry_stages: inquiryStages,
      enrollment_pipeline: enrollmentPipeline,
      recent_parents: parentRecords,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// XPI ADMIN ENDPOINTS
// ============================================

// Get all clients (XPI admin only)
app.get('/api/admin/clients', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'xpi_super_admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const connection = await pool.getConnection();

    const [clients] = await connection.query('SELECT * FROM clients ORDER BY created_at DESC');

    // Get parent count for each client
    const clientsWithCounts = await Promise.all(
      clients.map(async (client) => {
        const [counts] = await connection.query(
          'SELECT COUNT(*) as parent_count FROM parents WHERE client_id = ?',
          [client.id]
        );
        return { ...client, parent_count: counts[0].parent_count };
      })
    );

    connection.release();

    res.json({ clients: clientsWithCounts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get client details
app.get('/api/admin/client/:clientId', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'xpi_super_admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { clientId } = req.params;

    const connection = await pool.getConnection();

    const [client] = await connection.query('SELECT * FROM clients WHERE id = ?', [clientId]);

    if (client.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Client not found' });
    }

    const [parents] = await connection.query(
      'SELECT COUNT(*) as count FROM parents WHERE client_id = ?',
      [clientId]
    );

    const [inquiries] = await connection.query(
      'SELECT COUNT(*) as count FROM inquiries WHERE client_id = ?',
      [clientId]
    );

    connection.release();

    res.json({
      client: client[0],
      parent_count: parents[0].count,
      inquiry_count: inquiries[0].count,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'API is running' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`XPI Enrollment API running on port ${PORT}`);
});

module.exports = app;

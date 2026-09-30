import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/profile', authenticateToken, async (req, res) => {
  const { name, mobile_number, address, business_name } = req.body;
  const userId = req.user.userId;

  if (!name || !mobile_number || !address) {
    return res.status(400).json({ error: 'Name, Mobile Number, and Address are required' });
  }

  // Validate mobile number (Indian +91, 10 digits)
  // Strip spaces, dashes, etc.
  const cleanedMobile = mobile_number.replace(/\D/g, '');
  
  // Basic validation: 10 digits, or 12 digits starting with 91
  let finalMobile = cleanedMobile;
  if (cleanedMobile.length === 10) {
    finalMobile = '+91' + cleanedMobile;
  } else if (cleanedMobile.length === 12 && cleanedMobile.startsWith('91')) {
    finalMobile = '+' + cleanedMobile;
  } else {
    return res.status(400).json({ error: 'Invalid Indian mobile number. Must be 10 digits.' });
  }

  try {
    const existing = await pool.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);
    
    if (existing.rows.length > 0) {
      await pool.query(
        'UPDATE user_profiles SET name = $1, mobile_number = $2, address = $3, business_name = $4 WHERE user_id = $5',
        [name, finalMobile, address, business_name || null, userId]
      );
    } else {
      await pool.query(
        'INSERT INTO user_profiles (user_id, name, mobile_number, address, business_name) VALUES ($1, $2, $3, $4, $5)',
        [userId, name, finalMobile, address, business_name || null]
      );
    }
    
    res.status(200).json({ message: 'Profile saved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error saving profile' });
  }
});

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const profile = await pool.query('SELECT name, mobile_number, address, business_name FROM user_profiles WHERE user_id = $1', [req.user.userId]);
    if (profile.rows.length === 0) return res.status(404).json({ error: 'Profile not found' });
    res.status(200).json(profile.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
});

export default router;

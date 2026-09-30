import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Example DB connection check
app.get('/db-health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.status(200).json({ status: 'db ok', time: result.rows[0].now });
  } catch (error) {
    console.error('DB Error:', error);
    res.status(500).json({ status: 'db error', error: error.message });
  }
});

import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import taskRoutes from './routes/tasks.js';

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/tasks', taskRoutes);

app.listen(port, async () => {
  console.log(`Backend server running on port ${port}`);
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Successfully connected to Postgres database!');
  } catch (err) {
    console.error('❌ Failed to connect to Postgres database:', err.message);
  }
});

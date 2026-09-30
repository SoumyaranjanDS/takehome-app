import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/catalog', authenticateToken, async (req, res) => {
  try {
    // Join tasks with categories
    const result = await pool.query(`
      SELECT t.id, t.name, t.description, c.name as category 
      FROM tasks t 
      JOIN categories c ON t.category_id = c.id
    `);
    
    // Group by category
    const grouped = result.rows.reduce((acc, task) => {
      if (!acc[task.category]) acc[task.category] = [];
      acc[task.category].push({ id: task.id, name: task.name, description: task.description });
      return acc;
    }, {});

    const formatted = Object.keys(grouped).map(key => ({
      category: key,
      data: grouped[key]
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching catalog' });
  }
});

router.post('/select', authenticateToken, async (req, res) => {
  const { taskIds } = req.body; // Expecting array of task IDs
  const userId = req.user.userId;

  if (!Array.isArray(taskIds) || taskIds.length === 0) {
    return res.status(400).json({ error: 'Please select at least one task' });
  }

  try {
    await pool.query('BEGIN');
    
    // Clear old selections
    await pool.query('DELETE FROM user_tasks WHERE user_id = $1', [userId]);

    // Insert new selections
    for (const taskId of taskIds) {
      await pool.query('INSERT INTO user_tasks (user_id, task_id) VALUES ($1, $2)', [userId, taskId]);
    }

    await pool.query('COMMIT');
    res.status(200).json({ message: 'Tasks selected successfully' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Server error saving tasks' });
  }
});

router.get('/mine', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  try {
    const result = await pool.query(`
      SELECT t.id, t.name, t.description, c.name as category 
      FROM tasks t 
      JOIN categories c ON t.category_id = c.id
      JOIN user_tasks ut ON t.id = ut.task_id
      WHERE ut.user_id = $1
    `, [userId]);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching user tasks' });
  }
});

export default router;

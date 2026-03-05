const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all fish
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM fish_catches ORDER BY caught_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST fish
router.post('/', async (req, res) => {
  try {
    const { fish_type, lure_used, leader_length, city, state } = req.body;

    await pool.query(
      `INSERT INTO fish_catches
       (fish_type, lure_used, leader_length, city, state)
       VALUES ($1,$2,$3,$4,$5)`,
      [fish_type, lure_used, leader_length, city, state]
    );

    res.status(201).json({ message: 'Created' });

  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE fish
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM fish_catches WHERE id = $1',
      [req.params.id]
    );

    res.json({ message: 'Deleted' });

  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
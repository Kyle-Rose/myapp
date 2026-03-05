require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
});

// 🔥 AUTO-CREATE TABLE ON STARTUP
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fish_catches (
        id SERIAL PRIMARY KEY,
        fish_type VARCHAR(100) NOT NULL,
        lure_used VARCHAR(150) NOT NULL,
        leader_length DOUBLE PRECISION NOT NULL,
        city VARCHAR(150),
        state VARCHAR(150),
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        caught_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ Database ready");
  } catch (err) {
    console.error("❌ Database init error:", err);
  }
}

// API routes
app.get('/fish', async (req, res) => {
  const result = await pool.query('SELECT * FROM fish_catches ORDER BY id DESC');
  res.json(result.rows);
});

app.post('/fish', async (req, res) => {
  const { fish_type, lure_used, leader_length, city, state } = req.body;

  await pool.query(
    `INSERT INTO fish_catches 
     (fish_type, lure_used, leader_length, city, state)
     VALUES ($1, $2, $3, $4, $5)`,
    [fish_type, lure_used, leader_length, city, state]
  );

  res.json({ message: "Fish added" });
});

app.delete('/fish/:id', async (req, res) => {
  await pool.query('DELETE FROM fish_catches WHERE id = $1', [req.params.id]);
  res.json({ message: "Deleted" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await initializeDatabase(); // ← runs automatically in production
});
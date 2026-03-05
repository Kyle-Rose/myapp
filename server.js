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

// ---------------- RESET + CREATE TABLE ----------------
async function initializeDatabase() {
  try {
    // 🔥 REMOVE OLD TABLE (fixes wrong structure)
    await pool.query(`DROP TABLE IF EXISTS fish_catches;`);

    // 🔥 CREATE NEW TABLE (correct structure)
    await pool.query(`
      CREATE TABLE fish_catches (
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

    console.log("✅ Database reset and ready");

  } catch (err) {
    console.error("❌ Database init error:", err);
  }
}

// ---------------- GET ALL FISH ----------------
app.get('/fish', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM fish_catches ORDER BY id DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------- ADD FISH ----------------
app.post('/fish', async (req, res) => {
  try {
    const {
      fish_type,
      lure_used,
      leader_length,
      city,
      state,
      latitude,
      longitude
    } = req.body;

    await pool.query(
      `INSERT INTO fish_catches
       (fish_type, lure_used, leader_length, city, state, latitude, longitude)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [fish_type, lure_used, leader_length, city, state, latitude, longitude]
    );

    res.json({ message: "Fish added" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------- DELETE FISH ----------------
app.delete('/fish/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM fish_catches WHERE id = $1',
      [req.params.id]
    );

    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await initializeDatabase();
});
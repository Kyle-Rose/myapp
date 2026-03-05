require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const fishRoutes = require('./routes/fish');

const app = express();

app.use(helmet()); // security headers
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use('/fish', fishRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
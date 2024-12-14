const express = require('express');
const router = express.Router();
const db = require('../models/db');

router.get('/users', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users');
    res.render('users', { users: result.rows });
  } catch (err) {
    res.status(500).send('Database error');
  }
});

module.exports = router;

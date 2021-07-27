const express = require('express');
const authService = require('../services/authService');

const router = express.Router();

router.get('/', async (req, res) => {
  const { code } = req.query;
  const userData = await authService.getUserData(code);
  res.json(userData);
});

module.exports = router;

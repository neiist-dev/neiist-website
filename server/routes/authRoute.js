const express = require('express');
const { authService } = require('../services');

const router = express.Router();

router.get('/:code', async (req, res) => {
  const { code } = req.params;
  const userData = await authService.getUserData(code);
  res.json(userData);
});

module.exports = router;

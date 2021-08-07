const express = require('express');
const { authService } = require('../services');

const router = express.Router();

router.get('/accessToken/:code', async (req, res) => {
  const { code } = req.params;
  const accessToken = await authService.getAccessToken(code);
  res.send(accessToken);
});

router.get('/userData/:accessToken', async (req, res) => {
  const { accessToken } = req.params;
  const userData = await authService.getUserData(accessToken);
  res.json(userData);
});

module.exports = router;

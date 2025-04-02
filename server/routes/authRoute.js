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
  try {
    const userData = await authService.getUserData(accessToken);
    req.session.user = userData;
    res.json(userData);
  } catch (error) {
    res.status(401).send(error.message);
  }
});

module.exports = router;

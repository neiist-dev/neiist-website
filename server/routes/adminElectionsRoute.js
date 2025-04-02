const express = require('express');
const { electionsService } = require('../services');
const { adminMiddleware } = require('../middlewares');

const router = express.Router();

router.use(express.json());

router.get('/', adminMiddleware, async (req, res) => {
  const elections = await electionsService.getAllElections();
  res.json(elections);
});

module.exports = router;

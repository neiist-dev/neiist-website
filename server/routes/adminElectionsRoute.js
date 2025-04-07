const express = require('express');
const { electionsService } = require('../services');

const router = express.Router();

router.use(express.json());

router.get('/', async (req, res) => {
  const elections = await electionsService.getAllElections();
  res.json(elections);
});

module.exports = router;

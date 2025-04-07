const express = require('express');
const { electionsService } = require('../services');

const router = express.Router();

router.use(express.json());

router.post('/', async (req) => {
  const election = req.body;
  await electionsService.newElection(election);
});

router.get('/', async (req, res) => {
  const elections = await electionsService.getActiveElections();
  res.json(elections);
});

router.post('/:id/votes', async (req) => {
  const { id } = req.params;
  const vote = req.body;
  await electionsService.newVote(id, vote);
});

module.exports = router;

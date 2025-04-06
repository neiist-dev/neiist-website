const express = require('express');
const { electionsService, authService } = require('../services');
const { gacMiddleware, authMiddleware } = require('../middlewares');

const router = express.Router();

router.use(express.json());

router.post('/', gacMiddleware, async (req, res) => {
  const election = req.body;
  await electionsService.newElection(election);
  res.status(201).json({ message: 'Election created successfully' });
});

router.get('/', async (req, res) => {
  const elections = await electionsService.getActiveElections();
  res.json(elections);
});

router.post('/:id/votes', authMiddleware, async (req) => {
  const id = req.session.user.username;
  const vote = req.body;
  await electionsService.newVote(id, vote);
});

module.exports = router;

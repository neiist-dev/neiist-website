const express = require('express');
const { collabsService } = require('../services');
const { adminMiddleware, authMiddleware } = require('../middlewares');

const router = express.Router();

router.use(express.json());

router.get('/:option', async (req, res) => {
  const choices = {
    'all': await collabsService.getCurrentCollabs(),
    'resume': await collabsService.getCurrentCollabsResume(),
  };
  
  const { option } = req.params;
  const members = choices[option];
  res.json(members);
});

router.post('/add/:username', adminMiddleware, async (req, res) => {
  const { username } = req.params;
  const newCollabInfo = req.body;

  await collabsService.addNewCollab(username,newCollabInfo);
  res.json('OK');
});

router.post('/remove/:username', adminMiddleware, async (req, res) => {
  const { username } = req.params;
  await collabsService.removeCollab(username);
  res.json('OK');
});

router.get('/info/:username', authMiddleware, async (req, res) => {
  const { username } = req.params;
  if (username !== req.session.user.username && !req.session.user.isGacMember) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const state = await collabsService.getCollabTeams(username);
  res.json(state);
});

module.exports = router;

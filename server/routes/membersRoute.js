const express = require('express');
const { membersService, authService } = require('../services');
const { authMiddleware } = require('../middlewares');

const router = express.Router();

router.use(express.json());

router.post('/', async (req, res) => {
  const member = req.body;
  await membersService.registerMember(member);
  res.json(member.username);
});

router.get('/status/:username', async (req, res) => {
  const { username } = req.params;
  if (!req.session.user || (username !== req.session.user.username && !req.session.user.isGacMember))
    return res.status(403).json({ error: 'Forbidden' });

  const member = await membersService.getMemberStatus(username);
  res.json(member);
});

router.get('/:username', authMiddleware, async (req, res) => {
  const { username } = req.params;
  if (username !== req.session.user.username && !req.session.user.isGacMember)
    return res.status(403).json({ error: 'Forbidden' });

  const member = await membersService.getMember(username);
  res.json(member);
});

router.put('/:username', authMiddleware, async (req,res) => {
  const { username } = req.params;
  if (username !== req.session.user.username && !req.session.isGacMember)
    return res.status(403).json({ error: 'Forbidden' });

  const nameEmailCourses = req.body;
  await membersService.renovateMember(username, nameEmailCourses);
  res.json(username);
});

module.exports = router;

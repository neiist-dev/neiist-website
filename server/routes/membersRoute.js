const express = require('express');
const membersService = require('../services/membersService');

const router = express.Router();

router.get('/:username', async (req, res) => {
  const { username } = req.params;
  const member = await membersService.getMember(username);
  res.json(member);
});

router.post('/:username', async (req) => {
  const { username } = req.params;
  await membersService.registerMember(username);
});

router.put('/:username', async (req) => {
  const { username } = req.params;
  await membersService.renovateMember(username);
});

module.exports = router;

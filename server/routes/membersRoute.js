const express = require('express');
const { membersService } = require('../services');

const router = express.Router();

router.use(express.json());

router.post('/', async (req) => {
  const member = req.body;
  await membersService.registerMember(member);
});

router.get('/:username', async (req, res) => {
  const { username } = req.params;
  const member = await membersService.getMember(username);
  res.json(member);
});

router.put('/:username', async (req) => {
  const { username } = req.params;
  await membersService.renovateMember(username);
});

module.exports = router;

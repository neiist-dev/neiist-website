const express = require('express');
const { membersService } = require('../services');

const router = express.Router();

router.use(express.json());

router.post('/', async (req, res) => {
  const member = req.body;
  await membersService.registerMember(member);
  res.json(member.username);
});

router.get('/:username', async (req, res) => {
  const { username } = req.params;
  const member = await membersService.getMember(username);
  res.json(member);
});

router.put('/:username', async (req,res) => {
  const { username } = req.params;
  const nameAndEmail = req.body;
  await membersService.renovateMember(username, nameAndEmail);
  res.json(username);
});

module.exports = router;

const express = require('express');
const { membersService } = require('../services');

const router = express.Router();

router.use(express.json());

router.post('/', async (req, res) => {
  const member = req.body;
  await membersService.registerMember(member);
  res.json(member.username);
});

router.get('/status/:username', async (req, res) => {
  const { username } = req.params;
  const member = await membersService.getMemberStatus(username);
  res.json(member);
});

router.get('/:username', async (req, res) => {
  const { username } = req.params;
  const member = await membersService.getMember(username);
  res.json(member);
});

router.put('/:username', async (req,res) => {
  const { username } = req.params;
  const nameEmailCourses = req.body;
  await membersService.renovateMember(username, nameEmailCourses);
  res.json(username);
});

module.exports = router;

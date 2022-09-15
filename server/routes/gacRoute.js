const express = require('express');
const { membersService } = require('../services');

const router = express.Router();

router.use(express.json());

router.get('/:choice', async (req, res) => {
  const { choice } = req.params;

  const options = {
    'active': membersService.getActiveMembers(),
    'all': membersService.getAllMembers(),
  }

  const members = await options[choice];
  res.json(members);
});

router.put('/delete/:username', async (req, res) => {
  const { username } = req.params;
  await membersService.removeMember(username);
  res.json(username);
});

router.post('/update/email/:username', async (req, res) => {
  const { username } = req.params;
  const changedEmail = req.body["changedEmail"];
  await membersService.updateEmailMember(username, changedEmail);
  res.json(username);
});

module.exports = router;

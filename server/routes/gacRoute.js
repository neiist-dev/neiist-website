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

module.exports = router;

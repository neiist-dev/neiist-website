var express = require('express')
const membersService = require('../services/membersService')

var router = express.Router()

router.get('/:username', async (req, res) => {
  const username = req.params.username
  const member = await membersService.getMember(username)
  res.json(member)
})

router.post('/:username', async (req, res) => {
  const username = req.params.username
  await membersService.registerMember(username)
})

router.put('/:username', async (req, res) => {
  const username = req.params.username
  await membersService.renovateMember(username)
})

module.exports = router
var express = require('express')
const membersService = require('../services/membersService')

var router = express.Router()

router.get('/:username', async (req, res) => {
    const username = req.params.username
    console.log(username)
    const member = await membersService.getMember(username)
    res.json(member)
})

module.exports = router
var express = require('express')
const electionsService = require('../services/electionsService')

var router = express.Router()

// router.get('/:username', async (req, res) => {
//     const username = req.params.username
//     const member = await electionsService.getMember(username)
//     res.json(member)
// })

router.post('/:name', async (req, res) => {
    const name = req.params.name
    await electionsService.newElection(name)
})

module.exports = router
var express = require('express')
const electionsService = require('../services/electionsService')

var router = express.Router()

router.use(express.json())

router.get('/', async (req, res) => {
    const activeElections = await electionsService.getActiveElections()
    res.json(activeElections)
})

router.post('/', async (req, res) => {
    const election = req.body
    await electionsService.newElection(election)
})

module.exports = router
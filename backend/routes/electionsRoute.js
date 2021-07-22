var express = require('express')
const electionsService = require('../services/electionsService')

var router = express.Router()

router.use(express.json())

router.get('/:username', async (req, res) => {
  const username = req.params.username
  const activeElections = await electionsService.getActiveElections(username)
  res.json(activeElections)
})

router.get('/:id/options', async (req, res) => {
  const id = req.params.id
  const options = await electionsService.getOptions(id)
  res.json(options)
})

router.post('/', async (req, res) => {
  const election = req.body
  await electionsService.newElection(election)
})

module.exports = router
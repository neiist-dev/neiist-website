var express = require('express')
const electionsService = require('../services/electionsService')

var router = express.Router()

router.use(express.json())

router.get('/', async (req, res) => {
  const activeElections = await electionsService.getActiveElections()
  res.json(activeElections)
})

router.get('/:id', async (req, res) => {
  const id = req.params.id
  const options = await electionsService.getOptions(id)
  res.json(options)
})

router.post('/', async (req, res) => {
  const election = req.body
  await electionsService.newElection(election)
})

module.exports = router
var express = require('express')
const votesService = require('../services/votesService')

var router = express.Router()

router.use(express.json())

router.get('/:electionId', async (req, res) => {
  const electionId = req.params.electionId
  const results = await votesService.getResults(electionId)
  res.json(results)
})

router.post('/', async (req, res) => {
  const vote = req.body
  await votesService.newVote(vote)
})

module.exports = router
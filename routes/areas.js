var express = require('express')
const areasService = require('../services/areasService')

var router = express.Router()

router.use(express.urlencoded({ extended: true }))
router.use(express.json())

router.get("/", async (req, res) => {
    const areas = await areasService.getAreas()
    res.json(areas)
})

router.post('/upload', async (req, res) => {
    const areas = req.body
    await areasService.uploadAreas(areas)
})

module.exports = router
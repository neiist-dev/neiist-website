var express = require('express')
const areasService = require('../services/areasService')

var router = express.Router()

router.use(express.urlencoded({ extended: true }))
router.use(express.json())

router.get("/", async (req, res) => {
    const areas = await areasService.getAreas()
    console.log(areas)
    res.json(areas)
})

router.post('/upload', async (req, res) => {
    const newAreas = req.body
    await areasService.uploadAreas(newAreas)
})

module.exports = router
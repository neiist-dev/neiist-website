var express = require('express')
const fileUpload = require('express-fileupload');
const areasService = require('../services/areasService')

var router = express.Router()

router.use(fileUpload())
router.use(express.urlencoded({ extended: true }))
router.use(express.json())

router.get("/", async (req, res) => {
    const areas = await areasService.getAreas()
    res.json(areas)
})

router.post('/', async (req, res) => {
    const file = req.files.File; // FIXME: use input name instead
    const areasString = file.data.toString()
    const areas = JSON.parse(areasString)
    await areasService.uploadAreas(areas)
})

module.exports = router
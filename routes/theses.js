var express = require('express')
const fileUpload = require('express-fileupload');
const thesesService = require('../services/thesesService')

var router = express.Router()

router.use(fileUpload())
router.use(express.urlencoded({ limit: '50mb', extended: true }))
router.use(express.json({ limit: '50mb' }))

router.get('/', async (req, res) => {
    const areas = req.query.areas
    const theses = await thesesService.getThesesByAreas(areas)
    res.json(theses)
})

router.post('/upload', async (req, res) => {
    const file = req.files.File; // FIXME: use input name instead
    theses = file.data.toString()
    await thesesService.uploadTheses(theses)
})

module.exports = router
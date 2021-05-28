var express = require('express')
const thesesService = require('../services/thesesService')

var router = express.Router()

router.use(express.urlencoded({ limit: '50mb', extended: true }))
router.use(express.json({ limit: '50mb' }))

router.post('/upload', async (req, res) => {
    const newTheses = req.body.htmlContent
    await thesesService.uploadTheses(newTheses)
})

router.get('/:id', async (req, res) => {
    const id = req.params.id
    const thesis = await thesesService.getThesisById(id)
    res.json(thesis)
})

router.get('/:area1?/:area2?', async (req, res) => {
    const area1 = req.params.area1
    const area2 = req.params.area2
    const theses = await thesesService.getThesesByAreas(area1, area2)
    console.log(theses)
    res.json(theses)
})

module.exports = router
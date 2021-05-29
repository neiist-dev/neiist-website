var express = require('express')
const thesesService = require('../services/thesesService')

var router = express.Router()

router.use(express.urlencoded({ limit: '50mb', extended: true }))
router.use(express.json({ limit: '50mb' }))

router.get('/:id', async (req, res) => {
    const id = req.params.id
    const thesis = await thesesService.getThesisById(id)
    res.json(thesis)
})

router.get('/:area1?/:area2?', async (req, res) => {
    const area1 = req.params.area1
    const area2 = req.params.area2
    const theses = await thesesService.getThesesByAreas(area1, area2)
    res.json(theses)
})

router.post('/upload', async (req, res) => {
    const theses = req.body.htmlContent
    console.log(theses)
    //await thesesService.uploadTheses(theses)
})

module.exports = router
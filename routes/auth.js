var express = require('express')
const authService = require('../services/authService')

var router = express.Router()

router.get('/', async (req, res) => {
    const code = req.query.code
    const personInformation = await authService.getPersonInformation(code)
    res.json(personInformation)
})

module.exports = router
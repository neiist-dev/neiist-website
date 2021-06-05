var express = require('express')
const authService = require('../services/authService')

var router = express.Router()

router.get('/', async (req, res) => {
    const code = req.query.code
    const userData = await authService.getUserData(code)
    res.json(userData)
})

module.exports = router
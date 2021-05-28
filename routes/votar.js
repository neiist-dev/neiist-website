var express = require('express')
var router = express.Router()

router.get('/registar/:username', (req, res) => {
    res.json(
        {
            userState: "inexistente" //FIXME
        }
    )
})

module.exports = router
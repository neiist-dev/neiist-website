const express = require('express');

const router = express.Router();

router.use(express.json());

router.post('/', async (req, res) => {
  console.log(req.body);
  res.status(200).send();
});

module.exports = router;

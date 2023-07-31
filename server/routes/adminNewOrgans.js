const express = require('express');
const { collabsService } = require('../services');

const router = express.Router();

router.use(express.json());

router.post('/', async (req, res) => {
  console.log(req.body);
  await collabsService.updateOrgans(
    req.body.lectiveYear,
    req.body.newOrgans,
    req.body.startingDate 
  );
  res.status(200).send();
});

module.exports = router;

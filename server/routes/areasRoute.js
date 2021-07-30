const express = require('express');
const fileUpload = require('express-fileupload');
const { areasService } = require('../services');

const router = express.Router();

router.use(fileUpload());
router.use(express.urlencoded({ extended: true }));
router.use(express.json());

router.post('/', async (req) => {
  const areasFile = req.files.areas;
  const areasString = areasFile.data.toString();
  const areas = JSON.parse(areasString);
  await areasService.uploadAreas(areas);
});

router.get('/', async (req, res) => {
  const areas = await areasService.getAreas();
  res.json(areas);
});

module.exports = router;

const express = require('express');
const fileUpload = require('express-fileupload');
const { thesesService } = require('../services');

const router = express.Router();

router.use(fileUpload());
router.use(express.urlencoded({ limit: '50mb', extended: true }));
router.use(express.json({ limit: '50mb' }));

router.post('/', async (req) => {
  const thesesHtmlFile = req.files.theses;
  const thesesHtmlData = thesesHtmlFile.data;
  const thesesHtml = thesesHtmlData.toString();
  await thesesService.uploadTheses(thesesHtml);
});

router.get('/:areas?', async (req, res) => {
  const areasString = req.params.areas || '';
  const areas = areasString.split(',').filter((area) => area !== '');
  const theses = await thesesService.getThesesByAreas(areas);
  res.json(theses);
});

module.exports = router;

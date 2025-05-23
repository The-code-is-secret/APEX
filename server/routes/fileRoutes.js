const express = require('express');
const {
  downloadZipFile,
  downloadLatexFile
} = require('../controllers/fileController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/download/zip/:projectId', protect, downloadZipFile);
router.get('/download/latex/:projectId', protect, downloadLatexFile);

module.exports = router;
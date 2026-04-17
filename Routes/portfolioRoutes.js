const express = require('express');
const { createPortfolio, getAllPortfolio, deletePortfolio } = require('../Controllers/portfolioController');
const upload = require('../Middlewares/uploadMiddleware');

const router = express.Router();

router.get('/', getAllPortfolio);
router.post('/', upload.single('image'), createPortfolio);
router.delete('/:id', deletePortfolio);

module.exports = router;

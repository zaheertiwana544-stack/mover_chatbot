const express  = require('express');
const router   = express.Router();
const { createQuote, getMyQuotes, getQuote, getItemCatalog } = require('../controllers/quoteController');
const { protect } = require('../middleware/auth');

router.get('/catalog', getItemCatalog);         // public — item list for the form
router.post('/',       protect, createQuote);   // must be logged in to create
router.get('/my',      protect, getMyQuotes);
router.get('/:id',     protect, getQuote);      // must own the quote

module.exports = router;

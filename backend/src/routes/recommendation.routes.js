const router = require('express').Router();
const ctrl   = require('../controllers/recommendation.controller');
const auth   = require('../middleware/auth');

router.get('/daily', auth, ctrl.daily);

module.exports = router;
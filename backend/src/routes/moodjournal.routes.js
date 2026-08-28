const router = require('express').Router();
const ctrl   = require('../controllers/moodjournal.controller');
const auth   = require('../middleware/auth');

router.get('/timeline', auth, ctrl.timeline);
router.delete('/clear', auth, ctrl.clearAll);

module.exports = router;
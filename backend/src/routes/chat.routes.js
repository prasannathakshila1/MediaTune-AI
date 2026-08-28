const router = require('express').Router();
const ctrl   = require('../controllers/chat.controller');
const auth   = require('../middleware/auth');

router.post('/message', auth, ctrl.sendMessage);

module.exports = router;
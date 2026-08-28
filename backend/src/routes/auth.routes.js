const router = require('express').Router();
const ctrl   = require('../controllers/auth.controller');
const auth   = require('../middleware/auth');

router.post('/register',   ctrl.register);
router.post('/login',      ctrl.login);
router.get('/me',          auth, ctrl.getMe);
router.put('/preferences', auth, ctrl.updatePreferences);

module.exports = router;
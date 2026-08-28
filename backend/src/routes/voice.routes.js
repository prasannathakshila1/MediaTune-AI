const router = require('express').Router();
const ctrl   = require('../controllers/voice.controller');
const auth   = require('../middleware/auth');
const upload = require('../middleware/upload');

// field name must be "audio"
router.post('/analyze', auth, upload.single('audio'), ctrl.analyze);
router.post('/karaoke', auth, upload.single('audio'), ctrl.karaoke);
router.get('/profile',  auth, ctrl.getProfile);

module.exports = router;
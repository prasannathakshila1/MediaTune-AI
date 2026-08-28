const router = require('express').Router();
const ctrl   = require('../controllers/emotion.controller');
const auth   = require('../middleware/auth');
const upload = require('../middleware/upload');

// field name must be "image"
router.post('/predict',          auth, upload.single('image'), ctrl.predict);
router.get('/playlist/:emotion', auth, ctrl.getEmotionPlaylist);

module.exports = router;
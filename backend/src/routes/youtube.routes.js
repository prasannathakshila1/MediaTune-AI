const router = require('express').Router();
const ctrl   = require('../controllers/youtube.controller');
const auth   = require('../middleware/auth');

// Existing routes that require auth
router.get('/search',           auth, ctrl.search);
router.get('/mood/:emotion',    auth, ctrl.moodPlaylist);
router.get('/lyrics',           auth, ctrl.getLyrics);
router.get('/video/:id',        auth, ctrl.getVideo);
router.get('/artist',           auth, ctrl.artistSongs);
router.post('/play/:youtubeId', auth, ctrl.trackPlay);
router.post('/like',            auth, ctrl.toggleLike);
router.get('/audio-stream/:videoId', auth, ctrl.getAudioStream);

// OPTIONS handler for CORS
router.options('/stream-audio/:videoId', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

module.exports = router;
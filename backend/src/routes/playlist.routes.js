const router = require('express').Router();
const ctrl   = require('../controllers/playlist.controller');
const auth   = require('../middleware/auth');

router.post('/',                        auth, ctrl.create);
router.get('/',                         auth, ctrl.getAll);
router.get('/:id',                      auth, ctrl.getOne);
router.put('/:id',                      auth, ctrl.update);
router.post('/:id/songs',               auth, ctrl.addSong);
router.delete('/:id/songs/:youtubeId',  auth, ctrl.removeSong);
router.delete('/:id',                   auth, ctrl.deletePlaylist);

module.exports = router;
const Playlist = require('../models/Playlist');

/**
 * playlist.controller.js
 * ══════════════════════
 * POST   /api/playlist                       → create playlist
 * GET    /api/playlist                       → get all my playlists
 * GET    /api/playlist/:id                   → get one playlist with all songs
 * PUT    /api/playlist/:id                   → rename / update playlist
 * POST   /api/playlist/:id/songs             → add a song
 * DELETE /api/playlist/:id/songs/:youtubeId  → remove a song
 * DELETE /api/playlist/:id                   → delete playlist
 */

// ── Create ────────────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { name, description, mood, isPublic } = req.body;

    if (!name || name.trim() === '')
      return res.status(400).json({ error: 'name is required' });

    const playlist = await Playlist.create({
      userId:     req.user.id,
      name:       name.trim(),
      description: description || '',
      mood:       mood || '',
      isPublic:   isPublic || false,
    });

    res.status(201).json(playlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Get all playlists for current user ────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const playlists = await Playlist.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(playlists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Get one playlist ──────────────────────────────────────────────
exports.getOne = async (req, res) => {
  try {
    const playlist = await Playlist.findOne({ _id: req.params.id, userId: req.user.id });
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    res.json(playlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Update playlist name / description ───────────────────────────
exports.update = async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;
    const playlist = await Playlist.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: { name, description, isPublic } },
      { new: true }
    );
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    res.json(playlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Add a song ────────────────────────────────────────────────────
exports.addSong = async (req, res) => {
  try {
    const { youtubeId, title, artist, thumbnail } = req.body;
    if (!youtubeId) return res.status(400).json({ error: 'youtubeId is required' });

    const playlist = await Playlist.findOne({ _id: req.params.id, userId: req.user.id });
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });

    // Prevent duplicates
    const alreadyIn = playlist.songs.some(s => s.youtubeId === youtubeId);
    if (alreadyIn) return res.status(409).json({ error: 'Song already in playlist' });

    playlist.songs.push({ youtubeId, title, artist, thumbnail });
    await playlist.save();

    res.json(playlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Remove a song ─────────────────────────────────────────────────
exports.removeSong = async (req, res) => {
  try {
    const playlist = await Playlist.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $pull: { songs: { youtubeId: req.params.youtubeId } } },
      { new: true }
    );
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    res.json(playlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Delete playlist ───────────────────────────────────────────────
exports.deletePlaylist = async (req, res) => {
  try {
    const playlist = await Playlist.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    res.json({ ok: true, message: 'Playlist deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
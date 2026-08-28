/**
 * youtube.controller.js
 * ═════════════════════
 * GET  /api/youtube/search           → text search
 * GET  /api/youtube/mood/:emotion    → mood-based playlist
 * GET  /api/youtube/lyrics           → timestamped LRC lyrics
 * GET  /api/youtube/video/:id        → single video details
 * GET  /api/youtube/artist           → songs by artist name
 * POST /api/youtube/play/:youtubeId  → increment play count
 */
const Song = require('../models/Song');
const ListeningSession = require('../models/ListeningSession');
const {
  search,
  getMoodPlaylist,
  fetchLyrics,
  getVideoDetails,
  searchByArtist,
  getAudioStreamUrl 
} = require('../services/youtube.service');

// ── Text search ──────────────────────────────────────────────────
exports.search = async (req, res) => {
  try {
    const { q, limit } = req.query;
    if (!q) return res.status(400).json({ error: 'q (query) is required' });

    const results = await search(q, parseInt(limit) || 15);
    res.json({ query: q, count: results.length, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Mood playlist ────────────────────────────────────────────────
exports.moodPlaylist = async (req, res) => {
  try {
    const { emotion } = req.params;
    const validEmotions = ['angry','disgust','fear','happy','neutral','sad','surprise'];

    if (!validEmotions.includes(emotion))
      return res.status(400).json({ error: `emotion must be one of: ${validEmotions.join(', ')}` });

    const results = await getMoodPlaylist(emotion, 15);
    res.json({ emotion, count: results.length, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Lyrics (lrclib) ──────────────────────────────────────────────
exports.getLyrics = async (req, res) => {
  try {
    const { artist, title, duration } = req.query;
    if (!artist || !title)
      return res.status(400).json({ error: 'artist and title query params required' });

    // Check DB first
    const cached = await Song.findOne({ artist: new RegExp(artist, 'i'), title: new RegExp(title, 'i') });
    if (cached?.lyricsLRC) {
      return res.json({ plain: cached.lyricsPlain, lrc: cached.lyricsLRC, source: 'cache' });
    }

    const lyrics = await fetchLyrics(artist, title, duration);
    if (!lyrics) return res.status(404).json({ error: 'Lyrics not found' });

    res.json(lyrics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Single video details ─────────────────────────────────────────
exports.getVideo = async (req, res) => {
  try {
    const details = await getVideoDetails(req.params.id);
    if (!details) return res.status(404).json({ error: 'Video not found' });
    res.json(details);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Artist songs ─────────────────────────────────────────────────
exports.artistSongs = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) return res.status(400).json({ error: 'name query param required' });
    const results = await searchByArtist(name, 10);
    res.json({ artist: name, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Track play (increment counter + log session) ─────────────────
exports.trackPlay = async (req, res) => {
  try {
    const { youtubeId } = req.params;
    const { title, artist, emotion, mode, duration } = req.body;

    // Upsert song in DB
    await Song.findOneAndUpdate(
      { youtubeId },
      { $inc: { plays: 1 }, $setOnInsert: { title: title || '', artist: artist || '' } },
      { upsert: true }
    );

    // Log listening session
    await ListeningSession.create({
      userId:           req.user.id,
      youtubeId,
      songTitle:        title,
      artist,
      emotion,
      mode:             mode || 'normal',
      durationListened: duration || 0,
      completed:        (duration || 0) > 30,
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Like / unlike a song ─────────────────────────────────────────
exports.toggleLike = async (req, res) => {
  try {
    const { youtubeId, title, artist, thumbnail } = req.body;
    const User = require('../models/User');

    const user    = await User.findById(req.user.id);
    const already = user.likedSongs.find(s => s.youtubeId === youtubeId);

    if (already) {
      // Unlike
      user.likedSongs = user.likedSongs.filter(s => s.youtubeId !== youtubeId);
      await Song.findOneAndUpdate({ youtubeId }, { $inc: { likes: -1 } });
    } else {
      // Like
      user.likedSongs.push({ youtubeId, title, artist, thumbnail });
      await Song.findOneAndUpdate(
        { youtubeId },
        { $inc: { likes: 1 }, $setOnInsert: { title, artist } },
        { upsert: true }
      );
    }

    await user.save();
    res.json({ liked: !already, likedSongs: user.likedSongs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAudioStream = async (req, res) => {
  try {
    const { videoId } = req.params;
    const url = await getAudioStreamUrl(videoId);
    res.json({ url, videoId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
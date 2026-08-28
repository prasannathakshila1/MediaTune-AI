/**
 * voice.controller.js — UPDATED
 * ═══════════════════════════════════════════════════════════════════
 * Now returns SONG RECOMMENDATIONS the user can sing,
 * with real YouTube search results for each song.
 */

const axios    = require('axios');
const FormData = require('form-data');
const fs       = require('fs');
const User     = require('../models/User');
const { searchByArtist, search } = require('../services/youtube.service');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// ── POST /api/voice/analyze ────────────────────────────────────────
exports.analyze = async (req, res) => {
  const audioPath = req.file?.path;
  if (!audioPath) return res.status(400).json({ error: 'audio file required' });

  try {
    // ── 1. Send to Python ML ──────────────────────────────────────
    const form = new FormData();
    form.append('audio', fs.createReadStream(audioPath));

    const { data: mlResult } = await axios.post(`${ML_URL}/analyze-voice`, form, {
      headers: form.getHeaders(),
      timeout: 40000,
    });

    // ── 2. For each recommended song, fetch YouTube results ───────
    const enrichedSongs = await Promise.all(
      (mlResult.recommended_songs || []).slice(0, 10).map(async (song) => {
        try {
          const ytResults = await search(
            `${song.title} ${song.artist} official`,
            3
          );
          return {
            ...song,
            youtube: ytResults[0] || null,   // Best matching YouTube video
          };
        } catch {
          return { ...song, youtube: null };
        }
      })
    );

    // ── 3. Save voice profile to User document ─────────────────────
    if (req.user?.id) {
      await User.findByIdAndUpdate(req.user.id, {
        $set: {
          'voiceProfile': {
            f0_min:            mlResult.f0_min,
            f0_max:            mlResult.f0_max,
            f0_mean:           mlResult.f0_mean,
            mfcc:              mlResult.mfcc,
            vocal_range_label: mlResult.vocal_range_label,
            matched_artists:   mlResult.matched_artists,
            analyzedAt:        new Date(),
          }
        }
      });
    }

    // ── 4. Clean up uploaded file ─────────────────────────────────
    fs.unlink(audioPath, () => {});

    res.json({
      // Core vocal features
      f0_min:            mlResult.f0_min,
      f0_max:            mlResult.f0_max,
      f0_mean:           mlResult.f0_mean,
      vocal_range_label: mlResult.vocal_range_label,

      // Similar artists
      matched_artists:   mlResult.matched_artists || [],

      // Song recommendations (with YouTube data)
      recommended_songs: enrichedSongs,
    });

  } catch (err) {
    console.error('Voice analyze error:', err.message);
    fs.unlink(audioPath, () => {});
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/voice/karaoke ────────────────────────────────────────
exports.karaoke = async (req, res) => {
  const audioPath = req.file?.path;
  if (!audioPath) return res.status(400).json({ error: 'audio file required' });

  const mode = req.body.mode || 'instrumental';

  try {
    const form = new FormData();
    form.append('audio', fs.createReadStream(audioPath));
    form.append('mode', mode);

    const { data } = await axios.post(`${ML_URL}/karaoke/separate`, form, {
      headers: form.getHeaders(),
      timeout: 120000,
    });

    fs.unlink(audioPath, () => {});
    res.json(data);

  } catch (err) {
    fs.unlink(audioPath, () => {});
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/voice/profile ─────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('voiceProfile');
    res.json(user?.voiceProfile || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
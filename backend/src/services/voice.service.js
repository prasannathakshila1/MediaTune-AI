const axios    = require('axios');
const FormData = require('form-data');
const fs       = require('fs');

/**
 * voice.service.js
 * ════════════════
 * Bridges Node.js → Python Flask ML service for:
 *   /analyze-voice      → F0 pitch + 13 MFCC + artist match
 *   /karaoke/separate   → audio-separator stems + Whisper ASR lyrics
 */

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// ── Send 10s audio → get F0 + MFCC + matched artists ─────────────
const analyzeVoice = async (audioPath) => {
  const form = new FormData();
  form.append('audio', fs.createReadStream(audioPath));

  const { data } = await axios.post(`${ML_URL}/analyze-voice`, form, {
    headers: form.getHeaders(),
    timeout: 35000,
  });

  // Returns:
  // {
  //   f0_min, f0_max, f0_mean,
  //   mfcc: [13 values],
  //   vocal_range_label: 'Mezzo',
  //   matched_artists: [{ artist, score }, ...]
  // }
  return data;
};

// ── Send audio → stem separation + ASR lyrics ────────────────────
// mode: 'instrumental' | 'vocal_guide' | 'full'
const separateKaraoke = async (audioPath, mode = 'instrumental') => {
  const form = new FormData();
  form.append('audio', fs.createReadStream(audioPath));
  form.append('mode', mode);

  const { data } = await axios.post(`${ML_URL}/karaoke/separate`, form, {
    headers: form.getHeaders(),
    timeout: 120000,    // stem separation can take ~60s on CPU
  });

  // Returns:
  // {
  //   mode,
  //   vocals_path,
  //   instrumental_path,
  //   lyrics: { segments:[{start,end,text}], lrc, language }
  // }
  return data;
};

module.exports = { analyzeVoice, separateKaraoke };
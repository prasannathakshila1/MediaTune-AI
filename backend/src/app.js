/**
 * app.js  —  MoodTune Express Backend
 * =====================================
 * Port: 5000
 *
 * Requires the Python ML service on port 5001 for:
 *   - Emotion prediction (FER-2013 TFLite)
 *   - Voice analysis (librosa pyin + MFCC)
 *   - Karaoke stem separation (audio-separator + Whisper)
 */
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const connectDB  = require('./config/db');

const app = express();

// ── Connect MongoDB ──────────────────────────────────────────────
connectDB();

// ── Security middleware ──────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:8081',
    'http://localhost:19006',  // Expo web
    'http://172.20.10.2:8081', // Your hotspot IP
    process.env.CLIENT_URL
  ].filter(Boolean),
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting — 100 requests / 15 min per IP
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// ── Routes ───────────────────────────────────────────────────────
app.use('/api/auth',           require('./routes/auth.routes'));
app.use('/api/youtube',        require('./routes/youtube.routes'));
app.use('/api/emotion',        require('./routes/emotion.routes'));
app.use('/api/voice',          require('./routes/voice.routes'));
app.use('/api/playlist',       require('./routes/playlist.routes'));
app.use('/api/recommendation', require('./routes/recommendation.routes'));
app.use('/api/chat',           require('./routes/chat.routes'));
app.use('/api/moodjournal',    require('./routes/moodjournal.routes'));
// ── Health check ─────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({
  status:  'ok',
  service: 'MoodTune Node API',
  time:    new Date(),
  mongo:   require('mongoose').connection.readyState === 1 ? 'connected' : 'disconnected',
}));

// ── 404 handler ──────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: `Route ${req.method} ${req.path} not found` }));

// ── Global error handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// ── Start server ─────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎵 MoodTune API running on http://localhost:${PORT}`);
  console.log(`   ML Service expected at: ${process.env.ML_SERVICE_URL || 'http://localhost:5001'}`);
  console.log(`   MongoDB: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/moodtune'}\n`);
});

module.exports = app;
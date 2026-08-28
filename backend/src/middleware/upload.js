const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// ── Ensure upload folders exist ──────────────────────────────────
const AUDIO_DIR = path.join(__dirname, '../../uploads/audio');
const IMAGE_DIR = path.join(__dirname, '../../uploads/images');
fs.mkdirSync(AUDIO_DIR, { recursive: true });
fs.mkdirSync(IMAGE_DIR, { recursive: true });

// ── Storage: route audio/image to correct folder ─────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isAudio = file.mimetype.startsWith('audio');
    cb(null, isAudio ? AUDIO_DIR : IMAGE_DIR);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

// ── Only allow image and audio MIME types ─────────────────────────
const fileFilter = (req, file, cb) => {
  const allowed = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'audio/wav',
    'audio/mpeg',
    'audio/ogg',
    'audio/webm',
    'audio/mp4',
    'audio/x-m4a',
  ];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}`), false);
  }
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 },  // 25 MB max
});
const mongoose = require('mongoose');

// Represents a YouTube-sourced song cached/stored in MongoDB
const SongSchema = new mongoose.Schema(
  {
    youtubeId:   { type: String, required: true, unique: true },
    title:       { type: String, required: true },
    artist:      { type: String, required: true },
    thumbnail:   { type: String, default: '' },
    duration:    { type: Number, default: 0 },       // seconds

    genre:       { type: [String], default: [] },
    mood:        { type: [String], default: [] },     // ['happy','energetic']
    bpm:         { type: Number, default: null },
    language:    { type: String, default: 'en' },
    isChildSafe: { type: Boolean, default: false },
    tags:        { type: [String], default: [] },

    // Karaoke/vocal data — populated in Phase 3
    vocalRangeMin: { type: Number, default: null },   // Hz
    vocalRangeMax: { type: Number, default: null },   // Hz
    lyricsPlain:   { type: String, default: '' },     // plain text from Whisper ASR
    lyricsLRC:     { type: String, default: '' },     // timestamped LRC format

    plays:  { type: Number, default: 0 },
    likes:  { type: Number, default: 0 },
  },
  { timestamps: true }
);

SongSchema.index({ youtubeId: 1 });
SongSchema.index({ mood: 1 });
SongSchema.index({ genre: 1 });
SongSchema.index({ title: 'text', artist: 'text' });

module.exports = mongoose.model('Song', SongSchema);
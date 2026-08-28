const mongoose = require('mongoose');

// Tracks every song a user listens to — used for mood journal insights
const ListeningSessionSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    youtubeId:  { type: String, required: true },
    songTitle:  { type: String, default: '' },
    artist:     { type: String, default: '' },
    thumbnail:  { type: String, default: '' },

    // Context at time of listening
    emotion:    { type: String, default: 'neutral' },
    weather:    { type: String, default: '' },
    timeOfDay:  { type: String, default: '' },

    mode: {
      type:    String,
      enum:    ['normal', 'karaoke', 'sleep', 'study', 'focus', 'workout'],
      default: 'normal',
    },

    durationListened: { type: Number, default: 0 },    // seconds listened
    completed:        { type: Boolean, default: false },// listened > 80% of track
  },
  { timestamps: true }
);

ListeningSessionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ListeningSession', ListeningSessionSchema);
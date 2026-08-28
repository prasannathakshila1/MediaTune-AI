const mongoose = require('mongoose');

// Every face-scan emotion detection is logged here
const MoodLogSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Emotion from ML service
  emotion:    {
    type: String,
    enum: ['angry','disgust','fear','happy','neutral','sad','surprise'],
    required: true,
  },
  confidence: Number,
  allScores:  mongoose.Schema.Types.Mixed,  // { happy: 0.9, sad: 0.05, ... }

  // Context at time of detection
  weather:    String,     // Clear / Rain / Clouds ...
  timeOfDay:  String,     // morning / afternoon / evening / night
  dayOfWeek:  String,     // Monday / Tuesday ...

  // Song playing at time of scan (optional)
  youtubeId:  String,
  songTitle:  String,

  timestamp:  { type: Date, default: Date.now },
});

MoodLogSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('MoodLog', MoodLogSchema);
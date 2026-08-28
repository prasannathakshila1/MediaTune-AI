const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username:     { type: String, required: true, unique: true, trim: true, minlength: 3 },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  avatar:       { type: String, default: '' },

  // Voice profile from Phase 1 analyze-voice
  voiceProfile: {
    f0Min:          Number,
    f0Max:          Number,
    f0Mean:         Number,
    mfcc:           [Number],         // 13 features
    vocalRangeLabel: String,          // Soprano / Alto / Tenor / Baritone / Bass
    analyzedAt:     Date,
    matchedArtists: [{
      artist:    String,
      score:     Number,
    }],
  },

  preferences: {
    genres:   { type: [String], default: [] },
    moods:    { type: [String], default: [] },
    language: { type: String, default: 'en' },
  },

  likedSongs: [{        // YouTube IDs the user liked
    youtubeId:  String,
    title:      String,
    artist:     String,
    thumbnail:  String,
    likedAt:    { type: Date, default: Date.now },
  }],

  createdAt: { type: Date, default: Date.now },
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

UserSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

module.exports = mongoose.model('User', UserSchema);
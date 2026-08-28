/**
 * auth.controller.js
 * ══════════════════
 * POST /api/auth/register   → create account
 * POST /api/auth/login      → get JWT
 * GET  /api/auth/me         → get current user
 * PUT  /api/auth/preferences → update genres/moods
 */
const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ── Register ─────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ error: 'username, email and password are required' });

    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists)
      return res.status(409).json({ error: 'Username or email already taken' });

    const user  = await User.create({ username, email, passwordHash: password });
    const token = signToken(user._id);

    res.status(201).json({
      token,
      user: {
        id:       user._id,
        username: user.username,
        email:    user.email,
        avatar:   user.avatar,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Login ────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'email and password required' });

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ error: 'Invalid email or password' });

    const token = signToken(user._id);
    res.json({
      token,
      user: {
        id:           user._id,
        username:     user.username,
        email:        user.email,
        avatar:       user.avatar,
        voiceProfile: user.voiceProfile,
        preferences:  user.preferences,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Get current user ─────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Update preferences (genres, moods) ──────────────────────────
exports.updatePreferences = async (req, res) => {
  try {
    const { genres, moods, language } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { 'preferences.genres': genres, 'preferences.moods': moods, 'preferences.language': language } },
      { new: true }
    ).select('-passwordHash');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const MoodLog    = require('../models/MoodLog');
const { getSmartRecommendation } = require('../services/youtube.service');
const { getWeather, getTimeOfDay, getDayOfWeek } = require('../services/weather.service');

/**
 * recommendation.controller.js
 * ════════════════════════════
 * GET /api/recommendation/daily
 *
 * Fuses 4 signals → 10 perfectly timed song suggestions:
 *   1. Last detected emotion (from MoodLog)
 *   2. Current weather     (OpenWeatherMap)
 *   3. Time of day         (morning/afternoon/evening/night)
 *   4. Day of week         (Monday blues? Friday energy?)
 *
 * Client should refresh every 30 minutes (refreshAt timestamp returned).
 */
exports.daily = async (req, res) => {
  try {
    const { lat, lon } = req.query;

    // ── 1. Weather ───────────────────────────────────────────────
    const weather   = await getWeather(lat, lon);
    const timeOfDay = getTimeOfDay();
    const dayOfWeek = getDayOfWeek();

    // ── 2. Most recent emotion detected for this user ────────────
    const lastLog = await MoodLog
      .findOne({ userId: req.user.id })
      .sort({ createdAt: -1 });

    const emotion = lastLog?.emotion || 'neutral';

    // ── 3. Fetch contextual YouTube songs ────────────────────────
    const songs = await getSmartRecommendation({ emotion, weather: weather.condition, timeOfDay });

    // ── 4. Build human-readable reason string for the UI card ────
    const reasonMap = {
      angry:    'You seem tense — here\'s something to channel that energy',
      disgust:  'Feeling off? These calm tracks should help',
      fear:     'Feeling anxious? These will soothe your mind',
      happy:    'You\'re glowing! Here\'s your happy soundtrack',
      neutral:  'A balanced mix for your current mood',
      sad:      'Feeling low — music that understands you',
      surprise: 'Big energy detected — let\'s amplify it!',
    };

    res.json({
      context: {
        emotion,
        weather,
        timeOfDay,
        dayOfWeek,
        reason: reasonMap[emotion] || reasonMap.neutral,
      },
      songs,
      refreshAt: new Date(Date.now() + 30 * 60 * 1000),  // 30 min
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const MoodLog = require('../models/MoodLog');

/**
 * moodjournal.controller.js
 * ═════════════════════════
 * GET    /api/moodjournal/timeline?period=week|month
 *   → Returns all mood logs + computed insights for the period
 *
 * DELETE /api/moodjournal/clear
 *   → Deletes all mood logs for the user (GDPR / privacy)
 */

// ── Timeline + insights ───────────────────────────────────────────
exports.timeline = async (req, res) => {
  try {
    const period = req.query.period || 'week';
    const days   = period === 'month' ? 30 : 7;
    const from   = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const logs = await MoodLog.find({
      userId:    req.user.id,
      createdAt: { $gte: from },
    }).sort({ createdAt: -1 });

    // ── Build insights ───────────────────────────────────────────
    const emotionCounts = {};   // { happy: 5, sad: 2, ... }
    const byDayOfWeek   = {};   // { Monday: { happy:2 }, ... }
    const byTimeOfDay   = {};   // { morning: { happy:3 }, ... }

    for (const log of logs) {
      // Emotion frequency
      emotionCounts[log.emotion] = (emotionCounts[log.emotion] || 0) + 1;

      // By day of week
      if (log.dayOfWeek) {
        byDayOfWeek[log.dayOfWeek] = byDayOfWeek[log.dayOfWeek] || {};
        byDayOfWeek[log.dayOfWeek][log.emotion] =
          (byDayOfWeek[log.dayOfWeek][log.emotion] || 0) + 1;
      }

      // By time of day
      if (log.timeOfDay) {
        byTimeOfDay[log.timeOfDay] = byTimeOfDay[log.timeOfDay] || {};
        byTimeOfDay[log.timeOfDay][log.emotion] =
          (byTimeOfDay[log.timeOfDay][log.emotion] || 0) + 1;
      }
    }

    // Dominant emotion
    const dominantEntry = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0];

    // Build natural-language insight strings
    const insightTexts = [];
    if (dominantEntry) {
      insightTexts.push(`Your most common mood this ${period} was "${dominantEntry[0]}"`);
    }
    // Sunday night check
    if (byDayOfWeek['Sunday']?.sad > 0) {
      insightTexts.push('You tend to feel reflective on Sunday evenings');
    }
    // Tuesday morning productivity
    if (byDayOfWeek['Tuesday']?.happy > 0 && byTimeOfDay['morning']?.happy > 0) {
      insightTexts.push('Upbeat music seems to match your productive Tuesday mornings');
    }

    res.json({
      logs,
      insights: {
        period,
        totalSessions:    logs.length,
        dominantEmotion:  dominantEntry?.[0] || null,
        emotionBreakdown: emotionCounts,
        byDayOfWeek,
        byTimeOfDay,
        insightTexts,
      },
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Delete all logs (GDPR) ────────────────────────────────────────
exports.clearAll = async (req, res) => {
  try {
    const result = await MoodLog.deleteMany({ userId: req.user.id });
    res.json({ ok: true, deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
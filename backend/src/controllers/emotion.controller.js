// backend/controllers/emotion.controller.js
const fs = require('fs');
const { predictEmotion, emotionToContext } = require('../services/emotion.service');
const { getMoodPlaylist } = require('../services/youtube.service');
const { getTimeOfDay, getDayOfWeek } = require('../services/weather.service');
const MoodLog = require('../models/MoodLog');

exports.predict = async (req, res) => {
  console.log('=== PREDICT ENDPOINT HIT ===');
  console.log('Request file:', req.file);
  
  if (!req.file) {
    return res.status(400).json({ error: 'image file is required (field: image)' });
  }

  try {
    // Call ML service
    const mlResult = await predictEmotion(req.file.path);
    console.log('ML Result:', mlResult);

    // Cleanup temp file
    fs.unlink(req.file.path, () => {});

    // Log to MoodLog
    await MoodLog.create({
      userId:     req.user.id,
      emotion:    mlResult.emotion,
      confidence: mlResult.confidence,
      allScores:  mlResult.all_scores,
      timeOfDay:  getTimeOfDay(),
      dayOfWeek:  getDayOfWeek(),
    });

    // Fetch mood-matched playlist
    const playlist = await getMoodPlaylist(mlResult.emotion, 15);
    const context = emotionToContext(mlResult.emotion);

    res.json({
      emotion:      mlResult.emotion,
      confidence:   mlResult.confidence,
      allScores:    mlResult.all_scores,
      musicContext: context,
      playlist,
    });

  } catch (err) {
    console.error('ERROR in predict endpoint:', err);
    if (req.file?.path) fs.unlink(req.file.path, () => {});
    res.status(500).json({ error: err.message });
  }
};

exports.getEmotionPlaylist = async (req, res) => {
  try {
    const { emotion } = req.params;
    const playlist = await getMoodPlaylist(emotion, 15);
    const context = emotionToContext(emotion);
    res.json({ emotion, musicContext: context, playlist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
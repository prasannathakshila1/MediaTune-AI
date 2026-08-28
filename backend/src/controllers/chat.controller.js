/**
 * chat.controller.js
 * ═══════════════════
 * POST /api/chat/message
 * Detects emotion from free-text, returns an empathetic reply + 3-5 songs.
 */
const { detectEmotion } = require('../services/emotionText.service');
const { search } = require('../services/youtube.service');

// Search query + emoji + empathetic line per emotion
const EMOTION_META = {
  happy: {
    emoji: '😊',
    query: 'feel good happy pop hits',
    lines: [
      "That's wonderful to hear! Let's keep that energy going 🎶",
      "Love that! Here's some music to match your good vibes 😊",
    ],
  },
  sad: {
    emoji: '💙',
    query: 'sad emotional acoustic songs',
    lines: [
      "I'm sorry you're feeling low right now. Music won't fix everything, but maybe it can keep you company 💙",
      "That sounds tough. Here are a few songs that might understand how you feel right now.",
    ],
  },
  angry: {
    emoji: '😤',
    query: 'high energy rock rage release music',
    lines: [
      "Sounds like you've got a lot of frustration built up. Let's channel it into something 😤",
      "Totally valid to feel that way. Here's some music to help you let it out.",
    ],
  },
  calm: {
    emoji: '🌿',
    query: 'calm relaxing lofi chill music',
    lines: [
      "Nice, sounds like you're in a peaceful headspace 🌿",
      "Let's keep that calm going with something soothing.",
    ],
  },
  fearful: {
    emoji: '🤍',
    query: 'soothing calming anxiety relief music',
    lines: [
      "That sounds stressful. Let's ease things a little with some calming music 🤍",
      "It's okay to feel anxious sometimes. Here's something gentle to help you breathe.",
    ],
  },
  surprised: {
    emoji: '😲',
    query: 'upbeat energetic surprise mood music',
    lines: [
      "Whoa, sounds like quite a moment! Here's some music to match the surprise 😲",
    ],
  },
  nostalgic: {
    emoji: '🕰️',
    query: 'nostalgic throwback classic hits',
    lines: [
      "There's something special about looking back. Here's a throwback playlist 🕰️",
    ],
  },
  motivated: {
    emoji: '🔥',
    query: 'motivational workout hype music',
    lines: [
      "Love that energy! Let's fuel it with something powerful 🔥",
    ],
  },
  neutral: {
    emoji: '🎵',
    query: 'popular music 2024',
    lines: [
      "Got it! Here's a mix of songs for you — let me know your mood and I can tailor it better 🎵",
    ],
  },
};

// Optional genre/activity keywords the user might mention — appended to the search query
const ACTIVITY_HINTS = {
  workout: 'workout gym',
  gym: 'workout gym',
  study: 'study focus instrumental',
  studying: 'study focus instrumental',
  sleep: 'sleep relaxing',
  drive: 'road trip driving',
  driving: 'road trip driving',
  party: 'party dance',
  rain: 'rainy day',
};

const pickLine = (lines) => lines[Math.floor(Math.random() * lines.length)];

exports.sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }

    const { emotion, isDistressed } = detectEmotion(message);
    const meta = EMOTION_META[emotion] || EMOTION_META.neutral;

    // Check message for an activity/genre hint to tailor the query
    const lowerMsg = message.toLowerCase();
    const activityHit = Object.keys(ACTIVITY_HINTS).find((k) => lowerMsg.includes(k));
    const query = activityHit
      ? `${meta.query} ${ACTIVITY_HINTS[activityHit]}`
      : meta.query;

    const rawSongs = await search(query, 5);
    const songs = rawSongs.map((s) => ({
      youtubeId: s.youtubeId,
      title: s.title,
      artist: s.artist,
      thumbnail: s.thumbnail,
      reason: `Matches your ${emotion} mood`,
    }));

    let reply = pickLine(meta.lines);

    if (isDistressed) {
      reply =
        "I'm really glad you told me this, and I want you to know you don't have to go through it alone. " +
        "It might help to talk to a counselor, doctor, or someone you trust — you deserve real support, not just music. " +
        "In the meantime, here are a few gentle songs, but please consider reaching out to a professional if these feelings continue.";
    }

    reply += ' Want me to adjust the mix, or tell me more about what you\'re into?';

    res.json({
      emotion,
      emoji: meta.emoji,
      reply,
      isDistressed,
      songs,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
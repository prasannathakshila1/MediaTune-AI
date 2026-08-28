/**
 * emotionText.service.js
 * ═══════════════════════
 * Free, rule-based emotion detection from plain text.
 * No external API — keyword/phrase matching against 9 emotion categories.
 */

const EMOTION_KEYWORDS = {
  happy: [
    'happy', 'great', 'awesome', 'excited', 'joy', 'joyful', 'good mood',
    'amazing', 'wonderful', 'glad', 'smiling', 'smile', 'cheerful', 'yay',
    'love this day', 'feeling good', 'fantastic', 'blessed', 'thrilled',
  ],
  sad: [
    'sad', 'down', 'depressed', 'unhappy', 'crying', 'cry', 'heartbroken',
    'lonely', 'alone', 'miss him', 'miss her', 'miss them', 'low', 'blue',
    'hurt', 'upset', 'gloomy', 'tearful', 'broken', 'empty inside',
  ],
  angry: [
    'angry', 'mad', 'furious', 'annoyed', 'irritated', 'pissed', 'rage',
    'frustrated', 'hate this', 'so done', 'fed up', 'livid',
  ],
  calm: [
    'calm', 'relaxed', 'peaceful', 'chill', 'chilling', 'at ease', 'serene',
    'mellow', 'unwinding', 'zen', 'quiet mind',
  ],
  fearful: [
    'scared', 'afraid', 'anxious', 'nervous', 'worried', 'fear', 'panic',
    'terrified', 'overwhelmed', 'stressed', 'stress', 'tense',
  ],
  surprised: [
    'surprised', 'shocked', 'wow', 'omg', 'can\'t believe', 'unexpected',
    'whoa', 'stunned', 'speechless',
  ],
  nostalgic: [
    'nostalgic', 'miss the old days', 'used to', 'back then', 'reminds me',
    'old memories', 'throwback', 'those days', 'growing up',
  ],
  motivated: [
    'motivated', 'pumped', 'let\'s go', 'grinding', 'focused', 'determined',
    'workout', 'gym', 'productive', 'hustle', 'goal', 'crushing it',
  ],
  neutral: [], // fallback, no keywords needed
};

// Words that indicate the person may be in real distress — used to trigger
// a gentle, safe response rather than just a song list.
const DISTRESS_KEYWORDS = [
  'want to die', 'kill myself', 'end it all', 'suicide', 'suicidal',
  'hurt myself', 'self harm', 'self-harm', 'no reason to live',
  'can\'t go on', 'give up on life',
];

const containsAny = (text, keywords) =>
  keywords.some((kw) => text.includes(kw));

/**
 * detectEmotion(message) → { emotion, isDistressed }
 */
const detectEmotion = (message) => {
  const text = message.toLowerCase();

  const isDistressed = containsAny(text, DISTRESS_KEYWORDS);

  let bestEmotion = 'neutral';
  let bestScore = 0;

  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    if (emotion === 'neutral') continue;
    const score = keywords.reduce(
      (acc, kw) => acc + (text.includes(kw) ? 1 : 0),
      0
    );
    if (score > bestScore) {
      bestScore = score;
      bestEmotion = emotion;
    }
  }

  return { emotion: bestEmotion, isDistressed, matched: bestScore > 0 };
};

module.exports = { detectEmotion, EMOTION_KEYWORDS };
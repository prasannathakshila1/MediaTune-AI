// ─────────────────────────────────────────────────────────────────
// YouTube Data API v3 — central configuration
// API Key: AIzaSyBrSPCMWya9NSD2D3zhlEK3Lw6pthnrUEg
// Docs: https://developers.google.com/youtube/v3/docs/search/list
// ─────────────────────────────────────────────────────────────────

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyBrSPCMWya9NSD2D3zhlEK3Lw6pthnrUEg';
const BASE_URL        = 'https://www.googleapis.com/youtube/v3';

// FER-2013 7 emotion classes → YouTube search queries
const MOOD_QUERIES = {
  angry:    'angry rock intense energy songs',
  disgust:  'relaxing calm instrumental music',
  fear:     'calming peaceful anxiety relief music',
  happy:    'happy upbeat pop hits 2024',
  neutral:  'chill lo-fi background music',
  sad:      'sad emotional heartbreak songs',
  surprise: 'feel good euphoric uplifting music',
};

// OpenWeatherMap condition → query modifier
const WEATHER_QUERIES = {
  Rain:         'rainy day cozy acoustic',
  Clear:        'sunny upbeat happy vibes',
  Clouds:       'cloudy chill mellow music',
  Snow:         'cozy winter warm music',
  Thunderstorm: 'intense storm dramatic music',
  Drizzle:      'light rain soft piano',
  Mist:         'foggy mysterious ambient',
};

// Time of day → query modifier
const TIME_QUERIES = {
  morning:   'morning motivation energy boost',
  afternoon: 'afternoon chill daytime playlist',
  evening:   'evening wind down relax',
  night:     'night drive ambient lofi',
};

// Contextual auto-modes
const MODE_QUERIES = {
  sleep:   'sleep music binaural nature sounds ambient',
  study:   'lo-fi study beats no lyrics focus',
  focus:   'deep focus concentration instrumental',
  workout: 'workout gym high energy pump up',
};

module.exports = {
  YOUTUBE_API_KEY,
  BASE_URL,
  MOOD_QUERIES,
  WEATHER_QUERIES,
  TIME_QUERIES,
  MODE_QUERIES,
};
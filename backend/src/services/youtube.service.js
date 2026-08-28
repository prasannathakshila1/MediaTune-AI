/**
 * youtube.service.js
 * ══════════════════
 * All YouTube Data API v3 calls live here.
 *
 * API key: AIzaSyBrSPCMWya9NSD2D3zhlEK3Lw6pthnrUEg
 * Docs:    https://developers.google.com/youtube/v3/docs/search/list
 */
const axios = require('axios');
const { YOUTUBE_API_KEY, BASE_URL, MOOD_QUERIES, WEATHER_QUERIES, TIME_QUERIES } = require('../config/youtube');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// ── Core search ─────────────────────────────────────────────────
const search = async (query, maxResults = 15) => {
  const { data } = await axios.get(`${BASE_URL}/search`, {
    params: {
      part:            'snippet',
      q:               query,
      type:            'video',
      videoCategoryId: '10',       // Music
      maxResults,
      key:             YOUTUBE_API_KEY,
    },
  });

  return data.items.map(item => ({
    youtubeId:  item.id.videoId,
    title:      item.snippet.title,
    artist:     item.snippet.channelTitle,
    thumbnail:  item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
    publishedAt: item.snippet.publishedAt,
  }));
};

// ── Mood-based playlist ──────────────────────────────────────────
const getMoodPlaylist = async (emotion, maxResults = 15) => {
  const query = MOOD_QUERIES[emotion] || 'popular music 2024';
  return search(query, maxResults);
};

// ── Smart contextual recommendation (weather + time + emotion) ──
const getSmartRecommendation = async ({ emotion, weather, timeOfDay }) => {
  const parts = [
    MOOD_QUERIES[emotion] || '',
    WEATHER_QUERIES[weather] || '',
    TIME_QUERIES[timeOfDay] || '',
  ].filter(Boolean);

  const query = parts.join(' ').trim();
  return search(query, 10);
};

// ── Clean messy YouTube metadata into a real artist/title guess ──
const cleanForLyrics = (rawArtist, rawTitle) => {
  let artist = (rawArtist || '')
    .replace(/VEVO/gi, '')
    .replace(/official/gi, '')
    .replace(/- topic/gi, '')
    .trim();

  let title = (rawTitle || '')
    .replace(/\(.*?(official|video|audio|lyrics|hd|4k|remix|visualizer).*?\)/gi, '')
    .replace(/\[.*?(official|video|audio|lyrics|hd|4k|remix|visualizer).*?\]/gi, '')
    .replace(/official\s*(music\s*)?video/gi, '')
    .replace(/official\s*audio/gi, '')
    .replace(/lyrics?\s*video/gi, '')
    .trim();

  const dashSplit = title.split(/\s-\s/);
  if (dashSplit.length >= 2) {
    artist = dashSplit[0].trim();
    title = dashSplit.slice(1).join(' - ').trim();
  }

  title = title.replace(/[-–—,]+$/, '').trim();
  artist = artist.replace(/[-–—,]+$/, '').trim();

  return { artist, title };
};

// ── Pick the candidate whose duration best matches the actual track ──
const pickBestMatch = (candidates, targetDuration) => {
  if (!candidates || candidates.length === 0) return null;
  if (!targetDuration) return candidates[0];

  let best = candidates[0];
  let bestDiff = Infinity;

  for (const c of candidates) {
    if (!c.duration) continue;
    const diff = Math.abs(c.duration - targetDuration);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = c;
    }
  }
  return best;
};

// ── Fetch timestamped lyrics from lrclib (free, no key) ─────────
const fetchLyrics = async (rawArtist, rawTitle, targetDuration) => {
  const { artist, title } = cleanForLyrics(rawArtist, rawTitle);
  const duration = Number(targetDuration) || null;

  const attempts = [
    { artist_name: artist, track_name: title },
    { track_name: title },
    { track_name: rawTitle },
  ];

  for (const params of attempts) {
    if (!params.track_name) continue;
    try {
      const { data } = await axios.get('https://lrclib.net/api/search', {
        params,
        timeout: 5000,
      });
      if (data && data.length > 0) {
        const track = pickBestMatch(data, duration);
        if (track) {
          return {
            plain: track.plainLyrics || '',
            lrc: track.syncedLyrics || '',
            duration: track.duration,
            source: 'lrclib',
            matchedArtist: track.artistName,
            matchedTitle: track.trackName,
          };
        }
      }
    } catch {
      // try next attempt
    }
  }
  return null;
};

// ── Get video details (duration) ─────────────────────────────────
const getVideoDetails = async (videoId) => {
  try {
    const { data } = await axios.get(`${BASE_URL}/videos`, {
      params: { part: 'contentDetails,snippet', id: videoId, key: YOUTUBE_API_KEY },
    });
    return data.items[0] || null;
  } catch {
    return null;
  }
};

// ── Genre / artist specific search ──────────────────────────────
const searchByArtist = async (artistName, maxResults = 10) => {
  return search(`${artistName} official songs`, maxResults);
};

const getAudioStreamUrl = async (videoId) => {
  try {
    const { stdout } = await execAsync(
      `yt-dlp -f "bestaudio[ext=webm]/bestaudio/best" --get-url "https://www.youtube.com/watch?v=${videoId}"`,
      { timeout: 15000 }
    );
    return stdout.trim();
  } catch (err) {
    throw new Error('Failed to extract audio stream: ' + err.message);
  }
};

module.exports = {
  search,
  getMoodPlaylist,
  getSmartRecommendation,
  fetchLyrics,
  getVideoDetails,
  searchByArtist,
  getAudioStreamUrl,
};
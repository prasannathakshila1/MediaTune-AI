/**
 * seed.js — MoodTune/Moodify Database Seeder
 * ============================================
 * Seeds MongoDB with songs from YouTube API
 * across 10 mood/genre categories.
 *
 * Run: npm run seed
 * (from backend/ folder)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

// ── Import models ──────────────────────────────────────────────────
const Song = require('../src/models/Song');
const connectDB = require('../src/config/db');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyBrSPCMWya9NSD2D3zhlEK3Lw6pthnrUEg';
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

// ── 10 Seed Categories ─────────────────────────────────────────────
const SEED_CATEGORIES = [
  { query: 'happy upbeat pop hits 2024',         mood: 'happy',   genre: 'pop'        },
  { query: 'sad emotional ballad songs',          mood: 'sad',     genre: 'ballad'     },
  { query: 'angry rock intense energy songs',     mood: 'angry',   genre: 'rock'       },
  { query: 'calm relaxing peaceful music',        mood: 'neutral', genre: 'ambient'    },
  { query: 'lofi hip hop study beats no lyrics',  mood: 'neutral', genre: 'lofi'       },
  { query: 'euphoric surprise feel good music',   mood: 'surprise',genre: 'electronic' },
  { query: 'fear anxiety relief calming music',   mood: 'fear',    genre: 'ambient'    },
  { query: 'workout gym pump up high energy',     mood: 'angry',   genre: 'workout'    },
  { query: 'jazz smooth chill evening music',     mood: 'neutral', genre: 'jazz'       },
  { query: 'classical piano beautiful 2024',      mood: 'neutral', genre: 'classical'  },
];

// ── Fetch from YouTube ─────────────────────────────────────────────
const fetchFromYouTube = async (query, maxResults = 10) => {
  try {
    const { data } = await axios.get(`${BASE_URL}/search`, {
      params: {
        part: 'snippet',
        type: 'video',
        videoCategoryId: '10',   // Music category
        q: query,
        maxResults,
        key: YOUTUBE_API_KEY,
      },
      timeout: 10000,
    });

    return data.items.map((item) => ({
      youtubeId: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.medium?.url || '',
    }));
  } catch (err) {
    console.error(`YouTube API error for "${query}":`, err.response?.data?.error?.message || err.message);
    return [];
  }
};

// ── Main Seeder ────────────────────────────────────────────────────
const seedDatabase = async () => {
  console.log('🌱 Starting database seed...\n');

  await connectDB();

  let totalInserted = 0;
  let totalSkipped = 0;

  for (const category of SEED_CATEGORIES) {
    console.log(`📦 Seeding: "${category.query}"`);

    const songs = await fetchFromYouTube(category.query, 10);

    if (songs.length === 0) {
      console.log(`   ⚠️  No results — check YouTube API key\n`);
      continue;
    }

    for (const song of songs) {
      try {
        await Song.findOneAndUpdate(
          { youtubeId: song.youtubeId },
          {
            $set: {
              youtubeId: song.youtubeId,
              title:     song.title,
              artist:    song.artist,
              thumbnail: song.thumbnail,
              mood:      [category.mood],
              genre:     [category.genre],
            },
          },
          { upsert: true, new: true }
        );
        totalInserted++;
      } catch (err) {
        if (err.code !== 11000) {
          console.error(`   ❌ Failed to save "${song.title}":`, err.message);
        }
        totalSkipped++;
      }
    }

    console.log(`   ✅ Seeded ${songs.length} songs (mood: ${category.mood}, genre: ${category.genre})\n`);

    // Wait 500ms between API calls to avoid rate limit
    await new Promise((res) => setTimeout(res, 500));
  }

  console.log('════════════════════════════════════════════');
  console.log(`✅ Seed complete!`);
  console.log(`   Total inserted/updated: ${totalInserted}`);
  console.log(`   Total skipped:          ${totalSkipped}`);
  console.log('════════════════════════════════════════════');

  process.exit(0);
};

// ── Run ────────────────────────────────────────────────────────────
seedDatabase().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
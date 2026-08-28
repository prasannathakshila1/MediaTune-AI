import { createSlice } from '@reduxjs/toolkit';

/**
 * playerSlice.js — FIXED
 * ──────────────────────
 * FIXES:
 *   1. Unified naming: currentTrack (was currentSong in some files — now always currentTrack)
 *   2. next() / previous() actions work correctly
 *   3. Added playSingleSong + playPlaylist helpers
 */

const initialState = {
  currentTrack: null,      // ← FIXED: always "currentTrack", never "currentSong"
  isPlaying:    false,
  queue:        [],
  currentIndex: 0,
  volume:       1.0,
  isShuffled:   false,
  repeatMode:   'off',     // 'off' | 'one' | 'all'
  duration:     0,
  position:     0,
  isLoading:    false,
  error:        null,
};

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    play: (state) => { state.isPlaying = true; },
    pause: (state) => { state.isPlaying = false; },
    togglePlay: (state) => { state.isPlaying = !state.isPlaying; },

    // ── Play a single song immediately ────────────────────────────
    playSingleSong: (state, action) => {
      state.currentTrack = action.payload;
      state.queue        = [action.payload];
      state.currentIndex = 0;
      state.isPlaying    = true;
      state.position     = 0;
    },

    // ── Play a full playlist ──────────────────────────────────────
    playPlaylist: (state, action) => {
      const songs = action.payload;
      if (songs && songs.length > 0) {
        state.queue        = songs;
        state.currentIndex = 0;
        state.currentTrack = songs[0];
        state.isPlaying    = true;
        state.position     = 0;
      }
    },

    // ── Set queue without auto-playing ────────────────────────────
    setQueue: (state, action) => {
      state.queue        = action.payload;
      state.currentIndex = 0;
      state.currentTrack = action.payload[0] || null;
    },

    // ── Jump to specific index in queue ───────────────────────────
    setCurrentIndex: (state, action) => {
      const idx = action.payload;
      state.currentIndex = idx;
      state.currentTrack = state.queue[idx] || null;
      state.position     = 0;
    },

    addToQueue: (state, action) => {
      state.queue.push(action.payload);
    },

    removeFromQueue: (state, action) => {
      state.queue = state.queue.filter((_, i) => i !== action.payload);
    },

    // ── Next track ────────────────────────────────────────────────
    next: (state) => {
      if (state.currentIndex < state.queue.length - 1) {
        state.currentIndex++;
        state.currentTrack = state.queue[state.currentIndex];
        state.position     = 0;
      } else if (state.repeatMode === 'all' && state.queue.length > 0) {
        state.currentIndex = 0;
        state.currentTrack = state.queue[0];
        state.position     = 0;
      } else {
        state.isPlaying = false;
      }
    },

    // ── Previous track ────────────────────────────────────────────
    previous: (state) => {
      if (state.currentIndex > 0) {
        state.currentIndex--;
        state.currentTrack = state.queue[state.currentIndex];
        state.position     = 0;
      }
    },

    setVolume:     (state, action) => { state.volume     = action.payload; },
    toggleShuffle: (state)          => { state.isShuffled = !state.isShuffled; },
    setRepeatMode: (state, action) => { state.repeatMode = action.payload; },
    setPosition:   (state, action) => { state.position   = action.payload; },
    setDuration:   (state, action) => { state.duration   = action.payload; },
    setLoading:    (state, action) => { state.isLoading  = action.payload; },
    setError:      (state, action) => { state.error      = action.payload; },
  },
});

export const {
  play, pause, togglePlay,
  playSingleSong, playPlaylist,
  setQueue, setCurrentIndex,
  addToQueue, removeFromQueue,
  next, previous,
  setVolume, toggleShuffle, setRepeatMode,
  setPosition, setDuration,
  setLoading, setError,
} = playerSlice.actions;

export default playerSlice.reducer;
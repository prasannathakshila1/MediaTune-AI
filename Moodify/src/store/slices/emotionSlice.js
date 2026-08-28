// src/store/slices/emotionSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentEmotion: null,
  confidence: 0,
  history: [],
  playlist: [],
  isLoading: false,
  error: null,
};

const emotionSlice = createSlice({
  name: 'emotion',
  initialState,
  reducers: {
    setEmotion: (state, action) => {
      state.currentEmotion = action.payload.emotion;
      state.confidence = action.payload.confidence;
      state.history.unshift({
        emotion: action.payload.emotion,
        confidence: action.payload.confidence,
        timestamp: new Date().toISOString(),
      });
      state.history = state.history.slice(0, 20);
    },
    setEmotionPlaylist: (state, action) => {
      console.log('Setting playlist in Redux:', action.payload?.length);
      state.playlist = action.payload || [];
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearHistory: (state) => {
      state.history = [];
    },
    clearEmotion: (state) => {
      state.currentEmotion = null;
      state.confidence = 0;
      state.playlist = [];
      state.error = null;
    },
  },
});

export const { 
  setEmotion, 
  setEmotionPlaylist,
  setLoading, 
  setError, 
  clearHistory,
  clearEmotion 
} = emotionSlice.actions;

export default emotionSlice.reducer;
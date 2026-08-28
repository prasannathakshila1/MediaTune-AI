// src/services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_BASE_URL = 'http://localhost:5000/api'; // Change to your backend IP

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Add token to all requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const authService = {
  register: (username, email, password) =>
    api.post('/auth/register', { username, email, password }),

  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  getMe: () =>
    api.get('/auth/me'),

  updatePreferences: (genres, moods, language) =>
    api.put('/auth/preferences', { genres, moods, language }),
};

// YouTube endpoints
export const youtubeService = {
  search: (q, limit = 15) =>
    api.get('/youtube/search', { params: { q, limit } }),

  getMoodPlaylist: (emotion) =>
    api.get(`/youtube/mood/${emotion}`),

  getLyrics: (artist, title, duration) =>
  api.get('/youtube/lyrics', { params: { artist, title, duration } }),

  trackPlay: (youtubeId, title, artist, duration) =>
    api.post(`/youtube/play/${youtubeId}`, { title, artist, duration }),

  toggleLike: (youtubeId, title, artist, thumbnail) =>
    api.post('/youtube/like', { youtubeId, title, artist, thumbnail }),
};

// Emotion endpoints - FIXED: use the api instance with token interceptor
export const emotionService = {
  predict: (formData) => {
    // Use the existing api instance instead of creating a new axios instance
    return api.post('/emotion/predict', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getPlaylist: (emotion) =>
    api.get(`/emotion/playlist/${emotion}`),
};

// src/services/api.js - Update voiceService

// Replace only the voiceService section in your api.js

export const voiceService = {
  analyze: async (audioUri) => {
    const formData = new FormData();

    if (Platform.OS === 'web') {
      // Fetch the blob from the URI
      const response = await fetch(audioUri);
      const blob = await response.blob();
      console.log('Audio blob:', { size: blob.size, type: blob.type });
      
      // Use a supported format
      const file = new File([blob], 'recording.webm', { type: blob.type || 'audio/webm' });
      formData.append('audio', file);
    } else {
      // Mobile
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/wav',
        name: 'voice.wav',
      });
    }

    const ML_API_URL = 'http://localhost:5001';
    
    const response = await axios.post(`${ML_API_URL}/analyze-voice`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    
    return response;
  },

  karaoke: async (audioUri, mode = 'instrumental') => {
    const formData = new FormData();

    if (Platform.OS === 'web') {
      const response = await fetch(audioUri);
      const blob = await response.blob();
      const file = new File([blob], 'karaoke.webm', { type: blob.type || 'audio/webm' });
      formData.append('audio', file);
    } else {
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/wav',
        name: 'karaoke.wav',
      });
    }

    formData.append('mode', mode);
    
    const ML_API_URL = 'http://localhost:5001';
    return axios.post(`${ML_API_URL}/karaoke/separate`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
  },

  getProfile: () => api.get('/voice/profile'),
};

// Recommendation endpoints
export const recommendationService = {
  getDaily: (lat, lon) =>
    api.get('/recommendation/daily', { params: { lat, lon } }),
};

// Mood journal endpoints
export const moodJournalService = {
  getTimeline: (period = 'week') =>
    api.get('/moodjournal/timeline', { params: { period } }),

  clearAll: () =>
    api.delete('/moodjournal/clear'),
};
export const chatService = {
  sendMessage: (message) =>
    api.post('/chat/message', { message }),
};
// Playlist endpoints
export const playlistService = {
  create: (name, description, mood, isPublic) =>
    api.post('/playlist', { name, description, mood, isPublic }),

  getAll: () =>
    api.get('/playlist'),

  getOne: (id) =>
    api.get(`/playlist/${id}`),

  update: (id, name, description, isPublic) =>
    api.put(`/playlist/${id}`, { name, description, isPublic }),

  addSong: (playlistId, youtubeId, title, artist, thumbnail) =>
    api.post(`/playlist/${playlistId}/songs`, { youtubeId, title, artist, thumbnail }),

  removeSong: (playlistId, youtubeId) =>
    api.delete(`/playlist/${playlistId}/songs/${youtubeId}`),

  delete: (id) =>
    api.delete(`/playlist/${id}`),
};

export default api;
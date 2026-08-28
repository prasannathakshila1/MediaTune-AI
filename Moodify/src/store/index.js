// src/store/index.js
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import storage from 'redux-persist/lib/storage'; // For web

import authReducer from './slices/authSlice';
import playerReducer from './slices/playerSlice';
import emotionReducer from './slices/emotionSlice';

// Detect platform
const isWeb = typeof window !== 'undefined' && window.document;

const persistConfig = {
  key: 'root',
  storage: isWeb ? storage : AsyncStorage,
  whitelist: ['auth'], // Only persist auth
  blacklist: ['player', 'emotion'],
};

const rootReducer = combineReducers({
  auth: authReducer,
  player: playerReducer,
  emotion: emotionReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);
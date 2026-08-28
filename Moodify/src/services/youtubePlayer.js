import React, { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { useSelector, useDispatch } from 'react-redux';
import { setDuration, setPosition, pause, next } from '../store/slices/playerSlice';
import api from './api';

const YouTubePlayer = () => {
  const dispatch = useDispatch();
  const { currentTrack, isPlaying, volume } = useSelector((s) => s.player);

  const soundRef = useRef(null);
  const trackIdRef = useRef(null);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });

    return () => {
      unloadCurrentSound();
    };
  }, []);

  const unloadCurrentSound = async () => {
    const sound = soundRef.current;
    soundRef.current = null;
    if (!sound) return;
    try {
      sound.setOnPlaybackStatusUpdate(null);
    } catch (e) {}
    try {
      await sound.unloadAsync();
    } catch (e) {
      // already unloaded — ignore
    }
  };

  // Load new track
  useEffect(() => {
    if (!currentTrack?.youtubeId) return;
    if (trackIdRef.current === currentTrack.youtubeId) return;
    trackIdRef.current = currentTrack.youtubeId;
    loadAndPlay(currentTrack.youtubeId);
  }, [currentTrack?.youtubeId]);

  const loadAndPlay = async (videoId) => {
    isLoadingRef.current = true;
    try {
      await unloadCurrentSound();

      const { data } = await api.get(`/youtube/audio-stream/${videoId}`);
      const audioUrl = data.url;

      // User may have switched tracks again while we were fetching
      if (trackIdRef.current !== videoId) return;

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true, volume },
        onPlaybackStatus
      );

      // Bail if track changed again while createAsync was resolving
      if (trackIdRef.current !== videoId) {
        try {
          sound.setOnPlaybackStatusUpdate(null);
          await sound.unloadAsync();
        } catch (e) {}
        return;
      }

      soundRef.current = sound;
    } catch (e) {
      console.warn('Audio load error:', e?.message || e);
    } finally {
      isLoadingRef.current = false;
    }
  };

  const onPlaybackStatus = (status) => {
    if (!status || !status.isLoaded) return;
    dispatch(setPosition((status.positionMillis || 0) / 1000));
    dispatch(setDuration((status.durationMillis || 0) / 1000));
    if (status.didJustFinish) dispatch(next());
  };

  // Play / Pause — guarded against unloaded/loading sound
  useEffect(() => {
    const run = async () => {
      const sound = soundRef.current;
      if (!sound || isLoadingRef.current) return;
      try {
        const status = await sound.getStatusAsync();
        if (!status.isLoaded) return;
        if (isPlaying && !status.isPlaying) {
          await sound.playAsync();
        } else if (!isPlaying && status.isPlaying) {
          await sound.pauseAsync();
        }
      } catch (e) {
        console.warn('Playback control error:', e?.message || e);
      }
    };
    run();
  }, [isPlaying]);

  // Volume
  useEffect(() => {
    soundRef.current?.setVolumeAsync(volume).catch(() => {});
  }, [volume]);

  return null;
};

export default YouTubePlayer;
import { useState, useRef } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';

export const useVoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [waveformData, setWaveformData] = useState([]);
  const recordingRef = useRef(null);
  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null); // for web
  const chunksRef = useRef([]);          // for web

  const startRecording = async () => {
    try {
      if (Platform.OS === 'web') {
        // ── Web: use browser MediaRecorder API ──
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorder.start(100);
        mediaRecorderRef.current = mediaRecorder;
        setIsRecording(true);
        setDuration(0);

        // Timer
        timerRef.current = setInterval(() => {
          setDuration((d) => d + 100);
          setWaveformData(Array.from({ length: 30 }, () => Math.random() * 100));
        }, 100);

      } else {
        // ── Mobile: use expo-av ──
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        recordingRef.current = recording;
        setIsRecording(true);
        setDuration(0);

        timerRef.current = setInterval(() => {
          setDuration((d) => d + 100);
          setWaveformData(Array.from({ length: 30 }, () => Math.random() * 100));
        }, 100);
      }
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const stopRecording = async () => {
    clearInterval(timerRef.current);
    setIsRecording(false);
    setIsPaused(false);

    try {
      if (Platform.OS === 'web') {
        return new Promise((resolve) => {
          const mediaRecorder = mediaRecorderRef.current;
          if (!mediaRecorder) return resolve(null);

          mediaRecorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
            const uri = URL.createObjectURL(blob);
            // Store blob for later upload
            mediaRecorderRef.current._blob = blob;
            mediaRecorderRef.current._uri = uri;
            resolve(uri);
          };
          mediaRecorder.stop();
          mediaRecorder.stream.getTracks().forEach((t) => t.stop());
        });
      } else {
        const recording = recordingRef.current;
        if (!recording) return null;
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        recordingRef.current = null;
        return uri;
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
      return null;
    }
  };

  const pauseRecording = async () => {
    if (Platform.OS === 'web') {
      mediaRecorderRef.current?.pause();
    } else {
      await recordingRef.current?.pauseAsync();
    }
    setIsPaused(true);
    clearInterval(timerRef.current);
  };

  const resumeRecording = async () => {
    if (Platform.OS === 'web') {
      mediaRecorderRef.current?.resume();
    } else {
      await recordingRef.current?.resumeAsync();
    }
    setIsPaused(false);
    timerRef.current = setInterval(() => {
      setDuration((d) => d + 100);
    }, 100);
  };

  const clearRecording = async () => {
    clearInterval(timerRef.current);
    if (Platform.OS === 'web') {
      mediaRecorderRef.current?.stop();
      mediaRecorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current = null;
    } else {
      await recordingRef.current?.stopAndUnloadAsync().catch(() => {});
      recordingRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
    setDuration(0);
    setWaveformData([]);
  };

  return {
    isRecording,
    isPaused,
    duration,
    waveformData,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
  };
};
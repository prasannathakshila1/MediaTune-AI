// src/screens/Voice/VoiceRecorderScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  ImageBackground,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
  FadeIn,
  SlideInUp,
  withRepeat,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

const { width } = Dimensions.get('window');

const BACKGROUND_IMAGE = 'https://images.pexels.com/photos/167491/pexels-photo-167491.jpeg?w=1200&h=2400&fit=crop';
const SINGER_IMAGE = 'https://images.pexels.com/photos/1389429/pexels-photo-1389429.jpeg?w=400&h=400&fit=crop';
const MICROPHONE_IMAGE = 'https://images.pexels.com/photos/3394659/pexels-photo-3394659.jpeg?w=400&h=400&fit=crop';
const STUDIO_IMAGE = 'https://images.pexels.com/photos/1598485/pexels-photo-1598485.jpeg?w=400&h=400&fit=crop';

export default function VoiceRecorderScreen({ navigation }) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [waveformData, setWaveformData] = useState([]);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const waveIntervalRef = useRef(null);
  
  const micPulse = useSharedValue(1);
  
  const micAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micPulse.value }],
  }));

  useEffect(() => {
    micPulse.value = withSpring(1);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (waveIntervalRef.current) clearInterval(waveIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      micPulse.value = withRepeat(withSpring(1.15, { damping: 8 }), -1, true);
    } else {
      micPulse.value = withSpring(1);
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Check supported MIME types
      let mimeType = '';
      if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorder.mimeType || 'audio/webm'
        });
        
        console.log('Recording details:', {
          size: audioBlob.size,
          type: mediaRecorder.mimeType,
          chunks: audioChunksRef.current.length
        });
        
        if (audioBlob.size < 5000) {
          Alert.alert('Error', 'Recording too short. Please record at least 3 seconds of singing.');
          return;
        }
        
        // Create blob URL
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Navigate to analysis
        navigation.navigate('VoiceAnalysis', { recordingUri: audioUrl });
      };
      
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      
      // Start timer
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setDuration(elapsed);
        
        // Auto-stop at 10 seconds
        if (elapsed >= 10000) {
          stopRecording();
        }
      }, 100);
      
      // Simulate waveform
      waveIntervalRef.current = setInterval(() => {
        setWaveformData(prev => [...prev.slice(-30), Math.random() * 60 + 20]);
      }, 100);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      Alert.alert('Error', 'Could not access microphone. Please check permissions.');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (waveIntervalRef.current) {
        clearInterval(waveIntervalRef.current);
        waveIntervalRef.current = null;
      }
    }
  };
  
  const handleRecord = () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };
  
  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const secs = seconds % 60;
    return `00:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <ImageBackground
      source={{ uri: BACKGROUND_IMAGE }}
      style={{ flex: 1 }}
      imageStyle={{ opacity: 0.15 }}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(15,15,17,0.92)' }}>
        <Animated.View
          entering={FadeIn.duration(500)}
          style={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 10,
          }}
        >
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            activeOpacity={0.7}
            style={{ marginBottom: 16 }}
          >
            <MaterialCommunityIcons name="chevron-left" size={28} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: 32, fontWeight: '700', color: COLORS.text, letterSpacing: -0.5 }}>
            Voice Studio
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 4 }}>
            Discover your vocal signature
          </Text>
        </Animated.View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={SlideInUp.delay(100).duration(500).springify()}
            style={{ paddingHorizontal: 20, marginTop: 20, marginBottom: 24 }}
          >
            <View style={{
              flexDirection: 'row',
              backgroundColor: COLORS.surface,
              borderRadius: 20,
              overflow: 'hidden',
              borderWidth: 0.5,
              borderColor: COLORS.border,
            }}>
              <Image
                source={{ uri: SINGER_IMAGE }}
                style={{ width: 100, height: 100 }}
              />
              <View style={{ flex: 1, padding: 12, justifyContent: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text }}>
                  Find Your Voice
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
                  AI-powered vocal analysis
                </Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View
            entering={SlideInUp.delay(200).duration(500).springify()}
            style={{
              paddingHorizontal: 20,
              marginBottom: 32,
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: width - 40,
                height: 160,
                backgroundColor: COLORS.surface,
                borderRadius: 24,
                padding: 20,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 0.5,
                borderColor: COLORS.border,
              }}
            >
              {isRecording ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    height: 100,
                    gap: 4,
                  }}
                >
                  {waveformData.slice(-30).map((value, i) => (
                    <View
                      key={i}
                      style={{
                        width: 4,
                        height: Math.max((value / 100) * 80, 8),
                        backgroundColor: COLORS.primary,
                        borderRadius: 2,
                      }}
                    />
                  ))}
                </View>
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Image
                    source={{ uri: MICROPHONE_IMAGE }}
                    style={{ width: 80, height: 80, borderRadius: 40, opacity: 0.6 }}
                  />
                  <Text style={{ fontSize: 12, color: COLORS.textTertiary, marginTop: 12 }}>
                    Tap the mic to start
                  </Text>
                </View>
              )}
            </View>

            <Text
              style={{
                fontSize: 36,
                fontWeight: '700',
                color: COLORS.text,
                marginTop: 24,
                fontVariant: ['tabular-nums'],
                letterSpacing: 2,
              }}
            >
              {formatTime(duration)}
            </Text>
            <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 6 }}>
              {isRecording ? 'Recording... (10 seconds max)' : 'Ready'}
            </Text>
          </Animated.View>

          <Animated.View
            entering={SlideInUp.delay(300).duration(500).springify()}
            style={{ paddingHorizontal: 20, marginBottom: 32 }}
          >
            <View
              style={{
                backgroundColor: COLORS.surface,
                borderRadius: 16,
                padding: 18,
                borderWidth: 0.5,
                borderColor: COLORS.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: COLORS.primary + '20',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <MaterialCommunityIcons name="music-note" size={18} color={COLORS.primary} />
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text }}>How it works</Text>
              </View>
              <Text style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 }}>
                Record 10 seconds of your voice. Our AI analyzes your vocal range and matches you with similar artists.
              </Text>
            </View>
          </Animated.View>

          <Animated.View
            entering={SlideInUp.delay(400).duration(500).springify()}
            style={{
              alignItems: 'center',
              marginBottom: 32,
            }}
          >
            <TouchableOpacity
              onPress={handleRecord}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[
                  {
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: COLORS.primary,
                    shadowColor: COLORS.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    elevation: 8,
                  },
                  micAnimatedStyle,
                ]}
              >
                <MaterialCommunityIcons
                  name={isRecording ? 'stop' : 'microphone'}
                  size={44}
                  color="#FFF"
                />
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>

          {isRecording && (
            <Animated.View entering={FadeIn.delay(500).duration(400)}>
              <View style={{ paddingHorizontal: 20, alignItems: 'center' }}>
                <View
                  style={{
                    width: width - 80,
                    height: 4,
                    backgroundColor: COLORS.surfaceLight,
                    borderRadius: 2,
                    overflow: 'hidden',
                    marginBottom: 8,
                  }}
                >
                  <View
                    style={{
                      width: `${(duration / 10000) * 100}%`,
                      height: '100%',
                      backgroundColor: COLORS.primary,
                      borderRadius: 2,
                    }}
                  />
                </View>
                <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>
                  {Math.ceil((10000 - duration) / 1000)} seconds remaining
                </Text>
              </View>
            </Animated.View>
          )}

          <Animated.View
            entering={SlideInUp.delay(500).duration(500).springify()}
            style={{ paddingHorizontal: 20, marginTop: 16 }}
          >
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: COLORS.surface,
              borderRadius: 16,
              padding: 12,
              borderWidth: 0.5,
              borderColor: COLORS.border,
              gap: 12,
            }}>
              <Image
                source={{ uri: STUDIO_IMAGE }}
                style={{ width: 60, height: 60, borderRadius: 12 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.text }}>
                  Professional Studio Quality
                </Text>
                <Text style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 2 }}>
                  High-quality audio analysis
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  SlideInUp,
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  interpolate,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { voiceService } from '../../services/api';
import { COLORS } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

export default function KaraokeLyricsScreen({ route, navigation }) {
  const { recordingUri, mode = 'instrumental' } = route.params;
  const [karaokeData, setKaraokeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const scrollY = useSharedValue(0);

  useEffect(() => {
    separateAudio();
  }, []);

  const separateAudio = async () => {
    setLoading(true);
    try {
      const response = await voiceService.karaoke(recordingUri, mode);
      setKaraokeData(response.data);
    } catch (error) {
      console.error('Karaoke separation failed:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.textSecondary, marginTop: 16 }}>
          Preparing karaoke...
        </Text>
      </View>
    );
  }

  if (!karaokeData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <MaterialCommunityIcons name="alert-circle" size={64} color={COLORS.error} />
        <Text style={{ color: COLORS.textSecondary, marginTop: 16 }}>
          Failed to prepare karaoke
        </Text>
      </View>
    );
  }

  const lyrics = karaokeData.lyrics?.segments || [];

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(600)}
        style={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 10,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10,
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.text }}>
          Karaoke Mode
        </Text>
        <TouchableOpacity onPress={() => { /* Settings */ }}>
          <MaterialCommunityIcons name="tune" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </Animated.View>

      {/* Mode Tabs */}
      <View style={{ paddingHorizontal: 16, marginBottom: 12, flexDirection: 'row', gap: 8 }}>
        {['instrumental', 'vocal_guide', 'full'].map((m) => (
          <TouchableOpacity
            key={m}
            onPress={() => { /* Change mode */ }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                mode === m
                  ? [COLORS.primary, COLORS.accent]
                  : [COLORS.surfaceLight, COLORS.surface]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: mode === m ? COLORS.primary : COLORS.border,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: mode === m ? COLORS.text : COLORS.textSecondary,
                  textTransform: 'capitalize',
                }}
              >
                {m === 'vocal_guide' ? 'Vocal Guide' : m === 'instrumental' ? 'No Vocals' : 'Full'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lyrics Display */}
      <Animated.View
        entering={SlideInUp.delay(200).duration(600)}
        style={{ flex: 1, paddingHorizontal: 16, marginBottom: 80 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 20 }}
        >
          {lyrics.length === 0 ? (
            <View style={{ justifyContent: 'center', alignItems: 'center', marginTop: 40 }}>
              <MaterialCommunityIcons name="music" size={48} color={COLORS.textTertiary} />
              <Text style={{ color: COLORS.textSecondary, marginTop: 16, textAlign: 'center' }}>
                No lyrics available
              </Text>
            </View>
          ) : (
            lyrics.map((segment, idx) => {
              const isActive = currentTime >= segment.start && currentTime < segment.end;
              const progress = isActive
                ? (currentTime - segment.start) / (segment.end - segment.start)
                : currentTime > segment.end ? 1 : 0;

              return (
                <View
                  key={idx}
                  style={{
                    marginBottom: 20,
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    backgroundColor: isActive ? COLORS.primary : COLORS.surface,
                    borderRadius: 12,
                    overflow: 'hidden',
                  }}
                >
                  {/* Active line highlight */}
                  {isActive && (
                    <Animated.View
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        height: '100%',
                        backgroundColor: COLORS.accent,
                        opacity: 0.3,
                        width: `${progress * 100}%`,
                      }}
                    />
                  )}

                  {/* Text */}
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: isActive ? '700' : '500',
                      color: isActive ? '#FFF' : COLORS.text,
                      textAlign: 'center',
                      zIndex: 1,
                      lineHeight: 24,
                    }}
                  >
                    {segment.text}
                  </Text>

                  {/* Time indicator */}
                  <Text
                    style={{
                      fontSize: 10,
                      color: isActive ? 'rgba(255,255,255,0.7)' : COLORS.textTertiary,
                      marginTop: 6,
                      textAlign: 'center',
                    }}
                  >
                    {formatTime(segment.start)} - {formatTime(segment.end)}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>
      </Animated.View>

      {/* Pitch Feedback Bar */}
      <Animated.View
        entering={SlideInUp.delay(400).duration(600)}
        style={{
          paddingHorizontal: 16,
          paddingBottom: 20,
          position: 'absolute',
          bottom: 100,
          width: '100%',
        }}
      >
        <View
          style={{
            backgroundColor: COLORS.surface,
            borderRadius: 12,
            padding: 12,
          }}
        >
          <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 8 }}>
            🎤 Pitch feedback
          </Text>
          <View
            style={{
              flexDirection: 'row',
              gap: 2,
              alignItems: 'flex-end',
              justifyContent: 'center',
              height: 40,
            }}
          >
            {[...Array(20)].map((_, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: Math.random() * 30 + 5,
                  backgroundColor:
                    Math.random() > 0.3 ? COLORS.accent : COLORS.primary,
                  borderRadius: 2,
                }}
              />
            ))}
          </View>
          <Text style={{ fontSize: 10, color: COLORS.textSecondary, marginTop: 8, textAlign: 'center' }}>
            In tune 🎯
          </Text>
        </View>
      </Animated.View>

      {/* Controls */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingVertical: 12,
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
          paddingBottom: 20,
        }}
      >
        <TouchableOpacity onPress={() => { /* Decrease pitch */ }} activeOpacity={0.6}>
          <MaterialCommunityIcons name="minus" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsPlaying(!isPlaying)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <MaterialCommunityIcons
              name={isPlaying ? 'pause' : 'play'}
              size={28}
              color="#FFF"
            />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => { /* Increase pitch */ }} activeOpacity={0.6}>
          <MaterialCommunityIcons name="plus" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  Dimensions, ScrollView, Animated as RNAnimated,
  StatusBar, Modal, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, withRepeat, withTiming,
  useAnimatedStyle, FadeIn, SlideInUp,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import {
  play, pause, next, previous,
} from '../../store/slices/playerSlice';
import { youtubeService } from '../../services/api';
import { COLORS } from '../../theme/colors';
import { EMOTION_THEMES } from '../../theme/colors';

const { width, height } = Dimensions.get('window');
const LINE_HEIGHT = 44;

// Parses an LRC-format string into [{ time, text }]
const parseLRC = (lrcText) => {
  if (!lrcText) return [];
  const timeExp = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;
  const result = [];

  lrcText.split('\n').forEach((line) => {
    const matches = [...line.matchAll(timeExp)];
    if (matches.length === 0) return;
    const text = line.replace(timeExp, '').trim();
    matches.forEach((m) => {
      const min = parseInt(m[1], 10);
      const sec = parseInt(m[2], 10);
      const ms = parseInt(m[3].padEnd(3, '0'), 10);
      result.push({ time: min * 60 + sec + ms / 1000, text });
    });
  });

  return result.sort((a, b) => a.time - b.time);
};

export default function PlayerScreen({ navigation }) {
  const dispatch = useDispatch();

  const {
    currentTrack,
    isPlaying,
    queue,
    currentIndex,
    duration,
    position,
  } = useSelector((s) => s.player);

  const { lastEmotion } = useSelector((s) => s.emotion);

  const [liked, setLiked] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off');
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyricsPlain, setLyricsPlain] = useState('');
  const [lyricsLines, setLyricsLines] = useState([]); // [{ time, text }]
  const [lyricsError, setLyricsError] = useState('');
  const [lyricsOffset, setLyricsOffset] = useState(0); // seconds, +/- adjustable
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const controlsOpacity = useRef(new RNAnimated.Value(1)).current;
  const scrollY = useRef(new RNAnimated.Value(0)).current;
  const lyricsScrollRef = useRef(null);

  // Pulse animation for album art (no rotation)
  const albumScale = useSharedValue(1);

  useEffect(() => {
    if (isPlaying) {
      albumScale.value = withRepeat(withTiming(1.02, { duration: 1500 }), -1, true);
    } else {
      albumScale.value = withTiming(1, { duration: 300 });
    }
  }, [isPlaying]);

  const albumStyle = useAnimatedStyle(() => ({
    transform: [{ scale: albumScale.value }],
  }));

  // Header animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const flashControls = () => {
    RNAnimated.sequence([
      RNAnimated.timing(controlsOpacity, { toValue: 0.5, duration: 100, useNativeDriver: true }),
      RNAnimated.timing(controlsOpacity, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      dispatch(pause());
    } else {
      dispatch(play());
    }
    flashControls();
  };

  const handleNext = () => {
    flashControls();
    dispatch(next());
  };

  const handlePrevious = () => {
    flashControls();
    dispatch(previous());
  };

  const repeatIcon = { off: 'repeat-off', one: 'repeat-once', all: 'repeat' }[repeatMode];
  const cycleRepeat = () => {
    const cycle = { off: 'one', one: 'all', all: 'off' };
    setRepeatMode(cycle[repeatMode]);
  };

  // ── Fetch lyrics (synced when available, falls back to plain) ──
  const fetchLyrics = async () => {
    if (!currentTrack) return;
    setLoadingLyrics(true);
    setLyricsError('');
    setLyricsLines([]);
    setLyricsPlain('');
    try {
      const response = await youtubeService.getLyrics(currentTrack.artist, currentTrack.title, duration);
      const { plain, lrc } = response.data;

      if (lrc) {
        const parsed = parseLRC(lrc);
        if (parsed.length > 0) {
          setLyricsLines(parsed);
        } else if (plain) {
          setLyricsPlain(plain);
        } else {
          setLyricsError('Lyrics not available for this song.');
        }
      } else if (plain) {
        setLyricsPlain(plain);
      } else {
        setLyricsError('Lyrics not available for this song.');
      }
      setShowLyrics(true);
    } catch (error) {
      console.error('Failed to fetch lyrics:', error);
      setLyricsError(
        error?.response?.status === 404
          ? "We couldn't find lyrics for this track."
          : 'Unable to load lyrics. Please try again later.'
      );
      setShowLyrics(true);
    } finally {
      setLoadingLyrics(false);
    }
  };

  // ── Which lyric line is "active" based on current playback position ──
  const activeLineIndex = useMemo(() => {
    if (lyricsLines.length === 0) return -1;
    const adjustedPosition = position + lyricsOffset;
    let idx = -1;
    for (let i = 0; i < lyricsLines.length; i++) {
      if (lyricsLines[i].time <= adjustedPosition) idx = i;
      else break;
    }
    return idx;
  }, [lyricsLines, position, lyricsOffset]);

  // Auto-scroll the lyrics view to keep the active line in view
  useEffect(() => {
    if (activeLineIndex >= 0 && lyricsScrollRef.current) {
      lyricsScrollRef.current.scrollTo({
        y: Math.max(0, activeLineIndex * LINE_HEIGHT - 150),
        animated: true,
      });
    }
  }, [activeLineIndex]);

  // Emotion-based gradient
  const emotionGradient = lastEmotion && EMOTION_THEMES[lastEmotion]
    ? EMOTION_THEMES[lastEmotion].gradient
    : [COLORS.primary, COLORS.secondary];

  if (!currentTrack) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        <LinearGradient
          colors={[COLORS.primary + '20', COLORS.secondary + '20']}
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <MaterialCommunityIcons name="music" size={50} color={COLORS.primary} />
        </LinearGradient>
        <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '700', marginBottom: 8 }}>
          No track playing
        </Text>
        <Text style={{ color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
          Go to Home and tap a song or playlist to start playing
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          style={{
            backgroundColor: COLORS.primary,
            paddingHorizontal: 32,
            paddingVertical: 14,
            borderRadius: 40,
          }}
        >
          <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 16 }}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;
  const currentMins = Math.floor(position / 60);
  const currentSecs = Math.floor(position % 60);
  const remainingMins = Math.floor((duration - position) / 60);
  const remainingSecs = Math.floor((duration - position) % 60);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar barStyle="light-content" />

      {/* Lyrics Modal */}
      <Modal
        visible={showLyrics}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowLyrics(false)}
      >
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 48,
            paddingHorizontal: 20,
            paddingBottom: 16,
            borderBottomWidth: 0.5,
            borderBottomColor: COLORS.border,
          }}>
            <TouchableOpacity onPress={() => setShowLyrics(false)}>
              <MaterialCommunityIcons name="close" size={28} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text }}>Lyrics</Text>
            {lyricsLines.length > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={() => setLyricsOffset((o) => Math.round((o - 0.5) * 10) / 10)}
                  style={{ padding: 4 }}
                >
                  <MaterialCommunityIcons name="minus" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
                <Text style={{ fontSize: 11, color: COLORS.textTertiary, marginHorizontal: 4, minWidth: 34, textAlign: 'center' }}>
                  {lyricsOffset > 0 ? `+${lyricsOffset.toFixed(1)}` : lyricsOffset.toFixed(1)}s
                </Text>
                <TouchableOpacity
                  onPress={() => setLyricsOffset((o) => Math.round((o + 0.5) * 10) / 10)}
                  style={{ padding: 4 }}
                >
                  <MaterialCommunityIcons name="plus" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ width: 28 }} />
            )}
          </View>

          <ScrollView
            ref={lyricsScrollRef}
            contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
          >
            <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 8, textAlign: 'center' }}>
              {currentTrack.title}
            </Text>
            <Text style={{ fontSize: 15, color: COLORS.textSecondary, marginBottom: 24, textAlign: 'center' }}>
              {currentTrack.artist}
            </Text>

            {loadingLyrics ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={{ color: COLORS.textSecondary, marginTop: 16 }}>Loading lyrics...</Text>
              </View>
            ) : lyricsError ? (
              <Text style={{ fontSize: 16, color: COLORS.textSecondary, lineHeight: 28, textAlign: 'center' }}>
                {lyricsError}
              </Text>
            ) : lyricsLines.length > 0 ? (
              // Synced, Spotify-style lyrics — active line highlighted
              lyricsLines.map((line, idx) => (
                <Text
                  key={idx}
                  style={{
                    fontSize: idx === activeLineIndex ? 22 : 17,
                    fontWeight: idx === activeLineIndex ? '800' : '500',
                    color: idx === activeLineIndex ? COLORS.primary : COLORS.textSecondary,
                    textAlign: 'center',
                    lineHeight: LINE_HEIGHT,
                    opacity: idx === activeLineIndex ? 1 : 0.6,
                  }}
                >
                  {line.text || '♪'}
                </Text>
              ))
            ) : (
              // Fallback: plain, unsynced lyrics
              <Text style={{ fontSize: 16, color: COLORS.textSecondary, lineHeight: 28, textAlign: 'center' }}>
                {lyricsPlain}
              </Text>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Animated Header - Spotify Style */}
      <RNAnimated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          backgroundColor: COLORS.background,
          paddingTop: 48,
          paddingBottom: 12,
          paddingHorizontal: 20,
          opacity: headerOpacity,
          borderBottomWidth: 0.5,
          borderBottomColor: COLORS.border,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <MaterialCommunityIcons name="chevron-down" size={28} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textSecondary }}>Now Playing</Text>
          <TouchableOpacity onPress={() => setLiked(!liked)} activeOpacity={0.7}>
            <MaterialCommunityIcons
              name={liked ? 'heart' : 'heart-outline'}
              size={26}
              color={liked ? COLORS.primary : COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </RNAnimated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={RNAnimated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 20 }}
      >
        {/* Album Art - No Rotation, Only Pulse */}
        <View style={{ alignItems: 'center', paddingTop: 60, paddingBottom: 32 }}>
          <Animated.View
            style={[{
              width: width * 0.7,
              height: width * 0.7,
              borderRadius: 20,
              shadowColor: emotionGradient[0],
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.4,
              shadowRadius: 24,
              elevation: 20,
              overflow: 'hidden',
              backgroundColor: COLORS.surface,
            }, albumStyle]}
          >
            <LinearGradient
              colors={emotionGradient}
              style={{
                width: '100%',
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {currentTrack.thumbnail ? (
                <Image
                  source={{ uri: currentTrack.thumbnail }}
                  style={{
                    width: '100%',
                    height: '100%',
                  }}
                />
              ) : (
                <MaterialCommunityIcons name="music" size={80} color="#FFF" />
              )}
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Track Info */}
        <Animated.View entering={FadeIn.duration(400)}>
          <View style={{ paddingHorizontal: 24, marginBottom: 28 }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: '800',
                color: COLORS.text,
                marginBottom: 8,
                textAlign: 'center',
                letterSpacing: -0.5,
              }}
              numberOfLines={2}
            >
              {currentTrack.title}
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '500',
                color: COLORS.textSecondary,
                textAlign: 'center',
              }}
            >
              {currentTrack.artist}
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
            <View style={{
              height: 4,
              backgroundColor: COLORS.surfaceLight,
              borderRadius: 2,
              overflow: 'hidden',
              marginBottom: 10,
            }}>
              <View style={{
                height: '100%',
                backgroundColor: COLORS.primary,
                width: `${progressPercent}%`,
                borderRadius: 2,
              }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, color: COLORS.textTertiary, fontWeight: '500' }}>
                {currentMins}:{String(currentSecs).padStart(2, '0')}
              </Text>
              <Text style={{ fontSize: 13, color: COLORS.textTertiary, fontWeight: '500' }}>
                -{remainingMins}:{String(remainingSecs).padStart(2, '0')}
              </Text>
            </View>
          </View>

          {/* Main Controls */}
          <RNAnimated.View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 20,
              marginBottom: 32,
              opacity: controlsOpacity,
            }}
          >
            <TouchableOpacity onPress={() => setIsShuffling(!isShuffling)} activeOpacity={0.7}>
              <MaterialCommunityIcons
                name="shuffle-variant"
                size={24}
                color={isShuffling ? COLORS.primary : COLORS.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={handlePrevious} activeOpacity={0.7}>
              <MaterialCommunityIcons name="skip-previous" size={42} color={COLORS.text} />
            </TouchableOpacity>

            <TouchableOpacity onPress={handlePlayPause} activeOpacity={0.8}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: COLORS.primary,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.4,
                  shadowRadius: 16,
                  elevation: 10,
                }}
              >
                <MaterialCommunityIcons
                  name={isPlaying ? 'pause' : 'play'}
                  size={38}
                  color="#FFF"
                />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleNext} activeOpacity={0.7}>
              <MaterialCommunityIcons name="skip-next" size={42} color={COLORS.text} />
            </TouchableOpacity>

            <TouchableOpacity onPress={cycleRepeat} activeOpacity={0.7}>
              <MaterialCommunityIcons
                name={repeatIcon}
                size={24}
                color={repeatMode !== 'off' ? COLORS.primary : COLORS.textSecondary}
              />
            </TouchableOpacity>
          </RNAnimated.View>

          {/* Secondary Controls */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 48,
            marginBottom: 32,
          }}>
            <TouchableOpacity activeOpacity={0.7}>
              <MaterialCommunityIcons name="cast" size={22} color={COLORS.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7}>
              <MaterialCommunityIcons name="playlist-music" size={22} color={COLORS.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7}>
              <MaterialCommunityIcons name="volume-high" size={22} color={COLORS.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Queue Info Card */}
          <TouchableOpacity
            style={{
              marginHorizontal: 24,
              padding: 16,
              backgroundColor: COLORS.surface,
              borderRadius: 16,
              marginBottom: 24,
              borderWidth: 0.5,
              borderColor: COLORS.border,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <MaterialCommunityIcons name="playlist-play" size={22} color={COLORS.textSecondary} />
              <Text style={{ fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' }}>
                {currentIndex + 1} of {queue.length} • In Queue
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>

          {/* Up Next Section */}
          {queue.length > currentIndex + 1 && (
            <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: COLORS.text,
                marginBottom: 16,
                letterSpacing: -0.3,
              }}>
                Up Next
              </Text>
              {queue.slice(currentIndex + 1, currentIndex + 4).map((track, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 12,
                    padding: 12,
                    backgroundColor: COLORS.surface,
                    borderRadius: 14,
                    borderWidth: 0.5,
                    borderColor: COLORS.border,
                  }}
                  activeOpacity={0.7}
                  onPress={() => {
                    // You can implement playing specific track here
                  }}
                >
                  <View style={{
                    width: 52,
                    height: 52,
                    borderRadius: 10,
                    backgroundColor: COLORS.surfaceLight,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 14,
                  }}>
                    <MaterialCommunityIcons name="music-note" size={26} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 15,
                      fontWeight: '600',
                      color: COLORS.text,
                    }} numberOfLines={1}>
                      {track.title}
                    </Text>
                    <Text style={{
                      fontSize: 13,
                      color: COLORS.textSecondary,
                      marginTop: 2,
                    }} numberOfLines={1}>
                      {track.artist}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="play-circle-outline" size={28} color={COLORS.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Lyrics Card */}
          <TouchableOpacity
            style={{
              marginHorizontal: 24,
              marginBottom: 40,
              padding: 16,
              backgroundColor: COLORS.surface,
              borderRadius: 16,
              borderWidth: 0.5,
              borderColor: COLORS.border,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
            activeOpacity={0.7}
            onPress={fetchLyrics}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <MaterialCommunityIcons name="text-box-outline" size={24} color={COLORS.primary} />
              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.text }}>
                  Lyrics
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textTertiary, marginTop: 2 }}>
                  Tap to view lyrics
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
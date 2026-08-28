// src/screens/Voice/VoiceAnalysisScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Alert, Animated as RNAnimated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, SlideInUp, ZoomIn } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { playSingleSong, setQueue, setCurrentIndex } from '../../store/slices/playerSlice';
import { voiceService } from '../../services/api';
import { COLORS } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

// Function to get random but consistent artist image based on name
const getArtistImage = (artistName) => {
  const seed = artistName?.charCodeAt(0) || 65;
  // Using placeholder images with different colors based on artist name
  const images = [
    'https://images.pexels.com/photos/1389429/pexels-photo-1389429.jpeg?w=200&h=200&fit=crop',
    'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?w=200&h=200&fit=crop',
    'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?w=200&h=200&fit=crop',
    'https://images.pexels.com/photos/164837/pexels-photo-164837.jpeg?w=200&h=200&fit=crop',
    'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?w=200&h=200&fit=crop',
    'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?w=200&h=200&fit=crop',
  ];
  return images[seed % images.length];
};

const DIFFICULTY_LABELS = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  very_hard: 'Expert',
};

export default function VoiceAnalysisScreen({ route, navigation }) {
  const { recordingUri } = route.params;
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('songs');
  const dispatch = useDispatch();

  // Animations
  const fadeAnim = useRef(new RNAnimated.Value(0)).current;
  const slideAnim = useRef(new RNAnimated.Value(30)).current;

  useEffect(() => {
    RNAnimated.parallel([
      RNAnimated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      RNAnimated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    analyzeVoice();
  }, []);

  const analyzeVoice = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await voiceService.analyze(recordingUri);
      setAnalysis(response.data);
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Could not analyze your voice. Please try again.');
      Alert.alert('Analysis Failed', 'Could not analyze your voice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaySong = (song) => {
    if (song.youtube) {
      dispatch(playSingleSong({
        youtubeId: song.youtube.youtubeId,
        title: song.youtube.title || song.title,
        artist: song.youtube.artist || song.artist,
        thumbnail: song.youtube.thumbnail || '',
      }));
      navigation.navigate('Home', { screen: 'Player' });
    }
  };

  const handlePlayAll = () => {
    const playable = (analysis.recommended_songs || [])
      .filter(s => s.youtube)
      .map(s => ({
        youtubeId: s.youtube.youtubeId,
        title: s.youtube.title || s.title,
        artist: s.youtube.artist || s.artist,
        thumbnail: s.youtube.thumbnail || '',
      }));
    if (playable.length > 0) {
      dispatch(setQueue(playable));
      dispatch(setCurrentIndex(0));
      navigation.navigate('Home', { screen: 'Player' });
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
        <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: '600', marginBottom: 8 }}>Analyzing your voice...</Text>
        <Text style={{ color: COLORS.textSecondary, fontSize: 13, textAlign: 'center', paddingHorizontal: 40 }}>
          Finding songs that match your vocal range
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.error + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
          <MaterialCommunityIcons name="alert-circle" size={40} color={COLORS.error} />
        </View>
        <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 8, textAlign: 'center' }}>Analysis Failed</Text>
        <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginBottom: 24, textAlign: 'center' }}>{error}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <View style={{ backgroundColor: COLORS.primary, borderRadius: 40, paddingVertical: 14, paddingHorizontal: 32 }}>
            <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 16 }}>Try Again</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  if (!analysis) return null;

  const songs = analysis.recommended_songs || [];
  const artists = analysis.matched_artists || [];
  const rangeLabel = analysis.vocal_range_label || 'Tenor';

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
      <RNAnimated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 8,
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 12 }}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={COLORS.text} />
        </TouchableOpacity>
      </RNAnimated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Vocal Range Card */}
        <Animated.View
          entering={ZoomIn.delay(100).duration(600)}
          style={{ marginHorizontal: 20, marginBottom: 24 }}
        >
          <View style={{
            backgroundColor: COLORS.surface,
            borderRadius: 24,
            padding: 24,
            borderWidth: 0.5,
            borderColor: COLORS.border,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 }}>Your Vocal Range</Text>
                <Text style={{ fontSize: 36, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 }}>{rangeLabel}</Text>
                <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4 }}>
                  {analysis.f0_min ? Math.round(analysis.f0_min) : '?'} Hz – {analysis.f0_max ? Math.round(analysis.f0_max) : '?'} Hz
                </Text>
              </View>
              <View style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: COLORS.primary + '15',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <MaterialCommunityIcons name="microphone" size={30} color={COLORS.primary} />
              </View>
            </View>

            {/* Range Bar */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ height: 4, backgroundColor: COLORS.surfaceLight, borderRadius: 2, overflow: 'hidden' }}>
                <View style={{
                  height: '100%',
                  backgroundColor: COLORS.primary,
                  borderRadius: 2,
                  width: `${Math.min(100, ((analysis.f0_max - analysis.f0_min) / 600) * 100)}%`,
                }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <Text style={{ fontSize: 10, color: COLORS.textTertiary }}>Low (82Hz)</Text>
                <Text style={{ fontSize: 10, color: COLORS.textTertiary }}>High (1047Hz)</Text>
              </View>
            </View>

            {/* Play All Button */}
            <TouchableOpacity onPress={handlePlayAll} activeOpacity={0.8}>
              <View style={{
                backgroundColor: COLORS.primary,
                borderRadius: 40,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}>
                <MaterialCommunityIcons name="play" size={18} color="#FFF" />
                <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 14 }}>
                  Play All ({songs.filter(s => s.youtube).length} songs)
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Tabs */}
        <Animated.View entering={FadeIn.delay(200).duration(600)}>
          <View style={{ flexDirection: 'row', marginHorizontal: 20, marginBottom: 20, gap: 12 }}>
            {[
              { key: 'songs', label: 'Songs', count: songs.length, icon: 'music-note' },
              { key: 'artists', label: 'Artists', count: artists.length, icon: 'account-music' },
              { key: 'details', label: 'Details', icon: 'chart-bar' },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
                style={{ flex: 1 }}
              >
                <View
                  style={{
                    backgroundColor: activeTab === tab.key ? COLORS.primary : COLORS.surface,
                    borderRadius: 12,
                    paddingVertical: 10,
                    alignItems: 'center',
                    borderWidth: 0.5,
                    borderColor: COLORS.border,
                  }}
                >
                  <MaterialCommunityIcons
                    name={tab.icon}
                    size={18}
                    color={activeTab === tab.key ? '#FFF' : COLORS.textSecondary}
                  />
                  <Text style={{
                    fontSize: 12,
                    fontWeight: activeTab === tab.key ? '600' : '500',
                    color: activeTab === tab.key ? '#FFF' : COLORS.textSecondary,
                    marginTop: 4,
                  }}>
                    {tab.label}
                  </Text>
                  {tab.count !== undefined && (
                    <Text style={{
                      fontSize: 10,
                      color: activeTab === tab.key ? 'rgba(255,255,255,0.8)' : COLORS.textTertiary,
                    }}>
                      {tab.count}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Songs Tab */}
        {activeTab === 'songs' && (
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 16 }}>
              Songs matched to your {rangeLabel} voice
            </Text>
            {songs.length === 0 ? (
              <View style={{ alignItems: 'center', marginTop: 40 }}>
                <MaterialCommunityIcons name="music-off" size={48} color={COLORS.textTertiary} />
                <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 12 }}>No songs matched</Text>
              </View>
            ) : (
              songs.map((song, idx) => (
                <Animated.View
                  key={idx}
                  entering={SlideInUp.delay(idx * 50).duration(400).springify()}
                  style={{ marginBottom: 12 }}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handlePlaySong(song)}
                    style={{
                      backgroundColor: COLORS.surface,
                      borderRadius: 16,
                      overflow: 'hidden',
                      borderWidth: 0.5,
                      borderColor: COLORS.border,
                    }}
                  >
                    <View style={{ flexDirection: 'row', padding: 12 }}>
                      <View style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: COLORS.primary + '15',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12,
                      }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.primary }}>{idx + 1}</Text>
                      </View>

                      <View style={{ flex: 1, justifyContent: 'center' }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.text }} numberOfLines={1}>
                          {song.title}
                        </Text>
                        <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }} numberOfLines={1}>
                          {song.artist}
                        </Text>
                      </View>

                      <View style={{
                        backgroundColor: COLORS.primary + '15',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 12,
                        alignSelf: 'center',
                      }}>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.primary }}>
                          {Math.round(song.score * 100)}%
                        </Text>
                      </View>
                    </View>

                    <View style={{ height: 2, backgroundColor: COLORS.surfaceLight }}>
                      <View style={{
                        height: '100%',
                        backgroundColor: COLORS.primary,
                        width: `${Math.round(song.score * 100)}%`,
                      }} />
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))
            )}
          </View>
        )}

        {/* Artists Tab */}
        {activeTab === 'artists' && (
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 16 }}>
              Artists with similar vocal characteristics
            </Text>
            {artists.map((artist, idx) => {
              const matchPct = Math.round(artist.score * 100);
              return (
                <Animated.View
                  key={idx}
                  entering={SlideInUp.delay(idx * 80).duration(400).springify()}
                  style={{ marginBottom: 12 }}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('Search', { query: artist.artist })}
                    style={{
                      backgroundColor: COLORS.surface,
                      borderRadius: 16,
                      padding: 12,
                      borderWidth: 0.5,
                      borderColor: COLORS.border,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Image
                        source={{ uri: getArtistImage(artist.artist) }}
                        style={{ width: 52, height: 52, borderRadius: 26 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.text }}>{artist.artist}</Text>
                        <View style={{ marginTop: 6 }}>
                          <View style={{ height: 4, backgroundColor: COLORS.surfaceLight, borderRadius: 2, overflow: 'hidden' }}>
                            <View style={{ height: '100%', backgroundColor: COLORS.primary, width: `${matchPct}%` }} />
                          </View>
                          <Text style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 4 }}>
                            {matchPct}% Vocal Match
                          </Text>
                        </View>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* Details Tab */}
        {activeTab === 'details' && analysis.f0_min && (
          <View style={{ paddingHorizontal: 20 }}>
            <Animated.View entering={FadeIn.delay(100).duration(400)}>
              <View style={{
                backgroundColor: COLORS.surface,
                borderRadius: 20,
                padding: 20,
                borderWidth: 0.5,
                borderColor: COLORS.border,
                marginBottom: 16,
              }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 16, letterSpacing: -0.3 }}>
                  Pitch Analysis
                </Text>
                {[
                  { label: 'Lowest Note', value: `${Math.round(analysis.f0_min)} Hz`, percent: (analysis.f0_min / 600) * 100 },
                  { label: 'Average Pitch', value: `${Math.round(analysis.f0_mean)} Hz`, percent: (analysis.f0_mean / 600) * 100 },
                  { label: 'Highest Note', value: `${Math.round(analysis.f0_max)} Hz`, percent: (analysis.f0_max / 600) * 100 },
                ].map((item, idx) => (
                  <View key={idx} style={{ marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ fontSize: 13, color: COLORS.textSecondary }}>{item.label}</Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text }}>{item.value}</Text>
                    </View>
                    <View style={{ height: 4, backgroundColor: COLORS.surfaceLight, borderRadius: 2, overflow: 'hidden' }}>
                      <View style={{ height: '100%', backgroundColor: COLORS.primary, width: `${Math.min(100, item.percent)}%`, borderRadius: 2 }} />
                    </View>
                  </View>
                ))}
              </View>

              {/* Karaoke Button */}
              <TouchableOpacity
                onPress={() => navigation.navigate('Karaoke', { recordingUri, mode: 'instrumental' })}
                activeOpacity={0.8}
              >
                <View style={{
                  backgroundColor: COLORS.primary,
                  borderRadius: 40,
                  paddingVertical: 16,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 10,
                }}>
                  <MaterialCommunityIcons name="microphone" size={20} color="#FFF" />
                  <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>Try Karaoke Mode</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
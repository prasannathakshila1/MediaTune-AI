import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  SlideInUp,
  useSharedValue,
  withSpring,
  useAnimatedStyle,
  withDelay,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { setQueue, setCurrentIndex } from '../../store/slices/playerSlice';
import { COLORS, EMOTION_THEMES } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

// Professional mood images
const MOOD_BACKGROUNDS = {
  happy: 'https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?w=800&h=800&fit=crop',
  sad: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?w=800&h=800&fit=crop',
  angry: 'https://images.pexels.com/photos/1687845/pexels-photo-1687845.jpeg?w=800&h=800&fit=crop',
  fear: 'https://images.pexels.com/photos/713312/pexels-photo-713312.jpeg?w=800&h=800&fit=crop',
  surprise: 'https://images.pexels.com/photos/3779694/pexels-photo-3779694.jpeg?w=800&h=800&fit=crop',
  neutral: 'https://images.pexels.com/photos/1762578/pexels-photo-1762578.jpeg?w=800&h=800&fit=crop',
  disgust: 'https://images.pexels.com/photos/269077/pexels-photo-269077.jpeg?w=800&h=800&fit=crop',
};

// Mock playlist for testing
const MOCK_PLAYLIST = [
  { youtubeId: '1', title: 'Happy Song 1', artist: 'The Happies', thumbnail: null, duration: 180 },
  { youtubeId: '2', title: 'Happy Song 2', artist: 'Joy Band', thumbnail: null, duration: 180 },
  { youtubeId: '3', title: 'Happy Song 3', artist: 'Smile Artists', thumbnail: null, duration: 180 },
  { youtubeId: '4', title: 'Happy Song 4', artist: 'Good Vibes', thumbnail: null, duration: 180 },
  { youtubeId: '5', title: 'Happy Song 5', artist: 'Positive Crew', thumbnail: null, duration: 180 },
];

const FloatingParticle = ({ delay, left, size }) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withSpring(-height * 0.3, { damping: 10, mass: 0.5, stiffness: 40 })
    );
    opacity.value = withDelay(delay, withTiming(0.6, { duration: 500 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: left,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: COLORS.primary + '20',
          zIndex: 0,
        },
        animatedStyle,
      ]}
    />
  );
};

const ConfidenceRing = ({ confidence }) => {
  const ringScale = useSharedValue(0);

  useEffect(() => {
    ringScale.value = withSpring(0.8 + (confidence * 0.5), { damping: 8, mass: 1, stiffness: 60 });
  }, [confidence]);

  const ringAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 180,
          height: 180,
          borderRadius: 90,
          borderWidth: 2,
          borderColor: COLORS.primary,
        },
        ringAnimatedStyle,
      ]}
    />
  );
};

export default function EmotionResultScreen({ navigation }) {
  const { currentEmotion, confidence, playlist } = useSelector((state) => state.emotion);
  const dispatch = useDispatch();

  // Use mock playlist if real playlist is empty
  const displayPlaylist = (playlist && playlist.length > 0) ? playlist : MOCK_PLAYLIST;

  useEffect(() => {
    console.log('Current emotion:', currentEmotion);
    console.log('Confidence:', confidence);
    console.log('Playlist from Redux:', playlist?.length);
    console.log('Display playlist:', displayPlaylist.length);
  }, []);

  const mainScale = useSharedValue(0.8);
  const mainOpacity = useSharedValue(0);

  useEffect(() => {
    mainScale.value = withSpring(1, { damping: 10, mass: 0.8, stiffness: 80 });
    mainOpacity.value = withTiming(1, { duration: 600 });
  }, []);

  const mainAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mainScale.value }],
    opacity: mainOpacity.value,
  }));

  if (!currentEmotion) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <MaterialCommunityIcons name="emoticon-sad" size={64} color={COLORS.textSecondary} />
        <Text style={{ color: COLORS.textSecondary, marginTop: 16 }}>No emotion detected</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            marginTop: 20,
            backgroundColor: COLORS.primary,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 30,
          }}
        >
          <Text style={{ color: '#FFF', fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const theme = EMOTION_THEMES[currentEmotion];
  const confidencePercent = Math.round(confidence * 100);
  const backgroundImage = MOOD_BACKGROUNDS[currentEmotion] || MOOD_BACKGROUNDS.neutral;

  const handlePlayPlaylist = () => {
    console.log('Playing playlist with', displayPlaylist.length, 'songs');
    
    if (displayPlaylist && displayPlaylist.length > 0) {
      const formattedSongs = displayPlaylist.map(song => ({
        youtubeId: song.youtubeId || song.id || Math.random().toString(),
        title: song.title,
        artist: song.artist || 'Unknown Artist',
        thumbnail: song.thumbnail || null,
        duration: song.duration || 180,
      }));
      
      console.log('Formatted songs:', formattedSongs.length);
      
      dispatch(setQueue(formattedSongs));
      dispatch(setCurrentIndex(0));
      
      navigation.navigate('Home', { screen: 'Player' });
    } else {
      Alert.alert('No Playlist', 'No songs available for this mood. Please try scanning again.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Image
        source={{ uri: backgroundImage }}
        style={{
          position: 'absolute',
          width: width,
          height: height,
          opacity: 0.2,
        }}
      />
      
      <LinearGradient
        colors={[theme?.color + '20', 'transparent']}
        style={{
          position: 'absolute',
          width: '100%',
          height: height,
          zIndex: 0,
        }}
      />

      {[...Array(6)].map((_, i) => (
        <FloatingParticle
          key={i}
          delay={i * 200}
          left={`${10 + (i * 15)}%`}
          size={40 + (i * 10)}
        />
      ))}

      <ScrollView
        style={{ flex: 1, zIndex: 1 }}
        contentContainerStyle={{ paddingTop: 40, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={mainAnimatedStyle}>
          {/* Emotion Image Circle */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <View
              style={{
                position: 'relative',
                width: 220,
                height: 220,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <ConfidenceRing confidence={confidence} />

              <Animated.View
                entering={ZoomIn.delay(200).duration(800).springify()}
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: 80,
                  overflow: 'hidden',
                  borderWidth: 4,
                  borderColor: theme?.color || COLORS.primary,
                  shadowColor: theme?.color || COLORS.primary,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.4,
                  shadowRadius: 16,
                  elevation: 12,
                }}
              >
                <Image
                  source={{ uri: backgroundImage }}
                  style={{
                    width: '100%',
                    height: '100%',
                  }}
                />
                <LinearGradient
                  colors={['transparent', (theme?.color || COLORS.primary) + '60']}
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                  }}
                />
              </Animated.View>
            </View>

            <Animated.View entering={SlideInUp.delay(300).duration(600)} style={{ marginTop: 24, alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 40,
                  fontWeight: '800',
                  color: COLORS.text,
                  textTransform: 'capitalize',
                  letterSpacing: -0.5,
                }}
              >
                {currentEmotion}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                <LinearGradient
                  colors={[theme?.color || COLORS.primary, (theme?.color || COLORS.primary) + '80']}
                  style={{
                    width: Math.max(40, confidencePercent * 2),
                    height: 6,
                    borderRadius: 3,
                    marginRight: 10,
                  }}
                />
                <Text style={{ fontSize: 16, color: COLORS.textSecondary, fontWeight: '600' }}>
                  {confidencePercent}% Match
                </Text>
              </View>
            </Animated.View>
          </View>

          {/* Mood Message */}
          <Animated.View entering={SlideInUp.delay(400).duration(600)} style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <View
              style={{
                backgroundColor: COLORS.surface,
                borderRadius: 20,
                padding: 18,
                borderWidth: 0.5,
                borderColor: COLORS.border,
                alignItems: 'center',
              }}
            >
              <MaterialCommunityIcons 
                name={currentEmotion === 'happy' ? 'emoticon-happy-outline' : 'music-note'} 
                size={28} 
                color={theme?.color || COLORS.primary} 
              />
              <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 10, textAlign: 'center', lineHeight: 20 }}>
                {currentEmotion === 'happy' 
                  ? "You seem happy! Here's some upbeat music to keep the good vibes flowing." 
                  : `We detected a ${currentEmotion} mood. Here are some songs that might match your feeling.`}
              </Text>
            </View>
          </Animated.View>

          {/* Playlist Preview */}
          <Animated.View entering={SlideInUp.delay(500).duration(600)} style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text, letterSpacing: -0.3 }}>
                {currentEmotion === 'happy' ? '🎵 Recommended For You' : 'Recommended For You'}
              </Text>
              <Text style={{ fontSize: 12, color: theme?.color || COLORS.primary, fontWeight: '500' }}>
                {displayPlaylist.length} songs
              </Text>
            </View>

            {displayPlaylist.slice(0, 4).map((song, idx) => (
              <Animated.View
                key={song.youtubeId || idx}
                entering={SlideInUp.delay(550 + (idx * 50)).duration(500)}
                style={{
                  flexDirection: 'row',
                  backgroundColor: COLORS.surface,
                  borderRadius: 14,
                  padding: 12,
                  marginBottom: 10,
                  alignItems: 'center',
                  borderWidth: 0.5,
                  borderColor: COLORS.border,
                }}
              >
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 10,
                    backgroundColor: COLORS.surfaceLight,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 14,
                  }}
                >
                  {song.thumbnail ? (
                    <Image
                      source={{ uri: song.thumbnail }}
                      style={{ width: 50, height: 50, borderRadius: 10 }}
                    />
                  ) : (
                    <MaterialCommunityIcons name="music-note" size={24} color={theme?.color || COLORS.primary} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.text }} numberOfLines={1}>
                    {song.title}
                  </Text>
                  <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }} numberOfLines={1}>
                    {song.artist || 'Unknown Artist'}
                  </Text>
                </View>
                <MaterialCommunityIcons name="play-circle-outline" size={28} color={theme?.color || COLORS.primary} />
              </Animated.View>
            ))}
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View entering={SlideInUp.delay(700).duration(600)} style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <TouchableOpacity onPress={handlePlayPlaylist} activeOpacity={0.8}>
              <LinearGradient
                colors={[theme?.color || COLORS.primary, (theme?.color || COLORS.primary) + 'CC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 40,
                  paddingVertical: 16,
                  alignItems: 'center',
                  marginBottom: 12,
                  shadowColor: theme?.color || COLORS.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 6,
                }}
              >
                <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>
                  ▶ Play This Mood
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Home')} activeOpacity={0.8}>
              <View
                style={{
                  borderRadius: 40,
                  paddingVertical: 16,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              >
                <Text style={{ color: COLORS.textSecondary, fontSize: 16, fontWeight: '600' }}>
                  Back to Home
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={SlideInUp.delay(800).duration(600)} style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <TouchableOpacity onPress={() => navigation.navigate('EmotionScan')} activeOpacity={0.8}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 12,
                }}
              >
                <MaterialCommunityIcons name="camera-retake" size={20} color={COLORS.textSecondary} />
                <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginLeft: 8 }}>
                  Scan Again
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
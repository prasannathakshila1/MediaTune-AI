// ==========================================
// MOODIFY — PREMIUM MUSIC APP HOMESCREEN
// ==========================================
// Professional Spotify-like design with premium features
// Includes professional 3rd party images for all sections

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
  Dimensions,
  Animated as RNAnimated,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { recommendationService, youtubeService } from '../../services/api';
import { playSingleSong, playPlaylist } from '../../store/slices/playerSlice';
import { COLORS, EMOTION_THEMES } from '../../theme/colors';
import PlaylistScreen from '../Playlist/PlaylistScreen';

const { width, height } = Dimensions.get('window');

// Professional fallback thumbnail URL
const FALLBACK_THUMBNAIL = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop';

// Professional playlist cover images from Unsplash
const PLAYLIST_COVERS = {
  'Chill Vibes': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop',
  'Workout Mix': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=400&fit=crop',
  'Study Session': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=400&fit=crop',
  'Party Hits': 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=400&h=400&fit=crop',
  'R&B Korea': 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop',
  'Party Hits': 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&h=400&fit=crop',
};

// Professional mood images from Unsplash
const MOOD_IMAGES = {
  happy: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=200&h=200&fit=crop',
  sad: 'https://images.unsplash.com/photo-1496449903678-68ddcb189a24?w=200&h=200&fit=crop',
  angry: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=200&h=200&fit=crop',
  fear: 'https://images.unsplash.com/photo-1544717305-38b3144e7c1f?w=200&h=200&fit=crop',
  disgust: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&h=200&fit=crop',
  surprise: 'https://images.unsplash.com/photo-1530026405186-ed1f139613f4?w=200&h=200&fit=crop',
  neutral: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=200&h=200&fit=crop',
};

export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { lastEmotion } = useSelector((state) => state.emotion);

  const scrollY = useRef(new RNAnimated.Value(0)).current;
  const [dailyCard, setDailyCard] = useState(null);
  const [trendingSongs, setTrendingSongs] = useState([]);
  const [top10Songs, setTop10Songs] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60, 100],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });

  const fetchDaily = async () => {
    setLoading(true);
    try {
      const response = await recommendationService.getDaily(null, null);
      setDailyCard(response.data);
    } catch (error) {
      console.error('Failed to fetch daily card:', error);
    }
    setLoading(false);
  };

  const fetchTrending = async () => {
    try {
      const response = await youtubeService.search('trending music 2024 top hits', 15);
      const songsWithThumbnails = response.data.results.map(song => ({
        ...song,
        thumbnail: song.thumbnail || song.thumbnails?.high?.url || song.thumbnails?.default?.url || null
      }));
      setTrendingSongs(songsWithThumbnails.slice(0, 5));
      setTop10Songs(songsWithThumbnails.slice(0, 10));
    } catch (error) {
      console.error('Failed to fetch trending:', error);
      const mockTrending = [
        { id: '1', title: 'Blinding Lights', artist: 'The Weeknd', thumbnail: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg', youtubeId: '4NRXx6U8ABQ' },
        { id: '2', title: 'Shape of You', artist: 'Ed Sheeran', thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg', youtubeId: 'JGwWNGJdvx8' },
        { id: '3', title: 'As It Was', artist: 'Harry Styles', thumbnail: 'https://i.ytimg.com/vi/H5v3kku4y6Q/hqdefault.jpg', youtubeId: 'H5v3kku4y6Q' },
        { id: '4', title: 'Flowers', artist: 'Miley Cyrus', thumbnail: 'https://i.ytimg.com/vi/G7KNmW9a75Y/hqdefault.jpg', youtubeId: 'G7KNmW9a75Y' },
        { id: '5', title: 'Cruel Summer', artist: 'Taylor Swift', thumbnail: 'https://i.ytimg.com/vi/ic8j13piLq0/hqdefault.jpg', youtubeId: 'ic8j13piLq0' },
        { id: '6', title: 'Paint The Town Red', artist: 'Doja Cat', thumbnail: 'https://i.ytimg.com/vi/4L3fVrDhKFQ/hqdefault.jpg', youtubeId: '4L3fVrDhKFQ' },
        { id: '7', title: 'Vampire', artist: 'Olivia Rodrigo', thumbnail: 'https://i.ytimg.com/vi/RlPnR9FgDOY/hqdefault.jpg', youtubeId: 'RlPnR9FgDOY' },
        { id: '8', title: 'What Was I Made For?', artist: 'Billie Eilish', thumbnail: 'https://i.ytimg.com/vi/cWp8LJj0A1I/hqdefault.jpg', youtubeId: 'cWp8LJj0A1I' },
        { id: '9', title: 'Dance The Night', artist: 'Dua Lipa', thumbnail: 'https://i.ytimg.com/vi/NI9qyVJcw_Q/hqdefault.jpg', youtubeId: 'NI9qyVJcw_Q' },
        { id: '10', title: 'Cupid', artist: 'FIFTY FIFTY', thumbnail: 'https://i.ytimg.com/vi/Qc7_zRjHjaM/hqdefault.jpg', youtubeId: 'Qc7_zRjHjaM' },
      ];
      setTrendingSongs(mockTrending.slice(0, 5));
      setTop10Songs(mockTrending);
    }
  };
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchDaily(), fetchTrending()]);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchDaily();
    fetchTrending();
  }, []);

  const formatSong = (song) => ({
    youtubeId: song.youtubeId || song.id,
    title: song.title,
    artist: song.artist || 'Unknown Artist',
    thumbnail: song.thumbnail || null,
    duration: song.duration || 180,
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getThumbnailUrl = (thumbnail) => {
    if (thumbnail && thumbnail !== 'null' && thumbnail !== 'undefined') {
      return thumbnail;
    }
    return FALLBACK_THUMBNAIL;
  };

  // ==================== PREMIUM COMPONENTS ====================

  const PremiumFAB = () => (
    <RNAnimated.View style={{
      position: 'absolute',
      bottom: 20,
      right: 20,
      zIndex: 100,
      opacity: scrollY.interpolate({
        inputRange: [0, 200],
        outputRange: [1, 0.3],
        extrapolate: 'clamp',
      }),
    }}>
      <TouchableOpacity
        onPress={() => navigation.navigate('ChatAssistant')}
        style={{
          position: 'absolute',
          bottom: 90,
          right: 20,
          zIndex: 100,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: COLORS.secondary || COLORS.primary,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <MaterialCommunityIcons name="chat-processing" size={26} color="#FFF" />
      </TouchableOpacity>
    </RNAnimated.View>
  );

  const PremiumHeader = () => (
    <RNAnimated.View style={{
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
      borderBottomWidth: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <MaterialCommunityIcons name="menu" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.primary, letterSpacing: -0.5 }}>
          Moodify
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <View style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: COLORS.surfaceLight,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1.5,
            borderColor: COLORS.primary,
          }}>
            <MaterialCommunityIcons name="account" size={20} color={COLORS.textSecondary} />
          </View>
        </TouchableOpacity>
      </View>
    </RNAnimated.View>
  );

  const HeroSection = () => (
    <View style={{
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 24,
    }}>
      <Text style={{
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.text,
        letterSpacing: -0.8,
        marginBottom: 8,
      }}>
        {getGreeting()}, {user?.username?.split(' ')[0] || 'Listener'}!
      </Text>
      <Text style={{
        fontSize: 15,
        color: COLORS.textSecondary,
        lineHeight: 22,
      }}>
        Your mood, your music. Discover your daily soundtrack.
      </Text>
    </View>
  );

  const DailyMixCard = () => {
    const scaleAnim = useRef(new RNAnimated.Value(0.95)).current;

    useEffect(() => {
      RNAnimated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 45,
        useNativeDriver: true,
      }).start();
    }, []);

    if (loading || !dailyCard) return null;

    return (
      <RNAnimated.View style={[{
        marginHorizontal: 20,
        marginBottom: 32,
        transform: [{ scale: scaleAnim }],
      }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            const playlist = dailyCard.songs?.map(formatSong) || [];
            dispatch(playPlaylist(playlist));
            navigation.navigate('Player');
          }}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary, '#0B8B5E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 20,
              overflow: 'hidden',
              padding: 20,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <MaterialCommunityIcons name="sparkles" size={16} color="#FFF" />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#FFF', marginLeft: 6, letterSpacing: 0.5 }}>
                    YOUR DAILY MIX
                  </Text>
                </View>
                <Text style={{ fontSize: 22, fontWeight: '700', color: '#FFF', marginBottom: 6 }}>
                  Today's Vibe
                </Text>
                <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 12 }} numberOfLines={2}>
                  {dailyCard.context?.reason || 'Personalized just for you based on your mood'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="music-note" size={14} color="rgba(255,255,255,0.7)" />
                  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginLeft: 4 }}>
                    {dailyCard.songs?.length || 15} songs
                  </Text>
                </View>
              </View>
              <View style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: '#FFF',
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}>
                <MaterialCommunityIcons name="play" size={36} color="#000" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </RNAnimated.View>
    );
  };

  // ==================== JUST FOR YOU SECTION (with 3rd party images) ====================
  // ==================== RECOMMENDED FOR YOU SECTION ====================
  const ForYouSection = () => {
    const songs = dailyCard?.songs || [];
    if (loading || songs.length === 0) return null;

    return (
      <View style={{ marginBottom: 32 }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          marginBottom: 4,
        }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.text }}>
            Recommended For You
          </Text>
          <TouchableOpacity
            onPress={() => {
              const playlist = songs.map(formatSong);
              dispatch(playPlaylist(playlist));
              navigation.navigate('Player');
            }}
          >
            <Text style={{ fontSize: 13, color: COLORS.primary, fontWeight: '500' }}>Play all</Text>
          </TouchableOpacity>
        </View>

        {dailyCard?.context?.reason && (
          <Text style={{
            fontSize: 13,
            color: COLORS.textSecondary,
            paddingHorizontal: 20,
            marginBottom: 14,
          }} numberOfLines={1}>
            {dailyCard.context.reason}
          </Text>
        )}

        <FlatList
          data={songs}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 20, paddingRight: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{ marginRight: 16, width: 140 }}
              onPress={() => {
                const song = formatSong(item);
                dispatch(playSingleSong(song));
                navigation.navigate('Player');
              }}
            >
              <Image
                source={{ uri: getThumbnailUrl(item.thumbnail) }}
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: 12,
                  marginBottom: 8,
                  backgroundColor: COLORS.surface,
                }}
              />
              <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.text }} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.textSecondary }} numberOfLines={1}>
                {item.artist || 'Unknown Artist'}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item, index) => item.youtubeId || item.id || String(index)}
        />
      </View>
    );
  };

  // ==================== BROWSE BY MOOD SECTION (with 3rd party images) ====================
  const MoodSection = () => {
    const emotions = Object.entries(EMOTION_THEMES);
    return (
      <View style={{ marginBottom: 32 }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          marginBottom: 16,
        }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.text }}>Browse by Mood</Text>
          <TouchableOpacity>
            <Text style={{ fontSize: 13, color: COLORS.primary, fontWeight: '500' }}>Explore</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={emotions}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 20, paddingRight: 20 }}
          renderItem={({ item: [emotion, theme] }) => (
            <TouchableOpacity
              style={{ marginRight: 16, width: 100 }}
              onPress={async () => {
                try {
                  const response = await youtubeService.getMoodPlaylist(emotion);
                  const playlist = response.data.results.map(formatSong);
                  dispatch(playPlaylist(playlist));
                  navigation.navigate('Player');
                } catch (error) {
                  console.error('Failed to load emotion playlist:', error);
                }
              }}
            >
              <Image
                source={{ uri: MOOD_IMAGES[emotion] || FALLBACK_THUMBNAIL }}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  position: 'absolute',
                }}
              />
              <LinearGradient
                colors={[theme.color + '80', theme.color + '20']}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <MaterialCommunityIcons name={theme.icon} size={40} color="#FFF" />
              </LinearGradient>
              <Text style={{
                fontSize: 13,
                fontWeight: '600',
                color: COLORS.text,
                marginTop: 8,
                textAlign: 'center',
              }}>
                {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item[0]}
        />
      </View>
    );
  };

  // ==================== TOP 5 TRENDING SECTION ====================
  const Top5TrendingSection = () => (
    <View style={{ marginBottom: 32 }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
      }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.text }}>Top 5 Trending</Text>
        <Text style={{ fontSize: 12, color: COLORS.textTertiary }}>Most heard this week</Text>
      </View>
      {trendingSongs.slice(0, 5).map((song, index) => (
        <TouchableOpacity
          key={song.youtubeId || song.id || index}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 12,
          }}
          onPress={() => {
            const singleSong = formatSong(song);
            dispatch(playSingleSong(singleSong));
            navigation.navigate('Player');
          }}
        >
          <Text style={{
            width: 32,
            fontSize: 18,
            fontWeight: '700',
            color: index < 3 ? COLORS.primary : COLORS.textTertiary,
          }}>
            {index + 1}
          </Text>

          <Image
            source={{ uri: getThumbnailUrl(song.thumbnail) }}
            style={{
              width: 56,
              height: 56,
              borderRadius: 10,
              marginRight: 14,
              backgroundColor: COLORS.surface,
            }}
          />

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.text }} numberOfLines={1}>
              {song.title}
            </Text>
            <Text style={{ fontSize: 13, color: COLORS.textSecondary }} numberOfLines={1}>
              {song.artist || 'Unknown Artist'}
            </Text>
          </View>

          <View style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: COLORS.primary + '20',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <MaterialCommunityIcons name="play" size={20} color={COLORS.primary} />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  // ==================== TOP 10 TRENDING LIST ====================
  const Top10TrendingList = () => (
    <View style={{ marginBottom: 40 }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
      }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.text }}>Top 10 Global</Text>
        <TouchableOpacity>
          <Text style={{ fontSize: 13, color: COLORS.primary, fontWeight: '500' }}>View all</Text>
        </TouchableOpacity>
      </View>

      {top10Songs.map((song, index) => (
        <TouchableOpacity
          key={song.youtubeId || song.id || index}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 10,
          }}
          onPress={() => {
            const singleSong = formatSong(song);
            dispatch(playSingleSong(singleSong));
            navigation.navigate('Player');
          }}
        >
          <Text style={{
            width: 36,
            fontSize: 14,
            fontWeight: '600',
            color: COLORS.textTertiary,
          }}>
            {index + 1}
          </Text>

          <Image
            source={{ uri: getThumbnailUrl(song.thumbnail) }}
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              marginRight: 12,
              backgroundColor: COLORS.surface,
            }}
          />

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '500', color: COLORS.text }} numberOfLines={1}>
              {song.title}
            </Text>
            <Text style={{ fontSize: 12, color: COLORS.textSecondary }} numberOfLines={1}>
              {song.artist || 'Unknown Artist'}
            </Text>
          </View>

          <MaterialCommunityIcons name="play-circle-outline" size={28} color={COLORS.textSecondary} />
        </TouchableOpacity>
      ))}
    </View>
  );

  const PremiumBanner = () => (
    <View style={{ marginHorizontal: 20, marginBottom: 32 }}>
      <LinearGradient
        colors={[COLORS.primary, '#0B8B5E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 16,
          padding: 18,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <MaterialCommunityIcons name="crown" size={20} color="#FFF" />
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFF', marginLeft: 6 }}>
              PREMIUM
            </Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFF', marginBottom: 4 }}>
            Unlock Unlimited Skips
          </Text>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>
            Ad-free • Offline • High Quality
          </Text>
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: '#FFF',
            paddingHorizontal: 18,
            paddingVertical: 8,
            borderRadius: 24,
          }}
          onPress={() => navigation.navigate('PremiumUpgrade')}
        >
          <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.primary }}>
            Upgrade
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  return (
    <>
      <PremiumHeader />
      <PremiumFAB />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        onScroll={RNAnimated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        style={{ flex: 1, backgroundColor: COLORS.background }}
        contentContainerStyle={{
          paddingBottom: 100,
          paddingTop: 80,
        }}
      >
        <HeroSection />
        <DailyMixCard />
        <ForYouSection />
        <MoodSection />
        <Top5TrendingSection />
        <Top10TrendingList />
        <PremiumBanner />

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}
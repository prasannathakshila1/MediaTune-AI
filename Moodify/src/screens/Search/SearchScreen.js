// ==========================================
// MOODIFY — PREMIUM SEARCH SCREEN
// ==========================================
// Fixed search functionality with better error handling

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  ActivityIndicator,
  Dimensions,
  Animated as RNAnimated,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { youtubeService } from '../../services/api';
import { playSingleSong, playPlaylist } from '../../store/slices/playerSlice';
import { COLORS } from '../../theme/colors';

const { width } = Dimensions.get('window');

// Professional fallback thumbnail
const FALLBACK_THUMBNAIL = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop';

// Professional genre images from Unsplash
const GENRE_IMAGES = {
  Pop: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop',
  Rock: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300&h=300&fit=crop',
  'Hip-Hop': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
  Electronic: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop',
  Jazz: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=300&h=300&fit=crop',
  Classical: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=300&h=300&fit=crop',
  Lofi: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop',
  'R&B': 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop',
};

// Professional trending playlist covers
const TRENDING_COVERS = {
  'Summer Hits 2024': 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=400&fit=crop',
  'Viral Sounds': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
  'Feel Good Playlist': 'https://images.unsplash.com/photo-1459749411172-04bfb2f5f4b6?w=400&h=400&fit=crop',
  'Party Mix': 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=400&h=400&fit=crop',
  'Chill Vibes': 'https://images.unsplash.com/photo-1459749411172-04bfb2f5f4b6?w=400&h=400&fit=crop',
  'Workout Beats': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=400&fit=crop',
};

const GENRES = [
  { name: 'Pop', icon: 'music-note', color: '#10B981', image: GENRE_IMAGES.Pop },
  { name: 'Rock', icon: 'guitar-electric', color: '#EF4444', image: GENRE_IMAGES.Rock },
  { name: 'Hip-Hop', icon: 'microphone', color: '#F59E0B', image: GENRE_IMAGES['Hip-Hop'] },
  { name: 'Electronic', icon: 'waveform', color: '#8B5CF6', image: GENRE_IMAGES.Electronic },
  { name: 'Jazz', icon: 'music', color: '#EC4899', image: GENRE_IMAGES.Jazz },
  { name: 'Classical', icon: 'piano', color: '#3B82F6', image: GENRE_IMAGES.Classical },
  { name: 'Lofi', icon: 'headphones', color: '#06B6D4', image: GENRE_IMAGES.Lofi },
  { name: 'R&B', icon: 'heart-music', color: '#F43F5E', image: GENRE_IMAGES['R&B'] },
];

const TRENDING_SEARCHES = [
  { title: 'Summer Hits 2024', icon: 'weather-sunny', color: '#F59E0B', cover: TRENDING_COVERS['Summer Hits 2024'] },
  { title: 'Viral Sounds', icon: 'fire', color: '#EF4444', cover: TRENDING_COVERS['Viral Sounds'] },
  { title: 'Feel Good Playlist', icon: 'emoticon-happy', color: '#10B981', cover: TRENDING_COVERS['Feel Good Playlist'] },
  { title: 'Party Mix', icon: 'party-popper', color: '#EC4899', cover: TRENDING_COVERS['Party Mix'] },
  { title: 'Chill Vibes', icon: 'weather-night', color: '#3B82F6', cover: TRENDING_COVERS['Chill Vibes'] },
  { title: 'Workout Beats', icon: 'run', color: '#F97316', cover: TRENDING_COVERS['Workout Beats'] },
];

// Mock data for when API fails
const MOCK_SEARCH_RESULTS = [
  { youtubeId: '1', title: 'Blinding Lights', artist: 'The Weeknd', thumbnail: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg' },
  { youtubeId: '2', title: 'Shape of You', artist: 'Ed Sheeran', thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg' },
  { youtubeId: '3', title: 'As It Was', artist: 'Harry Styles', thumbnail: 'https://i.ytimg.com/vi/H5v3kku4y6Q/hqdefault.jpg' },
  { youtubeId: '4', title: 'Flowers', artist: 'Miley Cyrus', thumbnail: 'https://i.ytimg.com/vi/G7KNmW9a75Y/hqdefault.jpg' },
  { youtubeId: '5', title: 'Cruel Summer', artist: 'Taylor Swift', thumbnail: 'https://i.ytimg.com/vi/ic8j13piLq0/hqdefault.jpg' },
];

export default function SearchScreen({ navigation }) {
  const dispatch = useDispatch();
  const scrollY = useRef(new RNAnimated.Value(0)).current;
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const [apiError, setApiError] = useState(false);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60, 100],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setApiError(false);
    
    try {
      console.log('Searching for:', query);
      const response = await youtubeService.search(query, 20);
      console.log('API Response:', response.data);
      
      if (response.data && response.data.results) {
        const songsWithThumbnails = response.data.results.map(song => ({
          ...song,
          thumbnail: song.thumbnail || song.thumbnails?.high?.url || song.thumbnails?.default?.url || null
        }));
        setResults(songsWithThumbnails);
      } else if (response.data && Array.isArray(response.data)) {
        const songsWithThumbnails = response.data.map(song => ({
          ...song,
          thumbnail: song.thumbnail || song.thumbnails?.high?.url || null
        }));
        setResults(songsWithThumbnails);
      } else {
        // If API returns unexpected format, use mock data
        console.warn('Unexpected API response format, using mock data');
        setResults(MOCK_SEARCH_RESULTS);
        setApiError(true);
      }
      
      // Save to recent searches
      if (query.trim() && !recentSearches.includes(query)) {
        setRecentSearches(prev => [query, ...prev].slice(0, 5));
      }
    } catch (error) {
      console.error('Search failed:', error);
      // Use mock data when API fails
      setResults(MOCK_SEARCH_RESULTS);
      setApiError(true);
      Alert.alert(
        'Search Limited',
        'Using demo results. Please check your backend connection.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGenreSelect = (genre) => {
    setSelectedGenre(genre.name);
    setSearchQuery(genre.name);
    handleSearch(genre.name);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setResults([]);
    setSelectedGenre(null);
    setApiError(false);
  };

  const formatSong = (song) => ({
    youtubeId: song.youtubeId || song.id,
    title: song.title,
    artist: song.artist || 'Unknown Artist',
    thumbnail: song.thumbnail || null,
    duration: song.duration || 180,
  });

  const getThumbnailUrl = (thumbnail) => {
    if (thumbnail && thumbnail !== 'null' && thumbnail !== 'undefined') {
      return thumbnail;
    }
    return FALLBACK_THUMBNAIL;
  };

  const playSong = (song) => {
    const formattedSong = formatSong(song);
    dispatch(playSingleSong(formattedSong));
    navigation.navigate('Player');
  };

  // Premium Header
  const PremiumHeader = () => (
    <RNAnimated.View
     pointerEvents="box-none" 
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
          Discover
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

  // Search Input Component
  const SearchInput = () => (
    <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 30,
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: searchQuery ? COLORS.primary : COLORS.border,
      }}>
        <MaterialCommunityIcons 
          name="magnify" 
          size={22} 
          color={searchQuery ? COLORS.primary : COLORS.textTertiary} 
        />
        <TextInput
          placeholder="What do you want to listen to?"
          placeholderTextColor={COLORS.textTertiary}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            handleSearch(text);
          }}
          style={{
            flex: 1,
            paddingVertical: 14,
            paddingHorizontal: 14,
            color: COLORS.text,
            fontSize: 16,
            fontWeight: '500',
          }}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={clearSearch}>
            <MaterialCommunityIcons name="close-circle" size={22} color={COLORS.textTertiary} />
          </TouchableOpacity>
        ) : null}
      </View>
      {apiError && results.length > 0 && (
        <Text style={{ fontSize: 11, color: COLORS.warning, marginTop: 8, marginLeft: 12 }}>
          Using demo results - Backend connection issue
        </Text>
      )}
    </View>
  );

  // Recent Searches Section
  const RecentSearchesSection = () => {
    if (recentSearches.length === 0 || results.length > 0) return null;
    
    return (
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.text }}>Recent Searches</Text>
          <TouchableOpacity onPress={() => setRecentSearches([])}>
            <Text style={{ fontSize: 13, color: COLORS.textTertiary }}>Clear</Text>
          </TouchableOpacity>
        </View>
        {recentSearches.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: COLORS.surface,
              borderRadius: 12,
              padding: 12,
              marginBottom: 8,
            }}
            onPress={() => {
              setSearchQuery(item);
              handleSearch(item);
            }}
          >
            <MaterialCommunityIcons name="history" size={20} color={COLORS.primary} />
            <Text style={{ flex: 1, marginLeft: 12, color: COLORS.text, fontSize: 14 }}>{item}</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Genre Cards Section
  const GenreSection = () => {
    if (results.length > 0 || loading) return null;
    
    return (
      <View style={{ marginBottom: 28 }}>
        <View style={{ paddingHorizontal: 20, marginBottom: 14 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text }}>Browse All Genres</Text>
          <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }}>Discover music by category</Text>
        </View>
        <FlatList
          data={GENRES}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 20, paddingRight: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleGenreSelect(item)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[item.color + 'CC', item.color + '40']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: 16,
                  marginRight: 12,
                  overflow: 'hidden',
                }}
              >
                <Image
                  source={{ uri: item.image }}
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    opacity: 0.5,
                  }}
                />
                <View style={{ flex: 1, justifyContent: 'space-between', padding: 12 }}>
                  <MaterialCommunityIcons name={item.icon} size={28} color="#FFF" />
                  <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '700' }}>
                    {item.name}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.name}
        />
      </View>
    );
  };

  // Trending Section
  const TrendingSection = () => {
    if (results.length > 0 || loading) return null;
    
    return (
      <View style={{ marginBottom: 32 }}>
        <View style={{ paddingHorizontal: 20, marginBottom: 14 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text }}>Trending Now</Text>
          <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }}>Most popular playlists right now</Text>
        </View>
        <FlatList
          data={TRENDING_SEARCHES}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 20, paddingRight: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setSearchQuery(item.title);
                handleSearch(item.title);
              }}
              style={{ marginRight: 12, width: 140 }}
            >
              <Image
                source={{ uri: item.cover }}
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: 12,
                  marginBottom: 8,
                }}
              />
              <Text style={{ color: COLORS.text, fontWeight: '600', fontSize: 14 }} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                Playlist
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.title}
        />
      </View>
    );
  };

  // Search Results Section
  const ResultsSection = () => {
    if (loading) {
      return (
        <View style={{ paddingVertical: 60, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ color: COLORS.textSecondary, marginTop: 12 }}>Searching for music...</Text>
        </View>
      );
    }

    if (results.length === 0 && searchQuery) {
      return (
        <View style={{ paddingVertical: 60, alignItems: 'center' }}>
          <MaterialCommunityIcons name="music-box-outline" size={64} color={COLORS.textTertiary} />
          <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.text, marginTop: 16 }}>
            No results found
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 4 }}>
            Try searching for a different artist or song
          </Text>
        </View>
      );
    }

    if (results.length === 0) return null;

    return (
      <View style={{ paddingHorizontal: 20, paddingBottom: 100 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text }}>
            Top Results
          </Text>
          <Text style={{ fontSize: 12, color: COLORS.textTertiary }}>
            {results.length} songs
          </Text>
        </View>
        
        {results.map((song, index) => (
          <TouchableOpacity
            key={song.youtubeId || index}
            activeOpacity={0.7}
            onPress={() => playSong(song)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: COLORS.surface,
              borderRadius: 14,
              marginBottom: 10,
              overflow: 'hidden',
            }}
          >
            <Image
              source={{ uri: getThumbnailUrl(song.thumbnail) }}
              style={{ width: 60, height: 60 }}
            />
            <View style={{ flex: 1, padding: 12, paddingLeft: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.text }} numberOfLines={1}>
                {song.title}
              </Text>
              <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }} numberOfLines={1}>
                {song.artist || 'Unknown Artist'}
              </Text>
            </View>
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: COLORS.primary + '15',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
            }}>
              <MaterialCommunityIcons name="play" size={20} color={COLORS.primary} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <PremiumHeader />
      
      <ScrollView
        keyboardShouldPersistTaps="handled" 
        showsVerticalScrollIndicator={false}
        onScroll={RNAnimated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <SearchInput />
        <RecentSearchesSection />
        <GenreSection />
        <TrendingSection />
        <ResultsSection />
      </ScrollView>
    </View>
  );
}
// src/screens/PlaylistDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { setQueue, setCurrentIndex } from '../../store/slices/playerSlice';
import { playlistService, youtubeService } from '../../services/api';
import { COLORS } from '../../theme/colors';

const FALLBACK_IMAGE = 'https://images.pexels.com/photos/167491/pexels-photo-167491.jpeg?w=200&h=200&fit=crop';

export default function PlaylistDetailScreen({ route, navigation }) {
  const { playlist: initialPlaylist } = route.params;
  const [playlist, setPlaylist] = useState(initialPlaylist);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // --- Add Song Modal ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);

  const dispatch = useDispatch();

  // Fetch updated playlist details (e.g., after add/remove)
  const fetchPlaylist = async () => {
    try {
      const response = await playlistService.getOne(playlist._id);
      setPlaylist(response.data);
    } catch (err) {
      console.error('Failed to fetch playlist details:', err);
    }
  };

  // Refresh on mount
  useEffect(() => {
    fetchPlaylist();
  }, []);

  // Handle removing a song
  const handleRemoveSong = (youtubeId) => {
    Alert.alert(
      'Remove Song',
      'Are you sure you want to remove this song from the playlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await playlistService.removeSong(playlist._id, youtubeId);
              // Update local state optimistically
              setPlaylist((prev) => ({
                ...prev,
                songs: prev.songs.filter((s) => s.youtubeId !== youtubeId),
              }));
              // Re-fetch to sync
              await fetchPlaylist();
            } catch (err) {
              Alert.alert('Error', 'Failed to remove song');
            }
          },
        },
      ]
    );
  };

  // Handle Play All
  const handlePlayAll = () => {
    if (playlist.songs.length === 0) {
      Alert.alert('Empty Playlist', 'Add some songs to play this playlist');
      return;
    }
    const songs = playlist.songs.map((s) => ({
      youtubeId: s.youtubeId,
      title: s.title,
      artist: s.artist,
      thumbnail: s.thumbnail,
    }));
    dispatch(setQueue(songs));
    dispatch(setCurrentIndex(0));
    navigation.navigate('Home', { screen: 'Player' });
  };

  // --- Search and Add Songs ---
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const response = await youtubeService.search(searchQuery, 10);
      const data = response.data;

      // Try to extract the song list from different possible structures
      let songs = [];
      if (Array.isArray(data)) {
        songs = data;
      } else if (data?.items && Array.isArray(data.items)) {
        songs = data.items;
      } else if (data?.results && Array.isArray(data.results)) {
        songs = data.results;
      } else if (data?.data && Array.isArray(data.data)) {
        songs = data.data;
      } else {
        // If it's an object, try to find any array property
        const found = Object.values(data).find(v => Array.isArray(v));
        if (found) songs = found;
      }

      // Map to consistent shape if needed
      // Assumes each song has: youtubeId, title, artist, thumbnail
      // If the backend uses different field names, map them here
      setSearchResults(songs);
    } catch (err) {
      Alert.alert('Error', 'Failed to search songs');
      console.error(err);
    }
    setSearching(false);
  };

  const handleAddSong = async (song) => {
    setAdding(true);
    try {
      await playlistService.addSong(
        playlist._id,
        song.youtubeId,
        song.title,
        song.artist,
        song.thumbnail
      );
      // Update local state (add to playlist)
      setPlaylist((prev) => ({
        ...prev,
        songs: [...prev.songs, song],
      }));
      // Re-fetch to sync
      await fetchPlaylist();
      // Close modal if all added?
      // We could keep modal open for adding more
    } catch (err) {
      Alert.alert('Error', 'Failed to add song');
    }
    setAdding(false);
  };

  // Render song item in playlist
  const renderSongItem = ({ item }) => (
    <View style={styles.songItem}>
      <Image
        source={{ uri: item.thumbnail || FALLBACK_IMAGE }}
        style={styles.songThumbnail}
      />
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.songArtist} numberOfLines={1}>{item.artist}</Text>
      </View>
      <TouchableOpacity onPress={() => handleRemoveSong(item.youtubeId)} style={styles.removeButton}>
        <MaterialCommunityIcons name="close-circle" size={24} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );

  // Render search result item in modal
  const renderSearchResult = ({ item }) => (
    <View style={styles.searchResultItem}>
      <Image
        source={{ uri: item.thumbnail || FALLBACK_IMAGE }}
        style={styles.searchThumbnail}
      />
      <View style={styles.searchInfo}>
        <Text style={styles.searchTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.searchArtist} numberOfLines={1}>{item.artist}</Text>
      </View>
      <TouchableOpacity
        onPress={() => handleAddSong(item)}
        disabled={adding}
        style={styles.addButton}
      >
        {adding ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <MaterialCommunityIcons name="plus-circle" size={32} color={COLORS.primary} />
        )}
      </TouchableOpacity>
    </View>
  );

  if (!playlist) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Playlist</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Playlist Info */}
      <View style={styles.infoContainer}>
        <View style={styles.coverContainer}>
          {playlist.songs.length > 0 && playlist.songs[0].thumbnail ? (
            <Image source={{ uri: playlist.songs[0].thumbnail }} style={styles.coverImage} />
          ) : (
            <View style={[styles.coverImage, styles.placeholderCover]}>
              <MaterialCommunityIcons name="playlist-music" size={60} color={COLORS.textTertiary} />
            </View>
          )}
        </View>
        <Text style={styles.playlistName}>{playlist.name}</Text>
        <Text style={styles.songCount}>
          {playlist.songs.length} {playlist.songs.length === 1 ? 'song' : 'songs'}
        </Text>
        {playlist.description ? (
          <Text style={styles.description}>{playlist.description}</Text>
        ) : null}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.playButton]}
          onPress={handlePlayAll}
          disabled={playlist.songs.length === 0}
        >
          <MaterialCommunityIcons name="play" size={20} color="#FFF" />
          <Text style={styles.actionButtonText}>Play All</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.addButtonAction]}
          onPress={() => setShowAddModal(true)}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
          <Text style={styles.actionButtonText}>Add Songs</Text>
        </TouchableOpacity>
      </View>

      {/* Song List */}
      <FlatList
        data={playlist.songs}
        keyExtractor={(item) => item.youtubeId}
        renderItem={renderSongItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="music-note-off" size={48} color={COLORS.textTertiary} />
            <Text style={styles.emptyText}>No songs in this playlist</Text>
            <Text style={styles.emptySubtext}>Tap "Add Songs" to start building your playlist</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Add Song Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <MaterialCommunityIcons name="close" size={28} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Songs</Text>
            <View style={{ width: 28 }} />
          </View>

          <View style={styles.searchBar}>
            <TextInput
              placeholder="Search songs..."
              placeholderTextColor={COLORS.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              style={styles.searchInput}
            />
            <TouchableOpacity onPress={handleSearch} disabled={searching}>
              {searching ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <MaterialCommunityIcons name="magnify" size={28} color={COLORS.textSecondary} />
              )}
            </TouchableOpacity>
          </View>

          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.youtubeId}
            renderItem={renderSearchResult}
            ListEmptyComponent={
              searchQuery.trim() ? (
                <View style={styles.emptySearch}>
                  <Text style={styles.emptySearchText}>No results found</Text>
                </View>
              ) : null
            }
            contentContainerStyle={styles.searchResultsList}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  infoContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  coverContainer: {
    width: 140,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: COLORS.surface,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  placeholderCover: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
  },
  playlistName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  songCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 40,
    gap: 8,
    minWidth: '40%',
  },
  playButton: {
    backgroundColor: COLORS.primary,
  },
  addButtonAction: {
    backgroundColor: COLORS.secondary,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  songThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 14,
  },
  songInfo: {
    flex: 1,
    marginRight: 12,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  songArtist: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textTertiary,
    marginTop: 4,
    textAlign: 'center',
  },
  // --- Modal styles ---
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 48,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 16,
  },
  searchResultsList: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  searchThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 14,
  },
  searchInfo: {
    flex: 1,
    marginRight: 12,
  },
  searchTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  searchArtist: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  addButton: {
    padding: 4,
  },
  emptySearch: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptySearchText: {
    color: COLORS.textTertiary,
    fontSize: 16,
  },
});
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Image, Alert, ActivityIndicator, RefreshControl, Modal,
  Animated as RNAnimated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, SlideInUp, ZoomIn } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { setQueue, setCurrentIndex } from '../../store/slices/playerSlice';
import { playlistService } from '../../services/api';
import { COLORS } from '../../theme/colors';

const FALLBACK_IMAGE = 'https://images.pexels.com/photos/167491/pexels-photo-167491.jpeg?w=200&h=200&fit=crop';

export default function PlaylistScreen({ navigation }) {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [creating, setCreating] = useState(false);
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

  const fetchPlaylists = async () => {
    try {
      const response = await playlistService.getAll();
      setPlaylists(response.data);
    } catch (err) {
      console.error('Failed to fetch playlists:', err);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPlaylists();
    setRefreshing(false);
  };

  useEffect(() => { fetchPlaylists(); }, []);

  const handleCreate = async () => {
    if (!newPlaylistName.trim()) { 
      Alert.alert('Error', 'Please enter a playlist name'); 
      return; 
    }
    setCreating(true);
    try {
      const response = await playlistService.create(newPlaylistName.trim(), '', '', false);
      setPlaylists((prev) => [response.data, ...prev]);
      setNewPlaylistName('');
      setShowCreateModal(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to create playlist');
    }
    setCreating(false);
  };

  const handleDelete = (playlist) => {
    Alert.alert('Delete playlist', `Delete "${playlist.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await playlistService.delete(playlist._id);
            setPlaylists((prev) => prev.filter((p) => p._id !== playlist._id));
          } catch (err) { Alert.alert('Error', 'Failed to delete'); }
        },
      },
    ]);
  };

  const handlePlay = (playlist) => {
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

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
        <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>Loading your playlists...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
      <RNAnimated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 16,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottomWidth: 0.5,
          borderBottomColor: COLORS.border,
        }}
      >
        <Text style={{ fontSize: 28, fontWeight: '700', color: COLORS.text, letterSpacing: -0.5 }}>
          Playlists
        </Text>
        <TouchableOpacity onPress={() => setShowCreateModal(true)} activeOpacity={0.7}>
          <View style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: COLORS.primary,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
          </View>
        </TouchableOpacity>
      </RNAnimated.View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 }}
      >
        {playlists.length === 0 ? (
          <Animated.View entering={ZoomIn.delay(200).duration(600)} style={{ alignItems: 'center', marginTop: 80 }}>
            <View style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: COLORS.surface,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <MaterialCommunityIcons name="playlist-music" size={50} color={COLORS.textTertiary} />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 8 }}>No playlists yet</Text>
            <Text style={{ fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 40 }}>
              Create your first playlist to organize your favorite songs
            </Text>
          </Animated.View>
        ) : (
          playlists.map((playlist, idx) => (
            <Animated.View
              key={playlist._id}
              entering={SlideInUp.delay(idx * 60).duration(400).springify()}
              style={{ marginBottom: 14 }}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate('PlaylistDetail', { playlist })}
                style={{
                  backgroundColor: COLORS.surface,
                  borderRadius: 16,
                  overflow: 'hidden',
                  borderWidth: 0.5,
                  borderColor: COLORS.border,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}>
                  {/* Playlist Cover */}
                  <View style={{
                    width: 64,
                    height: 64,
                    borderRadius: 12,
                    overflow: 'hidden',
                    backgroundColor: COLORS.primary + '20',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    {playlist.songs.length > 0 && playlist.songs[0].thumbnail ? (
                      <Image source={{ uri: playlist.songs[0].thumbnail }} style={{ width: 64, height: 64 }} />
                    ) : (
                      <MaterialCommunityIcons name="playlist-music" size={32} color={COLORS.primary} />
                    )}
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.text }} numberOfLines={1}>
                      {playlist.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 4 }}>
                      {playlist.songs.length} {playlist.songs.length === 1 ? 'song' : 'songs'}
                    </Text>
                  </View>

                  {/* Actions */}
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity 
                      onPress={() => handlePlay(playlist)} 
                      activeOpacity={0.6} 
                      disabled={playlist.songs.length === 0}
                    >
                      <MaterialCommunityIcons 
                        name="play-circle" 
                        size={32} 
                        color={playlist.songs.length > 0 ? COLORS.primary : COLORS.textTertiary} 
                      />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(playlist)} activeOpacity={0.6}>
                      <MaterialCommunityIcons name="delete-outline" size={28} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Progress indicator for playlist */}
                {playlist.songs.length > 0 && (
                  <View style={{ height: 2, backgroundColor: COLORS.surfaceLight }}>
                    <View style={{
                      height: '100%',
                      backgroundColor: COLORS.primary,
                      width: `${Math.min(100, playlist.songs.length * 5)}%`,
                    }} />
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
          <Animated.View entering={ZoomIn.duration(300)} style={{
            backgroundColor: COLORS.surface,
            borderRadius: 24,
            width: '85%',
            padding: 24,
            borderWidth: 0.5,
            borderColor: COLORS.border,
          }}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: COLORS.primary + '20',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 12,
              }}>
                <MaterialCommunityIcons name="playlist-plus" size={30} color={COLORS.primary} />
              </View>
              <Text style={{ fontSize: 22, fontWeight: '700', color: COLORS.text, letterSpacing: -0.5 }}>Create Playlist</Text>
              <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' }}>
                Give your playlist a name
              </Text>
            </View>

            <TextInput
              placeholder="Playlist name"
              placeholderTextColor={COLORS.textTertiary}
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              autoFocus
              style={{
                backgroundColor: COLORS.surfaceLight,
                borderRadius: 14,
                padding: 16,
                color: COLORS.text,
                fontSize: 16,
                fontWeight: '500',
                borderWidth: 1,
                borderColor: COLORS.border,
                marginBottom: 20,
              }}
            />

            <TouchableOpacity onPress={handleCreate} disabled={creating} activeOpacity={0.8}>
              <View style={{
                backgroundColor: COLORS.primary,
                borderRadius: 40,
                paddingVertical: 14,
                alignItems: 'center',
                opacity: creating ? 0.6 : 1,
              }}>
                {creating ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>Create</Text>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => { setShowCreateModal(false); setNewPlaylistName(''); }} 
              activeOpacity={0.8}
              style={{ marginTop: 12 }}
            >
              <View style={{
                borderRadius: 40,
                paddingVertical: 14,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: COLORS.border,
              }}>
                <Text style={{ color: COLORS.textSecondary, fontSize: 16 }}>Cancel</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
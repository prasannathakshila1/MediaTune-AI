import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { chatService } from '../../services/api';
import { playSingleSong, playPlaylist } from '../../store/slices/playerSlice';
import { COLORS } from '../../theme/colors';

const FALLBACK_THUMBNAIL =
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop';

export default function ChatAssistantScreen({ navigation }) {
  const dispatch = useDispatch();
  const listRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'bot',
      text: "Hi! I'm your Moodify Assistant 🎧 How are you feeling today?",
      songs: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const scrollToEnd = () => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg = { id: `u-${Date.now()}`, role: 'user', text, songs: [] };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);
    scrollToEnd();

    try {
      const response = await chatService.sendMessage(text);
      const { reply, emoji, songs } = response.data;

      const botMsg = {
        id: `b-${Date.now()}`,
        role: 'bot',
        text: `${emoji} ${reply}`,
        songs: songs || [],
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'bot',
          text: "Sorry, I couldn't reach the music service. Try again in a moment.",
          songs: [],
        },
      ]);
    } finally {
      setSending(false);
      scrollToEnd();
    }
  };

  const playSong = (song) => {
    dispatch(
      playSingleSong({
        youtubeId: song.youtubeId,
        title: song.title,
        artist: song.artist,
        thumbnail: song.thumbnail,
        duration: 180,
      })
    );
    navigation.navigate('Player');
  };

  const playAll = (songs) => {
    const playlist = songs.map((s) => ({
      youtubeId: s.youtubeId,
      title: s.title,
      artist: s.artist,
      thumbnail: s.thumbnail,
      duration: 180,
    }));
    dispatch(playPlaylist(playlist));
    navigation.navigate('Player');
  };

  const renderSongCard = (song) => (
    <TouchableOpacity
      key={song.youtubeId}
      onPress={() => playSong(song)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 10,
        padding: 8,
        marginTop: 8,
      }}
    >
      <Image
        source={{ uri: song.thumbnail || FALLBACK_THUMBNAIL }}
        style={{ width: 44, height: 44, borderRadius: 8, marginRight: 10 }}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ color: COLORS.text, fontWeight: '600', fontSize: 13 }} numberOfLines={1}>
          {song.title}
        </Text>
        <Text style={{ color: COLORS.textSecondary, fontSize: 11 }} numberOfLines={1}>
          {song.artist}
        </Text>
      </View>
      <MaterialCommunityIcons name="play-circle" size={26} color={COLORS.primary} />
    </TouchableOpacity>
  );

  const renderItem = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View
        style={{
          alignSelf: isUser ? 'flex-end' : 'flex-start',
          maxWidth: '85%',
          marginVertical: 6,
          paddingHorizontal: 14,
        }}
      >
        <View
          style={{
            backgroundColor: isUser ? COLORS.primary : COLORS.surface,
            borderRadius: 16,
            padding: 12,
          }}
        >
          <Text style={{ color: isUser ? '#FFF' : COLORS.text, fontSize: 14, lineHeight: 20 }}>
            {item.text}
          </Text>
        </View>

        {item.songs?.length > 0 && (
          <View style={{ marginTop: 4 }}>
            {item.songs.map(renderSongCard)}
            <TouchableOpacity
              onPress={() => playAll(item.songs)}
              style={{
                marginTop: 8,
                alignSelf: 'flex-start',
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: COLORS.primary + '20',
              }}
            >
              <Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: '600' }}>
                ▶ Play all
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <View
        style={{
          paddingTop: 50,
          paddingBottom: 12,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: COLORS.surface,
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text }}>
          Moodify Assistant
        </Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 16 }}
        onContentSizeChange={scrollToEnd}
      />

      {sending && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 4 }}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      )}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderTopWidth: 1,
          borderTopColor: COLORS.surface,
        }}
      >
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Tell me how you're feeling..."
          placeholderTextColor={COLORS.textSecondary}
          style={{
            flex: 1,
            backgroundColor: COLORS.surface,
            borderRadius: 24,
            paddingHorizontal: 16,
            paddingVertical: 10,
            color: COLORS.text,
            marginRight: 10,
          }}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={sending}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: COLORS.primary,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <MaterialCommunityIcons name="send" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import Animated, { SlideInUp } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { play, pause } from '../../store/slices/playerSlice';
import { COLORS } from '../../theme/colors';

const { width } = Dimensions.get('window');

export default function MiniPlayer({ onPress }) {
  const { currentTrack, isPlaying } = useSelector((state) => state.player);
  const dispatch = useDispatch();

  if (!currentTrack) return null;

  return (
    <Animated.View
      entering={SlideInUp.duration(300)}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View
          style={{
            backgroundColor: COLORS.surfaceLight,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            paddingRight: 12,
            overflow: 'hidden',
            borderWidth: 0.5,
            borderColor: COLORS.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          {currentTrack.thumbnail && (
            <Image
              source={{ uri: currentTrack.thumbnail }}
              style={{
                width: 50,
                height: 50,
                borderRadius: 8,
                marginRight: 12,
              }}
            />
          )}

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: COLORS.text,
              }}
              numberOfLines={1}
            >
              {currentTrack.title}
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: COLORS.textSecondary,
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {currentTrack.artist}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => dispatch(isPlaying ? pause() : play())}
            activeOpacity={0.6}
            style={{ paddingLeft: 8 }}
          >
            <MaterialCommunityIcons
              name={isPlaying ? 'pause' : 'play'}
              size={24}
              color={COLORS.text}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
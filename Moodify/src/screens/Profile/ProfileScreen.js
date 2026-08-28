import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, Switch,
  Dimensions, Animated as RNAnimated, Platform,
} from 'react-native';
import Animated, { 
  FadeIn, 
  SlideInUp, 
  FadeInUp,
  withSpring,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logout } from '../../store/slices/authSlice';
import { COLORS, EMOTION_THEMES } from '../../theme/colors';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { lastEmotion, confidence } = useSelector((state) => state.emotion);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new RNAnimated.Value(0)).current;
  const slideAnim = useRef(new RNAnimated.Value(30)).current;
  
  // Reanimated shared values
  const avatarScale = useSharedValue(1);
  const buttonScale = useSharedValue(1);
  
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
  
  const avatarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));
  
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleLogout = () => {
    Alert.alert(
      'Sign out', 
      'Are you sure you want to sign out?', 
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear all AsyncStorage data
              await AsyncStorage.clear();
              
              // For web, also clear localStorage
              if (Platform.OS === 'web') {
                localStorage.clear();
                sessionStorage.clear();
              }
              
              // Dispatch logout action to clear Redux state
              dispatch(logout());
              
              // Force reload for web to reset everything
              if (Platform.OS === 'web') {
                window.location.href = '/';
              }
            } catch (error) {
              console.error('Logout error:', error);
              // Fallback: just dispatch logout
              dispatch(logout());
              if (Platform.OS === 'web') {
                window.location.href = '/';
              }
            }
          },
        },
      ]
    );
  };

  const handleAvatarPress = () => {
    avatarScale.value = withSpring(0.95, { damping: 10, stiffness: 200 });
    setTimeout(() => {
      avatarScale.value = withSpring(1, { damping: 10, stiffness: 200 });
    }, 150);
  };

  const handleItemPress = (callback) => {
    buttonScale.value = withTiming(0.97, { duration: 100 });
    setTimeout(() => {
      buttonScale.value = withTiming(1, { duration: 100 });
      if (callback) callback();
    }, 100);
  };

  const voiceProfile = user?.voiceProfile;
  const emotionTheme = lastEmotion ? EMOTION_THEMES[lastEmotion] : null;
  const username = user?.username || 'Music Lover';
  const email = user?.email || 'musiclover@example.com';

  const getInitials = () => {
    return username.charAt(0).toUpperCase();
  };

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: COLORS.background }} 
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <RNAnimated.View style={{ 
        paddingTop: 60, 
        paddingBottom: 24, 
        paddingHorizontal: 20, 
        alignItems: 'center',
        backgroundColor: COLORS.background,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}>
        <View style={{ alignItems: 'center' }}>
          {/* Avatar */}
          <Animated.View style={avatarAnimatedStyle}>
            <TouchableOpacity 
              onPress={handleAvatarPress}
              activeOpacity={0.9}
            >
              <View style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: COLORS.primary,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
                shadowColor: COLORS.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5,
              }}>
                <Text style={{ fontSize: 40, fontWeight: '700', color: '#FFF' }}>
                  {getInitials()}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
          
          <Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: 4 }}>
            {username}
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginBottom: 8 }}>
            {email}
          </Text>
          
          {/* Stats Row */}
          <Animated.View 
            entering={FadeInUp.delay(100).duration(500).springify()}
            style={{
              flexDirection: 'row',
              gap: 32,
              marginTop: 16,
            }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text }}>128</Text>
              <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>FOLLOWERS</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text }}>42</Text>
              <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>FOLLOWING</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text }}>8</Text>
              <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>PLAYLISTS</Text>
            </View>
          </Animated.View>
        </View>
      </RNAnimated.View>

      <View style={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {/* Last Emotion */}
        {lastEmotion && (
          <Animated.View 
            entering={SlideInUp.delay(150).duration(500).springify()}
            style={{ marginBottom: 24 }}
          >
            <View style={{ 
              backgroundColor: COLORS.surface, 
              borderRadius: 12, 
              padding: 16,
              borderWidth: 0.5,
              borderColor: COLORS.border,
            }}>
              <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 12, letterSpacing: 0.5 }}>
                CURRENT MOOD
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: emotionTheme?.color || COLORS.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <MaterialCommunityIcons name={emotionTheme?.icon || 'emoticon-happy'} size={28} color="#FFF" />
                </View>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.text, textTransform: 'capitalize' }}>
                    {lastEmotion}
                  </Text>
                  <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>
                    {Math.round(confidence * 100)}% confidence
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Voice Profile */}
        <Animated.View 
          entering={SlideInUp.delay(250).duration(500).springify()}
          style={{ marginBottom: 24 }}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8, letterSpacing: 0.5 }}>
            VOICE PROFILE
          </Text>
          <Animated.View style={buttonAnimatedStyle}>
            <TouchableOpacity 
              style={{ 
                backgroundColor: COLORS.surface, 
                borderRadius: 12, 
                padding: 16,
                borderWidth: 0.5,
                borderColor: COLORS.border,
              }}
              activeOpacity={0.7}
              onPress={() => handleItemPress()}
            >
              {voiceProfile ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: COLORS.primary + '20',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <MaterialCommunityIcons name="microphone" size={24} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text }}>
                      {voiceProfile.vocal_range_label || 'Vocal Profile Ready'}
                    </Text>
                    <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>
                      Best match: {voiceProfile.matched_artists?.[0]?.artist || 'N/A'}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: COLORS.surfaceLight,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <MaterialCommunityIcons name="microphone-off" size={24} color={COLORS.textSecondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text }}>No voice profile</Text>
                    <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>Go to Voice tab to create</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Preferences */}
        <Animated.View 
          entering={SlideInUp.delay(350).duration(500).springify()}
          style={{ marginBottom: 24 }}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8, letterSpacing: 0.5 }}>
            PREFERENCES
          </Text>
          <View style={{ 
            backgroundColor: COLORS.surface, 
            borderRadius: 12, 
            overflow: 'hidden',
            borderWidth: 0.5,
            borderColor: COLORS.border,
          }}>
            {/* Notifications */}
            <View style={{
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: 16, 
              borderBottomWidth: 0.5, 
              borderBottomColor: COLORS.border,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <MaterialCommunityIcons name="bell-outline" size={22} color={COLORS.textSecondary} />
                <Text style={{ fontSize: 15, color: COLORS.text }}>Daily mood reminder</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: COLORS.surfaceLight, true: COLORS.primary }}
                thumbColor={COLORS.text}
              />
            </View>

            {[
              { icon: 'music-note', label: 'Music preferences' },
              { icon: 'translate', label: 'Language' },
              { icon: 'shield-account', label: 'Privacy' },
              { icon: 'information', label: 'About' },
            ].map((item, idx) => (
              <Animated.View key={idx} style={buttonAnimatedStyle}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleItemPress()}
                  style={{
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: 16,
                    borderBottomWidth: idx < 3 ? 0.5 : 0,
                    borderBottomColor: COLORS.border,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <MaterialCommunityIcons name={item.icon} size={22} color={COLORS.textSecondary} />
                    <Text style={{ fontSize: 15, color: COLORS.text }}>{item.label}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Support */}
        <Animated.View 
          entering={SlideInUp.delay(450).duration(500).springify()}
          style={{ marginBottom: 24 }}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8, letterSpacing: 0.5 }}>
            SUPPORT
          </Text>
          <View style={{ 
            backgroundColor: COLORS.surface, 
            borderRadius: 12, 
            overflow: 'hidden',
            borderWidth: 0.5,
            borderColor: COLORS.border,
          }}>
            {[
              { icon: 'help-circle', label: 'Help Center' },
              { icon: 'email', label: 'Contact Us' },
              { icon: 'star', label: 'Rate Moodify' },
            ].map((item, idx) => (
              <Animated.View key={idx} style={buttonAnimatedStyle}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleItemPress()}
                  style={{
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: 16,
                    borderBottomWidth: idx < 2 ? 0.5 : 0,
                    borderBottomColor: COLORS.border,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <MaterialCommunityIcons name={item.icon} size={22} color={COLORS.textSecondary} />
                    <Text style={{ fontSize: 15, color: COLORS.text }}>{item.label}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Logout Button */}
        <Animated.View 
          entering={SlideInUp.delay(550).duration(500).springify()}
          style={buttonAnimatedStyle}
        >
          <TouchableOpacity 
            onPress={handleLogout} 
            activeOpacity={0.7}
          >
            <View style={{
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              backgroundColor: COLORS.surface,
              borderWidth: 0.5,
              borderColor: COLORS.border,
            }}>
              <Text style={{ color: COLORS.error, fontSize: 15, fontWeight: '500' }}>Sign Out</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* App Version */}
        <Animated.Text 
          entering={FadeIn.delay(650).duration(600)}
          style={{ 
            textAlign: 'center', 
            color: COLORS.textTertiary, 
            fontSize: 11, 
            marginTop: 24,
          }}
        >
          Version 1.0.0
        </Animated.Text>
      </View>
    </ScrollView>
  );
}
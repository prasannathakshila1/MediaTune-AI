import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, SlideInUp, useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { setQueue, setCurrentIndex, play } from '../../store/slices/playerSlice';
import { youtubeService } from '../../services/api';
import { COLORS } from '../../theme/colors';

const { width } = Dimensions.get('window');

const MODES = [
  {
    key: 'sleep',
    label: 'Sleep',
    emoji: '🌙',
    description: 'Soft ambient sounds to help you drift off',
    gradient: ['#1a1a2e', '#16213e'],
    icon: 'sleep',
    query: 'sleep music binaural waves ambient',
    timerDefault: 30,
  },
  {
    key: 'study',
    label: 'Study',
    emoji: '📚',
    description: 'Lo-fi beats to keep you focused and calm',
    gradient: ['#0f3460', '#533483'],
    icon: 'book-open-variant',
    query: 'lofi study beats no lyrics focus',
    timerDefault: 60,
  },
  {
    key: 'focus',
    label: 'Deep Focus',
    emoji: '🎯',
    description: 'Instrumental tracks for intense concentration',
    gradient: ['#2d6a4f', '#1b4332'],
    icon: 'target',
    query: 'deep focus concentration instrumental',
    timerDefault: 90,
  },
  {
    key: 'workout',
    label: 'Workout',
    emoji: '💪',
    description: 'High-energy bangers to push your limits',
    gradient: ['#c1121f', '#780000'],
    icon: 'dumbbell',
    query: 'workout gym high energy pump up',
    timerDefault: 45,
  },
];

// Timer Component
const ModeTimer = ({ minutes, onDone }) => {
  const [remaining, setRemaining] = useState(minutes * 60);
  const progressAnim = useSharedValue(1);

  useEffect(() => {
    progressAnim.value = withTiming(0, { duration: minutes * 60 * 1000 });
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) { clearInterval(interval); onDone?.(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%`,
  }));

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <View style={{ marginTop: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', marginBottom: 8 }}>
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </Text>
      <View style={{ height: 4, backgroundColor: COLORS.surfaceLight, borderRadius: 2, overflow: 'hidden' }}>
        <Animated.View style={[{ height: '100%', backgroundColor: COLORS.accent, borderRadius: 2 }, progressStyle]} />
      </View>
    </View>
  );
};

export default function SmartModesScreen({ navigation }) {
  const [activeMode, setActiveMode] = useState(null);
  const [timer, setTimer] = useState(null);
  const [loading, setLoading] = useState(null);
  const dispatch = useDispatch();

  const handleActivateMode = async (mode) => {
    if (activeMode?.key === mode.key) {
      setActiveMode(null);
      setTimer(null);
      return;
    }

    setLoading(mode.key);
    try {
      const response = await youtubeService.search(mode.query, 15);
      const songs = response.data.results || [];
      dispatch(setQueue(songs));
      dispatch(setCurrentIndex(0));
      dispatch(play());
      setActiveMode(mode);
      setTimer(mode.timerDefault);
    } catch (err) {
      console.error('Failed to load mode:', err);
    }
    setLoading(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Animated.View
        entering={FadeIn.duration(600)}
        style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 10 }}
      >
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: COLORS.text }}>Smart Modes</Text>
        <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 4 }}>
          Music curated for what you're doing right now
        </Text>
      </Animated.View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {MODES.map((mode, idx) => {
          const isActive = activeMode?.key === mode.key;
          const isLoadingThis = loading === mode.key;

          return (
            <Animated.View
              key={mode.key}
              entering={SlideInUp.delay(idx * 80).duration(500)}
              style={{ marginBottom: 16 }}
            >
              <TouchableOpacity onPress={() => handleActivateMode(mode)} activeOpacity={0.85} disabled={isLoadingThis}>
                <LinearGradient
                  colors={mode.gradient}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 20, padding: 20, overflow: 'hidden',
                    borderWidth: isActive ? 2 : 0,
                    borderColor: isActive ? COLORS.accent : 'transparent',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Text style={{ fontSize: 36 }}>{mode.emoji}</Text>
                      <View>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#FFF' }}>{mode.label}</Text>
                        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                          {mode.timerDefault} min • Auto-stop
                        </Text>
                      </View>
                    </View>

                    <View style={{
                      width: 44, height: 44, borderRadius: 22,
                      backgroundColor: isActive ? COLORS.accent : 'rgba(255,255,255,0.2)',
                      justifyContent: 'center', alignItems: 'center',
                    }}>
                      {isLoadingThis ? (
                        <MaterialCommunityIcons name="loading" size={22} color="#FFF" />
                      ) : (
                        <MaterialCommunityIcons
                          name={isActive ? 'stop' : 'play'}
                          size={22}
                          color="#FFF"
                        />
                      )}
                    </View>
                  </View>

                  <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 18, marginBottom: isActive ? 0 : 0 }}>
                    {mode.description}
                  </Text>

                  {isActive && timer && (
                    <ModeTimer
                      minutes={timer}
                      onDone={() => { setActiveMode(null); setTimer(null); }}
                    />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {/* Now Playing hint */}
        {activeMode && (
          <Animated.View entering={FadeIn.duration(400)}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Home', { screen: 'Player' })}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.accent]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{ borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <MaterialCommunityIcons name="music" size={22} color="#FFF" />
                  <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '600' }}>
                    {activeMode.label} mode playing
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={22} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}
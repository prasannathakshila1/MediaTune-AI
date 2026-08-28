import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Animated as RNAnimated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, SlideInUp, ZoomIn } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { moodJournalService } from '../../services/api';
import { COLORS, EMOTION_THEMES } from '../../theme/colors';

const { width } = Dimensions.get('window');

export default function MoodJournalScreen() {
  const [period, setPeriod] = useState('week');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const response = await moodJournalService.getTimeline(period);
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch timeline:', error);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTimeline();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchTimeline();
  }, [period]);

  if (loading && !data) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
        <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>Loading your mood timeline...</Text>
      </View>
    );
  }

  const insights = data?.insights || {};
  const logs = data?.logs || [];
  const emotionBreakdown = insights.emotionBreakdown || {};
  const dominantEmotion = insights.dominantEmotion;
  const totalSessions = insights.totalSessions || 0;

  // Weekly heatmap data
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const getDayActivity = (day) => {
    const dayData = insights.byDayOfWeek?.[day + 'day'];
    return dayData ? Math.min(100, (dayData.happy + dayData.sad) * 20) : 20;
  };

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
          borderBottomWidth: 0.5,
          borderBottomColor: COLORS.border,
        }}
      >
        <Text style={{ fontSize: 28, fontWeight: '700', color: COLORS.text, letterSpacing: -0.5 }}>
          Mood Journal
        </Text>
        <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 4 }}>
          Track your emotional journey
        </Text>
      </RNAnimated.View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Period Selector */}
        <Animated.View entering={FadeIn.delay(100).duration(600)}>
          <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginTop: 20, marginBottom: 24, gap: 12 }}>
            {['week', 'month'].map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setPeriod(p)}
                activeOpacity={0.7}
                style={{ flex: 1 }}
              >
                <View
                  style={{
                    backgroundColor: period === p ? COLORS.primary : COLORS.surface,
                    borderRadius: 30,
                    paddingVertical: 10,
                    alignItems: 'center',
                    borderWidth: period === p ? 0 : 0.5,
                    borderColor: COLORS.border,
                  }}
                >
                  <Text
                    style={{
                      color: period === p ? '#FFF' : COLORS.textSecondary,
                      fontSize: 14,
                      fontWeight: '600',
                      textTransform: 'capitalize',
                    }}
                  >
                    {p === 'week' ? 'This Week' : 'This Month'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Stats Cards */}
        <Animated.View entering={SlideInUp.delay(200).duration(600)}>
          <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 24 }}>
            {/* Total Sessions Card */}
            <View style={{
              flex: 1,
              backgroundColor: COLORS.surface,
              borderRadius: 16,
              padding: 16,
              borderWidth: 0.5,
              borderColor: COLORS.border,
            }}>
              <MaterialCommunityIcons name="calendar" size={24} color={COLORS.primary} />
              <Text style={{ fontSize: 28, fontWeight: '700', color: COLORS.text, marginTop: 12 }}>
                {totalSessions}
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 4 }}>
                Total {period === 'week' ? 'this week' : 'this month'}
              </Text>
            </View>

            {/* Dominant Emotion Card */}
            {dominantEmotion && (
              <View style={{
                flex: 1,
                backgroundColor: COLORS.surface,
                borderRadius: 16,
                padding: 16,
                borderWidth: 0.5,
                borderColor: COLORS.border,
              }}>
                <MaterialCommunityIcons name="emoticon-happy" size={24} color={COLORS.primary} />
                <Text style={{ fontSize: 22, fontWeight: '700', color: COLORS.text, marginTop: 12, textTransform: 'capitalize' }}>
                  {dominantEmotion}
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 4 }}>
                  Most common mood
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Emotion Distribution */}
        <Animated.View entering={SlideInUp.delay(300).duration(600)} style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 16, letterSpacing: -0.3 }}>
            Emotion Breakdown
          </Text>

          <View style={{
            backgroundColor: COLORS.surface,
            borderRadius: 20,
            padding: 16,
            borderWidth: 0.5,
            borderColor: COLORS.border,
          }}>
            {Object.entries(emotionBreakdown).length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <MaterialCommunityIcons name="chart-donut" size={40} color={COLORS.textTertiary} />
                <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 8 }}>No data yet</Text>
              </View>
            ) : (
              Object.entries(emotionBreakdown).map(([emotion, count]) => {
                const theme = EMOTION_THEMES[emotion];
                const total = totalSessions || 1;
                const percent = Math.round((count / total) * 100);

                return (
                  <View key={emotion} style={{ marginBottom: 14 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <MaterialCommunityIcons name={theme?.icon || 'emoticon-happy'} size={16} color={theme?.color || COLORS.primary} />
                        <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.text, textTransform: 'capitalize' }}>
                          {emotion}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.primary }}>
                        {percent}%
                      </Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: COLORS.surfaceLight, borderRadius: 3, overflow: 'hidden' }}>
                      <View style={{
                        height: '100%',
                        backgroundColor: theme?.color || COLORS.primary,
                        width: `${percent}%`,
                        borderRadius: 3,
                      }} />
                    </View>
                    <Text style={{ fontSize: 11, color: COLORS.textTertiary, marginTop: 4 }}>
                      {count} {count === 1 ? 'scan' : 'scans'}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        </Animated.View>

        {/* Weekly Heatmap */}
        <Animated.View entering={SlideInUp.delay(400).duration(600)} style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 16, letterSpacing: -0.3 }}>
            Weekly Activity
          </Text>

          <View style={{
            backgroundColor: COLORS.surface,
            borderRadius: 20,
            padding: 16,
            borderWidth: 0.5,
            borderColor: COLORS.border,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              {days.map((day, idx) => {
                const activity = getDayActivity(day);
                return (
                  <View key={day} style={{ alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' }}>
                      {day}
                    </Text>
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: COLORS.primary + Math.min(40, Math.floor(activity * 0.4)).toString(16),
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFF' }}>
                        {Math.floor(activity / 10) || 1}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
            <Text style={{ fontSize: 11, color: COLORS.textTertiary, textAlign: 'center', marginTop: 16 }}>
              Activity intensity by day of week
            </Text>
          </View>
        </Animated.View>

        {/* Recent Scans */}
        <Animated.View entering={SlideInUp.delay(500).duration(600)} style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 16, letterSpacing: -0.3 }}>
            Recent Scans
          </Text>

          {logs.length === 0 ? (
            <View style={{
              backgroundColor: COLORS.surface,
              borderRadius: 20,
              padding: 32,
              alignItems: 'center',
              borderWidth: 0.5,
              borderColor: COLORS.border,
            }}>
              <MaterialCommunityIcons name="emoticon-neutral" size={48} color={COLORS.textTertiary} />
              <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 12, textAlign: 'center' }}>
                No mood scans recorded yet
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.textTertiary, marginTop: 4, textAlign: 'center' }}>
                Scan your emotion from the Scan tab
              </Text>
            </View>
          ) : (
            logs.slice(0, 10).map((log, idx) => {
              const theme = EMOTION_THEMES[log.emotion];
              const logDate = new Date(log.createdAt);
              const dateStr = logDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const timeStr = logDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

              return (
                <Animated.View
                  key={idx}
                  entering={SlideInUp.delay(550 + idx * 30).duration(400)}
                  style={{
                    backgroundColor: COLORS.surface,
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    borderWidth: 0.5,
                    borderColor: COLORS.border,
                  }}
                >
                  <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: (theme?.color || COLORS.primary) + '20',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <MaterialCommunityIcons name={theme?.icon || 'emoticon-happy'} size={24} color={theme?.color || COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.text, textTransform: 'capitalize' }}>
                      {log.emotion}
                    </Text>
                    <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
                      {dateStr} · {timeStr}
                    </Text>
                  </View>
                  <View style={{
                    backgroundColor: COLORS.primary + '15',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.primary }}>
                      {Math.round(log.confidence * 100)}%
                    </Text>
                  </View>
                </Animated.View>
              );
            })
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}
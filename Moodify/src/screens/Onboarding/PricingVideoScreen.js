// src/screens/Onboarding/PricingVideoScreen.js
import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

export default function PricingVideoScreen({ navigation }) {
  const videoRef = useRef(null);

  const plans = [
    { name: 'Free Plan', price: '$0', period: 'forever', features: ['Basic streaming', 'Ads supported', 'Limited skips', 'Standard quality'], popular: false },
    { name: 'Premium', price: '$9.99', period: 'per month', features: ['Ad-free', 'Unlimited skips', 'High quality', 'Offline listening'], popular: true },
    { name: 'Family', price: '$14.99', period: 'per month', features: ['All Premium features', '6 accounts', 'Parental controls'], popular: false },
  ];

  const handleSelectPlan = (planName) => {
    navigation.navigate('FinalVideoScreen', { plan: planName === 'Free Plan' ? 'free' : 'premium' });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <Video
        ref={videoRef}
        source={{ uri: 'https://assets.mixkit.co/videos/preview/mixkit-abstract-music-visualizer-4265-large.mp4' }}
        style={styles.backgroundVideo}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
      />
      
      <View style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Choose Plan</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {plans.map((plan, index) => (
            <Animated.View
              key={index}
              entering={SlideInUp.delay(200 + index * 150).duration(600)}
              style={[styles.planCard, plan.popular && styles.popularCard]}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>MOST POPULAR</Text>
                </View>
              )}
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planPrice}>{plan.price}</Text>
              <Text style={styles.planPeriod}>{plan.period}</Text>
              {plan.features.map((feature, idx) => (
                <View key={idx} style={styles.featureRow}>
                  <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.primary} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
              <TouchableOpacity onPress={() => handleSelectPlan(plan.name)} style={styles.selectButton}>
                <Text style={styles.selectButtonText}>Select</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.footerLinks}>
            <TouchableOpacity><Text style={styles.linkText}>Terms</Text></TouchableOpacity>
            <TouchableOpacity><Text style={styles.linkText}>Privacy</Text></TouchableOpacity>
            <TouchableOpacity><Text style={styles.linkText}>Restore</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  backgroundVideo: { width: width, height: height, position: 'absolute' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#FFF' },
  scrollContent: { paddingHorizontal: 20, gap: 16, alignItems: 'center' },
  planCard: { width: width - 80, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  popularCard: { borderWidth: 2, borderColor: COLORS.primary },
  popularBadge: { position: 'absolute', top: -12, right: 20, backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  popularText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  planName: { fontSize: 20, fontWeight: '700', color: '#FFF', marginBottom: 8 },
  planPrice: { fontSize: 42, fontWeight: 'bold', color: COLORS.primary, marginTop: 8 },
  planPeriod: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  featureText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginLeft: 10 },
  selectButton: { backgroundColor: COLORS.primary, borderRadius: 30, paddingVertical: 12, alignItems: 'center', marginTop: 20 },
  selectButtonText: { color: '#FFF', fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 20, borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.1)' },
  backButton: { paddingVertical: 12, paddingHorizontal: 20 },
  backText: { color: 'rgba(255,255,255,0.6)', fontSize: 16 },
  footerLinks: { flexDirection: 'row', gap: 20 },
  linkText: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
});
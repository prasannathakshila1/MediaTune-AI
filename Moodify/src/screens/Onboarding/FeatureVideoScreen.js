// src/screens/Onboarding/FeatureVideoScreen.js
import React from 'react';
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

export default function FeatureVideoScreen({ navigation }) {
  const features = [
    { 
      icon: 'headphones', 
      title: 'Morning 2 Evening', 
      subtitle: 'Perfect playlist for your day',
      video: require('../../../assets/mp4/feature-music.mp4')
    },
    { 
      icon: 'emoticon-happy', 
      title: 'Mood Based', 
      subtitle: 'Music that matches your feeling',
      video: require('../../../assets/mp4/feature-dance.mp4')
    },
    { 
      icon: 'microphone', 
      title: 'Voice Analysis', 
      subtitle: 'Find your vocal match',
      video: require('../../../assets/mp4/feature-sing.mp4')
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <Video
        source={require('../../../assets/mp4/welcome-bg.mp4')}
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
          <Text style={styles.headerTitle}>Features</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Animated.View entering={FadeIn.delay(200).duration(600)}>
            <Text style={styles.title}>Cool!</Text>
            <Text style={styles.subtitle}>Here's what you'll love about Moodify</Text>
          </Animated.View>

          {features.map((feature, index) => (
            <Animated.View
              key={index}
              entering={SlideInUp.delay(300 + index * 100).duration(600)}
              style={styles.featureCard}
            >
              <View style={styles.featureVideoContainer}>
                <Video
                  source={feature.video}
                  style={styles.featureVideo}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay
                  isLooping
                  isMuted
                />
                <View style={styles.featureOverlay}>
                  <MaterialCommunityIcons name={feature.icon} size={24} color="#FFF" />
                </View>
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
              </View>
            </Animated.View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('PricingVideoScreen')} style={styles.nextButton}>
            <Text style={styles.nextText}>Next →</Text>
          </TouchableOpacity>
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
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  title: { fontSize: 34, fontWeight: 'bold', color: '#FFF', marginBottom: 8 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.7)', marginBottom: 32 },
  featureCard: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, marginBottom: 16, overflow: 'hidden' },
  featureVideoContainer: { width: 90, height: 90, position: 'relative' },
  featureVideo: { width: '100%', height: '100%' },
  featureOverlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  featureText: { flex: 1, padding: 12, justifyContent: 'center' },
  featureTitle: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  featureSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 20, borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.1)' },
  backButton: { paddingVertical: 12, paddingHorizontal: 20 },
  backText: { color: 'rgba(255,255,255,0.6)', fontSize: 16 },
  nextButton: { backgroundColor: COLORS.primary, borderRadius: 30, paddingVertical: 12, paddingHorizontal: 32 },
  nextText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
});
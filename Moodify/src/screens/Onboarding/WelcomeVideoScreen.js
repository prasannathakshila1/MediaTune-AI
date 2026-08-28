// screens/WelcomeVideoScreen.js (or wherever your file is)

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import Animated, { FadeIn, SlideInUp, ZoomIn } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

export default function WelcomeVideoScreen({ navigation }) {
  const videoRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  const videoSource = require('../../../assets/mp4/welcome-bg.mp4');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Loading indicator while video loads */}
      {isLoading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

      {/* 
        Full‑screen video – covers the entire screen.
        ResizeMode.COVER scales the video to fill the screen,
        cropping any excess while keeping the aspect ratio.
        No black bars will appear.
      */}
      <Video
        ref={videoRef}
        source={videoSource}
        style={styles.video}
        resizeMode={ResizeMode.COVER}   // <-- key: fills whole screen
        shouldPlay={true}
        isLooping={true}
        isMuted={true}
        onLoad={() => {
          setIsLoading(false);
        }}
        onError={(error) => {
          console.log('Video error:', error);
          setIsLoading(false);
        }}
      />

      {/* Overlay with content */}
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Animated.View entering={ZoomIn.delay(200).duration(800)} style={styles.logoContainer}>
            <View style={styles.logo}>
              <MaterialCommunityIcons name="music-note" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.appName}>Moodify</Text>
            <Text style={styles.tagline}>Your Mood, Your Music</Text>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(400).duration(800)} style={styles.textContainer}>
            <Text style={styles.title}>Millions of songs.</Text>
            <Text style={[styles.title, { color: COLORS.primary }]}>Free on Moodify.</Text>
            <Text style={styles.subtitle}>Connect your music library and start listening</Text>
          </Animated.View>

          <Animated.View entering={SlideInUp.delay(600).duration(600)} style={styles.buttonContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('FeatureVideoScreen')}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Get Started →</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    backgroundColor: '#000',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 40,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
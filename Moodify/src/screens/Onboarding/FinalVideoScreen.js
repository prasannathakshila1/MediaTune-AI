// src/screens/Onboarding/FinalVideoScreen.js
import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import Animated, { FadeIn, SlideInUp, ZoomIn } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

export default function FinalVideoScreen({ navigation, route }) {
  const { plan = 'free' } = route.params || {};
  const videoRef = useRef(null);

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
        <View style={styles.content}>
          <Animated.View entering={ZoomIn.delay(200).duration(800)} style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name={plan === 'free' ? 'heart' : 'crown'} size={50} color={COLORS.primary} />
            </View>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(400).duration(800)}>
            <Text style={styles.title}>{plan === 'free' ? 'Welcome to Moodify!' : "You're All Set!"}</Text>
            <Text style={styles.subtitle}>
              {plan === 'free' 
                ? 'Start exploring millions of songs and create your perfect playlists.'
                : 'Your premium subscription is active. Enjoy ad-free music with high quality streaming.'}
            </Text>
          </Animated.View>

          <Animated.View entering={SlideInUp.delay(600).duration(600)} style={styles.buttonContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.8} style={styles.button}>
              <Text style={styles.buttonText}>Start Listening →</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  backgroundVideo: { width: width, height: height, position: 'absolute' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center' },
  content: { alignItems: 'center', paddingHorizontal: 24 },
  iconContainer: { marginBottom: 32 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FFF', textAlign: 'center', marginBottom: 16 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  buttonContainer: { width: '100%' },
  button: { backgroundColor: COLORS.primary, borderRadius: 40, paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: '600' },
});
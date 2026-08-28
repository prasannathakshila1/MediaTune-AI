// ==========================================
// MOODIFY — ONBOARDING CAROUSEL SCREEN
// ==========================================
// Swipeable onboarding experience before login/register

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  FlatList,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

const onboardingData = [
  {
    id: '1',
    title: 'Discover Music',
    subtitle: 'Tailored Perfectly To You',
    description: 'Experience personalized music designed to elevate every moment you live.',
    icon: 'music-note',
    color: COLORS.primary,
  },
  {
    id: '2',
    title: 'Mood Based',
    subtitle: 'Feel the Rhythm',
    description: 'Our AI detects your mood and plays the perfect playlist for any emotion.',
    icon: 'emoticon-happy',
    color: COLORS.secondary,
  },
  {
    id: '3',
    title: 'Premium Quality',
    subtitle: 'Crystal Clear Sound',
    description: 'Stream in high quality and enjoy an immersive audio experience.',
    icon: 'headphones',
    color: COLORS.accent,
  },
];

export default function OnboardingCarouselScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const renderItem = ({ item }) => (
    <View style={{ width, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center' }}>
      <LinearGradient
        colors={[item.color + '30', item.color + '10']}
        style={{
          width: 160,
          height: 160,
          borderRadius: 80,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 48,
        }}
      >
        <MaterialCommunityIcons name={item.icon} size={80} color={item.color} />
      </LinearGradient>
      
      <Text style={{
        fontSize: 36,
        fontWeight: '800',
        color: '#FFF',
        textAlign: 'center',
        letterSpacing: -0.5,
        marginBottom: 8,
      }}>
        {item.title}
      </Text>
      <Text style={{
        fontSize: 18,
        fontWeight: '600',
        color: item.color,
        textAlign: 'center',
        marginBottom: 20,
      }}>
        {item.subtitle}
      </Text>
      <Text style={{
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
      }}>
        {item.description}
      </Text>
    </View>
  );

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      flatListRef.current.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.navigate('Login');
    }
  };

  const handleSkip = () => {
    navigation.navigate('Login');
  };

  const renderDots = () => {
    return (
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 40 }}>
        {onboardingData.map((_, index) => (
          <View
            key={index}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: currentIndex === index ? COLORS.primary : 'rgba(255,255,255,0.3)',
              marginHorizontal: 6,
            }}
          />
        ))}
      </View>
    );
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.pexels.com/photos/167491/pexels-photo-167491.jpeg?w=1200&h=2400&fit=crop' }}
      style={{ flex: 1 }}
      imageStyle={{ opacity: 0.3 }}
    >
      <LinearGradient
        colors={['rgba(15,15,17,0.88)', 'rgba(15,15,17,0.95)', COLORS.background]}
        style={{ flex: 1 }}
      >
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        
        {/* Skip Button */}
        <TouchableOpacity 
          onPress={handleSkip}
          style={{ position: 'absolute', top: 60, right: 24, zIndex: 10 }}
        >
          <Text style={{ color: COLORS.primary, fontSize: 16, fontWeight: '600' }}>Skip</Text>
        </TouchableOpacity>

        {/* Onboarding Content */}
        <FlatList
          ref={flatListRef}
          data={onboardingData}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrentIndex(index);
          }}
          keyExtractor={(item) => item.id}
        />

        {/* Dots and Button */}
        <View style={{ paddingHorizontal: 32, paddingBottom: 60 }}>
          {renderDots()}
          
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleNext}
            style={{ marginTop: 32 }}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 40,
                padding: 18,
                alignItems: 'center',
                shadowColor: COLORS.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '700' }}>
                {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Login Link */}
          <TouchableOpacity 
            onPress={() => navigation.navigate('Login')}
            style={{ alignItems: 'center', marginTop: 20 }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
              Already have an account? <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}
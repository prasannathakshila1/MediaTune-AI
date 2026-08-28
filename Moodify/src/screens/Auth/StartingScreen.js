// src/screens/Auth/StartingScreen.js
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  Animated as RNAnimated,
  Dimensions,
  StatusBar,
  ScrollView,
  Image,
} from 'react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

export default function StartingScreen({ navigation }) {
  const fadeAnim = useRef(new RNAnimated.Value(0)).current;
  const slideAnim = useRef(new RNAnimated.Value(30)).current;

  useEffect(() => {
    RNAnimated.parallel([
      RNAnimated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      RNAnimated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  const features = [
    { icon: 'headphones', title: 'Enjoy your music', subtitle: 'High quality streaming' },
    { icon: 'block-helper', title: 'No advertisement', subtitle: 'Ad-free experience' },
    { icon: 'share-variant', title: 'Share your playlist', subtitle: 'With friends & family' },
  ];

  const plans = [
    { name: 'Annual Plan', price: '$120', period: 'per year', features: ['No advertisements', 'Share your music', 'Enjoy your playlist'] },
    { name: 'Life Time Plan', price: '$200', period: 'one time', features: ['No advertisements', 'Share your music', 'Enjoy your playlist', 'Lifetime access'], popular: true },
    { name: 'Life Time Plan', price: '$400', period: 'family plan', features: ['No advertisements', 'Share your music', 'Enjoy your playlist', '5 family accounts'] },
  ];

  return (
    <ImageBackground
      source={{ uri: 'https://images.pexels.com/photos/167491/pexels-photo-167491.jpeg?w=1200&h=2400&fit=crop' }}
      style={{ flex: 1 }}
      imageStyle={{ opacity: 0.2 }}
    >
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <RNAnimated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              paddingHorizontal: 24,
              paddingTop: 60,
            }}
          >
            {/* Simple Logo - No Gradient */}
            <View style={{ alignItems: 'center', marginBottom: 40 }}>
              <View style={{
                width: 70,
                height: 70,
                borderRadius: 20,
                backgroundColor: COLORS.primary,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
              }}>
                <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#FFF' }}>M</Text>
              </View>
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: COLORS.text, letterSpacing: -0.5 }}>
                Moodify
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 4 }}>
                Your Mood, Your Music
              </Text>
            </View>

            {/* Hero Section */}
            <View style={{ marginBottom: 32 }}>
              <Text style={{
                fontSize: 36,
                fontWeight: 'bold',
                color: COLORS.text,
                letterSpacing: -0.5,
                textAlign: 'center',
              }}>
                Get Premium
              </Text>
              <Text style={{
                fontSize: 36,
                fontWeight: 'bold',
                color: COLORS.primary,
                letterSpacing: -0.5,
                textAlign: 'center',
                marginBottom: 12,
              }}>
                Now!
              </Text>
              <Text style={{
                fontSize: 15,
                color: COLORS.textSecondary,
                textAlign: 'center',
                lineHeight: 22,
              }}>
                Lorem ipsum dolor sit amet consectetur. Id in eget pellentesque quam non.
              </Text>
            </View>

            {/* Features Section */}
            <View style={{ marginBottom: 32 }}>
              {features.map((feature, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: COLORS.surface,
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 0.5,
                    borderColor: COLORS.border,
                  }}
                >
                  <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: COLORS.primary + '15',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 14,
                  }}>
                    <MaterialCommunityIcons name={feature.icon} size={22} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.text }}>
                      {feature.title}
                    </Text>
                    <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
                      {feature.subtitle}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textTertiary} />
                </View>
              ))}
            </View>

            {/* Pricing Cards */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 16, paddingRight: 24 }}
              style={{ marginBottom: 24 }}
            >
              {plans.map((plan, index) => (
                <View
                  key={index}
                  style={{
                    width: width - 80,
                    backgroundColor: COLORS.surface,
                    borderRadius: 20,
                    padding: 20,
                    borderWidth: plan.popular ? 2 : 1,
                    borderColor: plan.popular ? COLORS.primary : COLORS.border,
                  }}
                >
                  {plan.popular && (
                    <View style={{
                      position: 'absolute',
                      top: -12,
                      right: 20,
                      backgroundColor: COLORS.primary,
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 20,
                    }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFF' }}>POPULAR</Text>
                    </View>
                  )}
                  <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text }}>{plan.name}</Text>
                  <Text style={{ fontSize: 36, fontWeight: 'bold', color: COLORS.primary, marginTop: 8 }}>
                    {plan.price}
                  </Text>
                  <Text style={{ fontSize: 12, color: COLORS.textTertiary, marginBottom: 20 }}>
                    {plan.period}
                  </Text>
                  {plan.features.map((feature, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.primary} />
                      <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginLeft: 10 }}>{feature}</Text>
                    </View>
                  ))}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={{ marginTop: 20 }}
                    onPress={() => navigation.navigate('Login')}
                  >
                    <View style={{
                      backgroundColor: COLORS.primary,
                      borderRadius: 30,
                      paddingVertical: 12,
                      alignItems: 'center',
                    }}>
                      <Text style={{ color: '#FFF', fontWeight: '600' }}>Select</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            {/* Weekly Option */}
            <View style={{
              backgroundColor: COLORS.surface,
              borderRadius: 16,
              padding: 16,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderWidth: 0.5,
              borderColor: COLORS.border,
              marginBottom: 32,
            }}>
              <View>
                <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.text }}>$5/week or $10/month</Text>
                <Text style={{ fontSize: 12, color: COLORS.textTertiary, marginTop: 2 }}>Flexible weekly plan</Text>
              </View>
              <TouchableOpacity
                style={{
                  backgroundColor: COLORS.primary,
                  paddingHorizontal: 20,
                  paddingVertical: 8,
                  borderRadius: 30,
                }}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={{ color: '#FFF', fontWeight: '600' }}>Next</Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={{ alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', gap: 16, marginBottom: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
                <TouchableOpacity>
                  <Text style={{ fontSize: 12, color: COLORS.textTertiary }}>Terms of Use</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text style={{ fontSize: 12, color: COLORS.textTertiary }}>Privacy Policy</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text style={{ fontSize: 12, color: COLORS.textTertiary }}>Restore Purchase</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={{ color: COLORS.textTertiary, fontSize: 13 }}>
                  Already have an account? <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </RNAnimated.View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}
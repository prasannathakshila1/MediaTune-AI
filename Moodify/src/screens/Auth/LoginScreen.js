// ==========================================
// MOODIFY — PREMIUM LOGIN SCREEN
// ==========================================
// Professional Spotify-like design

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  Animated as RNAnimated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, SlideInUp, ZoomIn } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setCredentials, setLoading, setError, clearError } from '../../store/slices/authSlice';
import { authService } from '../../services/api';
import { COLORS } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  
  // Animations
  const fadeAnim = useRef(new RNAnimated.Value(0)).current;
  const slideAnim = useRef(new RNAnimated.Value(30)).current;
  const scaleAnim = useRef(new RNAnimated.Value(0.95)).current;

  useEffect(() => {
    RNAnimated.parallel([
      RNAnimated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      RNAnimated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      RNAnimated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    dispatch(setLoading(true));
    dispatch(clearError());

    try {
      const response = await authService.login(email, password);
      await AsyncStorage.setItem('token', response.data.token);
      dispatch(setCredentials(response.data));
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed';
      dispatch(setError(message));
      Alert.alert('Error', message);
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.pexels.com/photos/167491/pexels-photo-167491.jpeg?w=1200&h=2400&fit=crop' }}
      style={{ flex: 1 }}
      imageStyle={{ opacity: 0.2 }}
    >
      <LinearGradient
        colors={[COLORS.background, COLORS.backgroundSecondary]}
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
            keyboardShouldPersistTaps="handled"
          >
            <RNAnimated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                paddingHorizontal: 24,
                paddingVertical: 40,
              }}
            >
              {/* Logo Section */}
              <Animated.View entering={ZoomIn.delay(100).duration(800)} style={{ alignItems: 'center', marginBottom: 48 }}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 24,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 16,
                  }}
                >
                  <MaterialCommunityIcons name="headphones" size={40} color="#FFF" />
                </LinearGradient>
                <Text style={{ fontSize: 28, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 }}>
                  Moodify
                </Text>
                <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 4 }}>
                  Your Mood, Your Music
                </Text>
              </Animated.View>

              {/* Welcome Text */}
              <Animated.View entering={FadeIn.delay(200).duration(600)} style={{ marginBottom: 32 }}>
                <Text style={{ fontSize: 34, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5, marginBottom: 8 }}>
                  Welcome Back
                </Text>
                <Text style={{ fontSize: 15, color: COLORS.textSecondary }}>
                  Sign in to continue your musical journey
                </Text>
              </Animated.View>

              {/* Form Card */}
              <Animated.View entering={SlideInUp.delay(300).duration(600)}>
                <View style={{
                  backgroundColor: COLORS.surface,
                  borderRadius: 24,
                  padding: 20,
                  borderWidth: 0.5,
                  borderColor: COLORS.border,
                }}>
                  {/* Email Input */}
                  <View style={{ marginBottom: 20 }}>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginBottom: 8, fontWeight: '500' }}>
                      Email Address
                    </Text>
                    <TextInput
                      placeholder="you@example.com"
                      placeholderTextColor={COLORS.textTertiary}
                      value={email}
                      onChangeText={setEmail}
                      editable={!loading}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      style={{
                        backgroundColor: COLORS.surfaceLight,
                        borderRadius: 14,
                        padding: 16,
                        color: COLORS.text,
                        fontSize: 16,
                        fontWeight: '500',
                        borderWidth: 1.5,
                        borderColor: focusedField === 'email' ? COLORS.primary : COLORS.border,
                      }}
                    />
                  </View>

                  {/* Password Input */}
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginBottom: 8, fontWeight: '500' }}>
                      Password
                    </Text>
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: COLORS.surfaceLight,
                      borderRadius: 14,
                      borderWidth: 1.5,
                      borderColor: focusedField === 'password' ? COLORS.primary : COLORS.border,
                    }}>
                      <TextInput
                        placeholder="Enter your password"
                        placeholderTextColor={COLORS.textTertiary}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        editable={!loading}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        style={{
                          flex: 1,
                          padding: 16,
                          color: COLORS.text,
                          fontSize: 16,
                          fontWeight: '500',
                        }}
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ paddingRight: 16 }}>
                        <MaterialCommunityIcons
                          name={showPassword ? 'eye-off' : 'eye'}
                          size={22}
                          color={COLORS.textTertiary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Forgot Password */}
                  <TouchableOpacity
                    style={{ alignSelf: 'flex-end', marginBottom: 24 }}
                    onPress={() => Alert.alert('Reset Password', 'Coming soon!')}
                  >
                    <Text style={{ fontSize: 13, color: COLORS.primary, fontWeight: '500' }}>
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>

                  {/* Error Message */}
                  {error && (
                    <View style={{
                      backgroundColor: COLORS.error + '15',
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 20,
                      borderWidth: 1,
                      borderColor: COLORS.error + '30',
                    }}>
                      <Text style={{ color: COLORS.error, fontSize: 13, textAlign: 'center' }}>
                        {error}
                      </Text>
                    </View>
                  )}

                  {/* Login Button */}
                  <TouchableOpacity
                    onPress={handleLogin}
                    disabled={loading}
                    activeOpacity={0.8}
                    style={{ marginBottom: 20 }}
                  >
                    <View style={{
                      backgroundColor: COLORS.primary,
                      borderRadius: 40,
                      paddingVertical: 16,
                      alignItems: 'center',
                      opacity: loading ? 0.6 : 1,
                    }}>
                      {loading ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>
                          Sign In
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Or Divider */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                    <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
                    <Text style={{ color: COLORS.textTertiary, paddingHorizontal: 16, fontSize: 12 }}>OR</Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
                  </View>

                  {/* Social Login */}
                  <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 20 }}>
                    <TouchableOpacity style={{
                      backgroundColor: COLORS.surfaceLight,
                      padding: 12,
                      borderRadius: 48,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                    }}>
                      <MaterialCommunityIcons name="google" size={24} color="#DB4437" />
                    </TouchableOpacity>
                    <TouchableOpacity style={{
                      backgroundColor: COLORS.surfaceLight,
                      padding: 12,
                      borderRadius: 48,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                    }}>
                      <MaterialCommunityIcons name="apple" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <TouchableOpacity style={{
                      backgroundColor: COLORS.surfaceLight,
                      padding: 12,
                      borderRadius: 48,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                    }}>
                      <MaterialCommunityIcons name="facebook" size={24} color="#1877F2" />
                    </TouchableOpacity>
                  </View>

                  {/* Sign Up Link */}
                  <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>
                      Don't have an account?
                    </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                      <Text style={{ color: COLORS.primary, fontSize: 14, fontWeight: '700' }}>
                        Sign Up
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            </RNAnimated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </ImageBackground>
  );
}
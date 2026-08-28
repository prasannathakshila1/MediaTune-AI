// ==========================================
// MOODIFY — PREMIUM REGISTER SCREEN
// ==========================================
// Glassmorphism design with beautiful gradients
// Professional UI like the reference image

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
import { authService } from '../../services/api';
import { COLORS } from '../../theme/colors';
// ✅ Import the actual actions from your authSlice
import { setLoading, setError, setCredentials } from '../../store/slices/authSlice';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  // Animations
  const fadeAnim = useRef(new RNAnimated.Value(0)).current;
  const slideAnim = useRef(new RNAnimated.Value(50)).current;

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
    ]).start();
  }, []);

  const handleRegister = async () => {
    // --- Validation ---
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!agreeTerms) {
      Alert.alert('Error', 'Please agree to the Terms & Conditions');
      return;
    }

    // --- Dispatch loading state ---
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const response = await authService.register(username, email, password);
      // Save token in AsyncStorage
      await AsyncStorage.setItem('token', response.data.token);
      // Update Redux state with user and token
      dispatch(setCredentials({
        user: response.data.user,
        token: response.data.token,
      }));
      // Optionally navigate to Home or Dashboard
      // navigation.replace('Home');
    } catch (err) {
      const message = err.response?.data?.error || 'Registration failed';
      dispatch(setError(message));
      Alert.alert('Error', message);
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    if (password.length === 0) return 0;
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (password.length >= 10) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const passwordStrength = getPasswordStrength();
  const strengthColor = () => {
    if (passwordStrength <= 1) return '#EF4444';
    if (passwordStrength <= 3) return '#F59E0B';
    return '#10B981';
  };

  const doPasswordsMatch = password === confirmPassword && password.length > 0 && confirmPassword.length > 0;

  return (
    <ImageBackground
      source={{ uri: 'https://images.pexels.com/photos/167491/pexels-photo-167491.jpeg?w=1200&h=2400&fit=crop' }}
      style={{ flex: 1 }}
      imageStyle={{ opacity: 0.4 }}
    >
      <LinearGradient
        colors={['rgba(15,15,17,0.85)', 'rgba(15,15,17,0.95)', COLORS.background]}
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <RNAnimated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                flex: 1,
                paddingHorizontal: 24,
                paddingTop: 60,
                paddingBottom: 40,
              }}
            >
              {/* Header Section */}
              <Animated.View entering={ZoomIn.delay(100).duration(800)}>
                <Text style={{
                  fontSize: 42,
                  fontWeight: '800',
                  color: '#FFF',
                  marginBottom: 8,
                  letterSpacing: -0.5,
                }}>
                  Sign Up
                </Text>
                <Text style={{
                  fontSize: 15,
                  color: 'rgba(255,255,255,0.7)',
                  marginBottom: 32,
                  lineHeight: 22,
                }}>
                  Complete your information below, or register easily with your social account.
                </Text>
              </Animated.View>

              {/* Glassmorphism Card */}
              <Animated.View entering={SlideInUp.delay(200).duration(600)}>
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  borderRadius: 32,
                  padding: 24,
                  backdropFilter: 'blur(10px)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                  marginBottom: 24,
                }}>
                  {/* Username Input */}
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 8, fontWeight: '500' }}>
                      Username
                    </Text>
                    <TextInput
                      placeholder="yawearren"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={username}
                      onChangeText={setUsername}
                      editable={!loading}
                      onFocus={() => setFocusedField('username')}
                      onBlur={() => setFocusedField(null)}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        borderRadius: 16,
                        padding: 16,
                        color: '#FFF',
                        fontSize: 16,
                        fontWeight: '500',
                        borderWidth: 1.5,
                        borderColor: focusedField === 'username' ? COLORS.primary : 'rgba(255,255,255,0.15)',
                      }}
                    />
                  </View>

                  {/* Email Input */}
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 8, fontWeight: '500' }}>
                      Email
                    </Text>
                    <TextInput
                      placeholder="yawearren@gmail.com"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={email}
                      onChangeText={setEmail}
                      editable={!loading}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        borderRadius: 16,
                        padding: 16,
                        color: '#FFF',
                        fontSize: 16,
                        fontWeight: '500',
                        borderWidth: 1.5,
                        borderColor: focusedField === 'email' ? COLORS.primary : 'rgba(255,255,255,0.15)',
                      }}
                    />
                  </View>

                  {/* Password Input */}
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 8, fontWeight: '500' }}>
                      Password
                    </Text>
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderRadius: 16,
                      borderWidth: 1.5,
                      borderColor: focusedField === 'password' ? COLORS.primary : 'rgba(255,255,255,0.15)',
                    }}>
                      <TextInput
                        placeholder="••••••••"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        editable={!loading}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        style={{
                          flex: 1,
                          padding: 16,
                          color: '#FFF',
                          fontSize: 16,
                          fontWeight: '500',
                        }}
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ paddingRight: 16 }}>
                        <MaterialCommunityIcons
                          name={showPassword ? 'eye-off' : 'eye'}
                          size={22}
                          color="rgba(255,255,255,0.5)"
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Password Strength Indicator */}
                    {password.length > 0 && (
                      <View style={{ marginTop: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          {[1, 2, 3, 4, 5].map((level) => (
                            <View
                              key={level}
                              style={{
                                flex: 1,
                                height: 3,
                                borderRadius: 2,
                                backgroundColor: level <= passwordStrength ? strengthColor() : 'rgba(255,255,255,0.1)',
                              }}
                            />
                          ))}
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Confirm Password Input */}
                  <View style={{ marginBottom: 20 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 8, fontWeight: '500' }}>
                      Confirm Password
                    </Text>
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderRadius: 16,
                      borderWidth: 1.5,
                      borderColor: confirmPassword.length > 0 && !doPasswordsMatch ? '#EF4444' : (focusedField === 'confirmPassword' ? COLORS.primary : 'rgba(255,255,255,0.15)'),
                    }}>
                      <TextInput
                        placeholder="••••••••"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                        editable={!loading}
                        onFocus={() => setFocusedField('confirmPassword')}
                        onBlur={() => setFocusedField(null)}
                        style={{
                          flex: 1,
                          padding: 16,
                          color: '#FFF',
                          fontSize: 16,
                          fontWeight: '500',
                        }}
                      />
                      <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ paddingRight: 16 }}>
                        <MaterialCommunityIcons
                          name={showConfirmPassword ? 'eye-off' : 'eye'}
                          size={22}
                          color="rgba(255,255,255,0.5)"
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Password Match Indicator */}
                    {confirmPassword.length > 0 && (
                      <Text style={{ fontSize: 12, color: doPasswordsMatch ? '#10B981' : '#EF4444', marginTop: 6 }}>
                        {doPasswordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                      </Text>
                    )}
                  </View>

                  {/* Terms & Conditions */}
                  <TouchableOpacity
                    onPress={() => setAgreeTerms(!agreeTerms)}
                    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}
                  >
                    <View style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      borderWidth: 2,
                      borderColor: agreeTerms ? COLORS.primary : 'rgba(255,255,255,0.3)',
                      backgroundColor: agreeTerms ? COLORS.primary : 'transparent',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12,
                    }}>
                      {agreeTerms && <MaterialCommunityIcons name="check" size={14} color="#FFF" />}
                    </View>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                      Agree with <Text style={{ color: COLORS.primary }}>Terms & Condition</Text>
                    </Text>
                  </TouchableOpacity>

                  {/* Error Message */}
                  {error && (
                    <View style={{
                      backgroundColor: 'rgba(239,68,68,0.15)',
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 20,
                      borderWidth: 1,
                      borderColor: 'rgba(239,68,68,0.3)',
                    }}>
                      <Text style={{ color: '#EF4444', fontSize: 13, textAlign: 'center' }}>
                        {error}
                      </Text>
                    </View>
                  )}

                  {/* Sign Up Button */}
                  <TouchableOpacity
                    onPress={handleRegister}
                    disabled={loading}
                    activeOpacity={0.8}
                    style={{ marginBottom: 20 }}
                  >
                    <LinearGradient
                      colors={[COLORS.primary, COLORS.secondary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        borderRadius: 40,
                        padding: 16,
                        alignItems: 'center',
                        opacity: loading ? 0.6 : 1,
                        shadowColor: COLORS.primary,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 12,
                        elevation: 8,
                      }}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>
                          Sign Up
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Or Divider */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                    <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.15)' }} />
                    <Text style={{ color: 'rgba(255,255,255,0.4)', paddingHorizontal: 16, fontSize: 12 }}>Or</Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.15)' }} />
                  </View>

                  {/* Social Sign Up */}
                  <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 20 }}>
                    <TouchableOpacity
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        padding: 12,
                        borderRadius: 48,
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.1)',
                      }}
                    >
                      <MaterialCommunityIcons name="google" size={24} color="#DB4437" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        padding: 12,
                        borderRadius: 48,
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.1)',
                      }}
                    >
                      <MaterialCommunityIcons name="apple" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        padding: 12,
                        borderRadius: 48,
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.1)',
                      }}
                    >
                      <MaterialCommunityIcons name="facebook" size={24} color="#1877F2" />
                    </TouchableOpacity>
                  </View>

                  {/* Music Note Decoration */}
                  <View style={{ alignItems: 'center', marginBottom: 16 }}>
                    <MaterialCommunityIcons name="music-note" size={28} color={COLORS.primary} />
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 8, textAlign: 'center' }}>
                      Stream thousands of songs to lift your mood and keep the rhythm going.
                    </Text>
                  </View>

                  {/* Login Link */}
                  <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
                      Already have an account?
                    </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                      <Text style={{ color: COLORS.primary, fontSize: 14, fontWeight: '700' }}>
                        Login
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
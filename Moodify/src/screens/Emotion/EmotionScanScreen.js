import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { Camera } from 'expo-camera'; // no CameraType needed
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
  FadeIn,
  SlideInUp,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { setEmotion, setEmotionPlaylist, setLoading, setError } from '../../store/slices/emotionSlice';
import { emotionService } from '../../services/api';
import { COLORS } from '../../theme/colors';

const { width, height } = Dimensions.get('window');
const FACE_BOX_SIZE = 280;

export default function EmotionScanScreen({ navigation }) {
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasGalleryPermission, setHasGalleryPermission] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [showCamera, setShowCamera] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const cameraRef = useRef(null);
  const dispatch = useDispatch();

  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (scanning && !scanned) {
      pulseScale.value = withSpring(1.3, { damping: 10, mass: 1, stiffness: 100 }, () => {
        pulseScale.value = withSpring(1, { damping: 10, mass: 1, stiffness: 100 });
      });
    }
  }, [scanning]);

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Request permissions only on native platforms
  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') {
        // On web, we don't need camera permission, but we do need gallery permission
        const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        setHasGalleryPermission(galleryStatus === 'granted');
        setHasCameraPermission(false); // treat as "no camera" for web
        return;
      }

      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus === 'granted');
      const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasGalleryPermission(galleryStatus === 'granted');
    })();
  }, []);

  const handleCapture = async () => {
    if (scanning || scanned || !cameraRef.current) return;

    setScanning(true);
    dispatch(setLoading(true));

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
      });

      const formData = new FormData();
      
      if (Platform.OS === 'web') {
        const response = await fetch(photo.uri);
        const blob = await response.blob();
        const file = new File([blob], 'emotion-photo.jpg', { type: 'image/jpeg' });
        formData.append('image', file);
      } else {
        formData.append('image', {
          uri: photo.uri,
          type: 'image/jpeg',
          name: 'emotion-photo.jpg',
        });
      }

      const emotionResult = await emotionService.predict(formData);
      
      console.log('Emotion Result:', emotionResult.data);
      
      // Store emotion
      dispatch(setEmotion({
        emotion: emotionResult.data.emotion,
        confidence: emotionResult.data.confidence,
      }));
      
      // Store playlist if exists
      if (emotionResult.data.playlist && emotionResult.data.playlist.length > 0) {
        dispatch(setEmotionPlaylist(emotionResult.data.playlist));
        console.log('✅ Playlist stored with', emotionResult.data.playlist.length, 'songs');
      }

      setScanned(true);
      setScanning(false);
      dispatch(setLoading(false));

      navigation.replace('EmotionResult');
    } catch (error) {
      console.error('Emotion scan failed:', error);
      let errorMessage = 'Could not analyze your emotion. Please try again.';
      if (error.response?.data?.message) errorMessage = error.response.data.message;
      else if (error.response?.data?.error) errorMessage = error.response.data.error;
      
      dispatch(setError(errorMessage));
      Alert.alert('Scan failed', errorMessage);
      setScanning(false);
      dispatch(setLoading(false));
    }
  };

  const pickImage = async () => {
    if (scanning || scanned) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled) {
        setShowCamera(false);
        setPreviewImage(result.assets[0].uri);
        setScanning(true);
        dispatch(setLoading(true));

        const formData = new FormData();
        
        if (Platform.OS === 'web') {
          const response = await fetch(result.assets[0].uri);
          const blob = await response.blob();
          const file = new File([blob], 'emotion-photo.jpg', { type: 'image/jpeg' });
          formData.append('image', file);
        } else {
          formData.append('image', {
            uri: result.assets[0].uri,
            type: 'image/jpeg',
            name: 'emotion-photo.jpg',
          });
        }

        const emotionResult = await emotionService.predict(formData);

        dispatch(setEmotion({
          emotion: emotionResult.data.emotion,
          confidence: emotionResult.data.confidence,
        }));
        
        if (emotionResult.data.playlist && emotionResult.data.playlist.length > 0) {
          dispatch(setEmotionPlaylist(emotionResult.data.playlist));
        }

        setScanned(true);
        setScanning(false);
        dispatch(setLoading(false));

        navigation.replace('EmotionResult');
      }
    } catch (error) {
      console.error('Image picker failed:', error);
      let errorMessage = 'Could not process the image. Please try again.';
      Alert.alert('Error', errorMessage);
      setScanning(false);
      dispatch(setLoading(false));
      setShowCamera(true);
      setPreviewImage(null);
    }
  };

  const resetToCamera = () => {
    setShowCamera(true);
    setPreviewImage(null);
    setScanned(false);
    setScanning(false);
  };

  // --- WEB FALLBACK: no camera, only gallery ---
  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, padding: 24 }}>
        <MaterialCommunityIcons name="camera-off" size={64} color={COLORS.textSecondary} />
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginTop: 16, marginBottom: 8, textAlign: 'center' }}>
          Camera not available on web
        </Text>
        <Text style={{ fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 32 }}>
          Please pick a photo from your gallery to analyze your emotion.
        </Text>
        <TouchableOpacity
          onPress={pickImage}
          style={{
            backgroundColor: COLORS.primary,
            paddingVertical: 14,
            paddingHorizontal: 40,
            borderRadius: 30,
          }}
        >
          <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 16 }}>Choose from gallery</Text>
        </TouchableOpacity>
        {scanning && (
          <View style={{ marginTop: 20 }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{ color: COLORS.primary, marginTop: 8 }}>Analyzing...</Text>
          </View>
        )}
      </View>
    );
  }

  // --- Native (Android/iOS) logic starts here ---

  // Camera permission not granted
  if (hasCameraPermission === false && showCamera) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, paddingHorizontal: 20 }}>
        <MaterialCommunityIcons name="camera-off" size={64} color={COLORS.textSecondary} />
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginTop: 16, marginBottom: 8, textAlign: 'center' }}>
          Camera access needed
        </Text>
        <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginBottom: 24, textAlign: 'center' }}>
          We need access to your camera to scan your emotion
        </Text>
        <TouchableOpacity
          onPress={async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasCameraPermission(status === 'granted');
          }}
          activeOpacity={0.8}
          style={{
            backgroundColor: COLORS.primary,
            paddingVertical: 12,
            paddingHorizontal: 32,
            borderRadius: 30,
          }}
        >
          <Text style={{ color: COLORS.text, fontWeight: '600', fontSize: 16 }}>
            Grant permission
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={pickImage}
          activeOpacity={0.8}
          style={{
            marginTop: 16,
            paddingVertical: 12,
            paddingHorizontal: 32,
            borderRadius: 30,
            borderWidth: 1,
            borderColor: COLORS.primary,
          }}
        >
          <Text style={{ color: COLORS.primary, fontWeight: '600', fontSize: 16 }}>
            Choose from gallery
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Loading permissions
  if (hasCameraPermission === null && showCamera) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Show preview from gallery (native)
  if (!showCamera && previewImage) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Animated.View entering={FadeIn.duration(600)}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: COLORS.text, marginBottom: 8, textAlign: 'center' }}>
              Preview
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginBottom: 32, textAlign: 'center' }}>
              Review your photo
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              {
                width: FACE_BOX_SIZE,
                height: FACE_BOX_SIZE,
                borderRadius: 20,
                borderWidth: 3,
                borderColor: COLORS.primary,
                overflow: 'hidden',
                marginBottom: 24,
              },
              pulseAnimatedStyle,
            ]}
          >
            <Image
              source={{ uri: previewImage }}
              style={{
                width: '100%',
                height: '100%',
              }}
            />
          </Animated.View>

          {!scanning && (
            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 24 }}>
              <TouchableOpacity
                onPress={resetToCamera}
                style={{
                  backgroundColor: COLORS.surfaceLight,
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderRadius: 30,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              >
                <Text style={{ color: COLORS.text, fontWeight: '500' }}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={pickImage}
                style={{
                  backgroundColor: COLORS.surfaceLight,
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderRadius: 30,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              >
                <Text style={{ color: COLORS.text, fontWeight: '500' }}>Choose Another</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            onPress={async () => {
              if (scanning) return;
              setScanning(true);
              dispatch(setLoading(true));
              try {
                const formData = new FormData();
                if (Platform.OS === 'web') {
                  const response = await fetch(previewImage);
                  const blob = await response.blob();
                  const file = new File([blob], 'emotion-photo.jpg', { type: 'image/jpeg' });
                  formData.append('image', file);
                } else {
                  formData.append('image', {
                    uri: previewImage,
                    type: 'image/jpeg',
                    name: 'emotion-photo.jpg',
                  });
                }
                const emotionResult = await emotionService.predict(formData);
                dispatch(setEmotion({
                  emotion: emotionResult.data.emotion,
                  confidence: emotionResult.data.confidence,
                }));
                if (emotionResult.data.playlist) {
                  dispatch(setEmotionPlaylist(emotionResult.data.playlist));
                }
                setScanned(true);
                setScanning(false);
                dispatch(setLoading(false));
                navigation.replace('EmotionResult');
              } catch (error) {
                console.error('Analysis failed:', error);
                Alert.alert('Error', 'Could not analyze. Please try again.');
                setScanning(false);
                dispatch(setLoading(false));
              }
            }}
            disabled={scanning}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: scanning ? 'rgba(16, 185, 129, 0.5)' : COLORS.primary,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 4,
                borderColor: '#FFF',
              }}
            >
              {scanning ? (
                <ActivityIndicator size="large" color="#FFF" />
              ) : (
                <MaterialCommunityIcons name="emoticon-happy" size={40} color="#FFF" />
              )}
            </View>
          </TouchableOpacity>

          {scanning && (
            <Text style={{ color: COLORS.primary, fontSize: 14, marginTop: 16 }}>
              Analyzing your emotion...
            </Text>
          )}
        </View>
      </View>
    );
  }

  // --- Native Camera View ---
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Camera
        ref={cameraRef}
        style={{ flex: 1 }}
        type="front"
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.3)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Animated.View
            entering={FadeIn.duration(600)}
            style={{ position: 'absolute', top: 50, left: 20, right: 20 }}
          >
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#FFF', marginBottom: 8 }}>
              Scan your face
            </Text>
            <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)' }}>
              Position your face in the box
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              {
                width: FACE_BOX_SIZE,
                height: FACE_BOX_SIZE,
                borderRadius: 24,
                borderWidth: 3,
                borderColor: COLORS.primary,
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                justifyContent: 'center',
                alignItems: 'center',
              },
              pulseAnimatedStyle,
            ]}
          >
            <View
              style={{
                width: FACE_BOX_SIZE - 30,
                height: FACE_BOX_SIZE - 30,
                borderRadius: 18,
                borderWidth: 2,
                borderStyle: 'dashed',
                borderColor: 'rgba(255,255,255,0.4)',
              }}
            />
          </Animated.View>

          <Animated.View
            entering={SlideInUp.delay(300).duration(600)}
            style={{ position: 'absolute', bottom: 50, left: 20, right: 20 }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 20 }}>
              <TouchableOpacity
                onPress={pickImage}
                activeOpacity={0.8}
                style={{
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  borderRadius: 40,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <MaterialCommunityIcons name="image" size={22} color="#FFF" />
                <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '500' }}>Gallery</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center', marginBottom: 20 }}>
              Make sure you're in good lighting and your face is clearly visible
            </Text>

            <TouchableOpacity onPress={handleCapture} disabled={scanning} activeOpacity={0.8}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: scanning ? 'rgba(16, 185, 129, 0.5)' : COLORS.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                  alignSelf: 'center',
                  borderWidth: 4,
                  borderColor: '#FFF',
                  shadowColor: COLORS.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.5,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                {scanning ? (
                  <ActivityIndicator size="large" color="#FFF" />
                ) : (
                  <MaterialCommunityIcons name="camera" size={40} color="#FFF" />
                )}
              </View>
            </TouchableOpacity>

            {scanning && (
              <Text style={{ color: COLORS.primary, fontSize: 14, textAlign: 'center', marginTop: 16, fontWeight: '600' }}>
                Analyzing your emotion...
              </Text>
            )}
          </Animated.View>
        </View>
      </Camera>
    </View>
  );
}
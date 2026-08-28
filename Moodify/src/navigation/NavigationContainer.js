// src/navigation/NavigationContainer.js
import React, { useEffect, useState } from 'react';
import { NavigationContainer as RNNavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

// Auth
import StartingScreen from '../screens/Auth/StartingScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';

// Phase 4
import HomeScreen from '../screens/Home/HomeScreen';
import SearchScreen from '../screens/Search/SearchScreen';
import PlayerScreen from '../screens/Player/PlayerScreen';

// Phase 5
import EmotionScanScreen from '../screens/Emotion/EmotionScanScreen';
import EmotionResultScreen from '../screens/Emotion/EmotionResultScreen';
import MoodJournalScreen from '../screens/MoodJournal/MoodJournalScreen';

// Phase 6
import VoiceRecorderScreen from '../screens/Voice/VoiceRecorderScreen';
import VoiceAnalysisScreen from '../screens/Voice/VoiceAnalysisScreen';
import KaraokeLyricsScreen from '../screens/Voice/KaraokeLyricsScreen';

// Phase 7
import PlaylistScreen from '../screens/Playlist/PlaylistScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import SmartModesScreen from '../screens/SmartModes/SmartModesScreen';

import WelcomeVideoScreen from '../screens/Onboarding/WelcomeVideoScreen';
import FeatureVideoScreen from '../screens/Onboarding/FeatureVideoScreen';
import PricingVideoScreen from '../screens/Onboarding/PricingVideoScreen';
import FinalVideoScreen from '../screens/Onboarding/FinalVideoScreen';
import PlaylistDetailScreen from '../screens/Playlist/PlaylistDetailScreen';
import ChatAssistantScreen from '../screens/Chat/ChatAssistantScreen';

import { useNavigation } from '@react-navigation/native';
import MiniPlayer from '../components/player/MiniPlayer';
import YouTubePlayer from '../services/youtubePlayer';
import { View } from 'react-native';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const EmotionStack = createNativeStackNavigator();
const VoiceStack = createNativeStackNavigator();

const SCREEN_OPTIONS = { 
  headerShown: false, 
  cardStyle: { backgroundColor: COLORS.background },
  animation: 'slide_from_right',
};

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Onboarding">
    <Stack.Screen name="Onboarding" component={OnboardingStack} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);
const OnboardingStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }} initialRouteName="WelcomeVideo">
    <Stack.Screen name="WelcomeVideo" component={WelcomeVideoScreen} />
    <Stack.Screen name="FeatureVideoScreen" component={FeatureVideoScreen} />
    <Stack.Screen name="PricingVideoScreen" component={PricingVideoScreen} />
    <Stack.Screen name="FinalVideoScreen" component={FinalVideoScreen} />
  </Stack.Navigator>
);


const HomeStackNavigator = () => (
  <HomeStack.Navigator screenOptions={SCREEN_OPTIONS}>
    <HomeStack.Screen name="HomeScreen" component={HomeScreen} />
    <HomeStack.Screen name="Player" component={PlayerScreen} />
    <HomeStack.Screen name="PlaylistDetail" component={PlaylistDetailScreen} />
    <HomeStack.Screen name="SmartModes" component={SmartModesScreen} />
    <HomeStack.Screen name="ChatAssistant" component={ChatAssistantScreen} />
  </HomeStack.Navigator>
);

const EmotionStackNavigator = () => (
  <EmotionStack.Navigator screenOptions={SCREEN_OPTIONS}>
    <EmotionStack.Screen name="EmotionScan" component={EmotionScanScreen} />
    <EmotionStack.Screen name="EmotionResult" component={EmotionResultScreen} />
  </EmotionStack.Navigator>
);

const VoiceStackNavigator = () => (
  <VoiceStack.Navigator screenOptions={SCREEN_OPTIONS}>
    <VoiceStack.Screen name="VoiceRecorder" component={VoiceRecorderScreen} />
    <VoiceStack.Screen name="VoiceAnalysis" component={VoiceAnalysisScreen} />
    <VoiceStack.Screen name="Karaoke" component={KaraokeLyricsScreen} />
  </VoiceStack.Navigator>
);

const TAB_OPTIONS = {
  headerShown: false,
  tabBarStyle: {
    backgroundColor: COLORS.surface,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    paddingBottom: 5,
    paddingTop: 8,
    height: 60,
  },
  tabBarActiveTintColor: COLORS.primary,
  tabBarInactiveTintColor: COLORS.textTertiary,
  tabBarLabelStyle: { fontSize: 11, marginTop: 4, fontWeight: '500' },
};
const AppTabsWithMiniPlayer = () => {
  const navigation = useNavigation();

  return (
    <View style={{ flex: 1 }}>
      <AppTabs />
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 60, // sits directly above the 60px tab bar
        }}
        pointerEvents="box-none"
      >
        <MiniPlayer
          onPress={() => navigation.navigate('Home', { screen: 'Player' })}
        />
      </View>
    </View>
  );
};
const AppTabs = () => (
  <Tab.Navigator screenOptions={TAB_OPTIONS}>
    <Tab.Screen 
      name="Home" 
      component={HomeStackNavigator} 
      options={{
        tabBarLabel: 'Home',
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home" size={size} color={color} />,
      }} 
    />
    <Tab.Screen 
      name="Search" 
      component={SearchScreen} 
      options={{
        tabBarLabel: 'Search',
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="magnify" size={size} color={color} />,
      }} 
    />
    <Tab.Screen 
      name="Emotion" 
      component={EmotionStackNavigator} 
      options={{
        tabBarLabel: 'Scan',
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="emoticon-happy" size={size} color={color} />,
      }} 
    />
    <Tab.Screen 
      name="Voice" 
      component={VoiceStackNavigator} 
      options={{
        tabBarLabel: 'Voice',
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="microphone" size={size} color={color} />,
      }} 
    />
    <Tab.Screen 
      name="Playlist" 
      component={PlaylistScreen} 
      options={{
        tabBarLabel: 'Playlists',
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="playlist-music" size={size} color={color} />,
      }} 
    />
    <Tab.Screen 
      name="Journal" 
      component={MoodJournalScreen} 
      options={{
        tabBarLabel: 'Journal',
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="book-open-page-variant" size={size} color={color} />,
      }} 
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileScreen} 
      options={{
        tabBarLabel: 'Profile',
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-circle" size={size} color={color} />,
      }} 
    />
  </Tab.Navigator>
);

export default function NavigationContainer() {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [navigationKey, setNavigationKey] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setNavigationKey(prev => prev + 1);
    }
  }, [isAuthenticated]);

  return (
    <>
      {isAuthenticated && <YouTubePlayer />}
      <RNNavigationContainer key={navigationKey}>
        {isAuthenticated ? <AppTabsWithMiniPlayer /> : <AuthStack />}
      </RNNavigationContainer>
    </>
  );
}
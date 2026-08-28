import React, { useEffect, useState } from 'react';
import { LogBox, StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import NavigationContainer from './src/navigation/NavigationContainer';
import { store, persistor } from './src/store';
import YouTubePlayer from './src/services/youtubePlayer';

LogBox.ignoreLogs(['Reanimated 2', 'Sending `onAnimatedValueUpdate`']);
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Load fonts here if needed
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  if (!isReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

          {/* ✅ YouTubePlayer mounted globally — handles all audio */}
          <YouTubePlayer />

          <NavigationContainer />
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}
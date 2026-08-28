import { useSharedValue, withSpring, withTiming, withRepeat, withSequence, useAnimatedStyle, interpolate, Extrapolate } from 'react-native-reanimated';

export const SPRING_CONFIG = {
  damping: 12,
  mass: 0.8,
  stiffness: 120,
};

export const TIMING_CONFIG = {
  duration: 400,
};

// Premium fade in animation
export const useFadeIn = (delay = 0) => {
  const opacity = useSharedValue(0);
  
  const animate = () => {
    opacity.value = withTiming(1, { duration: 500, delay });
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
  
  return { animatedStyle, animate };
};

// Premium slide up animation
export const useSlideUp = (delay = 0) => {
  const translateY = useSharedValue(50);
  const opacity = useSharedValue(0);
  
  const animate = () => {
    translateY.value = withTiming(0, { duration: 600, delay });
    opacity.value = withTiming(1, { duration: 500, delay });
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));
  
  return { animatedStyle, animate };
};

// Premium scale animation (for cards)
export const useScaleIn = (delay = 0) => {
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);
  
  const animate = () => {
    scale.value = withSpring(1, SPRING_CONFIG);
    opacity.value = withTiming(1, { duration: 400, delay });
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  
  return { animatedStyle, animate };
};

// Pulse animation for CTA buttons
export const usePulse = () => {
  const scale = useSharedValue(1);
  
  const startPulse = () => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      true
    );
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  return { animatedStyle, startPulse };
};

// Vinyl rotation animation
export const useVinylRotation = (duration = 4000) => {
  const rotation = useSharedValue(0);
  
  const startRotation = () => {
    rotation.value = withRepeat(
      withTiming(360, { duration }),
      -1,
      false
    );
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  
  return { animatedStyle, startRotation, stopRotation: () => { rotation.value = 0; } };
};

// Gradient shimmer animation
export const useShimmer = () => {
  const translateX = useSharedValue(-200);
  
  const startShimmer = () => {
    translateX.value = withRepeat(
      withTiming(200, { duration: 1500 }),
      -1,
      false
    );
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  
  return { animatedStyle, startShimmer };
};

// For list items staggered entrance
export const getStaggerDelay = (index, baseDelay = 100) => {
  return index * baseDelay;
};
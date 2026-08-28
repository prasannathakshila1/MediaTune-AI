import { useSharedValue, withSpring, withTiming, interpolate, Extrapolate } from 'react-native-reanimated';

// ── Spring animation config ────────────────────────────────────
export const SPRING_CONFIG = {
  damping: 10,
  mass: 1,
  stiffness: 100,
  overshootClamping: false,
  restSpeedThreshold: 2,
  restDisplacementThreshold: 2,
};

// ── Timing animation config ────────────────────────────────────
export const TIMING_CONFIG = {
  duration: 300,
};

// ── Fade in animation ──────────────────────────────────────────
export const fadeIn = (duration = 300) => ({
  from: { opacity: 0 },
  to: { opacity: 1 },
  config: { duration },
});

// ── Slide up animation ────────────────────────────────────────
export const slideUp = (duration = 300) => ({
  from: { transform: [{ translateY: 50 }], opacity: 0 },
  to: { transform: [{ translateY: 0 }], opacity: 1 },
  config: { duration },
});

// ── Slide in from left ────────────────────────────────────────
export const slideInLeft = (duration = 300) => ({
  from: { transform: [{ translateX: -50 }], opacity: 0 },
  to: { transform: [{ translateX: 0 }], opacity: 1 },
  config: { duration },
});

// ── Bounce animation ─────────────────────────────────────────
export const bounce = () => ({
  from: { transform: [{ scale: 0.8 }], opacity: 0 },
  to: { transform: [{ scale: 1 }], opacity: 1 },
  config: SPRING_CONFIG,
});

// ── Pulse animation (for recording, scanning) ────────────────
export const usePulseAnimation = () => {
  const pulse = useSharedValue(1);

  const startPulse = () => {
    pulse.value = withSpring(1.2, SPRING_CONFIG, () => {
      pulse.value = withSpring(1, SPRING_CONFIG);
    });
  };

  return { pulse, startPulse };
};

// ── Rotation animation (for loading, vinyl) ────────────────
export const useRotationAnimation = (duration = 3000) => {
  const rotation = useSharedValue(0);

  const startRotation = () => {
    rotation.value = withTiming(360, { duration }, () => {
      rotation.value = 0;
      startRotation();
    });
  };

  return { rotation, startRotation };
};

// ── Interpolate value between ranges ─────────────────────────
export const interpolateValue = (animValue, inputRange, outputRange) => {
  return interpolate(animValue, inputRange, outputRange, Extrapolate.CLAMP);
};
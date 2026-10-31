import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export function Atmosphere({ children }: { children?: React.ReactNode }) {
  const { colors } = useTheme();
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 9000,
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 9000,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [drift]);

  const translateY = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 18],
  });

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.bgTop, colors.bgMid, colors.bgBottom]}
        locations={[0, 0.38, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.orb,
          {
            backgroundColor: colors.accentSoft,
            opacity: 0.35,
            transform: [{ translateY }],
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.orbSecondary,
          {
            backgroundColor: colors.accent,
            opacity: 0.12,
            transform: [{ translateY: Animated.multiply(translateY, -0.6) }],
          },
        ]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  orb: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    top: -40,
    end: -60,
  },
  orbSecondary: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    bottom: 80,
    start: -50,
  },
});

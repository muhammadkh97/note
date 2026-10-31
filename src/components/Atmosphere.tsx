import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export function Atmosphere({ children }: { children?: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.bgTop }]}>
      <View
        pointerEvents="none"
        style={[
          styles.wash,
          {
            backgroundColor: colors.accentSoft,
            opacity: 0.42,
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
    overflow: 'hidden',
  },
  wash: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    top: -170,
    end: -90,
  },
});

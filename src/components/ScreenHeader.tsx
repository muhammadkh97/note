import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/fonts';

type Props = {
  title: string;
  subtitle?: string;
  brand?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
};

export function ScreenHeader({ title, subtitle, brand, onBack, right }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.side}>{right}</View>
      <View style={styles.center}>
        <Text
          style={[
            brand ? styles.brand : styles.title,
            { color: colors.text, fontFamily: brand ? fonts.bold : fonts.semiBold },
          ]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.regular }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.side}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="رجوع"
            onPress={onBack}
            hitSlop={12}
            style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={{ color: colors.text, fontFamily: fonts.medium, fontSize: 17 }}>←</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, minHeight: 60 },
  center: { flex: 1, alignItems: 'flex-end', paddingHorizontal: 6 },
  side: { minWidth: 48, alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 28, letterSpacing: 0.2 },
  title: { fontSize: 18 },
  subtitle: { fontSize: 11, marginTop: 1 },
  backButton: { width: 38, height: 38, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
});

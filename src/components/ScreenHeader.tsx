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

export function ScreenHeader({
  title,
  subtitle,
  brand,
  onBack,
  right,
}: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <View style={styles.side}>{right}</View>
      <View style={styles.center}>
        <Text
          style={[
            brand ? styles.brand : styles.title,
            {
              color: brand ? colors.brand : colors.text,
              fontFamily: brand ? fonts.bold : fonts.semiBold,
            },
          ]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[
              styles.subtitle,
              { color: colors.brand, fontFamily: fonts.regular, opacity: 0.85 },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.side}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12}>
            <Text
              style={{
                color: colors.brand,
                fontFamily: fonts.medium,
                fontSize: 15,
              }}
            >
              رجوع
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    minHeight: 56,
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  side: {
    minWidth: 56,
    alignItems: 'center',
  },
  brand: {
    fontSize: 34,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 20,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
});

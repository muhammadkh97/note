import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Atmosphere } from '../components/Atmosphere';
import { ScreenHeader } from '../components/ScreenHeader';
import { ThemeMode } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/fonts';
import { ar } from '../i18n/ar';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const modes: { id: ThemeMode; label: string }[] = [
  { id: 'light', label: ar.themeLight },
  { id: 'dark', label: ar.themeDark },
  { id: 'system', label: ar.themeSystem },
];

export function SettingsScreen({ navigation }: Props) {
  const { colors, mode, setMode } = useTheme();

  return (
    <Atmosphere>
      <ScreenHeader
        title={ar.settings}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.body}>
        <Text
          style={[
            styles.label,
            { color: colors.brand, fontFamily: fonts.semiBold },
          ]}
        >
          {ar.theme}
        </Text>
        <View style={styles.row}>
          {modes.map((m) => {
            const active = mode === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => setMode(m.id)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? colors.accent : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: active ? colors.fabText : colors.text,
                    fontFamily: fonts.medium,
                  }}
                >
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={{
              color: colors.text,
              fontFamily: fonts.semiBold,
              fontSize: 16,
              textAlign: 'right',
            }}
          >
            {ar.localFirst}
          </Text>
          <Text
            style={{
              color: colors.textMuted,
              fontFamily: fonts.regular,
              fontSize: 13,
              lineHeight: 22,
              textAlign: 'right',
              marginTop: 8,
            }}
          >
            {ar.privacyNote}
          </Text>
        </View>

        <Text
          style={{
            color: colors.brand,
            fontFamily: fonts.regular,
            fontSize: 12,
            textAlign: 'center',
            marginTop: 28,
            opacity: 0.8,
          }}
        >
          {ar.brand} · com.smartnotes.app
        </Text>
      </View>
    </Atmosphere>
  );
}

const styles = StyleSheet.create({
  body: {
    padding: 16,
  },
  label: {
    textAlign: 'right',
    marginBottom: 10,
    fontSize: 15,
  },
  row: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
});

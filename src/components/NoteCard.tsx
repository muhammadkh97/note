import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NOTE_COLORS, NoteWithPreview } from '../types/note';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/fonts';

type Props = {
  note: NoteWithPreview;
  index: number;
  onPress: () => void;
  onLongPress?: () => void;
};

export function NoteCard({ note, index, onPress, onLongPress }: Props) {
  const { colors, resolved } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        delay: Math.min(index * 45, 360),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 420,
        delay: Math.min(index * 45, 360),
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, translateY]);

  const palette = NOTE_COLORS[note.color] ?? NOTE_COLORS.default;
  const bg = resolved === 'dark' ? palette.dark : palette.light;

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }], flex: 1 }}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: bg,
            borderColor: colors.border,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        {note.pinned === 1 ? (
          <Text style={[styles.pin, { color: colors.accent }]}>مثبّت</Text>
        ) : null}
        <Text
          numberOfLines={2}
          style={[styles.title, { color: colors.text, fontFamily: fonts.bold }]}
        >
          {note.title.trim() || note.preview || 'بدون عنوان'}
        </Text>
        {note.title.trim() ? (
          <Text
            numberOfLines={4}
            style={[
              styles.preview,
              { color: colors.textMuted, fontFamily: fonts.regular },
            ]}
          >
            {note.preview}
          </Text>
        ) : null}
        {note.tags.length > 0 ? (
          <View style={styles.tags}>
            {note.tags.slice(0, 3).map((t) => (
              <Text
                key={t.id}
                style={[
                  styles.tag,
                  { color: colors.accent, fontFamily: fonts.medium },
                ]}
              >
                #{t.name}
              </Text>
            ))}
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 14,
    minHeight: 120,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  pin: {
    fontSize: 11,
    marginBottom: 4,
    textAlign: 'right',
  },
  title: {
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  preview: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  tags: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tag: {
    fontSize: 11,
  },
});

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NOTE_COLORS, NoteWithPreview } from '../types/note';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/fonts';

type Props = {
  note: NoteWithPreview;
  index: number;
  onPress: () => void;
  onLongPress?: () => void;
};

function formatDate(timestamp: number) {
  const date = new Date(timestamp);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('ar', { hour: 'numeric', minute: '2-digit' });
  }
  return date.toLocaleDateString('ar', { day: 'numeric', month: 'short' });
}

export function NoteCard({ note, onPress, onLongPress }: Props) {
  const { colors, resolved } = useTheme();
  const palette = NOTE_COLORS[note.color] ?? NOTE_COLORS.default;
  const bg = resolved === 'dark' ? palette.dark : palette.light;
  return (
    <View style={{ flex: 1 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={note.title.trim() || note.preview || 'ملاحظة'}
        onPress={onPress}
        onLongPress={onLongPress}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: bg, borderColor: colors.border, opacity: pressed ? 0.82 : 1 },
        ]}
      >
        <View style={styles.metaRow}>
          <Text style={[styles.date, { color: colors.textMuted, fontFamily: fonts.regular }]}>{formatDate(note.updatedAt)}</Text>
          {note.pinned === 1 ? <Text style={[styles.pin, { color: colors.accent }]}>◆</Text> : null}
        </View>
        <Text numberOfLines={2} style={[styles.title, { color: colors.text, fontFamily: fonts.semiBold }]}>
          {note.title.trim() || note.preview || 'بدون عنوان'}
        </Text>
        {note.title.trim() && note.preview ? (
          <Text numberOfLines={4} style={[styles.preview, { color: colors.textMuted, fontFamily: fonts.regular }]}>{note.preview}</Text>
        ) : null}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          {note.tags.length > 0 ? (
            <View style={styles.tags}>
              {note.tags.slice(0, 2).map((tag) => (
                <Text key={tag.id} numberOfLines={1} style={[styles.tag, { color: colors.accent, fontFamily: fonts.medium }]}>#{tag.name}</Text>
              ))}
            </View>
          ) : <View />}
          <Text style={[styles.openMark, { color: colors.textMuted }]}>↗</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 11, minHeight: 146, borderWidth: StyleSheet.hairlineWidth, marginBottom: 12 },
  metaRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  date: { fontSize: 10 },
  pin: { fontSize: 10 },
  title: { fontSize: 15, lineHeight: 23, textAlign: 'right', writingDirection: 'rtl' },
  preview: { marginTop: 5, fontSize: 12, lineHeight: 19, textAlign: 'right', writingDirection: 'rtl' },
  footer: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, marginTop: 12, paddingTop: 8, minHeight: 24 },
  tags: { flexDirection: 'row-reverse', flex: 1, gap: 6 },
  tag: { fontSize: 10, maxWidth: '70%' },
  openMark: { fontSize: 13, marginStart: 6 },
});

import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Atmosphere } from '../components/Atmosphere';
import { ScreenHeader } from '../components/ScreenHeader';
import * as notesRepo from '../db/notesRepo';
import { NoteWithPreview } from '../types/note';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/fonts';
import { ar } from '../i18n/ar';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Trash'>;

function formatDeletedAt(timestamp: number | null) {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function TrashScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [notes, setNotes] = useState<NoteWithPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setNotes(await notesRepo.listTrashNotes());
    } catch {
      Alert.alert(ar.error, ar.loadError);
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const purgeAll = () => {
    Alert.alert(ar.purgeAll, ar.confirmPurgeAll, [
      {
        text: ar.purgeAll,
        style: 'destructive',
        onPress: async () => {
          try {
            await notesRepo.purgeAllTrash();
            await load();
          } catch {
            Alert.alert(ar.error, ar.deleteError);
          }
        },
      },
      { text: ar.cancel, style: 'cancel' },
    ]);
  };

  const restore = async (id: string) => {
    setBusyId(id);
    try {
      await notesRepo.restoreNote(id);
      await load();
    } catch {
      Alert.alert(ar.error, ar.restoreError);
    } finally {
      setBusyId(null);
    }
  };

  const purge = (id: string) => {
    Alert.alert(ar.purge, ar.confirmPurge, [
      {
        text: ar.purge,
        style: 'destructive',
        onPress: async () => {
          setBusyId(id);
          try {
            await notesRepo.purgeNote(id);
            await load();
          } catch {
            Alert.alert(ar.error, ar.deleteError);
          } finally {
            setBusyId(null);
          }
        },
      },
      { text: ar.cancel, style: 'cancel' },
    ]);
  };

  return (
    <Atmosphere>
      <ScreenHeader
        title={ar.trash}
        onBack={() => navigation.goBack()}
        right={notes.length > 0 ? (
          <Pressable accessibilityRole="button" onPress={purgeAll} hitSlop={8}>
            <Text style={{ color: colors.danger, fontFamily: fonts.medium, fontSize: 11 }}>{ar.purgeAll}</Text>
          </Pressable>
        ) : null}
      />
      <View style={styles.heading}>
        <Text style={[styles.description, { color: colors.textMuted, fontFamily: fonts.regular }]}>{ar.trashDescription}</Text>
        {!loading ? <Text style={[styles.count, { color: colors.accent, fontFamily: fonts.semiBold }]}>{notes.length} {ar.items}</Text> : null}
      </View>
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 35 }} />
          ) : (
            <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.accentSoft }]}><Text style={{ color: colors.accent, fontSize: 23 }}>⌫</Text></View>
              <Text style={[styles.emptyText, { color: colors.textMuted, fontFamily: fonts.regular }]}>{ar.emptyTrash}</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.noteHeader}>
              <Text style={[styles.deletedDate, { color: colors.textMuted, fontFamily: fonts.regular }]}>{formatDeletedAt(item.deletedAt)}</Text>
              <View style={[styles.deletedMark, { backgroundColor: colors.accentSoft }]}><Text style={{ color: colors.accent, fontSize: 11 }}>⌫</Text></View>
            </View>
            <Text numberOfLines={2} style={[styles.title, { color: colors.text, fontFamily: fonts.semiBold }]}>{item.title.trim() || item.preview || ar.untitled}</Text>
            <Text numberOfLines={2} style={[styles.preview, { color: colors.textMuted, fontFamily: fonts.regular }]}>{item.preview}</Text>
            <View style={[styles.actions, { borderTopColor: colors.border }]}>
              <Pressable disabled={busyId === item.id} onPress={() => purge(item.id)} style={[styles.action, { borderColor: colors.border }]}>
                <Text style={{ color: colors.danger, fontFamily: fonts.medium }}>{ar.purge}</Text>
              </Pressable>
              <Pressable disabled={busyId === item.id} onPress={() => restore(item.id)} style={[styles.action, styles.restoreAction, { backgroundColor: colors.accent, borderColor: colors.accent }]}>
                {busyId === item.id ? <ActivityIndicator color={colors.fabText} size="small" /> : <Text style={{ color: colors.fabText, fontFamily: fonts.semiBold }}>{ar.restore}</Text>}
              </Pressable>
            </View>
          </View>
        )}
      />
    </Atmosphere>
  );
}

const styles = StyleSheet.create({
  heading: { paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  description: { textAlign: 'right', fontSize: 11, flex: 1 },
  count: { fontSize: 11, marginStart: 10 },
  list: { paddingHorizontal: 16, paddingBottom: 40, flexGrow: 1 },
  card: { borderRadius: 17, padding: 14, borderWidth: StyleSheet.hairlineWidth, marginBottom: 10 },
  noteHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  deletedDate: { fontSize: 10 },
  deletedMark: { width: 27, height: 27, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, textAlign: 'right' },
  preview: { fontSize: 12, lineHeight: 19, textAlign: 'right', marginTop: 4 },
  actions: { flexDirection: 'row-reverse', gap: 9, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 12, paddingTop: 11 },
  action: { minHeight: 37, paddingHorizontal: 14, borderRadius: 11, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  restoreAction: { minWidth: 89, borderWidth: 0 },
  empty: { alignItems: 'center', padding: 28, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, marginTop: 18 },
  emptyIcon: { width: 50, height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: 9 },
  emptyText: { textAlign: 'center', fontSize: 13 },
});

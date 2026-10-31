import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Atmosphere } from '../components/Atmosphere';
import { NoteCard } from '../components/NoteCard';
import * as notesRepo from '../db/notesRepo';
import * as foldersRepo from '../db/foldersRepo';
import { Folder, NoteWithPreview } from '../types/note';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/fonts';
import { ar } from '../i18n/ar';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [notes, setNotes] = useState<NoteWithPreview[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [pinnedCount, setPinnedCount] = useState(0);

  const load = useCallback(async () => {
    const [all, visible, folderList] = await Promise.all([
      notesRepo.listActiveNotes(),
      notesRepo.listActiveNotes(folderId),
      foldersRepo.listFolders(),
    ]);
    setNotes(visible);
    setFolders(folderList);
    setTotalCount(all.length);
    setPinnedCount(all.filter((note) => note.pinned === 1).length);
  }, [folderId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const numColumns = width >= 900 ? 3 : width >= 600 ? 2 : 2;
  const onCreate = async () => {
    const note = await notesRepo.createNote({ folderId: folderId ?? undefined });
    navigation.navigate('Editor', { noteId: note.id });
  };
  const onLongPress = (note: NoteWithPreview) => {
    Alert.alert(note.title || ar.untitled, undefined, [
      {
        text: note.pinned ? ar.unpin : ar.pin,
        onPress: async () => {
          await notesRepo.togglePin(note.id);
          load();
        },
      },
      {
        text: ar.delete,
        style: 'destructive',
        onPress: async () => {
          await notesRepo.softDeleteNote(note.id);
          load();
        },
      },
      { text: ar.cancel, style: 'cancel' },
    ]);
  };

  return (
    <Atmosphere>
      <FlatList
        data={notes}
        key={numColumns}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.column}
        ListHeaderComponent={
          <View>
            <View style={styles.topBar}>
              <View>
                <Text style={[styles.eyebrow, { color: colors.accent, fontFamily: fonts.semiBold }]}>
                  {ar.brand}  ·  {ar.localFirst}
                </Text>
                <Text style={[styles.greeting, { color: colors.text, fontFamily: fonts.bold }]}>
                  {ar.home}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={ar.settings}
                onPress={() => navigation.navigate('Settings')}
                style={[styles.settingsButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={[styles.settingsGlyph, { color: colors.text }]}>⚙</Text>
              </Pressable>
            </View>
            <Text style={[styles.tagline, { color: colors.textMuted, fontFamily: fonts.regular }]}>
              {ar.tagline}
            </Text>

            <Pressable
              onPress={() => navigation.navigate('Search')}
              style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.searchGlyph, { color: colors.accent }]}>⌕</Text>
              <Text style={[styles.searchLabel, { color: colors.textMuted, fontFamily: fonts.regular }]}>
                {ar.searchPlaceholder}
              </Text>
            </Pressable>

            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.statNumber, { color: colors.text, fontFamily: fonts.bold }]}>{totalCount}</Text>
                <Text style={[styles.statLabel, { color: colors.textMuted, fontFamily: fonts.regular }]}>{ar.notesCount}</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.statNumber, { color: colors.text, fontFamily: fonts.bold }]}>{pinnedCount}</Text>
                <Text style={[styles.statLabel, { color: colors.textMuted, fontFamily: fonts.regular }]}>{ar.pinnedNotes}</Text>
              </View>
              <Pressable onPress={() => navigation.navigate('Folders')} style={[styles.statCard, styles.folderStat, { backgroundColor: colors.accentSoft, borderColor: colors.accentSoft }]}>
                <Text style={[styles.statNumber, { color: colors.accent, fontFamily: fonts.bold }]}>↗</Text>
                <Text style={[styles.statLabel, { color: colors.accent, fontFamily: fonts.medium }]}>{ar.organize}</Text>
              </Pressable>
            </View>

            <View style={styles.quickLinks}>
              {[
                { label: ar.folders, route: 'Folders' as const, mark: '▤' },
                { label: ar.trash, route: 'Trash' as const, mark: '⌫' },
              ].map((item) => (
                <Pressable key={item.route} onPress={() => navigation.navigate(item.route)} style={styles.quickLink}>
                  <Text style={[styles.quickMark, { color: colors.accent }]}>{item.mark}</Text>
                  <Text style={[styles.quickText, { color: colors.text, fontFamily: fonts.medium }]}>{item.label}</Text>
                  <Text style={[styles.quickArrow, { color: colors.textMuted }]}>←</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.sectionHead}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.bold }]}>{ar.yourNotes}</Text>
              <Text style={[styles.sectionCount, { color: colors.textMuted, fontFamily: fonts.regular }]}>{notes.length} {ar.items}</Text>
            </View>
            <View style={styles.filters}>
              <Pressable onPress={() => setFolderId(null)} style={[styles.filterChip, { backgroundColor: folderId === null ? colors.accent : colors.surface, borderColor: folderId === null ? colors.accent : colors.border }]}>
                <Text style={{ color: folderId === null ? colors.fabText : colors.text, fontFamily: fonts.medium, fontSize: 12 }}>{ar.allNotes}</Text>
              </Pressable>
              {folders.map((folder) => (
                <Pressable key={folder.id} onPress={() => setFolderId(folder.id)} style={[styles.filterChip, { backgroundColor: folderId === folder.id ? colors.accent : colors.surface, borderColor: folderId === folder.id ? colors.accent : colors.border }]}>
                  <Text style={{ color: folderId === folder.id ? colors.fabText : colors.text, fontFamily: fonts.medium, fontSize: 12 }}>{folder.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.accentSoft }]}><Text style={{ color: colors.accent, fontSize: 24 }}>✎</Text></View>
            <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: fonts.semiBold }]}>{ar.emptyTitle}</Text>
            <Text style={[styles.emptyBody, { color: colors.textMuted, fontFamily: fonts.regular }]}>{ar.emptyHome}</Text>
            <Pressable onPress={onCreate} style={[styles.emptyButton, { backgroundColor: colors.accent }]}>
              <Text style={{ color: colors.fabText, fontFamily: fonts.semiBold }}>{ar.createFirstNote}</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={{ flex: 1 / numColumns, paddingHorizontal: 6 }}>
            <NoteCard note={item} index={index} onPress={() => navigation.navigate('Editor', { noteId: item.id })} onLongPress={() => onLongPress(item)} />
          </View>
        )}
      />
      <Pressable accessibilityRole="button" accessibilityLabel={ar.newNote} onPress={onCreate} style={[styles.fab, { backgroundColor: colors.fab }]}>
        <Text style={[styles.fabText, { color: colors.fabText }]}>＋</Text>
        <Text style={[styles.fabLabel, { color: colors.fabText, fontFamily: fonts.semiBold }]}>{ar.newNote}</Text>
      </Pressable>
    </Atmosphere>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 110 },
  topBar: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  eyebrow: { textAlign: 'right', fontSize: 12, letterSpacing: 0.3 },
  greeting: { textAlign: 'right', fontSize: 31, lineHeight: 43, marginTop: 2 },
  tagline: { textAlign: 'right', fontSize: 14, marginTop: 2, marginBottom: 20 },
  settingsButton: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  settingsGlyph: { fontSize: 20 },
  searchBox: { minHeight: 52, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  searchGlyph: { fontSize: 25, lineHeight: 30 },
  searchLabel: { flex: 1, textAlign: 'right', fontSize: 13 },
  statsRow: { flexDirection: 'row-reverse', gap: 10, marginTop: 14 },
  statCard: { flex: 1, minHeight: 76, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 9, alignItems: 'flex-end', justifyContent: 'center' },
  folderStat: { borderWidth: 0 },
  statNumber: { fontSize: 21, lineHeight: 27 },
  statLabel: { fontSize: 11, marginTop: 1 },
  quickLinks: { flexDirection: 'row-reverse', gap: 10, marginTop: 12 },
  quickLink: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', gap: 8, paddingVertical: 10 },
  quickMark: { fontSize: 17 },
  quickText: { flex: 1, textAlign: 'right', fontSize: 12 },
  quickArrow: { fontSize: 14 },
  sectionHead: { flexDirection: 'row-reverse', alignItems: 'baseline', gap: 9, marginTop: 18, marginBottom: 10 },
  sectionTitle: { fontSize: 19 },
  sectionCount: { fontSize: 11 },
  filters: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 7, marginBottom: 13 },
  filterChip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  column: { gap: 0 },
  empty: { alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: 22, padding: 24, marginHorizontal: 4, marginTop: 12 },
  emptyIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 17 },
  emptyBody: { textAlign: 'center', fontSize: 13, lineHeight: 22, marginTop: 5 },
  emptyButton: { marginTop: 16, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 },
  fab: { position: 'absolute', end: 20, bottom: 22, minHeight: 56, borderRadius: 28, paddingHorizontal: 19, flexDirection: 'row-reverse', alignItems: 'center', gap: 7, elevation: 5 },
  fabText: { fontSize: 24, lineHeight: 29 },
  fabLabel: { fontSize: 13 },
});

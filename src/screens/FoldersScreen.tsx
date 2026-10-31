import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Atmosphere } from '../components/Atmosphere';
import { ScreenHeader } from '../components/ScreenHeader';
import * as foldersRepo from '../db/foldersRepo';
import * as tagsRepo from '../db/tagsRepo';
import { Folder, Tag } from '../types/note';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/fonts';
import { ar } from '../i18n/ar';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Folders'>;
type ManagedRow =
  | { kind: 'folder'; item: Folder; count: number }
  | { kind: 'tag'; item: Tag; count: number };
type Editing = { kind: 'folder' | 'tag'; id: string; name: string };

export function FoldersScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [folders, setFolders] = useState<{ item: Folder; count: number }[]>([]);
  const [tags, setTags] = useState<{ item: Tag; count: number }[]>([]);
  const [folderName, setFolderName] = useState('');
  const [tagName, setTagName] = useState('');
  const [editing, setEditing] = useState<Editing | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [folderList, tagList] = await Promise.all([
        foldersRepo.listFolders(),
        tagsRepo.listTags(),
      ]);
      const [folderCounts, tagCounts] = await Promise.all([
        Promise.all(folderList.map((item) => foldersRepo.countNotesInFolder(item.id))),
        Promise.all(tagList.map((item) => tagsRepo.countNotesForTag(item.id))),
      ]);
      setFolders(folderList.map((item, index) => ({ item, count: folderCounts[index] ?? 0 })));
      setTags(tagList.map((item, index) => ({ item, count: tagCounts[index] ?? 0 })));
    } catch {
      Alert.alert(ar.error, ar.loadError);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const addFolder = async () => {
    if (!folderName.trim()) return Alert.alert(ar.error, ar.folderNameRequired);
    setSaving(true);
    try {
      await foldersRepo.createFolder(folderName);
      setFolderName('');
      await load();
    } catch (error) {
      Alert.alert(ar.error, error instanceof Error && error.message.includes('exists') ? ar.duplicateName : ar.saveError);
    } finally {
      setSaving(false);
    }
  };

  const addTag = async () => {
    if (!tagName.trim().replace(/^#/, '')) return Alert.alert(ar.error, ar.tagNameRequired);
    setSaving(true);
    try {
      await tagsRepo.createTag(tagName);
      setTagName('');
      await load();
    } catch {
      Alert.alert(ar.error, ar.saveError);
    } finally {
      setSaving(false);
    }
  };

  const saveRename = async () => {
    if (!editing || !editing.name.trim()) return Alert.alert(ar.error, ar.nameRequired);
    setSaving(true);
    try {
      if (editing.kind === 'folder') {
        await foldersRepo.renameFolder(editing.id, editing.name);
      } else {
        await tagsRepo.renameTag(editing.id, editing.name);
      }
      setEditing(null);
      await load();
    } catch (error) {
      Alert.alert(ar.error, error instanceof Error && error.message.includes('exists') ? ar.duplicateName : ar.saveError);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (row: ManagedRow) => {
    const message = row.kind === 'folder' ? ar.deleteFolderMessage : ar.deleteTagMessage;
    const displayName = row.kind === 'tag' ? `#${row.item.name}` : row.item.name;
    Alert.alert(`${ar.delete}: ${displayName}`, message, [
      {
        text: ar.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            if (row.kind === 'folder') await foldersRepo.deleteFolder(row.item.id);
            else await tagsRepo.deleteTag(row.item.id);
            if (editing?.id === row.item.id) setEditing(null);
            await load();
          } catch {
            Alert.alert(ar.error, ar.deleteError);
          }
        },
      },
      { text: ar.cancel, style: 'cancel' },
    ]);
  };

  const data: ManagedRow[] = [
    ...folders.map(({ item, count }) => ({ kind: 'folder' as const, item, count })),
    ...tags.map(({ item, count }) => ({ kind: 'tag' as const, item, count })),
  ];

  return (
    <Atmosphere>
      <ScreenHeader title={`${ar.folders} / ${ar.tags}`} onBack={() => navigation.goBack()} />
      <FlatList
        data={data}
        keyExtractor={(item) => `${item.kind}-${item.item.id}`}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            {editing ? (
              <View style={[styles.editPanel, { backgroundColor: colors.accentSoft }]}>
                <Text style={[styles.label, { color: colors.accent, fontFamily: fonts.semiBold }]}>
                  {editing.kind === 'folder' ? ar.renameFolder : ar.renameTag}
                </Text>
                <View style={styles.row}>
                  <Pressable disabled={saving} onPress={saveRename} style={[styles.btn, { backgroundColor: colors.accent, opacity: saving ? 0.6 : 1 }]}>
                    <Text style={{ color: colors.fabText, fontFamily: fonts.semiBold }}>{ar.save}</Text>
                  </Pressable>
                  <TextInput value={editing.name} onChangeText={(name) => setEditing((current) => current ? { ...current, name } : current)} autoFocus placeholder={ar.name} placeholderTextColor={colors.textMuted} textAlign="right" style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border, fontFamily: fonts.regular }]} />
                </View>
                <Pressable onPress={() => setEditing(null)} style={styles.cancelEdit}>
                  <Text style={{ color: colors.textMuted, fontFamily: fonts.medium }}>{ar.cancel}</Text>
                </Pressable>
              </View>
            ) : null}
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.label, { color: colors.text, fontFamily: fonts.semiBold }]}>{ar.createFolder}</Text>
              <View style={styles.row}>
                <Pressable disabled={saving} onPress={addFolder} style={[styles.btn, { backgroundColor: colors.accent, opacity: saving ? 0.6 : 1 }]}>
                  <Text style={{ color: colors.fabText, fontFamily: fonts.semiBold }}>{ar.add}</Text>
                </Pressable>
                <TextInput value={folderName} onChangeText={setFolderName} onSubmitEditing={addFolder} returnKeyType="done" placeholder={ar.folderName} placeholderTextColor={colors.textMuted} textAlign="right" style={[styles.input, { color: colors.text, backgroundColor: colors.bgTop, borderColor: colors.border, fontFamily: fonts.regular }]} />
              </View>
              <Text style={[styles.label, styles.secondLabel, { color: colors.text, fontFamily: fonts.semiBold }]}>{ar.createTag}</Text>
              <View style={styles.row}>
                <Pressable disabled={saving} onPress={addTag} style={[styles.btn, { backgroundColor: colors.accent, opacity: saving ? 0.6 : 1 }]}>
                  <Text style={{ color: colors.fabText, fontFamily: fonts.semiBold }}>{ar.add}</Text>
                </Pressable>
                <TextInput value={tagName} onChangeText={setTagName} onSubmitEditing={addTag} returnKeyType="done" placeholder={ar.tagName} placeholderTextColor={colors.textMuted} textAlign="right" style={[styles.input, { color: colors.text, backgroundColor: colors.bgTop, borderColor: colors.border, fontFamily: fonts.regular }]} />
              </View>
            </View>
            <View style={styles.sectionHead}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.semiBold }]}>{ar.collections}</Text>
              <Text style={[styles.count, { color: colors.textMuted, fontFamily: fonts.regular }]}>{data.length}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.textMuted, fontFamily: fonts.regular }]}>{ar.emptyFolders}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardTop}>
              <View style={[styles.kindIcon, { backgroundColor: colors.accentSoft }]}>
                <Text style={{ color: colors.accent, fontSize: 15 }}>{item.kind === 'folder' ? '▤' : '#'}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text numberOfLines={1} style={[styles.cardTitle, { color: colors.text, fontFamily: fonts.semiBold }]}>{item.kind === 'tag' ? `#${item.item.name}` : item.item.name}</Text>
                <Text style={[styles.cardMeta, { color: colors.textMuted, fontFamily: fonts.regular }]}>{item.count} {ar.notesCount}</Text>
              </View>
            </View>
            <View style={[styles.actions, { borderTopColor: colors.border }]}>
              <Pressable accessibilityRole="button" onPress={() => setEditing({ kind: item.kind, id: item.item.id, name: item.item.name })} style={styles.actionButton}>
                <Text style={{ color: colors.accent, fontFamily: fonts.medium }}>{ar.rename}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => confirmDelete(item)} style={styles.actionButton}>
                <Text style={{ color: colors.danger, fontFamily: fonts.medium }}>{ar.delete}</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </Atmosphere>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  editPanel: { borderRadius: 16, padding: 14, marginBottom: 12 },
  formCard: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 14, marginBottom: 18 },
  label: { textAlign: 'right', marginBottom: 7, fontSize: 14 },
  secondLabel: { marginTop: 16 },
  row: { flexDirection: 'row-reverse', gap: 8, alignItems: 'center' },
  input: { flex: 1, minHeight: 44, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, borderWidth: StyleSheet.hairlineWidth, writingDirection: 'rtl' },
  btn: { minHeight: 42, paddingHorizontal: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cancelEdit: { alignSelf: 'flex-end', paddingTop: 9, paddingHorizontal: 4 },
  sectionHead: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 16 },
  count: { fontSize: 12 },
  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingTop: 13, marginBottom: 10 },
  cardTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 11, paddingBottom: 12 },
  kindIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1, alignItems: 'flex-end' },
  cardTitle: { fontSize: 15 },
  cardMeta: { fontSize: 11, marginTop: 2 },
  actions: { flexDirection: 'row-reverse', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 9, paddingBottom: 10, gap: 18 },
  actionButton: { paddingVertical: 2, paddingHorizontal: 4 },
  empty: { padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 13 },
});

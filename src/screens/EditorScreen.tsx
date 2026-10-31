import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Atmosphere } from '../components/Atmosphere';
import { BlockEditor } from '../components/BlockEditor';
import { ScreenHeader } from '../components/ScreenHeader';
import * as notesRepo from '../db/notesRepo';
import * as foldersRepo from '../db/foldersRepo';
import * as tagsRepo from '../db/tagsRepo';
import {
  Folder,
  NOTE_COLORS,
  NoteBlock,
  NoteColor,
  Tag,
  blocksToPlainText,
  parseBlocks,
} from '../types/note';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/fonts';
import { ar } from '../i18n/ar';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Editor'>;

export function EditorScreen({ navigation, route }: Props) {
  const { noteId } = route.params;
  const { colors, resolved } = useTheme();
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<NoteBlock[]>([]);
  const [color, setColor] = useState<NoteColor>('default');
  const [folderId, setFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState('');
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [note, f, t] = await Promise.all([
          notesRepo.getNote(noteId),
          foldersRepo.listFolders(),
          tagsRepo.listTags(),
        ]);
        if (!active) return;
        if (!note) {
          navigation.goBack();
          return;
        }
        setTitle(note.title);
        setBlocks(parseBlocks(note.blocksJson));
        setColor(note.color);
        setFolderId(note.folderId);
        setSelectedTagIds(note.tags.map((x) => x.id));
        setFolders(f);
        setAllTags(t);
        setReady(true);
      } catch {
        if (active) Alert.alert(ar.error, ar.loadError, [{ text: ar.cancel, onPress: () => navigation.goBack() }]);
      }
    })();
    return () => { active = false; };
  }, [noteId, navigation]);

  const persist = useCallback(
    async (
      nextTitle = title,
      nextBlocks = blocks,
      nextColor = color,
      nextFolder = folderId
    ) => {
      setSaveState('saving');
      try {
        const updated = await notesRepo.updateNote(noteId, {
          title: nextTitle,
          blocks: nextBlocks,
          color: nextColor,
          folderId: nextFolder,
        });
        if (!updated) throw new Error('Note no longer exists');
        await notesRepo.setNoteTags(noteId, selectedTagIds);
        setSaveState('saved');
      } catch (error) {
        setSaveState('error');
        throw error;
      }
    },
    [noteId, title, blocks, color, folderId, selectedTagIds]
  );

  useEffect(() => {
    if (!ready) return;
    const handle = setTimeout(() => {
      persist().catch(() => {});
    }, 400);
    return () => clearTimeout(handle);
  }, [ready, title, blocks, color, folderId, selectedTagIds, persist]);

  useEffect(() => {
    let handlingRemoval = false;
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (!ready || handlingRemoval) return;
      event.preventDefault();
      handlingRemoval = true;
      const action = event.data.action;
      persist()
        .then(() => {
          unsubscribe();
          navigation.dispatch(action);
        })
        .catch(() => {
          handlingRemoval = false;
          Alert.alert(ar.error, ar.notSaved);
        });
    });
    return unsubscribe;
  }, [navigation, persist, ready]);

  const onShare = async () => {
    const content = blocksToPlainText(blocks).trim();
    const body = [title.trim() || ar.untitled, content].filter(Boolean).join('\n\n');
    try {
      await Share.share({ message: body, title: title.trim() || ar.brand });
    } catch {
      Alert.alert(ar.error, ar.shareError);
    }
  };

  const addTag = async () => {
    if (!tagDraft.trim()) return;
    try {
      const tag = await tagsRepo.createTag(tagDraft);
      setTagDraft('');
      setAllTags(await tagsRepo.listTags());
      setSelectedTagIds((ids) => ids.includes(tag.id) ? ids : [...ids, tag.id]);
    } catch {
      Alert.alert(ar.error, ar.saveError);
    }
  };

  const palette = NOTE_COLORS[color];
  const sheetBg = resolved === 'dark' ? palette.dark : palette.light;

  if (!ready) {
    return <Atmosphere>{null}</Atmosphere>;
  }

  return (
    <Atmosphere>
      <ScreenHeader
        title={ar.editor}
        onBack={() => navigation.goBack()}
        right={
          <Pressable onPress={onShare}>
            <Text style={{ color: colors.brand, fontFamily: fonts.medium }}>
              {ar.share}
            </Text>
          </Pressable>
        }
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.statusRow}>
          <Text style={{ color: saveState === 'error' ? colors.danger : colors.textMuted, fontFamily: fonts.regular, fontSize: 11 }}>
            {saveState === 'saving' ? ar.saving : saveState === 'saved' ? ar.saved : saveState === 'error' ? ar.notSaved : ar.autosave}
          </Text>
        </View>
        <View
          style={[
            styles.sheet,
            { backgroundColor: sheetBg, borderColor: colors.border },
          ]}
        >
          <TextInput
            value={title}
            maxLength={120}
            returnKeyType="next"
            onChangeText={setTitle}
            placeholder={ar.titlePlaceholder}
            placeholderTextColor={colors.textMuted}
            textAlign="right"
            style={[
              styles.title,
              { color: colors.text, fontFamily: fonts.bold },
            ]}
          />
          <BlockEditor blocks={blocks} onChange={setBlocks} />
        </View>

        <Text
          style={[
            styles.section,
            { color: colors.brand, fontFamily: fonts.semiBold },
          ]}
        >
          {ar.color}
        </Text>
        <View style={styles.colors}>
          {(Object.keys(NOTE_COLORS) as NoteColor[]).map((key) => {
            const c = NOTE_COLORS[key];
            const swatch = resolved === 'dark' ? c.dark : c.light;
            return (
              <Pressable
                key={key}
                accessibilityRole="radio"
                accessibilityLabel={c.label}
                accessibilityState={{ checked: color === key }}
                onPress={() => setColor(key)}
                style={[
                  styles.swatch,
                  {
                    backgroundColor: swatch,
                    borderColor:
                      color === key ? colors.accent : colors.border,
                    borderWidth: color === key ? 2 : StyleSheet.hairlineWidth,
                  },
                ]}
              />
            );
          })}
        </View>

        <Text
          style={[
            styles.section,
            { color: colors.brand, fontFamily: fonts.semiBold },
          ]}
        >
          {ar.folder}
        </Text>
        <View style={styles.rowWrap}>
          <Pressable
            onPress={() => setFolderId(null)}
            style={[
              styles.chip,
              {
                backgroundColor:
                  folderId === null ? colors.accent : colors.surface,
              },
            ]}
          >
            <Text
              style={{
                color: folderId === null ? colors.fabText : colors.text,
                fontFamily: fonts.medium,
                fontSize: 12,
              }}
            >
              {ar.noFolder}
            </Text>
          </Pressable>
          {folders.map((f) => (
            <Pressable
              key={f.id}
              onPress={() => setFolderId(f.id)}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    folderId === f.id ? colors.accent : colors.surface,
                },
              ]}
            >
              <Text
                style={{
                  color: folderId === f.id ? colors.fabText : colors.text,
                  fontFamily: fonts.medium,
                  fontSize: 12,
                }}
              >
                {f.name}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text
          style={[
            styles.section,
            { color: colors.brand, fontFamily: fonts.semiBold },
          ]}
        >
          {ar.tags}
        </Text>
        <View style={styles.rowWrap}>
          {allTags.map((t) => {
            const selected = selectedTagIds.includes(t.id);
            return (
              <Pressable
                key={t.id}
                onPress={() =>
                  setSelectedTagIds((ids) =>
                    selected
                      ? ids.filter((x) => x !== t.id)
                      : [...ids, t.id]
                  )
                }
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected
                      ? colors.accent
                      : colors.surface,
                  },
                ]}
              >
                <Text
                  style={{
                    color: selected ? colors.fabText : colors.text,
                    fontFamily: fonts.medium,
                    fontSize: 12,
                  }}
                >
                  #{t.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.tagAdd}>
          <Pressable
            onPress={addTag}
            style={[styles.addBtn, { backgroundColor: colors.accent }]}
          >
            <Text
              style={{ color: colors.fabText, fontFamily: fonts.semiBold }}
            >
              {ar.add}
            </Text>
          </Pressable>
          <TextInput
            value={tagDraft}
            onChangeText={setTagDraft}
            placeholder={ar.tagName}
            placeholderTextColor={colors.textMuted}
            textAlign="right"
            style={[
              styles.tagInput,
              {
                color: colors.text,
                backgroundColor: colors.surface,
                fontFamily: fonts.regular,
                borderColor: colors.border,
              },
            ]}
          />
        </View>
      </ScrollView>
    </Atmosphere>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  statusRow: { alignItems: 'flex-end', marginBottom: 5, paddingHorizontal: 2 },
  sheet: {
    borderRadius: 20,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  title: {
    fontSize: 24,
    writingDirection: 'rtl',
    textAlign: 'right',
    marginBottom: 4,
  },
  section: {
    marginTop: 18,
    marginBottom: 8,
    textAlign: 'right',
    fontSize: 14,
  },
  colors: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  rowWrap: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  tagAdd: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    writingDirection: 'rtl',
  },
  addBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
});

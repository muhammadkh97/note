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
import { ScreenHeader } from '../components/ScreenHeader';
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

  const load = useCallback(async () => {
    const [n, f] = await Promise.all([
      notesRepo.listActiveNotes(folderId),
      foldersRepo.listFolders(),
    ]);
    setNotes(n);
    setFolders(f);
  }, [folderId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const numColumns = width >= 700 ? 3 : 2;

  const onCreate = async () => {
    const note = await notesRepo.createNote({
      folderId: folderId ?? undefined,
    });
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
      <ScreenHeader
        title={ar.brand}
        subtitle={ar.tagline}
        brand
        right={
          <Pressable onPress={() => navigation.navigate('Settings')}>
            <Text style={{ color: colors.brand, fontFamily: fonts.medium }}>
              ⚙
            </Text>
          </Pressable>
        }
      />

      <View style={styles.navRow}>
        {[
          { label: ar.search, route: 'Search' as const },
          { label: ar.folders, route: 'Folders' as const },
          { label: ar.trash, route: 'Trash' as const },
        ].map((item) => (
          <Pressable
            key={item.route}
            onPress={() => navigation.navigate(item.route)}
            style={[
              styles.navChip,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={{
                color: colors.text,
                fontFamily: fonts.medium,
                fontSize: 13,
              }}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.filters}>
        <Pressable
          onPress={() => setFolderId(null)}
          style={[
            styles.filterChip,
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
            {ar.allNotes}
          </Text>
        </Pressable>
        {folders.map((f) => (
          <Pressable
            key={f.id}
            onPress={() => setFolderId(f.id)}
            style={[
              styles.filterChip,
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

      <FlatList
        data={notes}
        key={numColumns}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.column}
        ListEmptyComponent={
          <Text
            style={[
              styles.empty,
              { color: colors.brand, fontFamily: fonts.regular },
            ]}
          >
            {ar.emptyHome}
          </Text>
        }
        renderItem={({ item, index }) => (
          <View style={{ flex: 1 / numColumns, paddingHorizontal: 6 }}>
            <NoteCard
              note={item}
              index={index}
              onPress={() =>
                navigation.navigate('Editor', { noteId: item.id })
              }
              onLongPress={() => onLongPress(item)}
            />
          </View>
        )}
      />

      <Pressable
        onPress={onCreate}
        style={[styles.fab, { backgroundColor: colors.fab }]}
      >
        <Text style={[styles.fabText, { color: colors.fabText }]}>+</Text>
      </Pressable>
    </Atmosphere>
  );
}

const styles = StyleSheet.create({
  navRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  navChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  filters: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  list: {
    paddingHorizontal: 10,
    paddingBottom: 100,
  },
  column: {
    gap: 0,
  },
  empty: {
    textAlign: 'center',
    marginTop: 48,
    fontSize: 15,
    lineHeight: 26,
  },
  fab: {
    position: 'absolute',
    end: 22,
    bottom: 28,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabText: {
    fontSize: 32,
    lineHeight: 34,
    fontWeight: '400',
  },
});

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

type Row =
  | { kind: 'folder'; item: Folder; count: number }
  | { kind: 'tag'; item: Tag };

export function FoldersScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [folders, setFolders] = useState<
    { folder: Folder; count: number }[]
  >([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [folderName, setFolderName] = useState('');
  const [tagName, setTagName] = useState('');

  const load = useCallback(async () => {
    const f = await foldersRepo.listFolders();
    const withCounts = await Promise.all(
      f.map(async (folder) => ({
        folder,
        count: await foldersRepo.countNotesInFolder(folder.id),
      }))
    );
    setFolders(withCounts);
    setTags(await tagsRepo.listTags());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const data: Row[] = [
    ...folders.map((f) => ({
      kind: 'folder' as const,
      item: f.folder,
      count: f.count,
    })),
    ...tags.map((t) => ({ kind: 'tag' as const, item: t })),
  ];

  return (
    <Atmosphere>
      <ScreenHeader
        title={`${ar.folders} / ${ar.tags}`}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.form}>
        <Text
          style={[
            styles.label,
            { color: colors.brand, fontFamily: fonts.semiBold },
          ]}
        >
          {ar.createFolder}
        </Text>
        <View style={styles.row}>
          <Pressable
            onPress={async () => {
              if (!folderName.trim()) return;
              await foldersRepo.createFolder(folderName);
              setFolderName('');
              load();
            }}
            style={[styles.btn, { backgroundColor: colors.accent }]}
          >
            <Text style={{ color: colors.fabText, fontFamily: fonts.semiBold }}>
              {ar.add}
            </Text>
          </Pressable>
          <TextInput
            value={folderName}
            onChangeText={setFolderName}
            placeholder={ar.folderName}
            placeholderTextColor={colors.textMuted}
            textAlign="right"
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: colors.surface,
                borderColor: colors.border,
                fontFamily: fonts.regular,
              },
            ]}
          />
        </View>

        <Text
          style={[
            styles.label,
            { color: colors.brand, fontFamily: fonts.semiBold },
          ]}
        >
          {ar.createTag}
        </Text>
        <View style={styles.row}>
          <Pressable
            onPress={async () => {
              if (!tagName.trim()) return;
              await tagsRepo.createTag(tagName);
              setTagName('');
              load();
            }}
            style={[styles.btn, { backgroundColor: colors.accent }]}
          >
            <Text style={{ color: colors.fabText, fontFamily: fonts.semiBold }}>
              {ar.add}
            </Text>
          </Pressable>
          <TextInput
            value={tagName}
            onChangeText={setTagName}
            placeholder={ar.tagName}
            placeholderTextColor={colors.textMuted}
            textAlign="right"
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: colors.surface,
                borderColor: colors.border,
                fontFamily: fonts.regular,
              },
            ]}
          />
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => `${item.kind}-${item.item.id}`}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text
            style={{
              textAlign: 'center',
              color: colors.brand,
              fontFamily: fonts.regular,
              marginTop: 24,
            }}
          >
            {ar.emptyFolders}
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onLongPress={() => {
              Alert.alert(
                item.kind === 'folder' ? item.item.name : `#${item.item.name}`,
                undefined,
                [
                  {
                    text: ar.delete,
                    style: 'destructive',
                    onPress: async () => {
                      if (item.kind === 'folder') {
                        await foldersRepo.deleteFolder(item.item.id);
                      } else {
                        await tagsRepo.deleteTag(item.item.id);
                      }
                      load();
                    },
                  },
                  { text: ar.cancel, style: 'cancel' },
                ]
              );
            }}
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
              {item.kind === 'folder'
                ? item.item.name
                : `#${item.item.name}`}
            </Text>
            <Text
              style={{
                color: colors.textMuted,
                fontFamily: fonts.regular,
                fontSize: 12,
                textAlign: 'right',
                marginTop: 4,
              }}
            >
              {item.kind === 'folder'
                ? `${item.count} ملاحظة`
                : ar.tags}
            </Text>
          </Pressable>
        )}
      />
    </Atmosphere>
  );
}

const styles = StyleSheet.create({
  form: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  label: {
    textAlign: 'right',
    marginBottom: 6,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row-reverse',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    writingDirection: 'rtl',
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  list: {
    padding: 16,
    paddingBottom: 40,
    gap: 10,
  },
  card: {
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
});

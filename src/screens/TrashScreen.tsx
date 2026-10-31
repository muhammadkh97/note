import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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

export function TrashScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [notes, setNotes] = useState<NoteWithPreview[]>([]);

  const load = useCallback(async () => {
    setNotes(await notesRepo.listTrashNotes());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const purgeAll = () => {
    Alert.alert(ar.purgeAll, ar.confirmPurgeAll, [
      {
        text: ar.purgeAll,
        style: 'destructive',
        onPress: async () => {
          await notesRepo.purgeAllTrash();
          load();
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
        right={
          notes.length > 0 ? (
            <Pressable onPress={purgeAll}>
              <Text
                style={{
                  color: colors.danger,
                  fontFamily: fonts.medium,
                  fontSize: 12,
                }}
              >
                {ar.purgeAll}
              </Text>
            </Pressable>
          ) : null
        }
      />
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text
            style={{
              textAlign: 'center',
              color: colors.brand,
              fontFamily: fonts.regular,
              marginTop: 48,
            }}
          >
            {ar.emptyTrash}
          </Text>
        }
        renderItem={({ item }) => (
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
              {item.title.trim() || item.preview || ar.untitled}
            </Text>
            <Text
              numberOfLines={2}
              style={{
                color: colors.textMuted,
                fontFamily: fonts.regular,
                fontSize: 13,
                textAlign: 'right',
                marginTop: 4,
              }}
            >
              {item.preview}
            </Text>
            <View style={styles.actions}>
              <Pressable
                onPress={() => {
                  Alert.alert(ar.purge, ar.confirmPurge, [
                    {
                      text: ar.purge,
                      style: 'destructive',
                      onPress: async () => {
                        await notesRepo.purgeNote(item.id);
                        load();
                      },
                    },
                    { text: ar.cancel, style: 'cancel' },
                  ]);
                }}
                style={[styles.actionBtn, { backgroundColor: colors.danger }]}
              >
                <Text
                  style={{
                    color: '#fff',
                    fontFamily: fonts.medium,
                    fontSize: 12,
                  }}
                >
                  {ar.purge}
                </Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  await notesRepo.restoreNote(item.id);
                  load();
                }}
                style={[styles.actionBtn, { backgroundColor: colors.accent }]}
              >
                <Text
                  style={{
                    color: colors.fabText,
                    fontFamily: fonts.medium,
                    fontSize: 12,
                  }}
                >
                  {ar.restore}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </Atmosphere>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
});

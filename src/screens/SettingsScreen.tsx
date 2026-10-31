import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Atmosphere } from '../components/Atmosphere';
import { ScreenHeader } from '../components/ScreenHeader';
import * as notesRepo from '../db/notesRepo';
import * as foldersRepo from '../db/foldersRepo';
import * as tagsRepo from '../db/tagsRepo';
import { parseBlocks } from '../types/note';
import { ThemeMode } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/fonts';
import { ar } from '../i18n/ar';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;
const modes: { id: ThemeMode; label: string; symbol: string }[] = [
  { id: 'light', label: ar.themeLight, symbol: '☼' },
  { id: 'dark', label: ar.themeDark, symbol: '☾' },
  { id: 'system', label: ar.themeSystem, symbol: '◐' },
];

export function SettingsScreen({ navigation }: Props) {
  const { colors, mode, setMode } = useTheme();
  const [exporting, setExporting] = useState(false);

  const exportBackup = async () => {
    Alert.alert(ar.backup, ar.backupPrivacy, [
      { text: ar.cancel, style: 'cancel' },
      {
        text: ar.continue,
        onPress: async () => {
          setExporting(true);
          try {
            const [active, trash, folders, tags] = await Promise.all([
              notesRepo.listActiveNotes(),
              notesRepo.listTrashNotes(),
              foldersRepo.listFolders(),
              tagsRepo.listTags(),
            ]);
            const notes = [...active, ...trash].map((note) => ({
              id: note.id,
              title: note.title,
              blocks: parseBlocks(note.blocksJson),
              color: note.color,
              pinned: note.pinned === 1,
              folderId: note.folderId,
              folderName: folders.find((folder) => folder.id === note.folderId)?.name ?? null,
              tags: note.tags.map((tag) => tag.name),
              createdAt: new Date(note.createdAt).toISOString(),
              updatedAt: new Date(note.updatedAt).toISOString(),
              deletedAt: note.deletedAt ? new Date(note.deletedAt).toISOString() : null,
            }));
            const payload = {
              app: 'Nota',
              formatVersion: 1,
              exportedAt: new Date().toISOString(),
              folders: folders.map(({ id, name }) => ({ id, name })),
              tags: tags.map(({ id, name }) => ({ id, name })),
              notes,
            };
            await Share.share({ title: ar.backup, message: JSON.stringify(payload, null, 2) });
          } catch {
            Alert.alert(ar.error, ar.backupError);
          } finally {
            setExporting(false);
          }
        },
      },
    ]);
  };

  return (
    <Atmosphere>
      <ScreenHeader title={ar.settings} onBack={() => navigation.goBack()} />
      <View style={styles.body}>
        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.semiBold }]}>{ar.appearance}</Text>
        <Text style={[styles.sectionNote, { color: colors.textMuted, fontFamily: fonts.regular }]}>{ar.theme}</Text>
        <View style={[styles.modeGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {modes.map((item) => {
            const active = mode === item.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                onPress={() => setMode(item.id)}
                style={[styles.mode, { backgroundColor: active ? colors.accent : 'transparent', borderColor: active ? colors.accent : 'transparent' }]}
              >
                <Text style={[styles.modeGlyph, { color: active ? colors.fabText : colors.textMuted }]}>{item.symbol}</Text>
                <Text style={{ color: active ? colors.fabText : colors.text, fontFamily: fonts.medium, fontSize: 12 }}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, styles.backupHeading, { color: colors.text, fontFamily: fonts.semiBold }]}>{ar.backup}</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHead}>
            <View style={[styles.cardIcon, { backgroundColor: colors.accentSoft }]}><Text style={{ color: colors.accent, fontSize: 20 }}>↥</Text></View>
            <View style={styles.cardTitleBlock}>
              <Text style={[styles.cardTitle, { color: colors.text, fontFamily: fonts.semiBold }]}>{ar.exportBackup}</Text>
              <Text style={[styles.cardBody, { color: colors.textMuted, fontFamily: fonts.regular }]}>{ar.backupNote}</Text>
            </View>
          </View>
          <Pressable disabled={exporting} onPress={exportBackup} style={[styles.exportButton, { backgroundColor: colors.accent, opacity: exporting ? 0.65 : 1 }]}>
            {exporting ? <ActivityIndicator color={colors.fabText} size="small" /> : <Text style={{ color: colors.fabText, fontFamily: fonts.semiBold }}>{ar.exportBackup}</Text>}
          </Pressable>
        </View>

        <View style={[styles.privacyCard, { backgroundColor: colors.accentSoft }]}>
          <Text style={[styles.privacyTitle, { color: colors.accent, fontFamily: fonts.semiBold }]}>{ar.localFirst}</Text>
          <Text style={[styles.privacyText, { color: colors.text, fontFamily: fonts.regular }]}>{ar.privacyNote}</Text>
        </View>
        <Text style={[styles.brand, { color: colors.textMuted, fontFamily: fonts.regular }]}>{ar.brand} · com.smartnotes.app</Text>
      </View>
    </Atmosphere>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 18, paddingTop: 7 },
  sectionTitle: { textAlign: 'right', fontSize: 18 },
  sectionNote: { textAlign: 'right', marginTop: 2, marginBottom: 10, fontSize: 12 },
  modeGroup: { flexDirection: 'row-reverse', borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 5, gap: 4 },
  mode: { flex: 1, minHeight: 66, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  modeGlyph: { fontSize: 17 },
  backupHeading: { marginTop: 25, marginBottom: 10 },
  card: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 15 },
  cardHead: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 11 },
  cardIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardTitleBlock: { flex: 1, alignItems: 'flex-end' },
  cardTitle: { fontSize: 14 },
  cardBody: { textAlign: 'right', fontSize: 12, lineHeight: 20, marginTop: 5 },
  exportButton: { minHeight: 44, borderRadius: 12, marginTop: 14, alignItems: 'center', justifyContent: 'center' },
  privacyCard: { borderRadius: 16, padding: 15, marginTop: 15 },
  privacyTitle: { textAlign: 'right', fontSize: 14 },
  privacyText: { textAlign: 'right', fontSize: 12, lineHeight: 20, marginTop: 5 },
  brand: { fontSize: 11, textAlign: 'center', marginTop: 24 },
});

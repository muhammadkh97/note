import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Atmosphere } from '../components/Atmosphere';
import { NoteCard } from '../components/NoteCard';
import { ScreenHeader } from '../components/ScreenHeader';
import * as notesRepo from '../db/notesRepo';
import { NoteWithPreview } from '../types/note';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/fonts';
import { ar } from '../i18n/ar';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

export function SearchScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NoteWithPreview[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const numColumns = width >= 900 ? 3 : 2;

  useEffect(() => {
    let active = true;
    const term = query.trim();
    if (!term) return () => { active = false; };
    const handle = setTimeout(() => {
      notesRepo.searchNotes(term)
        .then((items) => { if (active) setResults(items); })
        .catch(() => { if (active) { setResults([]); setSearchError(true); } })
        .finally(() => { if (active) setSearching(false); });
    }, 240);
    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [query]);

  return (
    <Atmosphere>
      <ScreenHeader title={ar.search} onBack={() => navigation.goBack()} />
      <View style={styles.searchWrap}>
        <Text style={[styles.searchIcon, { color: colors.accent }]}>⌕</Text>
        <TextInput
          value={query}
          onChangeText={(value) => {
            setQuery(value);
            setSearching(Boolean(value.trim()));
            setSearchError(false);
            if (!value.trim()) setResults([]);
          }}
          placeholder={ar.searchPlaceholder}
          placeholderTextColor={colors.textMuted}
          textAlign="right"
          autoFocus
          returnKeyType="search"
          accessibilityLabel={ar.searchPlaceholder}
          style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border, fontFamily: fonts.regular }]}
        />
        {searching ? (
          <ActivityIndicator size="small" color={colors.accent} style={styles.trailing} />
        ) : query.length > 0 ? (
          <Pressable accessibilityRole="button" accessibilityLabel={ar.clearSearch} onPress={() => { setQuery(''); setResults([]); setSearching(false); setSearchError(false); }} hitSlop={10} style={styles.trailing}>
            <Text style={{ color: colors.textMuted, fontSize: 20 }}>×</Text>
          </Pressable>
        ) : null}
      </View>
      {query.trim().length > 0 && !searching && !searchError ? (
        <Text style={[styles.resultCount, { color: colors.textMuted, fontFamily: fonts.regular }]}>
          {results.length} {ar.searchResults}
        </Text>
      ) : null}
      <FlatList
        data={searching ? [] : (query.trim() ? results : [])}
        key={numColumns}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.column}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          query.trim() ? (
            <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.emptyIcon, { color: colors.accent }]}>{searching ? '…' : searchError ? '!' : '⌕'}</Text>
              <Text style={[styles.emptyText, { color: colors.textMuted, fontFamily: fonts.regular }]}>
                {searchError ? ar.searchError : searching ? ar.searching : ar.emptySearch}
              </Text>
            </View>
          ) : (
            <View style={styles.tip}>
              <Text style={[styles.tipText, { color: colors.textMuted, fontFamily: fonts.regular }]}>{ar.searchTip}</Text>
            </View>
          )
        }
        renderItem={({ item, index }) => (
          <View style={{ flex: 1 / numColumns, paddingHorizontal: 6 }}>
            <NoteCard note={item} index={index} onPress={() => navigation.navigate('Editor', { noteId: item.id })} />
          </View>
        )}
      />
    </Atmosphere>
  );
}

const styles = StyleSheet.create({
  searchWrap: { flexDirection: 'row-reverse', alignItems: 'center', marginHorizontal: 16, marginBottom: 8 },
  searchIcon: { position: 'absolute', zIndex: 1, end: 13, fontSize: 25 },
  input: { flex: 1, minHeight: 50, borderRadius: 15, paddingStart: 44, paddingEnd: 46, paddingVertical: 11, borderWidth: StyleSheet.hairlineWidth, writingDirection: 'rtl', fontSize: 14 },
  trailing: { position: 'absolute', start: 14, zIndex: 1, minWidth: 24, alignItems: 'center' },
  resultCount: { textAlign: 'right', marginHorizontal: 18, marginBottom: 6, fontSize: 11 },
  list: { paddingHorizontal: 10, paddingBottom: 40, flexGrow: 1 },
  column: { gap: 0 },
  empty: { alignItems: 'center', borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, margin: 8, padding: 25 },
  emptyIcon: { fontSize: 26, marginBottom: 5 },
  emptyText: { textAlign: 'center', fontSize: 13 },
  tip: { alignItems: 'center', padding: 24 },
  tipText: { fontSize: 13, textAlign: 'center' },
});

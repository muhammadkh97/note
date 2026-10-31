import React, { useEffect, useState } from 'react';
import {
  FlatList,
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
  const numColumns = width >= 700 ? 3 : 2;

  useEffect(() => {
    const handle = setTimeout(() => {
      notesRepo.searchNotes(query).then(setResults);
    }, 180);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <Atmosphere>
      <ScreenHeader
        title={ar.search}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={ar.searchPlaceholder}
          placeholderTextColor={colors.textMuted}
          textAlign="right"
          autoFocus
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
      <FlatList
        data={results}
        key={numColumns}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          query.trim() ? (
            <Text
              style={{
                textAlign: 'center',
                color: colors.brand,
                fontFamily: fonts.regular,
                marginTop: 40,
              }}
            >
              {ar.emptySearch}
            </Text>
          ) : (
            <View />
          )
        }
        columnWrapperStyle={{}}
        renderItem={({ item, index }) => (
          <View style={{ flex: 1 / numColumns, paddingHorizontal: 6 }}>
            <NoteCard
              note={item}
              index={index}
              onPress={() =>
                navigation.navigate('Editor', { noteId: item.id })
              }
            />
          </View>
        )}
      />
    </Atmosphere>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
    writingDirection: 'rtl',
    fontSize: 15,
  },
  list: {
    paddingHorizontal: 10,
    paddingBottom: 40,
  },
});

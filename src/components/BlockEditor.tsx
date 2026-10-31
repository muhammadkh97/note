import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import React from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  ChecklistBlock,
  ChecklistItem,
  NoteBlock,
} from '../types/note';
import { newId } from '../utils/id';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/fonts';
import { ar } from '../i18n/ar';

type Props = {
  blocks: NoteBlock[];
  onChange: (blocks: NoteBlock[]) => void;
};

export function BlockEditor({ blocks, onChange }: Props) {
  const { colors } = useTheme();

  const updateBlock = (id: string, next: NoteBlock) => {
    onChange(blocks.map((b) => (b.id === id ? next : b)));
  };

  const removeBlock = (id: string) => {
    if (blocks.length <= 1) return;
    onChange(blocks.filter((b) => b.id !== id));
  };

  const addText = () => {
    onChange([...blocks, { id: newId(), type: 'text', text: '' }]);
  };

  const addChecklist = () => {
    const block: ChecklistBlock = {
      id: newId(),
      type: 'checklist',
      items: [{ id: newId(), text: '', checked: false }],
    };
    onChange([...blocks, block]);
  };

  const addImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(ar.permissionRequired, ar.photoPermissionNote);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
      });
      if (result.canceled || !result.assets[0]) return;
      onChange([
        ...blocks,
        {
          id: newId(),
          type: 'image',
          uri: result.assets[0].uri,
        },
      ]);
    } catch {
      Alert.alert(ar.error, ar.photoPickerError);
    }
  };

  const updateChecklistItem = (
    block: ChecklistBlock,
    itemId: string,
    patch: Partial<ChecklistItem>
  ) => {
    updateBlock(block.id, {
      ...block,
      items: block.items.map((i) =>
        i.id === itemId ? { ...i, ...patch } : i
      ),
    });
  };

  return (
    <View style={styles.root}>
      {blocks.map((block) => (
        <View
          key={block.id}
          style={[
            styles.block,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {block.type === 'text' ? (
            <TextInput
              value={block.text}
              onChangeText={(text) => updateBlock(block.id, { ...block, text })}
              placeholder={ar.textPlaceholder}
              placeholderTextColor={colors.textMuted}
              multiline
              textAlign="right"
              style={[
                styles.textInput,
                { color: colors.text, fontFamily: fonts.regular },
              ]}
            />
          ) : null}

          {block.type === 'checklist' ? (
            <View style={styles.checklist}>
              {block.items.map((item) => (
                <View key={item.id} style={styles.checkRow}>
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityLabel={item.text || ar.checklistItem}
                    accessibilityState={{ checked: item.checked }}
                    onPress={() =>
                      updateChecklistItem(block, item.id, {
                        checked: !item.checked,
                      })
                    }
                    style={[
                      styles.checkbox,
                      {
                        borderColor: colors.accent,
                        backgroundColor: item.checked
                          ? colors.accent
                          : 'transparent',
                      },
                    ]}
                  />
                  <TextInput
                    value={item.text}
                    onChangeText={(text) =>
                      updateChecklistItem(block, item.id, { text })
                    }
                    placeholder={ar.checklistItem}
                    placeholderTextColor={colors.textMuted}
                    textAlign="right"
                    style={[
                      styles.checkInput,
                      {
                        color: colors.text,
                        fontFamily: fonts.regular,
                        textDecorationLine: item.checked
                          ? 'line-through'
                          : 'none',
                        opacity: item.checked ? 0.55 : 1,
                      },
                    ]}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={ar.removeChecklistItem}
                    disabled={block.items.length <= 1}
                    onPress={() => updateBlock(block.id, {
                      ...block,
                      items: block.items.filter((entry) => entry.id !== item.id),
                    })}
                    style={[styles.removeItem, { opacity: block.items.length <= 1 ? 0.35 : 1 }]}
                  >
                    <Text style={{ color: colors.danger, fontSize: 18 }}>×</Text>
                  </Pressable>
                </View>
              ))}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={ar.addChecklist}
                onPress={() =>
                  updateBlock(block.id, {
                    ...block,
                    items: [
                      ...block.items,
                      { id: newId(), text: '', checked: false },
                    ],
                  })
                }
              >
                <Text
                  style={[
                    styles.addItem,
                    { color: colors.accent, fontFamily: fonts.medium },
                  ]}
                >
                  + عنصر
                </Text>
              </Pressable>
            </View>
          ) : null}

          {block.type === 'image' ? (
            <View>
              <Image
                source={{ uri: block.uri }}
                style={styles.image}
                contentFit="cover"
              />
              <TextInput
                value={block.caption ?? ''}
                onChangeText={(caption) =>
                  updateBlock(block.id, { ...block, caption })
                }
                placeholder="تعليق…"
                placeholderTextColor={colors.textMuted}
                textAlign="right"
                style={[
                  styles.caption,
                  { color: colors.textMuted, fontFamily: fonts.regular },
                ]}
              />
            </View>
          ) : null}

          {blocks.length > 1 ? (
            <Pressable accessibilityRole="button" accessibilityLabel={ar.removeBlock} onPress={() => removeBlock(block.id)}>
              <Text
                style={[
                  styles.remove,
                  { color: colors.danger, fontFamily: fonts.medium },
                ]}
              >
                إزالة الكتلة
              </Text>
            </Pressable>
          ) : null}
        </View>
      ))}

      <View style={styles.toolbar}>
        {[
          { label: ar.addText, onPress: addText },
          { label: ar.addChecklist, onPress: addChecklist },
          { label: ar.addImage, onPress: addImage },
        ].map((action) => (
          <Pressable
            key={action.label}
            onPress={action.onPress}
            style={[
              styles.toolBtn,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={{
                color: colors.accent,
                fontFamily: fonts.semiBold,
                fontSize: 13,
              }}
            >
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 12,
  },
  block: {
    borderRadius: 16,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  textInput: {
    minHeight: 88,
    fontSize: 16,
    lineHeight: 26,
    writingDirection: 'rtl',
    textAlignVertical: 'top',
  },
  checklist: {
    gap: 8,
  },
  checkRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
  },
  removeItem: { width: 28, height: 32, alignItems: 'center', justifyContent: 'center' },
  checkInput: {
    flex: 1,
    fontSize: 15,
    writingDirection: 'rtl',
    paddingVertical: 4,
  },
  addItem: {
    textAlign: 'right',
    marginTop: 4,
    fontSize: 13,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  caption: {
    marginTop: 8,
    fontSize: 13,
    writingDirection: 'rtl',
  },
  remove: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'right',
  },
  toolbar: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  toolBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
});

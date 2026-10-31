export type BlockType = 'text' | 'checklist' | 'image';

export type ChecklistItem = {
  id: string;
  text: string;
  checked: boolean;
};

export type TextBlock = {
  id: string;
  type: 'text';
  text: string;
};

export type ChecklistBlock = {
  id: string;
  type: 'checklist';
  items: ChecklistItem[];
};

export type ImageBlock = {
  id: string;
  type: 'image';
  uri: string;
  caption?: string;
};

export type NoteBlock = TextBlock | ChecklistBlock | ImageBlock;

export type NoteColor =
  | 'default'
  | 'mist'
  | 'sage'
  | 'sand'
  | 'ink'
  | 'coral'
  | 'sky';

export type Note = {
  id: string;
  title: string;
  blocksJson: string;
  color: NoteColor;
  pinned: number;
  folderId: string | null;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
};

export type NoteWithPreview = Note & {
  preview: string;
  tags: Tag[];
};

export type Folder = {
  id: string;
  name: string;
  createdAt: number;
};

export type Tag = {
  id: string;
  name: string;
  createdAt: number;
};

export const NOTE_COLORS: Record<
  NoteColor,
  { light: string; dark: string; label: string }
> = {
  default: { light: '#E8F0EE', dark: '#1A2A28', label: 'افتراضي' },
  mist: { light: '#D7E8E4', dark: '#1E3330', label: 'ضباب' },
  sage: { light: '#DCE8D6', dark: '#243028', label: 'مريمية' },
  sand: { light: '#EDE4D4', dark: '#2C281F', label: 'رمل' },
  ink: { light: '#D5DEE8', dark: '#1C2430', label: 'حبر' },
  coral: { light: '#F0D8D4', dark: '#302220', label: 'مرجاني' },
  sky: { light: '#D4E4F0', dark: '#1C2834', label: 'سماء' },
};

export function parseBlocks(json: string): NoteBlock[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function blocksToPreview(blocks: NoteBlock[]): string {
  for (const block of blocks) {
    if (block.type === 'text' && block.text.trim()) {
      return block.text.trim().slice(0, 120);
    }
    if (block.type === 'checklist') {
      const item = block.items.find((i) => i.text.trim());
      if (item) return item.text.trim().slice(0, 120);
    }
    if (block.type === 'image') return '📷 صورة';
  }
  return '';
}

export function blocksToPlainText(blocks: NoteBlock[]): string {
  return blocks
    .map((block) => {
      if (block.type === 'text') return block.text;
      if (block.type === 'checklist') {
        return block.items
          .map((i) => `${i.checked ? '✓' : '○'} ${i.text}`)
          .join('\n');
      }
      if (block.type === 'image') return block.caption || '[صورة]';
      return '';
    })
    .filter(Boolean)
    .join('\n\n');
}

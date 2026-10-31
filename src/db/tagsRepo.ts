import { Tag } from '../types/note';
import { newId } from '../utils/id';
import { getDb } from './database';

type TagRow = {
  id: string;
  name: string;
  created_at: number;
};

function mapTag(row: TagRow): Tag {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  };
}

export async function listTags(): Promise<Tag[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<TagRow>(
    'SELECT * FROM tags ORDER BY name COLLATE NOCASE'
  );
  return rows.map(mapTag);
}

export async function createTag(name: string): Promise<Tag> {
  const db = await getDb();
  const trimmed = name.trim().replace(/^#/, '');
  const existing = await db.getFirstAsync<TagRow>(
    'SELECT * FROM tags WHERE name = ? COLLATE NOCASE',
    trimmed
  );
  if (existing) return mapTag(existing);

  const tag: Tag = {
    id: newId(),
    name: trimmed,
    createdAt: Date.now(),
  };
  await db.runAsync(
    'INSERT INTO tags (id, name, created_at) VALUES (?, ?, ?)',
    tag.id,
    tag.name,
    tag.createdAt
  );
  return tag;
}

export async function deleteTag(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM note_tags WHERE tag_id = ?', id);
  await db.runAsync('DELETE FROM tags WHERE id = ?', id);
}

export async function getOrCreateTagsByNames(names: string[]): Promise<Tag[]> {
  const result: Tag[] = [];
  for (const name of names) {
    if (!name.trim()) continue;
    result.push(await createTag(name));
  }
  return result;
}

import { Tag, blocksToPlainText, parseBlocks } from '../types/note';
import { newId } from '../utils/id';
import { getDb, rebuildFtsForNote } from './database';
import { getNote } from './notesRepo';

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


export async function renameTag(id: string, name: string): Promise<void> {
  const db = await getDb();
  const trimmed = name.trim().replace(/^#/, '');
  if (!trimmed) throw new Error('Tag name cannot be empty');
  const duplicate = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM tags WHERE name = ? COLLATE NOCASE AND id != ?',
    trimmed,
    id
  );
  if (duplicate) throw new Error('Tag name already exists');
  await db.runAsync('UPDATE tags SET name = ? WHERE id = ?', trimmed, id);
  const noteIds = await db.getAllAsync<{ note_id: string }>(
    'SELECT note_id FROM note_tags WHERE tag_id = ?', id
  );
  for (const { note_id } of noteIds) {
    const note = await getNote(note_id);
    if (!note) continue;
    const tags = await db.getAllAsync<{ name: string }>(
      `SELECT t.name FROM tags t
       INNER JOIN note_tags nt ON nt.tag_id = t.id
       WHERE nt.note_id = ? ORDER BY t.name COLLATE NOCASE`, note_id
    );
    await rebuildFtsForNote(
      db,
      note.id,
      note.title,
      blocksToPlainText(parseBlocks(note.blocksJson)),
      tags.map((tag) => tag.name).join(' ')
    );
  }
}

export async function countNotesForTag(id: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(DISTINCT n.id) AS c FROM notes n
     INNER JOIN note_tags nt ON nt.note_id = n.id
     WHERE nt.tag_id = ? AND n.deleted_at IS NULL`,
    id
  );
  return row?.c ?? 0;
}

export async function deleteTag(id: string): Promise<void> {
  const db = await getDb();
  const affectedNotes = await db.getAllAsync<{ note_id: string }>(
    'SELECT note_id FROM note_tags WHERE tag_id = ?', id
  );
  await db.runAsync('DELETE FROM note_tags WHERE tag_id = ?', id);
  await db.runAsync('DELETE FROM tags WHERE id = ?', id);
  for (const { note_id } of affectedNotes) {
    const note = await getNote(note_id);
    if (!note) continue;
    const remainingTags = await db.getAllAsync<{ name: string }>(
      `SELECT t.name FROM tags t
       INNER JOIN note_tags nt ON nt.tag_id = t.id
       WHERE nt.note_id = ? ORDER BY t.name COLLATE NOCASE`, note_id
    );
    await rebuildFtsForNote(
      db,
      note.id,
      note.title,
      blocksToPlainText(parseBlocks(note.blocksJson)),
      remainingTags.map((tag) => tag.name).join(' ')
    );
  }
}

export async function getOrCreateTagsByNames(names: string[]): Promise<Tag[]> {
  const result: Tag[] = [];
  for (const name of names) {
    if (!name.trim()) continue;
    result.push(await createTag(name));
  }
  return result;
}

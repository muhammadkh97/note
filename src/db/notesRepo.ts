import {
  Note,
  NoteBlock,
  NoteColor,
  NoteWithPreview,
  Tag,
  blocksToPlainText,
  blocksToPreview,
  parseBlocks,
} from '../types/note';
import { newId } from '../utils/id';
import { getDb, rebuildFtsForNote, removeFtsForNote } from './database';

type NoteRow = {
  id: string;
  title: string;
  blocks_json: string;
  color: string;
  pinned: number;
  folder_id: string | null;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
};

function mapNote(row: NoteRow): Note {
  return {
    id: row.id,
    title: row.title,
    blocksJson: row.blocks_json,
    color: row.color as NoteColor,
    pinned: row.pinned,
    folderId: row.folder_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

async function tagsForNote(noteId: string): Promise<Tag[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    created_at: number;
  }>(
    `SELECT t.id, t.name, t.created_at
     FROM tags t
     INNER JOIN note_tags nt ON nt.tag_id = t.id
     WHERE nt.note_id = ?
     ORDER BY t.name COLLATE NOCASE`,
    noteId
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    createdAt: r.created_at,
  }));
}

async function withPreview(note: Note): Promise<NoteWithPreview> {
  const blocks = parseBlocks(note.blocksJson);
  const tags = await tagsForNote(note.id);
  return {
    ...note,
    preview: blocksToPreview(blocks) || note.title || 'ملاحظة فارغة',
    tags,
  };
}

async function syncFts(note: Note): Promise<void> {
  const db = await getDb();
  const blocks = parseBlocks(note.blocksJson);
  const tags = await tagsForNote(note.id);
  await rebuildFtsForNote(
    db,
    note.id,
    note.title,
    blocksToPlainText(blocks),
    tags.map((t) => t.name).join(' ')
  );
}

export async function listActiveNotes(
  folderId?: string | null
): Promise<NoteWithPreview[]> {
  const db = await getDb();
  let rows: NoteRow[];
  if (folderId) {
    rows = await db.getAllAsync<NoteRow>(
      `SELECT * FROM notes
       WHERE deleted_at IS NULL AND folder_id = ?
       ORDER BY pinned DESC, updated_at DESC`,
      folderId
    );
  } else {
    rows = await db.getAllAsync<NoteRow>(
      `SELECT * FROM notes
       WHERE deleted_at IS NULL
       ORDER BY pinned DESC, updated_at DESC`
    );
  }
  return Promise.all(rows.map((r) => withPreview(mapNote(r))));
}

export async function listTrashNotes(): Promise<NoteWithPreview[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<NoteRow>(
    `SELECT * FROM notes
     WHERE deleted_at IS NOT NULL
     ORDER BY deleted_at DESC`
  );
  return Promise.all(rows.map((r) => withPreview(mapNote(r))));
}

export async function getNote(id: string): Promise<NoteWithPreview | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<NoteRow>(
    'SELECT * FROM notes WHERE id = ?',
    id
  );
  if (!row) return null;
  return withPreview(mapNote(row));
}

export async function createNote(partial?: {
  title?: string;
  blocks?: NoteBlock[];
  color?: NoteColor;
  folderId?: string | null;
}): Promise<NoteWithPreview> {
  const db = await getDb();
  const now = Date.now();
  const blocks = partial?.blocks ?? [
    { id: newId(), type: 'text' as const, text: '' },
  ];
  const note: Note = {
    id: newId(),
    title: partial?.title ?? '',
    blocksJson: JSON.stringify(blocks),
    color: partial?.color ?? 'default',
    pinned: 0,
    folderId: partial?.folderId ?? null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  await db.runAsync(
    `INSERT INTO notes
      (id, title, blocks_json, color, pinned, folder_id, created_at, updated_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    note.id,
    note.title,
    note.blocksJson,
    note.color,
    note.pinned,
    note.folderId,
    note.createdAt,
    note.updatedAt
  );
  await syncFts(note);
  return withPreview(note);
}

export async function updateNote(
  id: string,
  patch: {
    title?: string;
    blocks?: NoteBlock[];
    color?: NoteColor;
    pinned?: number;
    folderId?: string | null;
  }
): Promise<NoteWithPreview | null> {
  const existing = await getNote(id);
  if (!existing) return null;
  const db = await getDb();
  const updated: Note = {
    ...existing,
    title: patch.title ?? existing.title,
    blocksJson: patch.blocks
      ? JSON.stringify(patch.blocks)
      : existing.blocksJson,
    color: patch.color ?? existing.color,
    pinned: patch.pinned ?? existing.pinned,
    folderId:
      patch.folderId !== undefined ? patch.folderId : existing.folderId,
    updatedAt: Date.now(),
  };
  await db.runAsync(
    `UPDATE notes SET
      title = ?, blocks_json = ?, color = ?, pinned = ?, folder_id = ?, updated_at = ?
     WHERE id = ?`,
    updated.title,
    updated.blocksJson,
    updated.color,
    updated.pinned,
    updated.folderId,
    updated.updatedAt,
    id
  );
  await syncFts(updated);
  return withPreview(updated);
}

export async function softDeleteNote(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE notes SET deleted_at = ?, updated_at = ? WHERE id = ?',
    Date.now(),
    Date.now(),
    id
  );
}

export async function restoreNote(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE notes SET deleted_at = NULL, updated_at = ? WHERE id = ?',
    Date.now(),
    id
  );
}

export async function purgeNote(id: string): Promise<void> {
  const db = await getDb();
  await removeFtsForNote(db, id);
  await db.runAsync('DELETE FROM notes WHERE id = ?', id);
}

export async function purgeAllTrash(): Promise<void> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string }>(
    'SELECT id FROM notes WHERE deleted_at IS NOT NULL'
  );
  for (const row of rows) {
    await removeFtsForNote(db, row.id);
  }
  await db.runAsync('DELETE FROM notes WHERE deleted_at IS NOT NULL');
}

export async function togglePin(id: string): Promise<void> {
  const note = await getNote(id);
  if (!note) return;
  await updateNote(id, { pinned: note.pinned ? 0 : 1 });
}

export async function setNoteTags(
  noteId: string,
  tagIds: string[]
): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM note_tags WHERE note_id = ?', noteId);
  for (const tagId of tagIds) {
    await db.runAsync(
      'INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)',
      noteId,
      tagId
    );
  }
  const note = await getNote(noteId);
  if (note) await syncFts(note);
}

export async function searchNotes(query: string): Promise<NoteWithPreview[]> {
  const trimmed = query.trim();
  if (!trimmed) return listActiveNotes();
  const db = await getDb();
  // Escape FTS special chars loosely; wrap tokens for prefix match
  const safe = trimmed.replace(/["*]/g, ' ').trim();
  if (!safe) return [];
  const ftsQuery = safe
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => `"${t}"*`)
    .join(' AND ');

  let rows: NoteRow[] = [];
  try {
    rows = await db.getAllAsync<NoteRow>(
      `SELECT n.* FROM notes n
       INNER JOIN notes_fts f ON f.note_id = n.id
       WHERE n.deleted_at IS NULL AND f MATCH ?
       ORDER BY n.pinned DESC, n.updated_at DESC`,
      ftsQuery
    );
  } catch {
    // Fallback LIKE search if FTS query fails
    const like = `%${safe}%`;
    rows = await db.getAllAsync<NoteRow>(
      `SELECT * FROM notes
       WHERE deleted_at IS NULL
         AND (title LIKE ? OR blocks_json LIKE ?)
       ORDER BY pinned DESC, updated_at DESC`,
      like,
      like
    );
  }
  return Promise.all(rows.map((r) => withPreview(mapNote(r))));
}

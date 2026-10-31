import { Folder } from '../types/note';
import { newId } from '../utils/id';
import { getDb } from './database';

type FolderRow = {
  id: string;
  name: string;
  created_at: number;
};

function mapFolder(row: FolderRow): Folder {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  };
}

export async function listFolders(): Promise<Folder[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<FolderRow>(
    'SELECT * FROM folders ORDER BY name COLLATE NOCASE'
  );
  return rows.map(mapFolder);
}

export async function createFolder(name: string): Promise<Folder> {
  const db = await getDb();
  const folder: Folder = {
    id: newId(),
    name: name.trim(),
    createdAt: Date.now(),
  };
  await db.runAsync(
    'INSERT INTO folders (id, name, created_at) VALUES (?, ?, ?)',
    folder.id,
    folder.name,
    folder.createdAt
  );
  return folder;
}

export async function renameFolder(id: string, name: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE folders SET name = ? WHERE id = ?', name.trim(), id);
}

export async function deleteFolder(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE notes SET folder_id = NULL WHERE folder_id = ?',
    id
  );
  await db.runAsync('DELETE FROM folders WHERE id = ?', id);
}

export async function countNotesInFolder(id: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) as c FROM notes
     WHERE folder_id = ? AND deleted_at IS NULL`,
    id
  );
  return row?.c ?? 0;
}

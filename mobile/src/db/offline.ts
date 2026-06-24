/**
 * SIN-Objetos Mobile — Banco de dados local (SQLite) para modo offline
 * Armazena vistorias, fotos e checklists para sincronização posterior
 */

import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('sinobjetos_offline.db');
    await initDB(db);
  }
  return db;
}

async function initDB(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS pending_checkins (
      id TEXT PRIMARY KEY,
      objeto_id TEXT NOT NULL,
      medicao_id TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      timestamp TEXT NOT NULL,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS pending_checklist_updates (
      id TEXT PRIMARY KEY,
      vistoria_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      atestado INTEGER NOT NULL,
      observacao TEXT,
      timestamp TEXT NOT NULL,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS pending_fotos (
      id TEXT PRIMARY KEY,
      vistoria_id TEXT NOT NULL,
      checklist_item_id TEXT,
      uri TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      timestamp_servidor TEXT,
      hash_local TEXT,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS pending_finalizacoes (
      id TEXT PRIMARY KEY,
      vistoria_id TEXT NOT NULL,
      resultado TEXT NOT NULL,
      observacoes TEXT,
      timestamp TEXT NOT NULL,
      synced INTEGER DEFAULT 0
    );
  `);
}

// ---------------------------------------------------------------------------
// Check-in offline
// ---------------------------------------------------------------------------
export async function salvarCheckinOffline(payload: {
  id: string;
  objeto_id: string;
  medicao_id?: string;
  latitude: number;
  longitude: number;
}): Promise<void> {
  const database = await getDB();
  await database.runAsync(
    'INSERT INTO pending_checkins (id, objeto_id, medicao_id, latitude, longitude, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
    [payload.id, payload.objeto_id, payload.medicao_id ?? null, payload.latitude, payload.longitude, new Date().toISOString()]
  );
}

// ---------------------------------------------------------------------------
// Foto offline
// ---------------------------------------------------------------------------
export async function salvarFotoOffline(payload: {
  id: string;
  vistoria_id: string;
  checklist_item_id?: string;
  uri: string;
  latitude?: number;
  longitude?: number;
  timestamp_servidor?: string;
  hash_local?: string;
}): Promise<void> {
  const database = await getDB();
  await database.runAsync(
    `INSERT INTO pending_fotos (id, vistoria_id, checklist_item_id, uri, latitude, longitude, timestamp_servidor, hash_local)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.id, payload.vistoria_id, payload.checklist_item_id ?? null,
      payload.uri, payload.latitude ?? null, payload.longitude ?? null,
      payload.timestamp_servidor ?? null, payload.hash_local ?? null,
    ]
  );
}

// ---------------------------------------------------------------------------
// Listar pendentes
// ---------------------------------------------------------------------------
export async function getPendentes(): Promise<{
  checkins: any[];
  fotos: any[];
  checklists: any[];
  finalizacoes: any[];
}> {
  const database = await getDB();
  const [checkins, fotos, checklists, finalizacoes] = await Promise.all([
    database.getAllAsync('SELECT * FROM pending_checkins WHERE synced = 0'),
    database.getAllAsync('SELECT * FROM pending_fotos WHERE synced = 0'),
    database.getAllAsync('SELECT * FROM pending_checklist_updates WHERE synced = 0'),
    database.getAllAsync('SELECT * FROM pending_finalizacoes WHERE synced = 0'),
  ]);
  return { checkins, fotos, checklists, finalizacoes };
}

export async function marcarSincronizado(tabela: string, id: string): Promise<void> {
  const database = await getDB();
  await database.runAsync(`UPDATE ${tabela} SET synced = 1 WHERE id = ?`, [id]);
}

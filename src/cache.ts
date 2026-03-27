/**
 * CCASS SQLite 缓存层
 * 提供数据持久化和历史查询能力
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import type { HoldingRecord, DailyHoldingsRow, FetchLogRow } from './types/index.js';

const DB_PATH = path.join(import.meta.dirname, '..', 'data', 'ccass.db');

let db: Database.Database | null = null;

/**
 * 初始化数据库（创建表、WAL 模式）
 */
function initDatabase(): Database.Database {
  if (db) return db;

  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // 创建表
  db.exec(`
    CREATE TABLE IF NOT EXISTS stocks (
      code TEXT PRIMARY KEY,
      name TEXT,
      last_updated INTEGER
    );

    CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY,
      name TEXT,
      address TEXT,
      last_updated INTEGER
    );

    CREATE TABLE IF NOT EXISTS daily_holdings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stock_code TEXT NOT NULL,
      participant_id TEXT NOT NULL,
      date TEXT NOT NULL,
      shareholding INTEGER NOT NULL,
      percentage TEXT,
      rank INTEGER,
      fetch_time INTEGER NOT NULL,
      UNIQUE(stock_code, participant_id, date)
    );

    CREATE TABLE IF NOT EXISTS fetch_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stock_code TEXT NOT NULL,
      date TEXT NOT NULL,
      participant_id TEXT,
      fetch_time INTEGER NOT NULL,
      success INTEGER NOT NULL,
      error TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_holdings_stock_date
      ON daily_holdings(stock_code, date);
    CREATE INDEX IF NOT EXISTS idx_holdings_participant
      ON daily_holdings(participant_id);
    CREATE INDEX IF NOT EXISTS idx_holdings_stock_participant_date
      ON daily_holdings(stock_code, participant_id, date);
    CREATE INDEX IF NOT EXISTS idx_fetch_log_stock_date
      ON fetch_log(stock_code, date);
  `);

  return db;
}

/**
 * 获取单条持仓记录（缓存读取）
 */
function getHolding(stockCode: string, participantId: string, date: string): DailyHoldingsRow | null {
  const database = initDatabase();
  const row = database
    .prepare(
      `SELECT * FROM daily_holdings
       WHERE stock_code = ? AND participant_id = ? AND date = ?
       LIMIT 1`
    )
    .get(stockCode, participantId, date) as DailyHoldingsRow | undefined;
  return row || null;
}

/**
 * 批量获取某股票某参与者在日期范围内的所有记录
 */
function getRange(stockCode: string, participantId: string, startDate: string, endDate: string): DailyHoldingsRow[] {
  const database = initDatabase();
  const rows = database
    .prepare(
      `SELECT * FROM daily_holdings
       WHERE stock_code = ? AND participant_id = ? AND date >= ? AND date <= ?
       ORDER BY date ASC`
    )
    .all(stockCode, participantId, startDate, endDate) as DailyHoldingsRow[];
  return rows;
}

/**
 * 获取某日某股票的全部参与者记录（含排名）
 */
function getParticipants(stockCode: string, date: string): DailyHoldingsRow[] {
  const database = initDatabase();
  const rows = database
    .prepare(
      `SELECT * FROM daily_holdings
       WHERE stock_code = ? AND date = ?
       ORDER BY rank ASC`
    )
    .all(stockCode, date) as DailyHoldingsRow[];
  return rows;
}

/**
 * 存储单条持仓记录（UPSERT）
 */
function setHolding(record: HoldingRecord): void {
  const database = initDatabase();
  const now = Date.now();
  database
    .prepare(
      `INSERT INTO daily_holdings
         (stock_code, participant_id, date, shareholding, percentage, rank, fetch_time)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(stock_code, participant_id, date)
       DO UPDATE SET
         shareholding = excluded.shareholding,
         percentage = excluded.percentage,
         rank = excluded.rank,
         fetch_time = excluded.fetch_time`
    )
    .run(
      record.stockCode,
      record.participantId,
      record.date,
      record.shareholding,
      record.percentage,
      record.rank,
      now
    );
}

/**
 * 批量存储持仓记录
 */
function setHoldings(records: HoldingRecord[]): void {
  const database = initDatabase();
  const insert = database.prepare(
    `INSERT INTO daily_holdings
       (stock_code, participant_id, date, shareholding, percentage, rank, fetch_time)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(stock_code, participant_id, date)
     DO UPDATE SET
       shareholding = excluded.shareholding,
       percentage = excluded.percentage,
       rank = excluded.rank,
       fetch_time = excluded.fetch_time`
  );

  const now = Date.now();
  const insertMany = database.transaction((recs: HoldingRecord[]) => {
    for (const r of recs) {
      insert.run(r.stockCode, r.participantId, r.date, r.shareholding, r.percentage, r.rank, now);
    }
  });
  insertMany(records);
}

/**
 * 记录抓取日志
 */
function setFetchLog(stockCode: string, date: string, participantId: string | null, success: boolean, error: string | null): void {
  const database = initDatabase();
  database
    .prepare(
      `INSERT INTO fetch_log (stock_code, date, participant_id, fetch_time, success, error)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(stockCode, date, participantId || null, Date.now(), success ? 1 : 0, error || null);
}

/**
 * 查询某股票某日的抓取日志（检查是否已有成功记录）
 */
function getFetchLog(stockCode: string, date: string): FetchLogRow | null {
  const database = initDatabase();
  const row = database
    .prepare(
      `SELECT * FROM fetch_log
       WHERE stock_code = ? AND date = ? AND success = 1
       ORDER BY fetch_time DESC LIMIT 1`
    )
    .get(stockCode, date) as FetchLogRow | undefined;
  return row || null;
}

/**
 * 获取历史持仓记录（用于信号计算）
 */
function getHistory(stockCode: string, participantId: string, days: number = 30): DailyHoldingsRow[] {
  const database = initDatabase();
  const rows = database
    .prepare(
      `SELECT * FROM daily_holdings
       WHERE stock_code = ? AND participant_id = ?
       ORDER BY date DESC
       LIMIT ?`
    )
    .all(stockCode, participantId, days) as DailyHoldingsRow[];
  return rows;
}

/**
 * 获取某日某股票的平均日成交量（估算，用持仓变化代替）
 */
function getAvgDailyVolume(stockCode: string, participantId: string, days: number = 30): number {
  const records = getRangeForAvg(stockCode, participantId, days);
  if (records.length < 2) return 0;

  let totalChange = 0;
  for (let i = 0; i < records.length - 1; i++) {
    totalChange += Math.abs(records[i].shareholding - records[i + 1].shareholding);
  }
  return Math.round(totalChange / (records.length - 1));
}

function getRangeForAvg(stockCode: string, participantId: string, days: number): Array<{ shareholding: number }> {
  const database = initDatabase();
  return database
    .prepare(
      `SELECT shareholding FROM daily_holdings
       WHERE stock_code = ? AND participant_id = ?
       ORDER BY date DESC LIMIT ?`
    )
    .all(stockCode, participantId, days) as Array<{ shareholding: number }>;
}

export {
  initDatabase,
  getHolding,
  getRange,
  getParticipants,
  setHolding,
  setHoldings,
  setFetchLog,
  getFetchLog,
  getHistory,
  getAvgDailyVolume,
};

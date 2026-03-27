/**
 * CCASS Monitor 类型定义
 */

// ============ 数据库相关类型 ============

export interface HoldingRecord {
  id?: number;
  stockCode: string;
  participantId: string;
  date: string;
  shareholding: number;
  percentage: string | null;
  rank: number | null;
  fetchTime: number;
}

export interface DailyHoldingsRow {
  id: number;
  stock_code: string;
  participant_id: string;
  date: string;
  shareholding: number;
  percentage: string | null;
  rank: number | null;
  fetch_time: number;
}

export interface Participant {
  id: string;
  name: string;
  address: string;
  shareholding: number;
  percentage: string;
}

export interface StockInfo {
  code: string;
  name: string;
  lastUpdated: number;
}

export interface FetchLogRow {
  id: number;
  stock_code: string;
  date: string;
  participant_id: string | null;
  fetch_time: number;
  success: number;
  error: string | null;
}

// ============ 配置相关类型 ============

export interface SignalWeights {
  positionChangeScore: number;
  momentumScore: number;
  volumeWeightScore: number;
  rankingShiftScore: number;
}

export interface SignalThresholds {
  strongBuy: number;
  buy: number;
  sell: number;
  strongSell: number;
}

export interface AlertConfig {
  minConfidence: number;
  minVolumeRatio: number;
  rankShiftThreshold: number;
}

export interface FetchConfig {
  retryCount: number;
  retryDelayMs: number;
  rateLimitMs: number;
}

export interface StockNames {
  [key: string]: string;
}

export interface Config {
  signal: {
    weights: SignalWeights;
    thresholds: SignalThresholds;
  };
  defaults: {
    participant: string;
    windowDays: number;
  };
  alert: AlertConfig;
  fetch: FetchConfig;
  stockNames: StockNames;
}

// ============ 信号相关类型 ============

export interface RawDataStats {
  mean: number;
  std: number;
  maxIncrease: { value: number; date: string };
  maxDecrease: { value: number; date: string };
  lastChange: { value: number; date: string };
  percentileOfLastChange: number;
  totalDays: number;
}

export interface RawData {
  deltas: Array<{ date: string; change: number; shareholding: number }>;
  stats: RawDataStats;
  current: {
    shareholding: number;
    date: string;
  };
}

export interface Anomaly {
  detected: boolean;
  zScore: number;
  magnitude: 'extreme' | 'significant' | 'notable' | 'normal';
  isHistoricalMax: boolean;
  isMaxIncrease: boolean;
  isMaxDecrease: boolean;
}

export interface ShortTermSignal {
  signal: 'STRONG_BUY' | 'BUY' | 'SELL' | 'STRONG_SELL' | 'HOLD';
  consecutiveDays: number;
  direction: '增持' | '减持' | '持平';
  momentum3d: number;
  deltas: Array<{ date: string; change: number }>;
}

export interface MediumTermSignal {
  signal: 'STRONG_BUY' | 'BUY' | 'SELL' | 'STRONG_SELL' | 'HOLD';
  trend: 'increasing' | 'decreasing' | 'neutral' | 'insufficient_data';
  change7d: number;
  change7dPct: number;
  change30d: number;
  change30dPct: number;
  sma7d: number;
  currentVsSma: number;
  daysAnalyzed: number;
}

export interface SignalIndicators {
  positionChangeScore: number;
  momentumScore: number;
  volumeWeightScore: number;
  rankingShiftScore: number;
}

export interface SignalResult {
  stockCode: string;
  participantId: string;
  date: string;
  rawData: RawData;
  anomaly: Anomaly;
  shortTerm: ShortTermSignal;
  mediumTerm: MediumTermSignal;
  signal: 'STRONG_BUY' | 'BUY' | 'SELL' | 'STRONG_SELL' | 'HOLD';
  confidence: number;
  score: number;
  summary: string;
  generatedAt: number;
  error?: string;
  indicators?: SignalIndicators;
}

// ============ 告警相关类型 ============

export type AlertType = 'STRONG_ACCUMULATION' | 'STRONG_DISTRIBUTION' | 'RANK_UP' | 'RANK_DOWN';
export type AlertAction = 'CONSIDER_BUY' | 'CONSIDER_SELL' | 'HOLD';

export interface Alert {
  alertId: string;
  type: AlertType;
  stockCode: string;
  stockName: string;
  participantId: string;
  participantName: string;
  date: string;
  confidence: number;
  summary: string;
  indicators: SignalIndicators;
  action: AlertAction;
}

export interface WatchlistStock {
  code: string;
  name?: string;
  participants?: string[];
}

export interface Watchlist {
  stocks: WatchlistStock[];
  globalParticipants?: string[];
}

// ============ 多日分析相关类型 ============

export interface WindowDataPoint {
  date: string;
  shareholding: number;
  delta: number;
  sma: number;
  percentage: string | null;
}

export interface WindowSummary {
  currentHolding: number;
  sma: number;
  currentVsSma: number;
  momentum: number;
  trend: 'increasing' | 'decreasing' | 'neutral';
  totalChange: number;
  totalChangePct: number;
  rank: number | null;
}

export interface WindowAnalysis {
  stockCode: string;
  participantId: string;
  windowDays: number;
  data: WindowDataPoint[];
  summary: WindowSummary;
}

// ============ HTTP 请求相关类型 ============

export interface HttpResponse {
  status: number;
  data: string;
  headers: Record<string, string | string[] | undefined>;
}

export interface CCASSParticipant {
  id: string;
  name: string;
  address: string;
  shareholding: number;
  percentage: string;
}

export interface CCASSResult {
  stockName?: string;
  participants: CCASSParticipant[];
}

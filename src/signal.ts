/**
 * CCASS 交易信号引擎
 * 综合多指标打分，生成买入/卖出/持有信号
 * 包含：异常检测、短期/中期信号分离、完整原始数据
 */

import * as cache from './cache.js';
import { getThresholds } from './config.js';
import * as fetcher from './fetcher.js';
import type {
  SignalResult,
  RawData,
  Anomaly,
  ShortTermSignal,
  MediumTermSignal,
  SignalIndicators,
  DailyHoldingsRow,
} from './types/index.js';

/**
 * 生成交易信号主入口
 */
async function generateSignal(stockCode: string, participantId: string): Promise<SignalResult> {
  // 获取 30 天历史数据
  let history = cache.getHistory(stockCode, participantId, 30);

  // 数据不足时自动抓取
  if (history.length < 7) {
    const windowDays = 30;
    const now = new Date();
    const endDate = formatDate(now);
    const startDate = formatDateNTradingDaysAgo(now, windowDays - 1);

    await fetcher.fetchRange(stockCode, participantId, startDate, endDate);
    history = cache.getHistory(stockCode, participantId, 30);
  }

  if (history.length === 0) {
    return {
      stockCode,
      participantId,
      date: '',
      rawData: { deltas: [], stats: {} as RawData['stats'], current: { shareholding: 0, date: '' } },
      anomaly: { detected: false, zScore: 0, magnitude: 'normal', isHistoricalMax: false, isMaxIncrease: false, isMaxDecrease: false },
      shortTerm: { signal: 'HOLD', consecutiveDays: 0, direction: '持平', momentum3d: 0, deltas: [] },
      mediumTerm: { signal: 'HOLD', trend: 'insufficient_data', change7d: 0, change7dPct: 0, change30d: 0, change30dPct: 0, sma7d: 0, currentVsSma: 0, daysAnalyzed: 0 },
      signal: 'HOLD',
      confidence: 0,
      score: 0,
      summary: '',
      generatedAt: Date.now(),
      error: 'No data available',
    };
  }

  // ===== 1. 原始数据与统计分析 =====
  const rawData = analyzeRawData(history);

  // ===== 2. 异常检测 =====
  const anomaly = detectAnomaly(history, rawData);

  // ===== 3. 短期信号 (1-5天) =====
  const shortTerm = computeShortTermSignal(history);

  // ===== 4. 中期信号 (7-30天) =====
  const mediumTerm = computeMediumTermSignal(history);

  // ===== 5. 综合信号（兼容旧接口）=====
  const composite = computeCompositeSignal(shortTerm, mediumTerm, anomaly, rawData);

  return {
    stockCode,
    participantId,
    date: history[0].date,
    rawData,
    anomaly,
    shortTerm,
    mediumTerm,
    signal: composite.signal,
    confidence: composite.confidence,
    score: composite.score,
    summary: composite.summary,
    generatedAt: Date.now(),
    indicators: composite.indicators,
  };
}

/**
 * 分析原始数据，返回统计信息
 */
function analyzeRawData(history: DailyHoldingsRow[]): RawData {
  // 计算每日变化量
  const deltas: Array<{ date: string; change: number; shareholding: number }> = [];
  for (let i = 0; i < history.length - 1; i++) {
    deltas.push({
      date: history[i].date,
      change: history[i].shareholding - history[i + 1].shareholding,
      shareholding: history[i].shareholding,
    });
  }

  // 统计计算
  const changes = deltas.map((d) => d.change);
  const mean = changes.reduce((a, b) => a + b, 0) / changes.length;
  const variance = changes.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / changes.length;
  const std = Math.sqrt(variance);

  // 排序找最大/最小
  const sorted = [...changes].sort((a, b) => b - a);
  const maxIncrease = sorted[0];
  const maxDecrease = sorted[sorted.length - 1];

  // 最新一天的变化
  const lastChange = deltas[0]?.change || 0;
  const lastChangeDate = deltas[0]?.date || '';

  // 计算最新变化的历史百分位
  const percentile = (changes.filter((c) => Math.abs(c) <= Math.abs(lastChange)).length / changes.length) * 100;

  // 最大增幅的日期
  const maxIncreaseDate = deltas.find((d) => d.change === maxIncrease)?.date || '';
  const maxDecreaseDate = deltas.find((d) => d.change === maxDecrease)?.date || '';

  return {
    deltas,
    stats: {
      mean: Math.round(mean),
      std: Math.round(std),
      maxIncrease: { value: maxIncrease, date: maxIncreaseDate },
      maxDecrease: { value: maxDecrease, date: maxDecreaseDate },
      lastChange: { value: lastChange, date: lastChangeDate },
      percentileOfLastChange: Math.round(percentile),
      totalDays: history.length,
    },
    current: {
      shareholding: history[0].shareholding,
      date: history[0].date,
    },
  };
}

/**
 * 异常检测：单日变化是否异常
 */
function detectAnomaly(history: DailyHoldingsRow[], rawData: RawData): Anomaly {
  const { stats } = rawData;
  const lastChange = stats.lastChange.value;
  const { mean, std } = stats;

  if (std === 0) {
    return { detected: false, zScore: 0, magnitude: 'normal', isHistoricalMax: false, isMaxIncrease: false, isMaxDecrease: false };
  }

  const zScore = (lastChange - mean) / std;
  const absZScore = Math.abs(zScore);

  // 判断是否为历史最大单日增幅/减幅
  const isHistoricalMax = Math.abs(lastChange) >= Math.abs(stats.maxIncrease.value) ||
    Math.abs(lastChange) >= Math.abs(stats.maxDecrease.value);

  let magnitude: Anomaly['magnitude'];
  if (absZScore >= 3) magnitude = 'extreme';
  else if (absZScore >= 2) magnitude = 'significant';
  else if (absZScore >= 1.5) magnitude = 'notable';
  else magnitude = 'normal';

  return {
    detected: absZScore >= 2,
    zScore: parseFloat(zScore.toFixed(2)),
    magnitude,
    isHistoricalMax,
    isMaxIncrease: lastChange > 0 && isHistoricalMax,
    isMaxDecrease: lastChange < 0 && isHistoricalMax,
  };
}

/**
 * 短期信号计算（1-5天）
 */
function computeShortTermSignal(history: DailyHoldingsRow[]): ShortTermSignal {
  const recent5 = history.slice(0, Math.min(5, history.length));

  // 计算近5日变化
  const deltas5d: number[] = [];
  for (let i = 0; i < recent5.length - 1; i++) {
    deltas5d.push(recent5[i].shareholding - recent5[i + 1].shareholding);
  }

  // 连续同向天数
  let consecutive = 0;
  let direction: 1 | -1 | 0 = 0;
  if (deltas5d.length > 0) {
    direction = deltas5d[0] > 0 ? 1 : deltas5d[0] < 0 ? -1 : 0;
    consecutive = 1;
    for (let i = 1; i < deltas5d.length; i++) {
      if ((deltas5d[i] > 0 && direction === 1) || (deltas5d[i] < 0 && direction === -1)) {
        consecutive++;
      } else {
        break;
      }
    }
  }

  // 3日动量
  const deltas3d = deltas5d.slice(0, 3);
  const positive3d = deltas3d.filter((d) => d > 0).length;
  const negative3d = deltas3d.filter((d) => d < 0).length;
  let momentum3d = 0;
  if (positive3d > negative3d) momentum3d = positive3d / 3;
  else if (negative3d > positive3d) momentum3d = -negative3d / 3;

  // 短期信号判断
  let signal: ShortTermSignal['signal'] = 'HOLD';
  if (consecutive >= 3 && direction === 1) signal = 'STRONG_BUY';
  else if (consecutive >= 2 && direction === 1) signal = 'BUY';
  else if (consecutive >= 3 && direction === -1) signal = 'STRONG_SELL';
  else if (consecutive >= 2 && direction === -1) signal = 'SELL';

  return {
    signal,
    consecutiveDays: consecutive,
    direction: direction === 1 ? '增持' : direction === -1 ? '减持' : '持平',
    momentum3d: parseFloat(momentum3d.toFixed(2)),
    deltas: deltas5d.map((d, i) => ({
      date: recent5[i].date,
      change: d,
    })),
  };
}

/**
 * 中期信号计算（7-30天）
 */
function computeMediumTermSignal(history: DailyHoldingsRow[]): MediumTermSignal {
  const recent7 = history.slice(0, 7);
  const recent30 = history;

  if (recent7.length < 2) {
    return { signal: 'HOLD', trend: 'insufficient_data', change7d: 0, change7dPct: 0, change30d: 0, change30dPct: 0, sma7d: 0, currentVsSma: 0, daysAnalyzed: 0 };
  }

  const first7 = recent7[recent7.length - 1];
  const last7 = recent7[0];
  const change7d = last7.shareholding - first7.shareholding;
  const change7dPct = first7.shareholding > 0 ? (change7d / first7.shareholding * 100) : 0;

  // 30天变化（如果有）
  const first30 = recent30[recent30.length - 1];
  const last30 = recent30[0];
  const change30d = last30.shareholding - first30.shareholding;
  const change30dPct = first30.shareholding > 0 ? (change30d / first30.shareholding * 100) : 0;

  // 趋势计算（线性回归斜率）
  const trend = computeTrend(recent7.map((r) => r.shareholding));

  // SMA
  const sma7 = Math.round(recent7.reduce((a, b) => a + b.shareholding, 0) / recent7.length);
  const currentVsSma = ((last7.shareholding / sma7 - 1) * 100);

  // 中期信号判断
  let signal: MediumTermSignal['signal'] = 'HOLD';
  if (change7dPct > 2) signal = 'BUY';
  else if (change7dPct > 5) signal = 'STRONG_BUY';
  else if (change7dPct < -2) signal = 'SELL';
  else if (change7dPct < -5) signal = 'STRONG_SELL';

  return {
    signal,
    trend,
    change7d: change7d,
    change7dPct: parseFloat(String(change7dPct)),
    change30d: change30d,
    change30dPct: parseFloat(String(change30dPct)),
    sma7d: sma7,
    currentVsSma: parseFloat(String(currentVsSma)),
    daysAnalyzed: Math.min(7, recent30.length),
  };
}

/**
 * 计算线性回归趋势
 */
function computeTrend(values: number[]): 'increasing' | 'decreasing' | 'neutral' {
  if (values.length < 2) return 'neutral';

  const n = values.length;
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const avgY = sumY / n;
  const normalizedSlope = avgY !== 0 ? slope / avgY : 0;

  if (normalizedSlope > 0.01) return 'increasing';
  if (normalizedSlope < -0.01) return 'decreasing';
  return 'neutral';
}

/**
 * 综合信号计算
 */
function computeCompositeSignal(
  shortTerm: ShortTermSignal,
  mediumTerm: MediumTermSignal,
  anomaly: Anomaly,
  rawData: RawData
): { signal: SignalResult['signal']; confidence: number; score: number; summary: string; indicators: SignalIndicators } {
  let signal: SignalResult['signal'] = 'HOLD';
  let score = 0;
  let confidence = 0;

  const indicators: SignalIndicators = {
    positionChangeScore: 0,
    momentumScore: 0,
    volumeWeightScore: 0,
    rankingShiftScore: 0,
  };

  // 异常信号权重最高
  if (anomaly.detected && anomaly.magnitude === 'extreme') {
    score = anomaly.zScore * 0.3;
    confidence = 0.9;
    indicators.positionChangeScore = anomaly.zScore * 0.3;
  } else if (anomaly.detected && anomaly.magnitude === 'significant') {
    score = anomaly.zScore * 0.25;
    confidence = 0.75;
    indicators.positionChangeScore = anomaly.zScore * 0.25;
  } else if (anomaly.detected && anomaly.magnitude === 'notable') {
    score = anomaly.zScore * 0.2;
    confidence = 0.6;
    indicators.positionChangeScore = anomaly.zScore * 0.2;
  }

  // 短期信号
  const shortTermWeight: Record<string, number> = { STRONG_BUY: 0.3, BUY: 0.2, SELL: -0.2, STRONG_SELL: -0.3 };
  if (shortTermWeight[shortTerm.signal]) {
    score += shortTermWeight[shortTerm.signal];
    indicators.momentumScore = shortTermWeight[shortTerm.signal];
    confidence = Math.max(confidence, 0.5);
  }

  // 中期信号
  if (mediumTerm.trend === 'increasing') {
    score += 0.15;
    indicators.volumeWeightScore = 0.15;
  } else if (mediumTerm.trend === 'decreasing') {
    score -= 0.15;
    indicators.volumeWeightScore = -0.15;
  }

  // 综合判断
  const thresholds = getThresholds();
  if (score > thresholds.strongBuy) signal = 'STRONG_BUY';
  else if (score > thresholds.buy) signal = 'BUY';
  else if (score < thresholds.strongSell) signal = 'STRONG_SELL';
  else if (score < thresholds.sell) signal = 'SELL';
  else signal = 'HOLD';

  // 生成摘要
  const summary = generateSummary(shortTerm, mediumTerm, anomaly, rawData, signal);

  return {
    signal,
    confidence: parseFloat(Math.min(confidence, 1).toFixed(2)),
    score: parseFloat(score.toFixed(4)),
    summary,
    indicators,
  };
}

/**
 * 生成中文摘要
 */
function generateSummary(
  shortTerm: ShortTermSignal,
  mediumTerm: MediumTermSignal,
  anomaly: Anomaly,
  rawData: RawData,
  _signal: SignalResult['signal']
): string {
  const current = rawData.current.shareholding;
  const lastChange = rawData.stats.lastChange;
  const stats = rawData.stats;

  const parts: string[] = [];

  // 异常描述
  if (anomaly.detected) {
    const direction = anomaly.zScore > 0 ? '增持' : '减持';
    if (anomaly.isHistoricalMax) {
      parts.push(`创${anomaly.zScore > 0 ? '最大' : '最小'}单日${direction}，Z-score=${anomaly.zScore}`);
    } else {
      parts.push(`单日${direction}异常，Z-score=${anomaly.zScore}`);
    }
  } else {
    const changeDesc = lastChange.value > 0 ? `+${lastChange.value.toLocaleString()}` : lastChange.value.toLocaleString();
    parts.push(`日变化: ${changeDesc} (历史${stats.percentileOfLastChange}%百分位)`);
  }

  // 短期描述
  if (shortTerm.consecutiveDays >= 2) {
    parts.push(`连续${shortTerm.consecutiveDays}日${shortTerm.direction}`);
  }

  // 中期描述
  if (mediumTerm.daysAnalyzed >= 7) {
    const trendDesc = mediumTerm.change7dPct > 0 ? `+${mediumTerm.change7dPct}%` : `${mediumTerm.change7dPct}%`;
    parts.push(`7日${trendDesc}，趋势${mediumTerm.trend === 'increasing' ? '上升' : mediumTerm.trend === 'decreasing' ? '下降' : '平稳'}`);
  }

  parts.push(`当前持仓: ${current.toLocaleString()}`);

  return parts.join(' | ');
}

/**
 * 批量生成信号（多个参与者）
 */
async function generateSignalsForParticipants(stockCode: string, participantIds: string[]): Promise<SignalResult[]> {
  const results: SignalResult[] = [];
  for (const pid of participantIds) {
    const signal = await generateSignal(stockCode, pid);
    if (!signal.error) {
      results.push(signal);
    }
  }
  return results;
}

/**
 * 格式化日期为 YYYY/MM/DD
 */
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}

/**
 * 获取 N 个交易日前的日期
 */
function formatDateNTradingDaysAgo(date: Date, n: number): string {
  const result = new Date(date);
  let count = 0;
  while (count < n) {
    result.setDate(result.getDate() - 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) {
      count++;
    }
  }
  return formatDate(result);
}

export {
  generateSignal,
  generateSignalsForParticipants,
};

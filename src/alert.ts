/**
 * CCASS 告警引擎
 * 基于信号结果和 watchlist 生成智能告警
 */

import fs from 'fs';
import * as signal from './signal.js';
import { getAlertConfig } from './config.js';
import * as cache from './cache.js';
import * as progress from './progress.js';
import type { Alert, Watchlist, WatchlistStock, AlertType, AlertAction, SignalResult } from './types/index.js';

/**
 * 加载并验证 watchlist 文件
 */
function loadWatchlist(filePath: string): Watchlist {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Watchlist file not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content) as Watchlist;

  // 验证结构
  if (!data.stocks || !Array.isArray(data.stocks)) {
    throw new Error('Invalid watchlist: stocks array is required');
  }

  return data;
}

/**
 * 检查所有监控标的
 */
async function checkAll(watchlist: Watchlist): Promise<Alert[]> {
  const alertConfig = getAlertConfig();
  const alerts: Alert[] = [];

  for (let i = 0; i < watchlist.stocks.length; i++) {
    const stock = watchlist.stocks[i];
    const stockName = stock.name || stock.code;

    // 输出进度
    progress.showStockProgress(stock.code, stockName, i + 1, watchlist.stocks.length);

    const participantIds = [
      ...(stock.participants || []),
      ...(watchlist.globalParticipants || []),
    ];

    // 去重
    const uniqueParticipants = [...new Set(participantIds)];

    for (const pid of uniqueParticipants) {
      try {
        const signalResult = await signal.generateSignal(stock.code, pid);

        if (signalResult.error) continue;
        if (signalResult.confidence < alertConfig.minConfidence) continue;

        // 多指标告警检测
        const alertType = detectAlertType(signalResult, alertConfig);
        if (alertType) {
          const alert = generateAlert(alertType, stock, pid, signalResult);
          alerts.push(alert);
        }
      } catch (err) {
        // 单个参与者失败不影响其他
        console.error(`告警检查失败 ${stock.code} ${pid}: ${(err as Error).message}`);
      }
    }
  }

  return alerts;
}

/**
 * 检测告警类型
 */
function detectAlertType(signalResult: SignalResult, _alertConfig: ReturnType<typeof getAlertConfig>): AlertType | null {
  const { positionChangeScore = 0, momentumScore = 0 } = signalResult.indicators || {};

  // 强烈积累信号：持仓变化 + 动量同时正向
  if (positionChangeScore > 0.5 && momentumScore > 0.5) {
    return 'STRONG_ACCUMULATION';
  }

  // 强烈分配信号：持仓变化 + 动量同时负向
  if (positionChangeScore < -0.5 && momentumScore < -0.5) {
    return 'STRONG_DISTRIBUTION';
  }

  // 单指标极端值
  if (positionChangeScore > 0.8 || momentumScore > 0.8) {
    return 'STRONG_ACCUMULATION';
  }

  if (positionChangeScore < -0.8 || momentumScore < -0.8) {
    return 'STRONG_DISTRIBUTION';
  }

  return null;
}

/**
 * 量价过滤
 */
function _filterByVolume(change: number, avgVolume: number, alertConfig: ReturnType<typeof getAlertConfig>): boolean {
  if (avgVolume === 0) return false;
  const ratio = Math.abs(change) / avgVolume;
  return ratio >= alertConfig.minVolumeRatio;
}

/**
 * 排名位移检测
 */
async function detectRankShift(stockCode: string, date: string, participantId: string, alertConfig: ReturnType<typeof getAlertConfig>): Promise<'RANK_UP' | 'RANK_DOWN' | null> {
  const participants = await cache.getParticipants(stockCode, date);
  const currentRank = participants.find((p) => p.participant_id === participantId)?.rank;

  if (!currentRank) return null;

  const history = await cache.getHistory(stockCode, participantId, 7);
  let totalRank = 0;
  let count = 0;

  for (const record of history) {
    const pts = await cache.getParticipants(stockCode, record.date);
    const rank = pts.find((p) => p.participant_id === participantId)?.rank;
    if (rank) {
      totalRank += rank;
      count++;
    }
  }

  if (count === 0) return null;

  const avgRank = totalRank / count;
  const shift = Math.abs(avgRank - currentRank);

  if (shift >= alertConfig.rankShiftThreshold) {
    return currentRank < avgRank ? 'RANK_UP' : 'RANK_DOWN';
  }

  return null;
}

/**
 * 生成告警 JSON
 */
function generateAlert(type: AlertType, stock: WatchlistStock, participantId: string, signalResult: SignalResult): Alert {
  const participantName = participantId === 'C00019' ? '汇丰' : participantId;

  const actionMap: Record<AlertType, AlertAction> = {
    STRONG_ACCUMULATION: 'CONSIDER_BUY',
    STRONG_DISTRIBUTION: 'CONSIDER_SELL',
    RANK_UP: 'CONSIDER_BUY',
    RANK_DOWN: 'CONSIDER_SELL',
  };

  const typeSummaryMap: Record<AlertType, string> = {
    STRONG_ACCUMULATION: '机构强势积累',
    STRONG_DISTRIBUTION: '机构强势分配',
    RANK_UP: '排名上升',
    RANK_DOWN: '排名下降',
  };

  return {
    alertId: generateUUID(),
    type,
    stockCode: stock.code,
    stockName: stock.name || stock.code,
    participantId,
    participantName,
    date: signalResult.date,
    confidence: signalResult.confidence,
    summary: `${participantName}${typeSummaryMap[type]} ${stock.name || stock.code}，置信度 ${(signalResult.confidence * 100).toFixed(0)}%`,
    indicators: signalResult.indicators || {
      positionChangeScore: 0,
      momentumScore: 0,
      volumeWeightScore: 0,
      rankingShiftScore: 0,
    },
    action: actionMap[type] || 'HOLD',
  };
}

/**
 * 简单的 UUID 生成
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export {
  loadWatchlist,
  checkAll,
  detectRankShift,
  generateAlert,
};

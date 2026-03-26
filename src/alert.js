/**
 * CCASS 告警引擎
 * 基于信号结果和 watchlist 生成智能告警
 */

const fs = require('fs');
const signal = require('./signal');
const config = require('./config');

/**
 * 加载并验证 watchlist 文件
 */
function loadWatchlist(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Watchlist file not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);

  // 验证结构
  if (!data.stocks || !Array.isArray(data.stocks)) {
    throw new Error('Invalid watchlist: stocks array is required');
  }

  return data;
}

/**
 * 检查所有监控标的
 */
async function checkAll(watchlist) {
  const alertConfig = config.getAlertConfig();
  const alerts = [];

  for (const stock of watchlist.stocks) {
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
        console.error(`告警检查失败 ${stock.code} ${pid}: ${err.message}`);
      }
    }
  }

  return alerts;
}

/**
 * 检测告警类型
 */
function detectAlertType(signalResult, alertConfig) {
  const { positionChangeScore, momentumScore } = signalResult.indicators;

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
function filterByVolume(change, avgVolume, alertConfig) {
  if (avgVolume === 0) return false;
  const ratio = Math.abs(change) / avgVolume;
  return ratio >= alertConfig.minVolumeRatio;
}

/**
 * 排名位移检测
 */
async function detectRankShift(stockCode, date, participantId, alertConfig) {
  const cache = require('./cache');
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
function generateAlert(type, stock, participantId, signalResult) {
  const participantName = participantId === 'C00019' ? '汇丰' : participantId;

  const actionMap = {
    STRONG_ACCUMULATION: 'CONSIDER_BUY',
    STRONG_DISTRIBUTION: 'CONSIDER_SELL',
    RANK_UP: 'CONSIDER_BUY',
    RANK_DOWN: 'CONSIDER_SELL',
  };

  const typeSummaryMap = {
    STRONG_ACCUMULATION: '机构强势积累',
    STRONG_DISTRIBUTION: '机构强势分配',
    RANK_UP: '排名上升',
    RANK_DOWN: '排名下降',
  };

  return {
    alertId: generateUUID(),
    type,
    stockCode: stock.code,
    stockName: stock.name,
    participantId,
    participantName,
    date: signalResult.date,
    confidence: signalResult.confidence,
    summary: `${participantName}${typeSummaryMap[type]} ${stock.name}，置信度 ${(signalResult.confidence * 100).toFixed(0)}%`,
    indicators: signalResult.indicators,
    action: actionMap[type] || 'HOLD',
  };
}

/**
 * 简单的 UUID 生成
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

module.exports = {
  loadWatchlist,
  checkAll,
  detectRankShift,
  generateAlert,
};

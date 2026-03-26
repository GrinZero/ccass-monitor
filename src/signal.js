/**
 * CCASS 交易信号引擎
 * 综合多指标打分，生成买入/卖出/持有信号
 */

const cache = require('./cache');
const config = require('./config');
const multiDay = require('./multi-day');

/**
 * 生成交易信号主入口
 */
async function generateSignal(stockCode, participantId) {
  const weights = config.getWeights();
  const thresholds = config.getThresholds();

  // 获取 30 天历史数据用于 Z-score 计算
  const history = cache.getHistory(stockCode, participantId, 30);
  const recentData = history.slice(0, 7); // 最近 7 天

  if (recentData.length === 0) {
    return { error: 'No data available' };
  }

  const current = recentData[0];
  const prev = recentData[1] || recentData[0];

  // 计算各子分数
  const positionChangeScore = computePositionChangeScore(recentData, history);
  const momentumScore = computeMomentumScore(recentData);
  const volumeWeightScore = computeVolumeWeightScore(current, prev, stockCode, participantId);
  const rankingShiftScore = computeRankingShiftScore(stockCode, current.date, participantId, recentData);

  // 加权求和
  const score =
    weights.positionChangeScore * positionChangeScore +
    weights.momentumScore * momentumScore +
    weights.volumeWeightScore * volumeWeightScore +
    weights.rankingShiftScore * rankingShiftScore;

  // 确定信号方向
  const action = determineAction(score, thresholds);
  const confidence = computeConfidence([
    positionChangeScore,
    momentumScore,
    volumeWeightScore,
    rankingShiftScore,
  ]);

  return {
    stockCode,
    participantId,
    date: current.date,
    signal: action,
    confidence: parseFloat(confidence.toFixed(2)),
    score: parseFloat(score.toFixed(4)),
    indicators: {
      positionChangeScore: parseFloat(positionChangeScore.toFixed(4)),
      momentumScore: parseFloat(momentumScore.toFixed(4)),
      volumeWeightScore: parseFloat(volumeWeightScore.toFixed(4)),
      rankingShiftScore: parseFloat(rankingShiftScore.toFixed(4)),
    },
    summary: generateSummary(current, recentData, score, action, confidence),
    generatedAt: Date.now(),
  };
}

/**
 * 持仓变化 Z-score
 */
function computePositionChangeScore(recentData, history) {
  if (recentData.length < 2 || history.length < 3) {
    return 0;
  }

  const current = recentData[0];
  const prev = recentData[1];
  const currentChange = current.shareholding - prev.shareholding;

  // 计算历史变化均值和标准差
  const changes = [];
  for (let i = 0; i < history.length - 1; i++) {
    changes.push(history[i].shareholding - history[i + 1].shareholding);
  }

  if (changes.length < 3) return 0;

  const mean = changes.reduce((a, b) => a + b, 0) / changes.length;
  const variance = changes.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / changes.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return 0;

  const zScore = (currentChange - mean) / stdDev;
  return sigmoid(zScore); // 归一化到 -1~1
}

/**
 * 动量分数
 */
function computeMomentumScore(recentData) {
  if (recentData.length < 2) return 0;

  const deltas = [];
  for (let i = 1; i < recentData.length; i++) {
    deltas.push(recentData[i].shareholding - recentData[i - 1].shareholding);
  }

  const sameDirection = deltas.filter(
    (d, i) => i > 0 && d * deltas[i - 1] > 0
  ).length;

  // 连续同向天数
  let consecutive = 0;
  for (let i = 1; i < deltas.length; i++) {
    if (deltas[i] * deltas[i - 1] > 0) {
      consecutive++;
    } else {
      consecutive = 0;
    }
  }

  if (consecutive >= 6) return 1.0;
  if (consecutive >= 4) return 0.6;
  if (consecutive >= 2) return 0.3;

  // 总体同向比例
  const positive = deltas.filter((d) => d > 0).length;
  const negative = deltas.filter((d) => d < 0).length;

  if (positive > negative && positive >= 4) return 0.5;
  if (negative > positive && negative >= 4) return -0.5;

  return 0;
}

/**
 * 量价加权分数
 */
async function computeVolumeWeightScore(current, prev, stockCode, participantId) {
  const change = Math.abs(current.shareholding - prev.shareholding);
  const avgVolume = await cache.getAvgDailyVolume(stockCode, participantId, 30);

  if (avgVolume === 0) return 0;

  const ratio = change / avgVolume;

  // 超过日均成交 50% 认为是显著变化
  if (ratio > 0.5) return 0.8;
  if (ratio > 0.2) return 0.4;
  if (ratio > 0.05) return 0.1;
  if (ratio < -0.05) return -0.1;
  return 0;
}

/**
 * 排名位移分数
 */
async function computeRankingShiftScore(stockCode, date, participantId, recentData) {
  const participants = await cache.getParticipants(stockCode, date);
  if (participants.length === 0) return 0;

  const currentRank = participants.find((p) => p.participant_id === participantId)?.rank;
  if (!currentRank) return 0;

  // 计算 7 日平均排名
  let totalRank = 0;
  let count = 0;
  for (const record of recentData) {
    const participants = await cache.getParticipants(stockCode, record.date);
    const rank = participants.find((p) => p.participant_id === participantId)?.rank;
    if (rank) {
      totalRank += rank;
      count++;
    }
  }

  if (count === 0) return 0;

  const avgRank = totalRank / count;
  const shift = avgRank - currentRank; // 正数 = 排名上升

  if (shift >= 5) return 1.0;
  if (shift >= 3) return 0.6;
  if (shift >= 1) return 0.2;
  if (shift <= -5) return -1.0;
  if (shift <= -3) return -0.6;
  if (shift <= -1) return -0.2;

  return 0;
}

/**
 * Sigmoid 函数，将 Z-score 归一化到 -1~1
 */
function sigmoid(x) {
  const s = 1 / (1 + Math.exp(-x));
  return 2 * s - 1; // 映射到 -1~1
}

/**
 * 根据分数确定信号方向
 */
function determineAction(score, thresholds) {
  if (score > thresholds.strongBuy) return 'STRONG_BUY';
  if (score > thresholds.buy) return 'BUY';
  if (score < thresholds.strongSell) return 'STRONG_SELL';
  if (score < thresholds.sell) return 'SELL';
  return 'HOLD';
}

/**
 * 计算置信度
 */
function computeConfidence(subScores) {
  const absScores = subScores.map(Math.abs);
  const contributing = absScores.filter((s) => s > 0.1);
  if (contributing.length === 0) return 0;

  const avg = contributing.reduce((a, b) => a + b, 0) / absScores.length;
  return Math.min(avg, 1);
}

/**
 * 生成中文摘要
 */
function generateSummary(current, recentData, score, action, confidence) {
  const participantId = current.participant_id || '';
  const name = participantId === 'C00019' ? '汇丰' : participantId;

  const sign = score > 0 ? '增持' : '减持';
  const days = recentData.length;

  const actionMap = {
    STRONG_BUY: '强烈买入',
    BUY: '买入',
    SELL: '卖出',
    STRONG_SELL: '强烈卖出',
    HOLD: '持有',
  };

  return `${name}连续${days}日${sign}，当前持仓 ${current.shareholding} 股，信号：${actionMap[action]}，置信度：${(confidence * 100).toFixed(0)}%`;
}

/**
 * 批量生成信号（多个参与者）
 */
async function generateSignalsForParticipants(stockCode, participantIds) {
  const results = [];
  for (const pid of participantIds) {
    const signal = await generateSignal(stockCode, pid);
    if (!signal.error) {
      results.push(signal);
    }
  }
  return results;
}

module.exports = {
  generateSignal,
  computePositionChangeScore,
  computeMomentumScore,
  computeVolumeWeightScore,
  computeRankingShiftScore,
  determineAction,
  computeConfidence,
  generateSignalsForParticipants,
};

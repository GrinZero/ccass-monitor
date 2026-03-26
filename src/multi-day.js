/**
 * CCASS 多日分析引擎
 * 支持 7 日、30 日窗口的趋势分析
 */

const cache = require('./cache');
const fetcher = require('./fetcher');

/**
 * 获取指定窗口天数的历史数据
 */
function getWindowData(stockCode, participantId, windowDays) {
  const now = new Date();
  const endDate = formatDate(now);
  const startDate = formatDateN交易日前(now, windowDays - 1);

  // 先尝试从缓存获取
  const cached = cache.getRange(stockCode, participantId, startDate, endDate);

  if (cached.length >= windowDays) {
    return cached;
  }

  // 缓存不足，抓取缺失数据
  // 这是一个同步转异步的便捷函数
  return cached;
}

/**
 * 主入口：分析 N 日窗口
 */
async function analyzeWindow(stockCode, participantId, windowDays = 7) {
  const now = new Date();
  const endDate = formatDate(now);
  const startDate = formatDateN交易日前(now, windowDays - 1);

  // 抓取数据
  const records = await fetcher.fetchRange(stockCode, participantId, startDate, endDate);

  if (records.length === 0) {
    return null;
  }

  // 按日期排序（升序）
  records.sort((a, b) => a.date.localeCompare(b.date));

  const deltas = computeDeltas(records);
  const sma = computeSMA(
    records.map((r) => r.shareholding),
    windowDays
  );
  const trend = computeTrend(records.map((r) => r.shareholding));
  const momentum = computeMomentum(deltas);

  const current = records[records.length - 1];
  const first = records[0];
  const totalChange = current.shareholding - first.shareholding;
  const totalChangePct =
    first.shareholding > 0 ? (totalChange / first.shareholding) * 100 : 0;

  // 获取排名
  const ranking = await getRanking(stockCode, current.date);
  const participantRanking = ranking.find((r) => r.participant_id === participantId);

  return {
    stockCode,
    participantId,
    windowDays,
    data: records.map((r, i) => ({
      date: r.date,
      shareholding: r.shareholding,
      delta: deltas[i] || 0,
      sma: sma,
      percentage: r.percentage,
    })),
    summary: {
      currentHolding: current.shareholding,
      sma: sma,
      currentVsSma: first.shareholding > 0 ? (current.shareholding / sma - 1) * 100 : 0,
      momentum: momentum,
      trend: trend,
      totalChange,
      totalChangePct: parseFloat(totalChangePct.toFixed(2)),
      rank: participantRanking ? participantRanking.rank : null,
    },
  };
}

/**
 * 计算每日变化量
 */
function computeDeltas(records) {
  const deltas = [0]; // 第一天无对比
  for (let i = 1; i < records.length; i++) {
    deltas.push(records[i].shareholding - records[i - 1].shareholding);
  }
  return deltas;
}

/**
 * 计算简单移动平均
 */
function computeSMA(values, window) {
  if (values.length === 0) return 0;
  const slice = values.slice(-window);
  const sum = slice.reduce((a, b) => a + b, 0);
  return Math.round(sum / slice.length);
}

/**
 * 计算趋势方向（线性回归斜率）
 */
function computeTrend(values) {
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

  // 归一化斜率（相对平均值）
  const normalizedSlope = avgY !== 0 ? slope / avgY : 0;

  if (normalizedSlope > 0.01) return 'increasing';
  if (normalizedSlope < -0.01) return 'decreasing';
  return 'neutral';
}

/**
 * 计算动量分数（连续同向天数占比）
 */
function computeMomentum(deltas) {
  if (deltas.length < 2) return 0;

  // 去掉第一个（无变化）
  const changes = deltas.slice(1);
  const positive = changes.filter((d) => d > 0).length;
  const negative = changes.filter((d) => d < 0).length;

  if (positive > negative) {
    return positive / changes.length; // 0~1，正向动量
  } else if (negative > positive) {
    return -(negative / changes.length); // -1~0，负向动量
  }
  return 0;
}

/**
 * 计算波动率（标准差/均值）
 */
function computeVolatility(deltas) {
  if (deltas.length < 2) return 0;

  const changes = deltas.slice(1).filter((d) => d !== 0);
  if (changes.length === 0) return 0;

  const mean = changes.reduce((a, b) => a + b, 0) / changes.length;
  const variance =
    changes.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / changes.length;
  const stdDev = Math.sqrt(variance);

  return mean !== 0 ? stdDev / Math.abs(mean) : 0;
}

/**
 * 获取某日全体参与者排名
 */
async function getRanking(stockCode, date) {
  return cache.getParticipants(stockCode, date);
}

/**
 * 获取某参与者平均排名
 */
function computeAvgRank(rankingHistory) {
  if (rankingHistory.length === 0) return null;
  const sum = rankingHistory.reduce((acc, r) => acc + (r.rank || 0), 0);
  return Math.round(sum / rankingHistory.length);
}

/**
 * 格式化日期为 YYYY/MM/DD
 */
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}

/**
 * 获取 N 个交易日前的日期
 */
function formatDateN交易日前(date, n) {
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

module.exports = {
  analyzeWindow,
  computeDeltas,
  computeSMA,
  computeTrend,
  computeMomentum,
  computeVolatility,
  getRanking,
  computeAvgRank,
};

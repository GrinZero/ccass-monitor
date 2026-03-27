/**
 * CCASS 进度输出模块
 * 统一管理所有阶段性进度输出，兼容 JSON/silent 模式
 */

const FULL = '█';
const EMPTY = '░';

let silent = false;
const startTimes = new Map<string, number>();

/**
 * 设置 silent 模式（JSON 输出时启用）
 */
function setSilent(value: boolean): void {
  silent = value;
}

/**
 * 获取是否处于 silent 模式
 */
function isSilent(): boolean {
  return silent;
}

/**
 * 输出抓取进度（stderr）
 */
function showFetchProgress(stock: string, participant: string, current: number, total: number, remainingMs: number): void {
  if (silent) return;

  const pct = Math.round((current / total) * 100);
  const barLen = 20;
  const filled = Math.round((current / total) * barLen);
  const bar = FULL.repeat(filled) + EMPTY.repeat(barLen - filled);
  const remaining = remainingMs > 0 ? ` ~${Math.round(remainingMs / 1000)}秒剩余` : '';
  process.stderr.write(`[抓取] ${stock} ${participant}: ${current}/${total} ${bar} ${pct}%${remaining}\n`);
}

/**
 * 输出股票检查进度（alert 用）
 */
function showStockProgress(stock: string, name: string, current: number, total: number): void {
  if (silent) return;
  process.stderr.write(`[检查] ${stock} (${current}/${total}) ${name}\n`);
}

/**
 * 创建计时器
 */
function startTimer(key: string): void {
  startTimes.set(key, Date.now());
}

/**
 * 获取已耗时（毫秒）
 */
function getElapsed(key: string): number {
  return Date.now() - (startTimes.get(key) || Date.now());
}

/**
 * 估算剩余时间
 */
function estimateRemaining(current: number, total: number, elapsedMs: number): number {
  if (current === 0 || total === 0) return 0;
  const perItem = elapsedMs / current;
  return Math.round(perItem * (total - current));
}

export {
  setSilent,
  isSilent,
  showFetchProgress,
  showStockProgress,
  startTimer,
  getElapsed,
  estimateRemaining,
};

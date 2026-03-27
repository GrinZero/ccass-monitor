/**
 * CCASS Monitor 配置加载模块
 * 从 config.yaml 读取所有配置，支持默认值
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import type { Config, SignalWeights, SignalThresholds, AlertConfig, FetchConfig, StockNames } from './types/index.js';

const CONFIG_PATH = path.join(import.meta.dirname, '..', 'config.yaml');

let configCache: Config | null = null;

const DEFAULT_CONFIG: Config = {
  signal: {
    weights: {
      positionChangeScore: 0.3,
      momentumScore: 0.3,
      volumeWeightScore: 0.2,
      rankingShiftScore: 0.2,
    },
    thresholds: {
      strongBuy: 0.7,
      buy: 0.3,
      sell: -0.3,
      strongSell: -0.7,
    },
  },
  defaults: {
    participant: 'C00019',
    windowDays: 7,
  },
  alert: {
    minConfidence: 0.5,
    minVolumeRatio: 0.001,
    rankShiftThreshold: 5,
  },
  fetch: {
    retryCount: 2,
    retryDelayMs: 3000,
    rateLimitMs: 2000,
  },
  stockNames: {},
};

/**
 * 深度合并 source into target
 */
function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  for (const key of Object.keys(source)) {
    const sourceValue = source[key as keyof T];
    const targetValue = target[key as keyof T];
    if (
      sourceValue !== null &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === 'object' &&
      targetValue !== null
    ) {
      deepMerge(targetValue as Record<string, unknown>, sourceValue as Record<string, unknown>);
    } else {
      (target as Record<string, unknown>)[key] = sourceValue;
    }
  }
  return target;
}

/**
 * 加载配置文件
 */
function loadConfig(): Config {
  if (configCache) return configCache;

  let fileConfig: Partial<Config> = {};
  if (fs.existsSync(CONFIG_PATH)) {
    const content = fs.readFileSync(CONFIG_PATH, 'utf8');
    fileConfig = yaml.load(content) as Partial<Config> || {};
  }

  configCache = deepMerge(JSON.parse(JSON.stringify(DEFAULT_CONFIG)), fileConfig);
  return configCache!;
}

/**
 * 返回信号引擎权重
 */
function getWeights(): SignalWeights {
  return loadConfig().signal.weights;
}

/**
 * 返回信号阈值
 */
function getThresholds(): SignalThresholds {
  return loadConfig().signal.thresholds;
}

/**
 * 返回默认配置
 */
function getDefaults(): Config['defaults'] {
  return loadConfig().defaults;
}

/**
 * 返回告警配置
 */
function getAlertConfig(): AlertConfig {
  return loadConfig().alert;
}

/**
 * 返回抓取配置
 */
function getFetchConfig(): FetchConfig {
  return loadConfig().fetch;
}

/**
 * 返回股票名称映射
 */
function getStockNames(): StockNames {
  return loadConfig().stockNames;
}

/**
 * 根据名称查找股票代码
 */
function resolveStockCode(name: string): string | null {
  const names = getStockNames();
  // 直接是代码
  if (/^\d{5}$/.test(name)) return name;
  // 名称映射
  if (names[name]) return names[name];
  return null;
}

export {
  loadConfig,
  getWeights,
  getThresholds,
  getDefaults,
  getAlertConfig,
  getFetchConfig,
  getStockNames,
  resolveStockCode,
};

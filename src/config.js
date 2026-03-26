/**
 * CCASS Monitor 配置加载模块
 * 从 config.yaml 读取所有配置，支持默认值
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const CONFIG_PATH = path.join(__dirname, '..', 'config.yaml');

let configCache = null;

const DEFAULT_CONFIG = {
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
function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (
      source[key] !== null &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key])
    ) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

/**
 * 加载配置文件
 */
function loadConfig() {
  if (configCache) return configCache;

  let fileConfig = {};
  if (fs.existsSync(CONFIG_PATH)) {
    const content = fs.readFileSync(CONFIG_PATH, 'utf8');
    fileConfig = yaml.load(content) || {};
  }

  configCache = deepMerge(JSON.parse(JSON.stringify(DEFAULT_CONFIG)), fileConfig);
  return configCache;
}

/**
 * 返回信号引擎权重
 */
function getWeights() {
  return loadConfig().signal.weights;
}

/**
 * 返回信号阈值
 */
function getThresholds() {
  return loadConfig().signal.thresholds;
}

/**
 * 返回默认配置
 */
function getDefaults() {
  return loadConfig().defaults;
}

/**
 * 返回告警配置
 */
function getAlertConfig() {
  return loadConfig().alert;
}

/**
 * 返回抓取配置
 */
function getFetchConfig() {
  return loadConfig().fetch;
}

/**
 * 返回股票名称映射
 */
function getStockNames() {
  return loadConfig().stockNames;
}

/**
 * 根据名称查找股票代码
 */
function resolveStockCode(name) {
  const names = getStockNames();
  // 直接是代码
  if (/^\d{5}$/.test(name)) return name;
  // 名称映射
  if (names[name]) return names[name];
  return null;
}

module.exports = {
  loadConfig,
  getWeights,
  getThresholds,
  getDefaults,
  getAlertConfig,
  getFetchConfig,
  getStockNames,
  resolveStockCode,
};

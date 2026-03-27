import { describe, it, expect } from 'vitest';
import {
  getWeights,
  getThresholds,
  getDefaults,
  getAlertConfig,
  getFetchConfig,
  getStockNames,
  resolveStockCode,
} from './config.js';

describe('config.ts', () => {
  describe('getWeights', () => {
    it('should return signal weights from config', () => {
      const weights = getWeights();

      expect(weights.positionChangeScore).toBe(0.3);
      expect(weights.momentumScore).toBe(0.3);
      expect(weights.volumeWeightScore).toBe(0.2);
      expect(weights.rankingShiftScore).toBe(0.2);
    });
  });

  describe('getThresholds', () => {
    it('should return signal thresholds from config', () => {
      const thresholds = getThresholds();

      expect(thresholds.strongBuy).toBe(0.7);
      expect(thresholds.buy).toBe(0.3);
      expect(thresholds.sell).toBe(-0.3);
      expect(thresholds.strongSell).toBe(-0.7);
    });
  });

  describe('getDefaults', () => {
    it('should return default values from config', () => {
      const defaults = getDefaults();

      expect(defaults.participant).toBe('C00019');
      expect(defaults.windowDays).toBe(7);
    });
  });

  describe('getAlertConfig', () => {
    it('should return alert config from config', () => {
      const alertConfig = getAlertConfig();

      expect(alertConfig.minConfidence).toBe(0.5);
      expect(alertConfig.minVolumeRatio).toBe(0.001);
      expect(alertConfig.rankShiftThreshold).toBe(5);
    });
  });

  describe('getFetchConfig', () => {
    it('should return fetch config from config', () => {
      const fetchConfig = getFetchConfig();

      expect(fetchConfig.retryCount).toBe(2);
      expect(fetchConfig.retryDelayMs).toBe(3000);
      expect(fetchConfig.rateLimitMs).toBe(2000);
    });
  });

  describe('getStockNames', () => {
    it('should return stock names from config', () => {
      const stockNames = getStockNames();

      expect(stockNames['美团']).toBe('03690');
      expect(stockNames['腾讯']).toBe('00700');
      expect(stockNames['阿里巴巴']).toBe('09988');
      expect(stockNames['小米']).toBe('01810');
    });

    it('should have all expected stock mappings', () => {
      const stockNames = getStockNames();

      expect(Object.keys(stockNames)).toContain('美团');
      expect(Object.keys(stockNames)).toContain('腾讯');
      expect(Object.keys(stockNames)).toContain('阿里巴巴');
      expect(Object.keys(stockNames)).toContain('小米');
      expect(Object.keys(stockNames)).toContain('比亚迪');
      expect(Object.keys(stockNames)).toContain('京东');
      expect(Object.keys(stockNames)).toContain('网易');
      expect(Object.keys(stockNames)).toContain('百度');
      expect(Object.keys(stockNames)).toContain('工商银行');
      expect(Object.keys(stockNames)).toContain('中国银行');
    });
  });

  describe('resolveStockCode', () => {
    it('should return input if it is a 5-digit code', () => {
      expect(resolveStockCode('03690')).toBe('03690');
      expect(resolveStockCode('00700')).toBe('00700');
    });

    it('should resolve Chinese name to stock code', () => {
      expect(resolveStockCode('美团')).toBe('03690');
      expect(resolveStockCode('腾讯')).toBe('00700');
      expect(resolveStockCode('阿里巴巴')).toBe('09988');
    });

    it('should return null for unknown name', () => {
      expect(resolveStockCode('未知公司')).toBeNull();
    });
  });
});

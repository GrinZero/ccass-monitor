import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create mocks
const mockExistsSync = vi.fn();
const mockReadFileSync = vi.fn();

// Mock modules before they are imported
vi.mock('path', async () => ({
  join: vi.fn(() => '/mock/config.yaml'),
  dirname: vi.fn(() => '/mock'),
}));

vi.mock('fs', async () => ({
  existsSync: (...args: unknown[]) => mockExistsSync(...args),
  readFileSync: (...args: unknown[]) => mockReadFileSync(...args),
}));

describe('config.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync.mockReturnValue(false);
    mockReadFileSync.mockReturnValue('');
  });

  describe('getWeights', () => {
    it('should return default signal weights', async () => {
      const { getWeights } = await import('./config.js');
      const weights = getWeights();

      expect(weights.positionChangeScore).toBe(0.3);
      expect(weights.momentumScore).toBe(0.3);
      expect(weights.volumeWeightScore).toBe(0.2);
      expect(weights.rankingShiftScore).toBe(0.2);
    });
  });

  describe('getThresholds', () => {
    it('should return default signal thresholds', async () => {
      const { getThresholds } = await import('./config.js');
      const thresholds = getThresholds();

      expect(thresholds.strongBuy).toBe(0.7);
      expect(thresholds.buy).toBe(0.3);
      expect(thresholds.sell).toBe(-0.3);
      expect(thresholds.strongSell).toBe(-0.7);
    });
  });

  describe('getDefaults', () => {
    it('should return default values', async () => {
      const { getDefaults } = await import('./config.js');
      const defaults = getDefaults();

      expect(defaults.participant).toBe('C00019');
      expect(defaults.windowDays).toBe(7);
    });
  });

  describe('getAlertConfig', () => {
    it('should return default alert config', async () => {
      const { getAlertConfig } = await import('./config.js');
      const alertConfig = getAlertConfig();

      expect(alertConfig.minConfidence).toBe(0.5);
      expect(alertConfig.minVolumeRatio).toBe(0.001);
      expect(alertConfig.rankShiftThreshold).toBe(5);
    });
  });

  describe('getFetchConfig', () => {
    it('should return default fetch config', async () => {
      const { getFetchConfig } = await import('./config.js');
      const fetchConfig = getFetchConfig();

      expect(fetchConfig.retryCount).toBe(2);
      expect(fetchConfig.retryDelayMs).toBe(3000);
      expect(fetchConfig.rateLimitMs).toBe(2000);
    });
  });

  describe('getStockNames', () => {
    it('should return empty stock names when no config file', async () => {
      mockExistsSync.mockReturnValue(false);

      const { getStockNames } = await import('./config.js');
      const stockNames = getStockNames();

      expect(Object.keys(stockNames)).toHaveLength(0);
    });

    it('should return stock names from config file', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(`
stockNames:
  美团: "03690"
  腾讯: "00700"
`);

      const { getStockNames } = await import('./config.js');
      const stockNames = getStockNames();

      expect(stockNames['美团']).toBe('03690');
      expect(stockNames['腾讯']).toBe('00700');
    });
  });

  describe('resolveStockCode', () => {
    it('should return input if it is a 5-digit code', async () => {
      mockExistsSync.mockReturnValue(false);

      const { resolveStockCode } = await import('./config.js');

      expect(resolveStockCode('03690')).toBe('03690');
      expect(resolveStockCode('00700')).toBe('00700');
    });

    it('should resolve name to code from stockNames', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(`
stockNames:
  美团: "03690"
`);

      const { resolveStockCode } = await import('./config.js');

      expect(resolveStockCode('美团')).toBe('03690');
    });

    it('should return null for unknown name', async () => {
      mockExistsSync.mockReturnValue(false);

      const { resolveStockCode } = await import('./config.js');

      expect(resolveStockCode('未知')).toBeNull();
    });
  });

  describe('loadConfig', () => {
    it('should load config from yaml file', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(`
defaults:
  participant: CUSTOM_ID
  windowDays: 14
`);

      const { loadConfig } = await import('./config.js');
      const config = loadConfig();

      expect(config.defaults.participant).toBe('CUSTOM_ID');
      expect(config.defaults.windowDays).toBe(14);
    });
  });
});

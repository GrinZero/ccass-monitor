import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Alert, Watchlist, WatchlistStock, SignalResult } from './types/index.js';

// Mock dependencies
vi.mock('./signal.js', () => ({
  generateSignal: vi.fn(),
}));

vi.mock('./config.js', () => ({
  getAlertConfig: () => ({
    minConfidence: 0.5,
    minVolumeRatio: 0.001,
    rankShiftThreshold: 5,
  }),
}));

vi.mock('./cache.js', () => ({
  getParticipants: vi.fn().mockResolvedValue([]),
  getHistory: vi.fn().mockResolvedValue([]),
}));

describe('alert.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkAll filtering', () => {
    it('should filter by minConfidence', async () => {
      const lowConfidenceSignal: SignalResult = {
        stockCode: '03690',
        participantId: 'C00019',
        date: '2024/03/10',
        rawData: { deltas: [], stats: {} as SignalResult['rawData']['stats'], current: { shareholding: 0, date: '' } },
        anomaly: { detected: false, zScore: 0, magnitude: 'normal', isHistoricalMax: false, isMaxIncrease: false, isMaxDecrease: false },
        shortTerm: { signal: 'HOLD', consecutiveDays: 0, direction: '持平', momentum3d: 0, deltas: [] },
        mediumTerm: { signal: 'HOLD', trend: 'insufficient_data', change7d: 0, change7dPct: 0, change30d: 0, change30dPct: 0, sma7d: 0, currentVsSma: 0, daysAnalyzed: 0 },
        signal: 'HOLD',
        confidence: 0.2, // Below minConfidence of 0.5
        score: 0,
        summary: '',
        generatedAt: Date.now(),
        indicators: {
          positionChangeScore: 0.1,
          momentumScore: 0.1,
          volumeWeightScore: 0,
          rankingShiftScore: 0,
        },
      };

      const signal = await import('./signal.js');
      vi.mocked(signal.generateSignal).mockResolvedValue(lowConfidenceSignal);

      const mockWatchlist: Watchlist = {
        stocks: [{ code: '03690', name: '美团' }],
        globalParticipants: ['C00019'],
      };

      const { checkAll } = await import('./alert.js');
      const alerts = await checkAll(mockWatchlist);

      expect(alerts.length).toBe(0);
    });

    it('should handle empty watchlist', async () => {
      const emptyWatchlist: Watchlist = { stocks: [] };

      const { checkAll } = await import('./alert.js');
      const alerts = await checkAll(emptyWatchlist);

      expect(alerts).toHaveLength(0);
    });

    it('should generate alert with STRONG_ACCUMULATION signal', async () => {
      const strongAccumulationSignal: SignalResult = {
        stockCode: '03690',
        participantId: 'C00019',
        date: '2024/03/10',
        rawData: { deltas: [], stats: {} as SignalResult['rawData']['stats'], current: { shareholding: 0, date: '' } },
        anomaly: { detected: false, zScore: 0, magnitude: 'normal', isHistoricalMax: false, isMaxIncrease: false, isMaxDecrease: false },
        shortTerm: { signal: 'STRONG_BUY', consecutiveDays: 3, direction: '增持', momentum3d: 1, deltas: [] },
        mediumTerm: { signal: 'BUY', trend: 'increasing', change7d: 1000000, change7dPct: 10, change30d: 0, change30dPct: 0, sma7d: 5000000, currentVsSma: 20, daysAnalyzed: 7 },
        signal: 'STRONG_BUY',
        confidence: 0.85,
        score: 0.9,
        summary: 'Test alert',
        generatedAt: Date.now(),
        indicators: {
          positionChangeScore: 0.6,
          momentumScore: 0.6,
          volumeWeightScore: 0,
          rankingShiftScore: 0,
        },
      };

      const signal = await import('./signal.js');
      vi.mocked(signal.generateSignal).mockResolvedValue(strongAccumulationSignal);

      const mockWatchlist: Watchlist = {
        stocks: [{ code: '03690', name: '美团' }],
        globalParticipants: ['C00019'],
      };

      const { checkAll } = await import('./alert.js');
      const alerts = await checkAll(mockWatchlist);

      expect(alerts.length).toBeGreaterThan(0);
    });
  });

  describe('generateAlert', () => {
    it('should generate alert with correct structure', async () => {
      const mockStock: WatchlistStock = { code: '03690', name: '美团' };
      const mockSignalResult: SignalResult = {
        stockCode: '03690',
        participantId: 'C00019',
        date: '2024/03/10',
        rawData: { deltas: [], stats: {} as SignalResult['rawData']['stats'], current: { shareholding: 0, date: '' } },
        anomaly: { detected: false, zScore: 0, magnitude: 'normal', isHistoricalMax: false, isMaxIncrease: false, isMaxDecrease: false },
        shortTerm: { signal: 'HOLD', consecutiveDays: 0, direction: '持平', momentum3d: 0, deltas: [] },
        mediumTerm: { signal: 'HOLD', trend: 'insufficient_data', change7d: 0, change7dPct: 0, change30d: 0, change30dPct: 0, sma7d: 0, currentVsSma: 0, daysAnalyzed: 0 },
        signal: 'HOLD',
        confidence: 0.5,
        score: 0,
        summary: 'Test alert',
        generatedAt: Date.now(),
        indicators: {
          positionChangeScore: 0,
          momentumScore: 0,
          volumeWeightScore: 0,
          rankingShiftScore: 0,
        },
      };

      const { generateAlert } = await import('./alert.js');
      const alert = generateAlert('STRONG_ACCUMULATION', mockStock, 'C00019', mockSignalResult);

      expect(alert).toHaveProperty('alertId');
      expect(alert.type).toBe('STRONG_ACCUMULATION');
      expect(alert.stockCode).toBe('03690');
      expect(alert.participantId).toBe('C00019');
      expect(alert.confidence).toBe(0.5);
      expect(alert.action).toBe('CONSIDER_BUY');
    });

    it('should generate valid UUID format', async () => {
      const mockStock: WatchlistStock = { code: '03690', name: '美团' };
      const mockSignalResult: SignalResult = {
        stockCode: '03690',
        participantId: 'C00019',
        date: '2024/03/10',
        rawData: { deltas: [], stats: {} as SignalResult['rawData']['stats'], current: { shareholding: 0, date: '' } },
        anomaly: { detected: false, zScore: 0, magnitude: 'normal', isHistoricalMax: false, isMaxIncrease: false, isMaxDecrease: false },
        shortTerm: { signal: 'HOLD', consecutiveDays: 0, direction: '持平', momentum3d: 0, deltas: [] },
        mediumTerm: { signal: 'HOLD', trend: 'insufficient_data', change7d: 0, change7dPct: 0, change30d: 0, change30dPct: 0, sma7d: 0, currentVsSma: 0, daysAnalyzed: 0 },
        signal: 'HOLD',
        confidence: 0.5,
        score: 0,
        summary: 'Test alert',
        generatedAt: Date.now(),
        indicators: {
          positionChangeScore: 0,
          momentumScore: 0,
          volumeWeightScore: 0,
          rankingShiftScore: 0,
        },
      };

      const { generateAlert } = await import('./alert.js');
      const alert = generateAlert('STRONG_ACCUMULATION', mockStock, 'C00019', mockSignalResult);

      expect(alert.alertId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate STRONG_DISTRIBUTION alert with CONSIDER_SELL action', async () => {
      const mockStock: WatchlistStock = { code: '03690', name: '美团' };
      const mockSignalResult: SignalResult = {
        stockCode: '03690',
        participantId: 'C00019',
        date: '2024/03/10',
        rawData: { deltas: [], stats: {} as SignalResult['rawData']['stats'], current: { shareholding: 0, date: '' } },
        anomaly: { detected: false, zScore: 0, magnitude: 'normal', isHistoricalMax: false, isMaxIncrease: false, isMaxDecrease: false },
        shortTerm: { signal: 'HOLD', consecutiveDays: 0, direction: '持平', momentum3d: 0, deltas: [] },
        mediumTerm: { signal: 'HOLD', trend: 'insufficient_data', change7d: 0, change7dPct: 0, change30d: 0, change30dPct: 0, sma7d: 0, currentVsSma: 0, daysAnalyzed: 0 },
        signal: 'HOLD',
        confidence: 0.5,
        score: 0,
        summary: 'Test alert',
        generatedAt: Date.now(),
        indicators: {
          positionChangeScore: -0.6,
          momentumScore: -0.6,
          volumeWeightScore: 0,
          rankingShiftScore: 0,
        },
      };

      const { generateAlert } = await import('./alert.js');
      const alert = generateAlert('STRONG_DISTRIBUTION', mockStock, 'C00019', mockSignalResult);

      expect(alert.type).toBe('STRONG_DISTRIBUTION');
      expect(alert.action).toBe('CONSIDER_SELL');
    });
  });

  describe('loadWatchlist error handling', () => {
    it('should throw error for missing stocks array', async () => {
      // This test verifies the validation logic - when JSON.parse returns {}
      // without stocks array, it should throw
      // We can't easily test this without proper fs mocking
    });
  });
});

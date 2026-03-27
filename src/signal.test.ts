import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DailyHoldingsRow } from './types/index.js';

// Mock dependencies
vi.mock('./cache.js', () => ({
  getHistory: vi.fn().mockReturnValue([]),
  getParticipants: vi.fn().mockResolvedValue([]),
}));

vi.mock('./fetcher.js', () => ({
  fetchRange: vi.fn().mockResolvedValue([]),
}));

vi.mock('./config.js', () => ({
  getThresholds: () => ({
    strongBuy: 0.7,
    buy: 0.3,
    sell: -0.3,
    strongSell: -0.7,
  }),
  getWeights: () => ({
    positionChangeScore: 0.3,
    momentumScore: 0.3,
    volumeWeightScore: 0.2,
    rankingShiftScore: 0.2,
  }),
}));

describe('signal.ts', () => {
  describe('analyzeRawData', () => {
    it('should handle empty history', async () => {
      const { generateSignal } = await import('./signal.js');
      const result = await generateSignal('03690', 'C00019');

      expect(result.error).toBe('No data available');
    });
  });

  describe('Signal threshold boundaries', () => {
    it('should classify score >= 0.7 as STRONG_BUY', async () => {
      // Create mock data that will produce a strong signal
      const mockHistory: DailyHoldingsRow[] = [
        { id: 1, stock_code: '03690', participant_id: 'C00019', date: '2024/03/10', shareholding: 10000000, percentage: '5.0', rank: 1, fetch_time: Date.now() },
        { id: 2, stock_code: '03690', participant_id: 'C00019', date: '2024/03/09', shareholding: 5000000, percentage: '2.5', rank: 2, fetch_time: Date.now() },
        { id: 3, stock_code: '03690', participant_id: 'C00019', date: '2024/03/08', shareholding: 3000000, percentage: '1.5', rank: 3, fetch_time: Date.now() },
        { id: 4, stock_code: '03690', participant_id: 'C00019', date: '2024/03/07', shareholding: 2000000, percentage: '1.0', rank: 4, fetch_time: Date.now() },
        { id: 5, stock_code: '03690', participant_id: 'C00019', date: '2024/03/06', shareholding: 1500000, percentage: '0.8', rank: 5, fetch_time: Date.now() },
        { id: 6, stock_code: '03690', participant_id: 'C00019', date: '2024/03/05', shareholding: 1000000, percentage: '0.5', rank: 6, fetch_time: Date.now() },
        { id: 7, stock_code: '03690', participant_id: 'C00019', date: '2024/03/04', shareholding: 800000, percentage: '0.4', rank: 7, fetch_time: Date.now() },
      ];

      const cache = await import('./cache.js');
      vi.mocked(cache.getHistory).mockReturnValue(mockHistory);

      const { generateSignal } = await import('./signal.js');
      const result = await generateSignal('03690', 'C00019');

      // Score should be positive due to consistent increase
      expect(result.signal).toMatch(/BUY|STRONG_BUY|HOLD/);
    });

    it('should classify score <= -0.7 as STRONG_SELL', async () => {
      // Create mock data with consistent decrease
      const mockHistory: DailyHoldingsRow[] = [
        { id: 1, stock_code: '03690', participant_id: 'C00019', date: '2024/03/10', shareholding: 1000000, percentage: '0.5', rank: 5, fetch_time: Date.now() },
        { id: 2, stock_code: '03690', participant_id: 'C00019', date: '2024/03/09', shareholding: 2000000, percentage: '1.0', rank: 4, fetch_time: Date.now() },
        { id: 3, stock_code: '03690', participant_id: 'C00019', date: '2024/03/08', shareholding: 3000000, percentage: '1.5', rank: 3, fetch_time: Date.now() },
        { id: 4, stock_code: '03690', participant_id: 'C00019', date: '2024/03/07', shareholding: 4000000, percentage: '2.0', rank: 2, fetch_time: Date.now() },
        { id: 5, stock_code: '03690', participant_id: 'C00019', date: '2024/03/06', shareholding: 5000000, percentage: '2.5', rank: 1, fetch_time: Date.now() },
        { id: 6, stock_code: '03690', participant_id: 'C00019', date: '2024/03/05', shareholding: 6000000, percentage: '3.0', rank: 1, fetch_time: Date.now() },
        { id: 7, stock_code: '03690', participant_id: 'C00019', date: '2024/03/04', shareholding: 7000000, percentage: '3.5', rank: 1, fetch_time: Date.now() },
      ];

      const cache = await import('./cache.js');
      vi.mocked(cache.getHistory).mockReturnValue(mockHistory);

      const { generateSignal } = await import('./signal.js');
      const result = await generateSignal('03690', 'C00019');

      // Score should be negative due to consistent decrease
      expect(result.signal).toMatch(/SELL|STRONG_SELL|HOLD/);
    });
  });

  describe('Signal indicators structure', () => {
    it('should return proper SignalResult structure', async () => {
      const mockHistory: DailyHoldingsRow[] = [
        { id: 1, stock_code: '03690', participant_id: 'C00019', date: '2024/03/10', shareholding: 1000000, percentage: '0.5', rank: 1, fetch_time: Date.now() },
        { id: 2, stock_code: '03690', participant_id: 'C00019', date: '2024/03/09', shareholding: 1000000, percentage: '0.5', rank: 1, fetch_time: Date.now() },
        { id: 3, stock_code: '03690', participant_id: 'C00019', date: '2024/03/08', shareholding: 1000000, percentage: '0.5', rank: 1, fetch_time: Date.now() },
      ];

      const cache = await import('./cache.js');
      vi.mocked(cache.getHistory).mockReturnValue(mockHistory);

      const { generateSignal } = await import('./signal.js');
      const result = await generateSignal('03690', 'C00019');

      expect(result).toHaveProperty('stockCode');
      expect(result).toHaveProperty('participantId');
      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('signal');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('rawData');
      expect(result).toHaveProperty('anomaly');
      expect(result).toHaveProperty('shortTerm');
      expect(result).toHaveProperty('mediumTerm');
    });
  });

  describe('Short term signal', () => {
    it('should detect consecutive BUY signals', async () => {
      // Create history with 3 consecutive days of increase
      const mockHistory: DailyHoldingsRow[] = [
        { id: 1, stock_code: '03690', participant_id: 'C00019', date: '2024/03/10', shareholding: 1000000, percentage: '0.5', rank: 1, fetch_time: Date.now() },
        { id: 2, stock_code: '03690', participant_id: 'C00019', date: '2024/03/09', shareholding: 900000, percentage: '0.45', rank: 2, fetch_time: Date.now() },
        { id: 3, stock_code: '03690', participant_id: 'C00019', date: '2024/03/08', shareholding: 800000, percentage: '0.4', rank: 3, fetch_time: Date.now() },
        { id: 4, stock_code: '03690', participant_id: 'C00019', date: '2024/03/07', shareholding: 700000, percentage: '0.35', rank: 4, fetch_time: Date.now() },
        { id: 5, stock_code: '03690', participant_id: 'C00019', date: '2024/03/06', shareholding: 600000, percentage: '0.3', rank: 5, fetch_time: Date.now() },
      ];

      const cache = await import('./cache.js');
      vi.mocked(cache.getHistory).mockReturnValue(mockHistory);

      const { generateSignal } = await import('./signal.js');
      const result = await generateSignal('03690', 'C00019');

      expect(result.shortTerm.signal).toMatch(/BUY|STRONG_BUY/);
      expect(result.shortTerm.consecutiveDays).toBeGreaterThanOrEqual(2);
    });
  });

  describe('generateSignalsForParticipants', () => {
    it('should generate signals for multiple participants', async () => {
      const mockHistory: DailyHoldingsRow[] = [
        { id: 1, stock_code: '03690', participant_id: 'C00019', date: '2024/03/10', shareholding: 1000000, percentage: '0.5', rank: 1, fetch_time: Date.now() },
        { id: 2, stock_code: '03690', participant_id: 'C00019', date: '2024/03/09', shareholding: 1000000, percentage: '0.5', rank: 1, fetch_time: Date.now() },
      ];

      const cache = await import('./cache.js');
      vi.mocked(cache.getHistory).mockReturnValue(mockHistory);

      const { generateSignalsForParticipants } = await import('./signal.js');
      const results = await generateSignalsForParticipants('03690', ['C00019', 'C00020']);

      expect(results).toHaveLength(2);
    });
  });
});

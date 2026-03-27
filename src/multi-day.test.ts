import { describe, it, expect } from 'vitest';
import {
  computeSMA,
  computeTrend,
  computeMomentum,
  computeVolatility,
  computeDeltas,
  computeAvgRank,
} from './multi-day.js';

describe('multi-day.ts', () => {
  describe('computeDeltas', () => {
    it('should compute daily changes', () => {
      const records = [
        { date: '2024/03/01', shareholding: 100 },
        { date: '2024/03/02', shareholding: 150 },
        { date: '2024/03/03', shareholding: 120 },
      ];

      const deltas = computeDeltas(records);

      expect(deltas[0]).toBe(0); // First day has no change
      expect(deltas[1]).toBe(50); // 150 - 100
      expect(deltas[2]).toBe(-30); // 120 - 150
    });

    it('should return [0] for single record', () => {
      const records = [{ date: '2024/03/01', shareholding: 100 }];

      const deltas = computeDeltas(records);

      expect(deltas).toEqual([0]);
    });
  });

  describe('computeSMA', () => {
    it('should calculate simple moving average correctly', () => {
      const values = [10, 20, 30, 40, 50];

      const sma = computeSMA(values, 3);

      expect(sma).toBe(40); // (30 + 40 + 50) / 3 = 40
    });

    it('should use last window when values exceed window', () => {
      const values = [10, 20, 30, 40, 50, 60, 70];

      const sma = computeSMA(values, 3);

      expect(sma).toBe(60); // (50 + 60 + 70) / 3 = 60
    });

    it('should return 0 for empty array', () => {
      const values: number[] = [];

      const sma = computeSMA(values, 3);

      expect(sma).toBe(0);
    });

    it('should return average when window equals data length', () => {
      const values = [10, 20, 30];

      const sma = computeSMA(values, 3);

      expect(sma).toBe(20); // (10 + 20 + 30) / 3 = 20
    });
  });

  describe('computeTrend', () => {
    it('should return increasing for upward trend', () => {
      const values = [10, 20, 30, 40, 50];

      const trend = computeTrend(values);

      expect(trend).toBe('increasing');
    });

    it('should return decreasing for downward trend', () => {
      const values = [50, 40, 30, 20, 10];

      const trend = computeTrend(values);

      expect(trend).toBe('decreasing');
    });

    it('should return neutral for flat data', () => {
      const values = [10, 10, 10, 10, 10];

      const trend = computeTrend(values);

      expect(trend).toBe('neutral');
    });

    it('should return neutral for single value', () => {
      const values = [10];

      const trend = computeTrend(values);

      expect(trend).toBe('neutral');
    });

    it('should return neutral for insufficient data', () => {
      const values: number[] = [];

      const trend = computeTrend(values);

      expect(trend).toBe('neutral');
    });
  });

  describe('computeMomentum', () => {
    it('should return positive momentum for increasing values', () => {
      const deltas = [0, 10, 20, 30]; // All positive changes after first

      const momentum = computeMomentum(deltas);

      expect(momentum).toBeGreaterThan(0);
      expect(momentum).toBeLessThanOrEqual(1);
    });

    it('should return negative momentum for decreasing values', () => {
      const deltas = [0, -10, -20, -30];

      const momentum = computeMomentum(deltas);

      expect(momentum).toBeLessThan(0);
      expect(momentum).toBeGreaterThanOrEqual(-1);
    });

    it('should return 0 for equal positive and negative changes', () => {
      const deltas = [0, 10, -10, 20, -20];

      const momentum = computeMomentum(deltas);

      expect(momentum).toBe(0);
    });

    it('should return 0 for insufficient data', () => {
      const deltas = [0];

      const momentum = computeMomentum(deltas);

      expect(momentum).toBe(0);
    });

    it('should return 0 for single change', () => {
      const deltas = [0, 10];

      const momentum = computeMomentum(deltas);

      expect(momentum).toBe(1); // 1 positive out of 1 change = 1.0
    });
  });

  describe('computeVolatility', () => {
    it('should return 0 for insufficient data', () => {
      const deltas = [0];

      const volatility = computeVolatility(deltas);

      expect(volatility).toBe(0);
    });

    it('should return 0 for flat changes', () => {
      const deltas = [0, 10, 10, 10];

      const volatility = computeVolatility(deltas);

      expect(volatility).toBe(0);
    });

    it('should calculate positive volatility for varied changes', () => {
      const deltas = [0, 10, 20, 30];

      const volatility = computeVolatility(deltas);

      expect(volatility).toBeGreaterThan(0);
    });
  });

  describe('computeAvgRank', () => {
    it('should return null for empty array', () => {
      const rankingHistory: Array<{ rank?: number }> = [];

      const avgRank = computeAvgRank(rankingHistory);

      expect(avgRank).toBeNull();
    });

    it('should calculate average rank correctly', () => {
      const rankingHistory = [{ rank: 5 }, { rank: 3 }, { rank: 7 }];

      const avgRank = computeAvgRank(rankingHistory);

      expect(avgRank).toBe(5); // (5 + 3 + 7) / 3 = 5
    });

    it('should round to nearest integer', () => {
      const rankingHistory = [{ rank: 5 }, { rank: 6 }];

      const avgRank = computeAvgRank(rankingHistory);

      expect(avgRank).toBe(6); // (5 + 6) / 2 = 5.5 -> 6
    });

    it('should treat records without rank as 0', () => {
      const rankingHistory = [{ rank: 5 }, { rank: undefined }, { rank: 7 }];

      const avgRank = computeAvgRank(rankingHistory);

      expect(avgRank).toBe(4); // (5 + 0 + 7) / 3 = 4
    });
  });
});

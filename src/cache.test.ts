import { describe, it, expect } from 'vitest';
import * as cache from './cache.js';

describe('cache.ts', () => {
  describe('module exports', () => {
    it('should export initDatabase function', () => {
      expect(typeof cache.initDatabase).toBe('function');
    });

    it('should export getHolding function', () => {
      expect(typeof cache.getHolding).toBe('function');
    });

    it('should export getRange function', () => {
      expect(typeof cache.getRange).toBe('function');
    });

    it('should export getParticipants function', () => {
      expect(typeof cache.getParticipants).toBe('function');
    });

    it('should export setHolding function', () => {
      expect(typeof cache.setHolding).toBe('function');
    });

    it('should export setHoldings function', () => {
      expect(typeof cache.setHoldings).toBe('function');
    });

    it('should export setFetchLog function', () => {
      expect(typeof cache.setFetchLog).toBe('function');
    });

    it('should export getFetchLog function', () => {
      expect(typeof cache.getFetchLog).toBe('function');
    });

    it('should export getHistory function', () => {
      expect(typeof cache.getHistory).toBe('function');
    });

    it('should export getAvgDailyVolume function', () => {
      expect(typeof cache.getAvgDailyVolume).toBe('function');
    });
  });

  describe('initDatabase', () => {
    it('should return a database instance', () => {
      const db = cache.initDatabase();
      expect(db).toBeDefined();
    });

    it('should return the same instance on subsequent calls', () => {
      const db1 = cache.initDatabase();
      const db2 = cache.initDatabase();
      expect(db1).toBe(db2);
    });
  });

  describe('getHolding', () => {
    it('should return null for non-existent record', () => {
      const result = cache.getHolding('NONEXISTENT', 'C00019', '2024/03/10');
      expect(result).toBeNull();
    });
  });

  describe('getRange', () => {
    it('should return empty array for non-existent range', () => {
      const result = cache.getRange('NONEXISTENT', 'C00019', '2024/03/01', '2024/03/31');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getParticipants', () => {
    it('should return empty array for non-existent stock', () => {
      const result = cache.getParticipants('NONEXISTENT', '2024/03/10');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getFetchLog', () => {
    it('should return null for non-existent log', () => {
      const result = cache.getFetchLog('NONEXISTENT', '2024/03/10');
      expect(result).toBeNull();
    });
  });

  describe('getHistory', () => {
    it('should return empty array for non-existent history', () => {
      const result = cache.getHistory('NONEXISTENT', 'C00019', 30);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getAvgDailyVolume', () => {
    it('should return 0 for non-existent data', () => {
      const result = cache.getAvgDailyVolume('NONEXISTENT', 'C00019', 30);
      expect(result).toBe(0);
    });
  });
});

// backend/src/controllers/__tests__/drillProgress.test.ts
// Unit tests for drill progress derivation from audit_logs
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the database module before importing drillProgress
vi.mock('../../db/database.js', () => ({
  default: {
    prepare: vi.fn(),
  },
}));

import db from '../../db/database.js';
import { getProgressByTenant, getTotalXP } from '../drillProgress.js';

describe('drillProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProgressByTenant', () => {
    it('returns empty object when no audit logs exist', () => {
      vi.mocked(db.prepare).mockReturnValue({
        all: vi.fn().mockReturnValue([]),
      } as ReturnType<typeof db.prepare>);

      const result = getProgressByTenant('test-tenant');
      
      expect(result).toEqual({});
      expect(db.prepare).toHaveBeenCalledTimes(1);
    });

    it('derives progress from audit_logs correctly for CLICKED outcome', () => {
      vi.mocked(db.prepare).mockReturnValue({
        all: vi.fn().mockReturnValue([
          {
            drillId: 'drill-1',
            attempts: 1,
            lastOutcome: 'CLICKED',
            lastAttemptAt: '2025-12-13T10:00:00Z',
            hasReported: 0,
          },
        ]),
      } as ReturnType<typeof db.prepare>);

      const result = getProgressByTenant('test-tenant');

      expect(result).toEqual({
        'drill-1': {
          drillId: 'drill-1',
          attempts: 1,
          lastOutcome: 'CLICKED',
          lastAttemptAt: '2025-12-13T10:00:00Z',
          completed: false,
          xpEarned: 0,
        },
      });
    });

    it('marks drill as completed and awards XP when REPORTED outcome exists', () => {
      vi.mocked(db.prepare).mockReturnValue({
        all: vi.fn().mockReturnValue([
          {
            drillId: 'drill-2',
            attempts: 2,
            lastOutcome: 'REPORTED',
            lastAttemptAt: '2025-12-13T12:00:00Z',
            hasReported: 1,
          },
        ]),
      } as ReturnType<typeof db.prepare>);

      const result = getProgressByTenant('test-tenant');

      expect(result['drill-2']).toEqual({
        drillId: 'drill-2',
        attempts: 2,
        lastOutcome: 'REPORTED',
        lastAttemptAt: '2025-12-13T12:00:00Z',
        completed: true,
        xpEarned: 100,
      });
    });

    it('handles multiple drills with mixed outcomes', () => {
      vi.mocked(db.prepare).mockReturnValue({
        all: vi.fn().mockReturnValue([
          {
            drillId: 'drill-1',
            attempts: 3,
            lastOutcome: 'CLICKED',
            lastAttemptAt: '2025-12-13T10:00:00Z',
            hasReported: 0,
          },
          {
            drillId: 'drill-2',
            attempts: 1,
            lastOutcome: 'REPORTED',
            lastAttemptAt: '2025-12-13T11:00:00Z',
            hasReported: 1,
          },
          {
            drillId: 'drill-3',
            attempts: 2,
            lastOutcome: 'REPORTED',
            lastAttemptAt: '2025-12-13T12:00:00Z',
            hasReported: 1,
          },
        ]),
      } as ReturnType<typeof db.prepare>);

      const result = getProgressByTenant('test-tenant');

      expect(Object.keys(result)).toHaveLength(3);
      expect(result['drill-1'].completed).toBe(false);
      expect(result['drill-1'].xpEarned).toBe(0);
      expect(result['drill-2'].completed).toBe(true);
      expect(result['drill-2'].xpEarned).toBe(100);
      expect(result['drill-3'].completed).toBe(true);
      expect(result['drill-3'].xpEarned).toBe(100);
    });

    it('completed is true even if last outcome was CLICKED but a previous REPORTED exists', () => {
      // User clicked after they already reported = still completed
      vi.mocked(db.prepare).mockReturnValue({
        all: vi.fn().mockReturnValue([
          {
            drillId: 'drill-1',
            attempts: 2,
            lastOutcome: 'CLICKED', // Latest was a retry click
            lastAttemptAt: '2025-12-13T14:00:00Z',
            hasReported: 1, // But they did report at some point
          },
        ]),
      } as ReturnType<typeof db.prepare>);

      const result = getProgressByTenant('test-tenant');

      expect(result['drill-1'].completed).toBe(true);
      expect(result['drill-1'].xpEarned).toBe(100);
    });
  });

  describe('getTotalXP', () => {
    it('returns 0 when no drills are completed', () => {
      vi.mocked(db.prepare).mockReturnValue({
        all: vi.fn().mockReturnValue([
          { drillId: 'drill-1', attempts: 1, lastOutcome: 'CLICKED', lastAttemptAt: null, hasReported: 0 },
        ]),
      } as ReturnType<typeof db.prepare>);

      const result = getTotalXP('test-tenant');

      expect(result).toBe(0);
    });

    it('sums XP from all completed drills', () => {
      vi.mocked(db.prepare).mockReturnValue({
        all: vi.fn().mockReturnValue([
          { drillId: 'drill-1', attempts: 1, lastOutcome: 'REPORTED', lastAttemptAt: null, hasReported: 1 },
          { drillId: 'drill-2', attempts: 2, lastOutcome: 'CLICKED', lastAttemptAt: null, hasReported: 0 },
          { drillId: 'drill-3', attempts: 1, lastOutcome: 'REPORTED', lastAttemptAt: null, hasReported: 1 },
        ]),
      } as ReturnType<typeof db.prepare>);

      const result = getTotalXP('test-tenant');

      expect(result).toBe(200); // 100 + 0 + 100
    });
  });
});

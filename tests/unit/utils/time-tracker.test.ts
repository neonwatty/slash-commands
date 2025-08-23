import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TimeTracker } from '../../../src/utils/time-tracker';

describe('TimeTracker', () => {
  let timeTracker: TimeTracker;

  beforeEach(() => {
    timeTracker = new TimeTracker();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('start and end', () => {
    it('should track time correctly', () => {
      timeTracker.start('test');
      
      // Advance time by 1000ms
      vi.advanceTimersByTime(1000);
      
      const duration = timeTracker.end('test');
      
      expect(duration).toBe(1000);
      expect(timeTracker.getDuration('test')).toBe(1000);
    });

    it('should throw error when ending non-existent timer', () => {
      expect(() => timeTracker.end('nonexistent')).toThrow("Timer with id 'nonexistent' not found");
    });
  });

  describe('formatDuration', () => {
    it('should format milliseconds correctly', () => {
      expect(timeTracker.formatDuration(500)).toBe('500ms');
      expect(timeTracker.formatDuration(1500)).toBe('1s');
      expect(timeTracker.formatDuration(65000)).toBe('1m 5s');
      expect(timeTracker.formatDuration(120000)).toBe('2m 0s');
    });
  });

  describe('clear', () => {
    it('should clear specific timer', () => {
      timeTracker.start('test1');
      timeTracker.start('test2');
      
      timeTracker.clear('test1');
      
      expect(() => timeTracker.end('test1')).toThrow();
      expect(() => timeTracker.end('test2')).not.toThrow();
    });

    it('should clear all timers', () => {
      timeTracker.start('test1');
      timeTracker.start('test2');
      
      timeTracker.clear();
      
      expect(() => timeTracker.end('test1')).toThrow();
      expect(() => timeTracker.end('test2')).toThrow();
    });
  });
});
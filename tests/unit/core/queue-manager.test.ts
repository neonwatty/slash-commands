import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueueManager } from '../../../src/core/queue-manager';
import { CommandRunner } from '../../../src/utils/command-runner';
import { MOCK_TFQ_RESPONSES } from '../../fixtures/mock-responses';

// Mock CommandRunner
vi.mock('../../../src/utils/command-runner');
const MockCommandRunner = CommandRunner as any;

describe('QueueManager', () => {
  let queueManager: QueueManager;
  let mockCommandRunner: any;

  beforeEach(() => {
    mockCommandRunner = new MockCommandRunner() as any;
    queueManager = new QueueManager(mockCommandRunner);
  });

  describe('getQueueStatus', () => {
    it('should return empty queue status', async () => {
      mockCommandRunner.executeShell.mockResolvedValue({
        success: true,
        exitCode: 0,
        output: MOCK_TFQ_RESPONSES.EMPTY_QUEUE,
        error: '',
        duration: 100
      });

      const status = await queueManager.getQueueStatus();

      expect(status).toEqual({
        count: 0,
        available: true
      });
    });

    it('should return non-empty queue status', async () => {
      mockCommandRunner.executeShell.mockResolvedValue({
        success: true,
        exitCode: 0,
        output: MOCK_TFQ_RESPONSES.NON_EMPTY_QUEUE,
        error: '',
        duration: 100
      });

      const status = await queueManager.getQueueStatus();

      expect(status).toEqual({
        count: 3,
        available: true
      });
    });

    it('should handle command failure', async () => {
      mockCommandRunner.executeShell.mockResolvedValue({
        success: false,
        exitCode: 1,
        output: '',
        error: 'Command not found',
        duration: 50
      });

      const status = await queueManager.getQueueStatus();

      expect(status).toEqual({
        count: -1,
        available: false,
        error: 'TFQ command failed: Command not found'
      });
    });

    it('should handle invalid count output', async () => {
      mockCommandRunner.executeShell.mockResolvedValue({
        success: true,
        exitCode: 0,
        output: 'invalid-number',
        error: '',
        duration: 100
      });

      const status = await queueManager.getQueueStatus();

      expect(status).toEqual({
        count: -1,
        available: false,
        error: 'Invalid TFQ count output: invalid-number'
      });
    });

    it('should handle execution exception', async () => {
      mockCommandRunner.executeShell.mockRejectedValue(new Error('Network error'));

      const status = await queueManager.getQueueStatus();

      expect(status).toEqual({
        count: -1,
        available: false,
        error: 'Network error'
      });
    });
  });

  describe('isQueueEmpty', () => {
    it('should return true for empty queue', async () => {
      mockCommandRunner.executeShell.mockResolvedValue({
        success: true,
        exitCode: 0,
        output: '0',
        error: '',
        duration: 100
      });

      const isEmpty = await queueManager.isQueueEmpty();
      expect(isEmpty).toBe(true);
    });

    it('should return false for non-empty queue', async () => {
      mockCommandRunner.executeShell.mockResolvedValue({
        success: true,
        exitCode: 0,
        output: '3',
        error: '',
        duration: 100
      });

      const isEmpty = await queueManager.isQueueEmpty();
      expect(isEmpty).toBe(false);
    });

    it('should return false when queue status unavailable', async () => {
      mockCommandRunner.executeShell.mockResolvedValue({
        success: false,
        exitCode: 1,
        output: '',
        error: 'Command failed',
        duration: 50
      });

      const isEmpty = await queueManager.isQueueEmpty();
      expect(isEmpty).toBe(false);
    });
  });

  describe('hasQueueItems', () => {
    it('should return true for non-empty queue', async () => {
      mockCommandRunner.executeShell.mockResolvedValue({
        success: true,
        exitCode: 0,
        output: '2',
        error: '',
        duration: 100
      });

      const hasItems = await queueManager.hasQueueItems();
      expect(hasItems).toBe(true);
    });

    it('should return false for empty queue', async () => {
      mockCommandRunner.executeShell.mockResolvedValue({
        success: true,
        exitCode: 0,
        output: '0',
        error: '',
        duration: 100
      });

      const hasItems = await queueManager.hasQueueItems();
      expect(hasItems).toBe(false);
    });
  });
});
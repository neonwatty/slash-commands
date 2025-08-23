import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoopController } from '../../src/core/loop-controller';
import { setupDependencies } from '../../src/cli/dependency-injection';
import { LoopConfig } from '../../src/types/config';
import { ExitReason } from '../../src/types/status';
import { CommandRunner } from '../../src/utils/command-runner';
import { MOCK_TFQ_RESPONSES, MOCK_TASK_RESPONSES, MOCK_EXECUTION_RESULTS, MOCK_COMMIT_RESPONSES } from '../fixtures/mock-responses';

// Mock CommandRunner
vi.mock('../../src/utils/command-runner');
const MockCommandRunner = CommandRunner as any;

describe('End-to-End Integration Tests', () => {
  let config: LoopConfig;
  let mockCommandRunner: any;

  beforeEach(() => {
    config = {
      taskNumber: '5',
      maxIterations: 3,
      timeoutMs: 5000,
      autoCommit: true,
      verbose: false,
      skipPermissions: true
    };

    // Reset mocks
    vi.clearAllMocks();
    
    // Mock the CommandRunner constructor to return a mocked instance
    mockCommandRunner = {
      executeShell: vi.fn(),
      execute: vi.fn()
    };
    
    MockCommandRunner.mockImplementation(() => mockCommandRunner);
  });

  describe('Happy Path: Successful Task Completion', () => {
    it('should complete task successfully with auto-commit', async () => {
      config.maxIterations = 1; // Only run one iteration
      
      // Mock sequence: TFQ empty -> Task available -> Execution success -> TFQ still empty -> Commit success
      mockCommandRunner.executeShell
        .mockResolvedValueOnce({
          success: true,
          exitCode: 0,
          output: MOCK_TFQ_RESPONSES.EMPTY_QUEUE,
          error: '',
          duration: 100
        })
        .mockResolvedValueOnce({
          success: true,
          exitCode: 0,
          output: MOCK_TASK_RESPONSES.NEXT_TASK_AVAILABLE,
          error: '',
          duration: 200
        })
        .mockResolvedValueOnce(MOCK_EXECUTION_RESULTS.SUCCESS)
        .mockResolvedValueOnce({
          success: true,
          exitCode: 0,
          output: MOCK_TFQ_RESPONSES.EMPTY_QUEUE,
          error: '',
          duration: 100
        })
        .mockResolvedValueOnce(MOCK_COMMIT_RESPONSES.SUCCESS);

      const dependencies = setupDependencies(config);
      const result = await dependencies.loopController.execute();

      expect(result.exitCode).toBe(2); // EXECUTION_ERROR for MAX_ITERATIONS_REACHED
      expect(result.completedIterations).toBe(1);
      expect(result.exitReason).toBe(ExitReason.MAX_ITERATIONS_REACHED);
      expect(result.iterations).toHaveLength(1);
      expect(result.iterations[0]?.success).toBe(true);
      expect(result.iterations[0]?.taskNumber).toBe('5');
    });
  });

  describe('TFQ Queue Blocking', () => {
    it('should exit early when TFQ queue has items', async () => {
      // Mock: TFQ has items -> Exit immediately
      mockCommandRunner.executeShell.mockResolvedValueOnce({
        success: true,
        exitCode: 0,
        output: MOCK_TFQ_RESPONSES.NON_EMPTY_QUEUE,
        error: '',
        duration: 100
      });

      const dependencies = setupDependencies(config);
      const result = await dependencies.loopController.execute();

      expect(result.exitCode).toBe(0);
      expect(result.completedIterations).toBe(0);
      expect(result.exitReason).toBe(ExitReason.TFQ_QUEUE_NOT_EMPTY);
      expect(result.iterations).toHaveLength(1);
      expect(result.iterations[0]?.success).toBe(false);
    });
  });

  describe('All Tasks Completed', () => {
    it('should exit successfully when all tasks are completed', async () => {
      // Mock: TFQ empty -> All tasks completed
      mockCommandRunner.executeShell
        .mockResolvedValueOnce({
          success: true,
          exitCode: 0,
          output: MOCK_TFQ_RESPONSES.EMPTY_QUEUE,
          error: '',
          duration: 100
        })
        .mockResolvedValueOnce({
          success: true,
          exitCode: 0,
          output: MOCK_TASK_RESPONSES.ALL_TASKS_COMPLETED,
          error: '',
          duration: 200
        });

      const dependencies = setupDependencies(config);
      const result = await dependencies.loopController.execute();

      expect(result.exitCode).toBe(0);
      expect(result.completedIterations).toBe(0);
      expect(result.exitReason).toBe(ExitReason.ALL_TASKS_COMPLETED);
      expect(result.iterations).toHaveLength(1);
    });
  });

  describe('No Task Files', () => {
    it('should exit with error when no task files found', async () => {
      // Mock: TFQ empty -> No task files
      mockCommandRunner.executeShell
        .mockResolvedValueOnce({
          success: true,
          exitCode: 0,
          output: MOCK_TFQ_RESPONSES.EMPTY_QUEUE,
          error: '',
          duration: 100
        })
        .mockResolvedValueOnce({
          success: true,
          exitCode: 0,
          output: MOCK_TASK_RESPONSES.NO_TASK_FILES,
          error: '',
          duration: 200
        });

      const dependencies = setupDependencies(config);
      const result = await dependencies.loopController.execute();

      expect(result.exitCode).toBe(1);
      expect(result.completedIterations).toBe(0);
      expect(result.exitReason).toBe(ExitReason.NO_TASK_FILES);
    });
  });

  describe('Task Execution Failure', () => {
    it('should continue to next iteration on task failure', async () => {
      config.maxIterations = 2;

      // Mock: First iteration fails, second iteration succeeds
      mockCommandRunner.executeShell
        // First iteration
        .mockResolvedValueOnce({
          success: true,
          exitCode: 0,
          output: MOCK_TFQ_RESPONSES.EMPTY_QUEUE,
          error: '',
          duration: 100
        })
        .mockResolvedValueOnce({
          success: true,
          exitCode: 0,
          output: MOCK_TASK_RESPONSES.NEXT_TASK_AVAILABLE,
          error: '',
          duration: 200
        })
        .mockResolvedValueOnce(MOCK_EXECUTION_RESULTS.FAILURE)
        // Second iteration
        .mockResolvedValueOnce({
          success: true,
          exitCode: 0,
          output: MOCK_TFQ_RESPONSES.EMPTY_QUEUE,
          error: '',
          duration: 100
        })
        .mockResolvedValueOnce({
          success: true,
          exitCode: 0,
          output: MOCK_TASK_RESPONSES.NEXT_TASK_AVAILABLE,
          error: '',
          duration: 200
        })
        .mockResolvedValueOnce(MOCK_EXECUTION_RESULTS.SUCCESS)
        .mockResolvedValueOnce({
          success: true,
          exitCode: 0,
          output: MOCK_TFQ_RESPONSES.EMPTY_QUEUE,
          error: '',
          duration: 100
        })
        .mockResolvedValueOnce(MOCK_COMMIT_RESPONSES.SUCCESS);

      const dependencies = setupDependencies(config);
      const result = await dependencies.loopController.execute();

      expect(result.exitCode).toBe(2);
      expect(result.completedIterations).toBe(1);
      expect(result.iterations).toHaveLength(2);
      expect(result.iterations[0]?.success).toBe(false);
      expect(result.iterations[1]?.success).toBe(true);
    });
  });

  describe('Auto-commit Disabled', () => {
    it('should skip commit when auto-commit is disabled', async () => {
      config.autoCommit = false;
      config.maxIterations = 1; // Only run one iteration

      mockCommandRunner.executeShell
        .mockResolvedValueOnce({
          success: true,
          exitCode: 0,
          output: MOCK_TFQ_RESPONSES.EMPTY_QUEUE,
          error: '',
          duration: 100
        })
        .mockResolvedValueOnce({
          success: true,
          exitCode: 0,
          output: MOCK_TASK_RESPONSES.NEXT_TASK_AVAILABLE,
          error: '',
          duration: 200
        })
        .mockResolvedValueOnce(MOCK_EXECUTION_RESULTS.SUCCESS);

      const dependencies = setupDependencies(config);
      const result = await dependencies.loopController.execute();

      expect(result.iterations[0]?.success).toBe(true);
      expect(result.iterations[0]?.commitResult).toBeUndefined();
      
      // Should only call executeShell 3 times (no commit call)
      expect(mockCommandRunner.executeShell).toHaveBeenCalledTimes(3);
    });
  });
});
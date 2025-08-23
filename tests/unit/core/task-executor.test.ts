import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskExecutor } from '../../../src/core/task-executor';
import { CommandRunner } from '../../../src/utils/command-runner';
import { LoopConfig } from '../../../src/types/config';
import { MOCK_TASK_RESPONSES, MOCK_EXECUTION_RESULTS } from '../../fixtures/mock-responses';

// Mock CommandRunner
vi.mock('../../../src/utils/command-runner');
const MockCommandRunner = CommandRunner as any;

describe('TaskExecutor', () => {
  let taskExecutor: TaskExecutor;
  let mockCommandRunner: any;
  let config: LoopConfig;

  beforeEach(() => {
    mockCommandRunner = new MockCommandRunner() as any;
    taskExecutor = new TaskExecutor(mockCommandRunner);
    config = {
      taskNumber: '5',
      tasksDirectory: './tasks',
      projectDirectory: './project',
      maxIterations: 20,
      timeoutMs: 120000,
      autoCommit: true,
      verbose: false,
      skipPermissions: true
    };
  });

  describe('showNextTask', () => {
    it('should return available task info', async () => {
      mockCommandRunner.executeShell.mockResolvedValue({
        success: true,
        exitCode: 0,
        output: MOCK_TASK_RESPONSES.NEXT_TASK_AVAILABLE,
        error: '',
        duration: 500
      });

      const taskInfo = await taskExecutor.showNextTask(config);

      expect(taskInfo).toEqual({
        number: '5',
        available: true,
        allCompleted: false,
        output: MOCK_TASK_RESPONSES.NEXT_TASK_AVAILABLE
      });
    });

    it('should detect all tasks completed', async () => {
      mockCommandRunner.executeShell.mockResolvedValue({
        success: true,
        exitCode: 0,
        output: MOCK_TASK_RESPONSES.ALL_TASKS_COMPLETED,
        error: '',
        duration: 300
      });

      const taskInfo = await taskExecutor.showNextTask(config);

      expect(taskInfo).toEqual({
        available: false,
        allCompleted: true,
        output: MOCK_TASK_RESPONSES.ALL_TASKS_COMPLETED
      });
    });

    it('should detect no task files', async () => {
      mockCommandRunner.executeShell.mockResolvedValue({
        success: true,
        exitCode: 0,
        output: MOCK_TASK_RESPONSES.NO_TASK_FILES,
        error: '',
        duration: 200
      });

      const taskInfo = await taskExecutor.showNextTask(config);

      expect(taskInfo).toEqual({
        available: false,
        allCompleted: false,
        output: MOCK_TASK_RESPONSES.NO_TASK_FILES,
        noTaskFiles: true
      });
    });

    it('should handle task without extractable number', async () => {
      mockCommandRunner.executeShell.mockResolvedValue({
        success: true,
        exitCode: 0,
        output: MOCK_TASK_RESPONSES.TASK_WITHOUT_NUMBER,
        error: '',
        duration: 400
      });

      const taskInfo = await taskExecutor.showNextTask(config);

      expect(taskInfo).toEqual({
        number: undefined,
        available: true,
        allCompleted: false,
        output: MOCK_TASK_RESPONSES.TASK_WITHOUT_NUMBER
      });
    });

    it('should build correct command for show-next-task', async () => {
      mockCommandRunner.executeShell.mockResolvedValue({
        success: true,
        exitCode: 0,
        output: '',
        error: '',
        duration: 100
      });

      await taskExecutor.showNextTask(config);

      expect(mockCommandRunner.executeShell).toHaveBeenCalledWith(
        'claude --dangerously-skip-permissions -p "/show-next-task 5 ./tasks"'
      );
    });
  });

  describe('workNextTask', () => {
    it('should execute work-next-task successfully', async () => {
      mockCommandRunner.executeShell.mockResolvedValue(MOCK_EXECUTION_RESULTS.SUCCESS);

      const result = await taskExecutor.workNextTask(config);

      expect(result).toEqual(MOCK_EXECUTION_RESULTS.SUCCESS);
      expect(mockCommandRunner.executeShell).toHaveBeenCalledWith(
        'claude --dangerously-skip-permissions -p "/work-next-task 5 ./tasks ./project"'
      );
    });

    it('should handle work-next-task failure', async () => {
      mockCommandRunner.executeShell.mockResolvedValue(MOCK_EXECUTION_RESULTS.FAILURE);

      const result = await taskExecutor.workNextTask(config);

      expect(result).toEqual(MOCK_EXECUTION_RESULTS.FAILURE);
    });

    it('should build command with empty placeholders', async () => {
      const configWithoutTaskNumber: LoopConfig = {
        projectDirectory: './project',
        maxIterations: 20,
        timeoutMs: 120000,
        autoCommit: true,
        verbose: false,
        skipPermissions: true
      };

      mockCommandRunner.executeShell.mockResolvedValue(MOCK_EXECUTION_RESULTS.SUCCESS);

      await taskExecutor.workNextTask(configWithoutTaskNumber);

      expect(mockCommandRunner.executeShell).toHaveBeenCalledWith(
        'claude --dangerously-skip-permissions -p "/work-next-task \"\" \"\" ./project"'
      );
    });

    it('should handle paths with spaces', async () => {
      const configWithSpaces: LoopConfig = {
        tasksDirectory: './my tasks',
        projectDirectory: './my project',
        maxIterations: 20,
        timeoutMs: 120000,
        autoCommit: true,
        verbose: false,
        skipPermissions: true
      };

      mockCommandRunner.executeShell.mockResolvedValue(MOCK_EXECUTION_RESULTS.SUCCESS);

      await taskExecutor.workNextTask(configWithSpaces);

      expect(mockCommandRunner.executeShell).toHaveBeenCalledWith(
        'claude --dangerously-skip-permissions -p "/work-next-task \"\" \"./my tasks\" \"./my project\""'
      );
    });
  });
});
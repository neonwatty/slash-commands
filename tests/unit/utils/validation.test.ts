import { describe, it, expect } from 'vitest';
import { CommandArgsBuilder, extractTaskNumber, validateConfig, ValidationError } from '../../../src/utils/validation';
import { LoopConfig } from '../../../src/types/config';

describe('CommandArgsBuilder', () => {
  describe('buildShowTaskArgs', () => {
    it('should build args with task number only', () => {
      const config: LoopConfig = {
        taskNumber: '5',
        maxIterations: 20,
        timeoutMs: 120000,
        autoCommit: true,
        verbose: false,
        skipPermissions: true
      };

      const args = CommandArgsBuilder.buildShowTaskArgs(config);
      expect(args).toEqual(['5']);
    });

    it('should build args with task number and tasks directory', () => {
      const config: LoopConfig = {
        taskNumber: '3',
        tasksDirectory: './tasks',
        maxIterations: 20,
        timeoutMs: 120000,
        autoCommit: true,
        verbose: false,
        skipPermissions: true
      };

      const args = CommandArgsBuilder.buildShowTaskArgs(config);
      expect(args).toEqual(['3', './tasks']);
    });

    it('should build empty args when no parameters', () => {
      const config: LoopConfig = {
        maxIterations: 20,
        timeoutMs: 120000,
        autoCommit: true,
        verbose: false,
        skipPermissions: true
      };

      const args = CommandArgsBuilder.buildShowTaskArgs(config);
      expect(args).toEqual([]);
    });
  });

  describe('buildWorkTaskArgs', () => {
    it('should build args with all parameters', () => {
      const config: LoopConfig = {
        taskNumber: '5',
        tasksDirectory: './tasks',
        projectDirectory: './project',
        maxIterations: 20,
        timeoutMs: 120000,
        autoCommit: true,
        verbose: false,
        skipPermissions: true
      };

      const args = CommandArgsBuilder.buildWorkTaskArgs(config);
      expect(args).toEqual(['5', './tasks', './project']);
    });

    it('should use empty placeholders correctly', () => {
      const config: LoopConfig = {
        projectDirectory: './project',
        maxIterations: 20,
        timeoutMs: 120000,
        autoCommit: true,
        verbose: false,
        skipPermissions: true
      };

      const args = CommandArgsBuilder.buildWorkTaskArgs(config);
      expect(args).toEqual(['""', '""', './project']);
    });
  });

  describe('buildCommitArgs', () => {
    it('should return task number as array when provided', () => {
      const args = CommandArgsBuilder.buildCommitArgs('5');
      expect(args).toEqual(['5']);
    });

    it('should return empty array when no task number', () => {
      const args = CommandArgsBuilder.buildCommitArgs();
      expect(args).toEqual([]);
    });
  });
});

describe('extractTaskNumber', () => {
  it('should extract task number from "Next Task" pattern', () => {
    const output = '## Next Task: 5\n\nTask details...';
    expect(extractTaskNumber(output)).toBe('5');
  });

  it('should extract task number from "Task" pattern as fallback', () => {
    const output = 'Task 3\n\nSome task description';
    expect(extractTaskNumber(output)).toBe('3');
  });

  it('should return undefined when no task number found', () => {
    const output = 'No task numbers here';
    expect(extractTaskNumber(output)).toBeUndefined();
  });

  it('should prefer "Next Task" pattern over "Task" pattern', () => {
    const output = 'Task 1\n## Next Task: 5\nTask details...';
    expect(extractTaskNumber(output)).toBe('5');
  });
});

describe('validateConfig', () => {
  it('should not throw for valid config', () => {
    const config = {
      maxIterations: 10,
      timeoutMs: 60000
    };

    expect(() => validateConfig(config)).not.toThrow();
  });

  it('should throw for invalid maxIterations', () => {
    const config = {
      maxIterations: 0
    };

    expect(() => validateConfig(config)).toThrow(ValidationError);
    expect(() => validateConfig(config)).toThrow('maxIterations must be a positive number');
  });

  it('should throw for invalid timeoutMs', () => {
    const config = {
      timeoutMs: -1000
    };

    expect(() => validateConfig(config)).toThrow(ValidationError);
    expect(() => validateConfig(config)).toThrow('timeoutMs must be a positive number');
  });
});
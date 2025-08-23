import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CommandRunner } from '../../../src/utils/command-runner'

// Mock execa with Vitest - much cleaner!
vi.mock('execa', () => ({
  execa: vi.fn()
}))

const mockExeca = vi.mocked((await import('execa')).execa)

describe('CommandRunner', () => {
  let commandRunner: CommandRunner;

  beforeEach(() => {
    commandRunner = new CommandRunner(5000);
    mockExeca.mockReset();
  });

  describe('execute', () => {
    it('should execute command successfully', async () => {
      // Mock Date.now to return specific times for this test
      const mockNow = vi.spyOn(Date, 'now')
        .mockReturnValueOnce(1000) // Start time
        .mockReturnValueOnce(1100); // End time (100ms later)
        
      mockExeca.mockResolvedValue({
        exitCode: 0,
        stdout: 'success output',
        stderr: '',
        all: undefined,
        command: 'test',
        escapedCommand: 'test',
        failed: false,
        killed: false,
        signal: undefined,
        signalDescription: undefined,
        timedOut: false,
        isCanceled: false,
        shortMessage: '',
        originalMessage: '',
        cwd: process.cwd(),
        durationMs: 100,
        pipedFrom: undefined
      });

      const result = await commandRunner.execute('echo', ['hello']);

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.output).toBe('success output');
      expect(result.error).toBe('');
      expect(result.duration).toBe(100);
      
      mockNow.mockRestore();
    });

    it('should handle command failure', async () => {
      mockExeca.mockResolvedValue({
        exitCode: 1,
        stdout: '',
        stderr: 'error message',
        all: undefined,
        command: 'test',
        escapedCommand: 'test',
        failed: true,
        killed: false,
        signal: undefined,
        signalDescription: undefined,
        timedOut: false,
        isCanceled: false,
        shortMessage: '',
        originalMessage: '',
        cwd: process.cwd(),
        durationMs: 100,
        pipedFrom: undefined
      });

      const result = await commandRunner.execute('false');

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.output).toBe('');
      expect(result.error).toBe('error message');
    });

    it('should handle execution timeout', async () => {
      mockExeca.mockRejectedValue(new Error('Command timed out'));

      const result = await commandRunner.execute('sleep', ['10']);

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(-1);
      expect(result.error).toContain('Command timed out');
    });
  });

  describe('executeShell', () => {
    it('should execute shell command successfully', async () => {
      mockExeca.mockResolvedValue({
        exitCode: 0,
        stdout: 'shell output',
        stderr: '',
        all: undefined,
        command: 'sh',
        escapedCommand: 'sh',
        failed: false,
        killed: false,
        signal: undefined,
        signalDescription: undefined,
        timedOut: false,
        isCanceled: false,
        shortMessage: '',
        originalMessage: '',
        cwd: process.cwd(),
        durationMs: 100,
        pipedFrom: undefined
      });

      const result = await commandRunner.executeShell('echo "hello world"');

      expect(result.success).toBe(true);
      expect(result.output).toBe('shell output');
      expect(mockExeca).toHaveBeenCalledWith('sh', ['-c', 'echo "hello world"'], expect.any(Object));
    });
  });
});
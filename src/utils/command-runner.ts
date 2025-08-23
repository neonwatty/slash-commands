import { execa } from 'execa';
import { ExecutionResult } from '../types/status';

export class CommandRunner {
  constructor(private timeoutMs: number = 120000) {}

  async execute(command: string, args: string[] = []): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      const result = await execa(command, args, {
        timeout: this.timeoutMs,
        reject: false // Don't throw on non-zero exit codes
      });
      
      const duration = Date.now() - startTime;
      
      return {
        success: result.exitCode === 0,
        exitCode: result.exitCode,
        output: result.stdout,
        error: result.stderr,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error && typeof error === 'object' && 'exitCode' in error) {
        const execaError = error as { exitCode?: number; stdout?: string; stderr?: string; message: string };
        return {
          success: false,
          exitCode: execaError.exitCode ?? -1,
          output: execaError.stdout || '',
          error: execaError.stderr || execaError.message,
          duration
        };
      }
      
      return {
        success: false,
        exitCode: -1,
        output: '',
        error: error instanceof Error ? error.message : String(error),
        duration
      };
    }
  }

  async executeShell(command: string): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      const result = await execa('sh', ['-c', command], {
        timeout: this.timeoutMs,
        reject: false
      });
      
      const duration = Date.now() - startTime;
      
      return {
        success: result.exitCode === 0,
        exitCode: result.exitCode,
        output: result.stdout,
        error: result.stderr,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error && typeof error === 'object' && 'exitCode' in error) {
        const execaError = error as { exitCode?: number; stdout?: string; stderr?: string; message: string };
        return {
          success: false,
          exitCode: execaError.exitCode ?? -1,
          output: execaError.stdout || '',
          error: execaError.stderr || execaError.message,
          duration
        };
      }
      
      return {
        success: false,
        exitCode: -1,
        output: '',
        error: error instanceof Error ? error.message : String(error),
        duration
      };
    }
  }
}
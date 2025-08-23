import { z } from 'zod';

export const ConfigSchema = z.object({
  taskNumber: z.string().optional(),
  tasksDirectory: z.string().optional(),
  projectDirectory: z.string().optional(),
  maxIterations: z.number().int().positive().default(20),
  timeoutMs: z.number().int().positive().default(120000),
  autoCommit: z.boolean().default(true),
  verbose: z.boolean().default(false),
  skipPermissions: z.boolean().default(true)
});

export type LoopConfig = z.infer<typeof ConfigSchema>;

export interface TaskArgs {
  taskNumber?: string;
  tasksDirectory?: string;
  projectDirectory?: string;
}
import { z } from 'zod';
import { lifecycleCommandSchema } from './lifecycle-command-schema';

export const configSchema = z.object({
  lifecycle: z.object({
    start: z.array(lifecycleCommandSchema),
    stop: z.array(lifecycleCommandSchema),
  }),
  screenshots: z
    .object({
      diffThreshold: z.number().optional(),
    })
    .optional(),
  output: z
    .object({
      console: z.boolean().optional(),
      text: z.boolean().optional(),
    })
    .optional(),
});

export type Config = z.infer<typeof configSchema>;

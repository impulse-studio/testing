import { z } from "zod";

export const lifecycleCommandSchema = z
  .object({
    command: z.string(),
    timeout: z.number().optional(),
    keepAlive: z.boolean().optional(),
  })
  .refine((data) => !(data.timeout !== undefined && data.keepAlive === true), {
    message:
      "Cannot use both 'timeout' and 'keepAlive' - timeout waits for command completion while keepAlive runs indefinitely",
  });

export type LifecycleCommand = z.infer<typeof lifecycleCommandSchema>;

import * as z from 'zod';

export const jobrunoutput = z.object({
  path: z.string().min(1).max(255),
});

export type JobRunOutput = z.infer<typeof jobrunoutput>;

import * as z from 'zod';

export const error_msg_scheme = z
  .object({
    message: z.string(),
  })
  .describe('Error message');

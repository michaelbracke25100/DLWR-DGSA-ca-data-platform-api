import * as z from 'zod';

export const websocket_message = z.object({
  job_id: z.string(),
  run_id: z.string(),
  state: z.string(),
});

export type websocket_message = z.infer<typeof websocket_message>;

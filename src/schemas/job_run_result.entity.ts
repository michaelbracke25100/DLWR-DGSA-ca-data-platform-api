import * as z from 'zod';
import {uuid_uppercase} from './uuid_uppercase';

export const job_run_result_schema = z.object({
  job_id: uuid_uppercase,
  job_name: z.string(),
  run_id: z.string().uuid().min(1),
  run_executor: z.string(),
  run_parameters_hash: z.string(),
  run_state: z.string(),
  metadata: z.object({
    queued_time: z.string().datetime().nullable(),
    start_time: z.string().datetime().nullable(),
    estimated_duration: z.number().nullable(),
    end_time: z.string().datetime().nullable(),
    priority: z.number(),
    // retry_count: z.number(),
    logs: z
      .array(
        z.object({
          log_timestamp: z.date(),
          log_message: z.string(),
        }),
      )
      .nullable(),
  }),
  result: z
    .object({
      type: z.enum(['JSON', 'CSV', 'XML', 'BINARY', 'ERROR']),
      location: z.string(),
      size: z.string().nullable(),
    })
    .nullable(),
});

export type JobRunResult = z.infer<typeof job_run_result_schema>;

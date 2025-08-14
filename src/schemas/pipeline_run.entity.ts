import {z} from 'zod';
import {uuid_uppercase} from './uuid_uppercase';
export enum PipelineRunState {
  REQUESTED = 'REQUESTED',
  QUEUED = 'QUEUED',
  ESTIMATING = 'ESTIMATING',
  IN_PROGRESS = 'IN_PROGRESS',
  SUCCESSFUL = 'SUCCESSFUL',
  FAILED = 'FAILED',
}
export const pipelinerun_entity_schema = z.object({
  run_id: z.string().uuid().min(1),
  job_id: uuid_uppercase,
  pipeline_id: uuid_uppercase,
  run_parameters_compressed: z.string().min(1),
  run_parameters_hash: z.string().min(1),
  state: z.string().min(1),
  queued_time: z.date().nullable(),
  start_time: z.date().nullable(),
  estimated_duration: z.number().nullable(),
  end_time: z.date().nullable(),
  modified_by: z
    .object({
      name: z.string().min(1).nullable(),
      user_id: z.string().min(1).nullable(),
    })
    .nullable(),
  logs: z
    .array(
      z.object({
        log_timestamp: z.date(),
        log_message: z.string(),
      }),
    )
    .nullable(),
});

export const pipelinerun_array_entity_schema = z.array(pipelinerun_entity_schema);

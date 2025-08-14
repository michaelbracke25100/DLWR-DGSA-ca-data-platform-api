import * as z from 'zod';
import {cronSchema} from './cron';

export const job_parameter_object_array_oracle_schema = z.array(
  z.object({
    type: z.string().min(1).max(100),
    origin_schema_name: z.string().min(1).max(255),
    origin_object_name: z.string().min(1).max(255),
    destination_schema_name: z.string().min(1).max(255),
    destination_object_name: z.string().min(1).max(255),
    columns: z.array(z.string().min(1)).optional().nullable(),
    query: z.string().min(1).optional(),
  }),
);

export const job_parameters_oracle_schema = z.object({
  name: z.string().min(1).max(255),
  pipeline_id: z.string().min(1).uuid(),
  cron: cronSchema.nullable(),
  parameters: z.object({
    queued_time: z.string().datetime().min(1),
    privacy_level: z.string().min(1),
    oracle_connectionstring_kv_name: z.string().min(1).max(255),
    objects: job_parameter_object_array_oracle_schema,
  }),
});

export const job_parameter_object_array_transform_schema = z.array(
  z.object({
    type: z.string().min(1).max(100),
    destination_schema_name: z.string().min(1).max(255),
    destination_object_name: z.string().min(1).max(255),
    query: z.string().min(1),
  }),
);

export const job_parameters_transform_schema = z.object({
  name: z.string().min(1).max(255),
  pipeline_id: z.string().min(1).uuid(),
  cron: cronSchema.nullable(),
  parameters: z.object({
    queued_time: z.string().datetime().min(1),
    privacy_level: z.string().min(1),
    objects: job_parameter_object_array_transform_schema,
  }),
});

export type JobParametersOracle = z.infer<typeof job_parameters_oracle_schema>;
export type JobParametersObjectsArrayOracle = z.infer<typeof job_parameter_object_array_oracle_schema>;

export type JobParametersTransform = z.infer<typeof job_parameters_transform_schema>;
export type JobParametersObjectsArrayTransform = z.infer<typeof job_parameter_object_array_transform_schema>;

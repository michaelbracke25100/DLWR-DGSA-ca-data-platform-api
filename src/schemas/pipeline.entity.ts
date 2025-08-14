import * as z from 'zod';
import {cronSchema} from './cron';
import {pipeline_parameters_oracle_schema, pipeline_parameters_transform_schema} from './pipeline.parameters';
import {uuid_uppercase} from './uuid_uppercase';

export enum PipelineState {
  ENABLED = 'ENABLED',
  DISABLED = 'DISABLED',
  DELETED = 'DELETED',
  ERROR = 'ERROR',
}
export enum PipelineType {
  DATABASE_SYNCHRONIZATION = 'DATABASE_SYNCHRONIZATION',
  FILE_SYNCHRONIZATION = 'FILE_SYNCHRONIZATION',
  DATABASE_TRANSFORMATION = 'DATABASE_TRANSFORMATION',
}

export enum PipelinePrivacyLevel {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export const pipeline_entity_schema = z.discriminatedUnion('type', [
  z.object({
    name: z.string().min(1).max(255),
    description: z.string().nullable(),
    parameters: pipeline_parameters_oracle_schema, // z.union([pipeline_parameters_oracle_schema, z.any()])
    job_id: uuid_uppercase,
    pipeline_id: uuid_uppercase,
    privacy_level: z.enum([PipelinePrivacyLevel.PRIVATE, PipelinePrivacyLevel.PUBLIC]),
    type: z.enum([PipelineType.DATABASE_SYNCHRONIZATION]),
    linkedservice_id: uuid_uppercase,
    state: z.enum([PipelineState.ENABLED, PipelineState.DISABLED, PipelineState.ERROR, PipelineState.DELETED]), // Replace with actual PipelineState enum values
    cron: cronSchema.nullable(),
    modified_by: z
      .object({
        name: z.string().min(1).nullable(),
        user_id: z.string().min(1).nullable(),
      })
      .nullable(),
    owner: z
      .object({
        name: z.string().min(1).nullable(),
        user_id: z.string().min(1).nullable(),
      })
      .nullable(),
    deleted_date: z.date().nullable(),
    created_date: z.date().nullable(),
    modified_date: z.date().nullable(),
    metadata: z.object({
      business_unit: z.string().min(1).nullable(),
      it_solution: z.string().min(1).nullable(),
      eurovoc_subjects: z.string().min(1).nullable(),
      business_data_owner: z.string().min(1).nullable(),
      business_data_steward: z.string().min(1).nullable(),
      technical_data_steward: z.string().min(1).nullable(),
      domain: z.string().min(1).nullable(),
      sub_domain: z.string().min(1).nullable(),
    }),
    user_groups: z.array(z.string()).nullable(),
  }),
  z.object({
    name: z.string().min(1).max(255),
    description: z.string().nullable(),
    parameters: pipeline_parameters_transform_schema, // z.union([pipeline_parameters_transform_schema, z.any()])
    job_id: uuid_uppercase,
    pipeline_id: uuid_uppercase,
    privacy_level: z.enum([PipelinePrivacyLevel.PRIVATE, PipelinePrivacyLevel.PUBLIC]),
    type: z.enum([PipelineType.DATABASE_TRANSFORMATION]),
    state: z.enum([PipelineState.ENABLED, PipelineState.DISABLED, PipelineState.ERROR, PipelineState.DELETED]), // Replace with actual PipelineState enum values
    cron: cronSchema.nullable(),
    modified_by: z
      .object({
        name: z.string().min(1).nullable(),
        user_id: z.string().min(1).nullable(),
      })
      .nullable(),
    owner: z
      .object({
        name: z.string().min(1).nullable(),
        user_id: z.string().min(1).nullable(),
      })
      .nullable(),
    deleted_date: z.date().nullable(),
    created_date: z.date().nullable(),
    modified_date: z.date().nullable(),
    metadata: z.object({
      business_unit: z.string().min(1).nullable(),
      it_solution: z.string().min(1).nullable(),
      eurovoc_subjects: z.string().min(1).nullable(),
      business_data_owner: z.string().min(1).nullable(),
      business_data_steward: z.string().min(1).nullable(),
      technical_data_steward: z.string().min(1).nullable(),
      domain: z.string().min(1).nullable(),
      sub_domain: z.string().min(1).nullable(),
    }),
    user_groups: z.array(z.string()).nullable(),
  }),
]);

export const post_pipeline_entity_schema = z.discriminatedUnion('type', [
  z.object({
    name: z.string().min(1).max(255),
    description: z.string().nullable(),
    parameters: pipeline_parameters_oracle_schema, // z.union([pipeline_parameters_oracle_schema, z.any()])
    privacy_level: z.enum([PipelinePrivacyLevel.PRIVATE, PipelinePrivacyLevel.PUBLIC]),
    type: z.enum([PipelineType.DATABASE_SYNCHRONIZATION]),
    job_id: uuid_uppercase,
    linkedservice_id: uuid_uppercase,
    cron: cronSchema.nullable(),
    modified_by: z
      .object({
        name: z.string().min(1).nullable(),
        user_id: z.string().min(1).nullable(),
      })
      .nullable(),
    owner: z
      .object({
        name: z.string().min(1).nullable(),
        user_id: z.string().min(1).nullable(),
      })
      .nullable(),
    metadata: z.object({
      business_unit: z.string().min(1).nullable(),
      it_solution: z.string().min(1).nullable(),
      eurovoc_subjects: z.string().min(1).nullable(),
      business_data_owner: z.string().min(1).nullable(),
      business_data_steward: z.string().min(1).nullable(),
      technical_data_steward: z.string().min(1).nullable(),
      domain: z.string().min(1).nullable(),
      sub_domain: z.string().min(1).nullable(),
    }),
    user_groups: z.array(z.string()).nullable(),
  }),
  z.object({
    name: z.string().min(1).max(255),
    description: z.string().nullable(),
    parameters: pipeline_parameters_transform_schema, // z.union([pipeline_parameters_oracle_schema, z.any()])
    privacy_level: z.enum([PipelinePrivacyLevel.PRIVATE, PipelinePrivacyLevel.PUBLIC]),
    type: z.enum([PipelineType.DATABASE_TRANSFORMATION]),
    job_id: uuid_uppercase,
    linkedservice_id: z.string().optional().nullable(),
    cron: cronSchema.nullable(),
    modified_by: z
      .object({
        name: z.string().min(1).nullable(),
        user_id: z.string().min(1).nullable(),
      })
      .nullable(),
    owner: z
      .object({
        name: z.string().min(1).nullable(),
        user_id: z.string().min(1).nullable(),
      })
      .nullable(),
    metadata: z.object({
      business_unit: z.string().min(1).nullable(),
      it_solution: z.string().min(1).nullable(),
      eurovoc_subjects: z.string().min(1).nullable(),
      business_data_owner: z.string().min(1).nullable(),
      business_data_steward: z.string().min(1).nullable(),
      technical_data_steward: z.string().min(1).nullable(),
      domain: z.string().min(1).nullable(),
      sub_domain: z.string().min(1).nullable(),
    }),
    user_groups: z.array(z.string()).nullable(),
  }),
]);

export const put_pipeline_entity_schema = z.discriminatedUnion('type', [
  z.object({
    name: z.string().min(1).max(255),
    description: z.string().nullable(),
    parameters: pipeline_parameters_oracle_schema, // z.union([pipeline_parameters_oracle_schema, z.any()])
    privacy_level: z.enum([PipelinePrivacyLevel.PRIVATE, PipelinePrivacyLevel.PUBLIC]),
    type: z.enum([PipelineType.DATABASE_SYNCHRONIZATION]),
    job_id: uuid_uppercase,
    pipeline_id: uuid_uppercase,
    linkedservice_id: uuid_uppercase,
    state: z.enum([PipelineState.ENABLED, PipelineState.DISABLED, PipelineState.ERROR, PipelineState.DELETED]), // Replace with actual PipelineState enum values
    cron: cronSchema.nullable(),
    modified_by: z
      .object({
        name: z.string().min(1).nullable(),
        user_id: z.string().min(1).nullable(),
      })
      .nullable(),
    metadata: z.object({
      business_unit: z.string().min(1).nullable(),
      it_solution: z.string().min(1).nullable(),
      eurovoc_subjects: z.string().min(1).nullable(),
      business_data_owner: z.string().min(1).nullable(),
      business_data_steward: z.string().min(1).nullable(),
      technical_data_steward: z.string().min(1).nullable(),
      domain: z.string().min(1).nullable(),
      sub_domain: z.string().min(1).nullable(),
    }),
    user_groups: z.array(z.string()).nullable(),
  }),
  z.object({
    name: z.string().min(1).max(255),
    description: z.string().nullable(),
    parameters: pipeline_parameters_transform_schema, // z.union([pipeline_parameters_oracle_schema, z.any()])
    privacy_level: z.enum([PipelinePrivacyLevel.PRIVATE, PipelinePrivacyLevel.PUBLIC]),
    type: z.enum([PipelineType.DATABASE_TRANSFORMATION]),
    job_id: uuid_uppercase,
    pipeline_id: uuid_uppercase,
    state: z.enum([PipelineState.ENABLED, PipelineState.DISABLED, PipelineState.ERROR, PipelineState.DELETED]), // Replace with actual PipelineState enum values
    linkedservice_id: z.string().optional().nullable(),
    cron: cronSchema.nullable(),
    modified_by: z
      .object({
        name: z.string().min(1).nullable(),
        user_id: z.string().min(1).nullable(),
      })
      .nullable(),
    metadata: z.object({
      business_unit: z.string().min(1).nullable(),
      it_solution: z.string().min(1).nullable(),
      eurovoc_subjects: z.string().min(1).nullable(),
      business_data_owner: z.string().min(1).nullable(),
      business_data_steward: z.string().min(1).nullable(),
      technical_data_steward: z.string().min(1).nullable(),
      domain: z.string().min(1).nullable(),
      sub_domain: z.string().min(1).nullable(),
    }),
    user_groups: z.array(z.string()).nullable(),
  }),
]);

export type PipelineEntitySchema = z.infer<typeof pipeline_entity_schema>;

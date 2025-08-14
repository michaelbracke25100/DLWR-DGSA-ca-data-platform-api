import * as z from 'zod';
import { uuid_uppercase } from './uuid_uppercase';

export enum DataObjectState {
  UNPUBLISHED = 'UNPUBLISHED',
  PUBLISHED = 'PUBLISHED',
  DELETED = 'DELETED',
}

export enum DataObjectManagedBy {
  DATAOBJECT = 'DATAOBJECT',
  PIPELINE = 'PIPELINE',
}

export const dataobject_metadata_schema = z.object({
  business_unit: z.string().min(1).nullable(),
  it_solution: z.string().min(1).nullable(),
  eurovoc_subjects: z.string().min(1).nullable(),
  business_data_owner: z.string().min(1).nullable(),
  business_data_steward: z.string().min(1).nullable(),
  technical_data_steward: z.string().min(1).nullable(),
  domain: z.string().min(1).nullable(),
  sub_domain: z.string().min(1).nullable(),
});

export const dataobject_entity_schema = z.object({
  dataobject_id: uuid_uppercase,
  pipeline_id: uuid_uppercase.nullable(),
  name: z.string().min(1).max(255),
  type: z.string().min(1),
  state: z.enum([DataObjectState.DELETED, DataObjectState.PUBLISHED, DataObjectState.UNPUBLISHED]),
  modified_by: z
    .object({
      name: z.string().min(1).max(255),
      user_id: z.string().min(1).max(255).nullable(),
    })
    .nullable(),
  uploaded_date: z.date().nullable(),
  modified_date: z.date().nullable(),
  deleted_date: z.date().nullable(),
  metadata: dataobject_metadata_schema.nullable(),
  managed_by: z.enum([DataObjectManagedBy.DATAOBJECT, DataObjectManagedBy.PIPELINE]),
  user_groups: z.array(z.string()).nullable(),
  is_enabled_for_download_apis: z.boolean().optional().default(false),
});

export const dataobject_create_schema = z.object({
  dataobject_id: uuid_uppercase.nullable(),
  name: z.string().min(1).max(255),
  type: z.string().min(1),
  state: z.enum([DataObjectState.DELETED, DataObjectState.PUBLISHED, DataObjectState.UNPUBLISHED]),
  modified_by: z.object({
    name: z.string().min(1).max(255),
    user_id: z.string().min(1).max(255).nullable(),
  }),
  metadata: dataobject_metadata_schema,
  managed_by: z.enum([DataObjectManagedBy.DATAOBJECT, DataObjectManagedBy.PIPELINE]),
  user_groups: z.array(z.string()).nullable(),
  is_enabled_for_download_apis: z.boolean().optional().default(false),
});

export const dataobject_update_schema = z.object({
  dataobject_id: uuid_uppercase,
  name: z.string().min(1).max(255),
  type: z.string().min(1),
  state: z.enum([DataObjectState.DELETED, DataObjectState.PUBLISHED, DataObjectState.UNPUBLISHED]),
  modified_by: z.object({
    name: z.string().min(1).max(255),
    user_id: z.string().min(1).max(255).nullable(),
  }),
  metadata: dataobject_metadata_schema,
  managed_by: z.enum([DataObjectManagedBy.DATAOBJECT, DataObjectManagedBy.PIPELINE]),
  user_groups: z.array(z.string()).nullable(),
  is_enabled_for_download_apis: z.boolean().optional().default(false),
});

export const dataobject_metadata_update_schema = z.object({
  modified_by: z.object({ name: z.string().min(1).max(255).nullable(), user_id: z.string().min(1).max(255).nullable() }),
  metadata: dataobject_metadata_schema.nullable(),
  managed_by: z.enum([DataObjectManagedBy.DATAOBJECT, DataObjectManagedBy.PIPELINE]),
  user_groups: z.array(z.string()).nullable(),
  is_enabled_for_download_apis: z.boolean().optional().default(false),
});

export const dataobject_array_entity_schema = z.array(dataobject_entity_schema);

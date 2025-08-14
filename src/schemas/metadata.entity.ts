import * as z from 'zod';

export const metadata_entity_schema = z.object({
  business_unit: z.string().min(1).nullable(),
  it_solution: z.string().min(1).nullable(),
  eurovoc_subjects: z.string().min(1).nullable(),
  business_data_owner: z.string().min(1).nullable(),
  business_data_steward: z.string().min(1).nullable(),
  technical_data_steward: z.string().min(1).nullable(),
  domain: z.string().min(1).nullable(),
  sub_domain: z.string().min(1).nullable(),
});

export type MetadataSchema = z.infer<typeof metadata_entity_schema>;

import * as z from 'zod';

const noBrackets = z
  .string()
  .min(1)
  .max(255)
  .refine(
    value => {
      return /^[^[\]]+$/.test(value);
    },
    {
      message: "Cannot contain '[' or ']'",
    },
  );

export const pipeline_parameter_object_oracle_schema = z.object({
  type: z.enum(['table', 'view']),
  origin_schema_name: noBrackets,
  origin_object_name: noBrackets,
  destination_schema_name: noBrackets,
  destination_object_name: noBrackets,
  columns: z.array(z.string().min(1)).optional().nullable(),
});

export const pipeline_parameters_oracle_schema = z.object({
  objects: z.array(pipeline_parameter_object_oracle_schema),
});

export const pipeline_parameter_object_transform_schema = z.object({
  type: z.enum(['table', 'view']),
  destination_schema_name: noBrackets,
  destination_object_name: noBrackets,
  query: z.string().min(1),
});

export const pipeline_parameters_transform_schema = z.object({
  objects: z.array(pipeline_parameter_object_transform_schema),
});

export type PipelineParametersOracle = z.infer<typeof pipeline_parameters_oracle_schema>;

export type PipelineParametersTransform = z.infer<typeof pipeline_parameters_transform_schema>;

import * as z from 'zod';

export const synapse_pipeline_response_oracle_details_transformed_schema = z.array(
  z.object({
    schema_name: z.string().min(1).max(255),
    objects: z.array(
      z.object({
        object_name: z.string().min(1).max(255),
        type: z.string().min(1).max(255),
        columns: z.array(
          z.object({
            column_name: z.string().min(1).max(255),
            column_type: z.string().min(1).max(255),
          }),
        ),
      }),
    ),
  }),
);
export const synapse_pipeline_response_oracle_details_schema = z.object({
  result_query: z.object({
    count: z.number(),
    value: z.array(
      z.object({
        SCHEMA_NAME: z.string().min(1).max(255),
        TABLE_NAME: z.string().min(1).max(255),
        COLUMN_NAME: z.string().min(1).max(255),
        DATA_TYPE: z.string().min(1).max(255),
        OBJECT_TYPE: z.string().min(1).max(255),
      }),
    ),
  }),
});
export const synapse_pipeline_request_parameters_schema = z.object({
  queued_time: z.string().datetime().min(1),
  oracle_connectionstring_kv_name: z.string().min(1).max(255),
  objects: z.array(
    z.object({
      type: z.string().min(1),
      origin_schema_name: z.string().min(1).max(255),
      origin_object_name: z.string().min(1).max(255),
      destination_schema_name: z.string().min(1).max(255),
      destination_object_name: z.string().min(1).max(255),
    }),
  ),
});
export const synapse_test_request_parameters_schema = z.object({
  oracle_connectionstring_kv_name: z.string().min(1).max(255),
  query: z.string().min(1),
});

export const synapse_pipeline_request_schema = z.object({
  name: z.string().min(1).max(255),
  pipeline_id: z.string().min(1).max(255),
  cron: z.string().min(1).max(255),
  parameters: synapse_pipeline_request_parameters_schema,
});

export const synapse_pipeline_createrun_response_scheme = z.object({
  runId: z.string().min(1).max(255).describe('run identifier of azure synapse pipeline'),
  error: z
    .object({
      code: z.string(),
      details: z.any(),
      message: z.string(),
      target: z.string(),
    })
    ?.optional(),
});

export const synapse_pipeline_get_pipelineruns_response_scheme = z.object({
  runId: z.string().min(1).max(255).describe('run identifier of azure synapse pipeline'),
  status: z.enum(['Failed', 'Succeeded', 'InProgress', 'Queued']),
  message: z.nullable(z.string()).optional(),
  pipelineReturnValue: z.object({}).passthrough().nullable().optional(),
  error: z
    .nullable(
      z.object({
        code: z.string(),
        details: z.any(),
        message: z.string(),
        target: z.string(),
      }),
    )
    ?.optional(),
});

export const synapse_pipeline_stop_pipelineruns_response_scheme = z.object({
  error: z
    .object({
      code: z.string(),
      details: z.any(),
      message: z.string(),
      target: z.string(),
    })
    ?.optional(),
});

export const synapse_pipeline_get_pipelines_response_scheme = z.object({
  value: z.any(),
});

export const synapse_pipeline_get_pipelinerunslogs_response_scheme = z.object({
  value: z.array(
    z.union([
      z.object({
        activityRunEnd: z.string(),
        activityName: z.string(),
        activityRunStart: z.string(),
        activityType: z.string(),
        durationInMs: z.number(),
        retryAttempt: z.null(),
        error: z.object({
          errorCode: z.string(),
          message: z.string(),
          failureType: z.string(),
          target: z.string(),
        }),
        activityRunId: z.string(),
        input: z.object({}),
        linkedServiceName: z.string(),
        output: z.object({}),
        userProperties: z.object({}),
        pipelineName: z.string(),
        pipelineRunId: z.string(),
        status: z.string(),
      }),
      z.object({
        activityRunEnd: z.string(),
        activityName: z.string(),
        activityRunStart: z.string(),
        activityType: z.string(),
        durationInMs: z.number(),
        retryAttempt: z.null(),
        error: z.object({
          errorCode: z.string(),
          message: z.string(),
          failureType: z.string(),
          target: z.string(),
        }),
        activityRunId: z.string(),
        input: z.object({
          source: z.object({type: z.string()}),
          sink: z.object({type: z.string()}),
          dataIntegrationUnits: z.number(),
        }),
        linkedServiceName: z.string(),
        output: z.object({
          dataRead: z.number(),
          dataWritten: z.number(),
          filesRead: z.number(),
          filesWritten: z.number(),
          copyDuration: z.number(),
          throughput: z.number(),
          errors: z.array(z.unknown()),
          effectiveIntegrationRuntime: z.string(),
          usedCloudDataMovementUnits: z.number(),
          usedParallelCopies: z.number(),
          executionDetails: z.array(
            z.object({
              source: z.object({type: z.string()}),
              sink: z.object({type: z.string()}),
              status: z.string(),
              start: z.string(),
              duration: z.number(),
              usedCloudDataMovementUnits: z.number(),
              usedParallelCopies: z.number(),
              detailedDurations: z.object({
                queuingDuration: z.number(),
                transferDuration: z.number(),
              }),
            }),
          ),
        }),
        userProperties: z.object({}),
        pipelineName: z.string(),
        pipelineRunId: z.string(),
        status: z.string(),
      }),
    ]),
  ),
});

export type synapse_pipeline_request = z.infer<typeof synapse_pipeline_request_schema>;
export type synapse_pipeline_request_parameters = z.infer<typeof synapse_pipeline_request_parameters_schema>;
export type synapse_test_request_parameters_schema = z.infer<typeof synapse_test_request_parameters_schema>;
export type synapse_pipeline_createrun_response = z.infer<typeof synapse_pipeline_createrun_response_scheme>;
export type synapse_pipeline_get_pipelines_response = z.infer<typeof synapse_pipeline_get_pipelines_response_scheme>;
export type synapse_pipeline_get_pipelineruns_response = z.infer<typeof synapse_pipeline_get_pipelineruns_response_scheme>;
export type synapse_pipeline_stop_pipelineruns_response = z.infer<typeof synapse_pipeline_stop_pipelineruns_response_scheme>;
export type synapse_pipeline_get_pipelinerunslogs_response = z.infer<typeof synapse_pipeline_get_pipelinerunslogs_response_scheme>;
export type synapse_pipeline_response_oracle_details_schema = z.infer<typeof synapse_pipeline_response_oracle_details_schema>;
export type synapse_pipeline_response_oracle_details_transformed_schema_type = z.infer<typeof synapse_pipeline_response_oracle_details_transformed_schema>;

import * as z from 'zod';

export enum LinkedServiceType {
  // AZUREKEYVAULTSECRET = 'AZUREKEYVAULTSECRET',
  // AZURESTORAGE = 'AZURESTORAGE',
  ORACLESQL = 'ORACLESQL',
  // AZURESQL = 'AZURESQL',
}
export enum LinkedServiceState {
  CREATED = 'CREATED',
  VALIDATING = 'VALIDATING',
  CONNECTED = 'CONNECTED',
  FAILED = 'FAILED',
  DELETED = 'DELETED',
}
export const config_oraclesql_schema = z.object({
  connectionstring_azurekeyvaultsecret_name: z.string().min(1).max(255),
});
export type ConfigOracleSql = z.infer<typeof config_oraclesql_schema>;
export const config_oraclesql_management_schema = z.object({
  host: z.string().min(1).max(255),
  database: z.string().min(1).max(255),
  port: z.number(),
  user: z.string().min(1).max(255),
  password: z.string().min(1).max(255).nullable(),
});
export type ConfigOracleSqlManagement = z.infer<typeof config_oraclesql_management_schema>;
export const config_oraclesql_result_schema = z.object({
  host: z.string().min(1).max(255).nullable(),
  database: z.string().min(1).max(255).nullable(),
  port: z.number().nullable(),
  user: z.string().min(1).max(255).nullable(),
  password: z.string().min(1).max(255).nullable(),
});
export type ConfigOracleSqlResult = z.infer<typeof config_oraclesql_result_schema>;
export const linkedservice_entity_schema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(LinkedServiceType.ORACLESQL),
    linkedservice_id: z.string(),
    state: z.enum([LinkedServiceState.CONNECTED, LinkedServiceState.DELETED, LinkedServiceState.CREATED, LinkedServiceState.FAILED, LinkedServiceState.VALIDATING]),
    config: config_oraclesql_result_schema,
    created_date: z.date(),
    modified_date: z.date().nullable(),
  }),
]);
export const linkedservice_create_schema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(LinkedServiceType.ORACLESQL),
    config: config_oraclesql_management_schema,
  }),
]);
export const linkedservice_update_schema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(LinkedServiceType.ORACLESQL),
    linkedservice_id: z.string(),
    config: config_oraclesql_management_schema,
  }),
]);

export const linkedservice_array_entity_schema = z.array(linkedservice_entity_schema);

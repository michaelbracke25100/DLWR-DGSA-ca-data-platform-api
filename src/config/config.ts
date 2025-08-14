import * as dotenv from 'dotenv';
import { z, ZodIssue } from 'zod';

dotenv.config({ path: '.env' });

const configSchema = z.object({
  API_SQL_DATABASE: z.string().min(1),
  API_SQL_HOST: z.string().min(1),
  CA_JOBORCHESTRATOR_URL: z.string().min(1),
  ENV: z.enum(['LOCAL', 'DEVELOPMENT', 'TEST', 'PRODUCTION']),
  ID_CLIENTID: z
    .string()
    .min(1)
    .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/),
  KEYVAULT_URL: z.string().min(1),
  SQL_DATABASE: z.string().min(1),
  SQL_HOST: z.string().min(1),
  STORAGE_PRIVINT_NAME: z.string().min(1),
  STORAGE_PUBLEXT_NAME: z.string().min(1),
  SYNAPSE_ENDPOINT: z.string().min(1),
  SYNAPSE_PIPELINE_NAME: z.string().min(1),
  SYNAPSE_PIPELINE_ORACLE_ID: z.string().min(1),
  SYNAPSE_PIPELINE_TRANSFORM_ID: z.string().min(1)
});

export type Config = z.infer<typeof configSchema>;

export let config: Config | null = null;

export function getConfig(): Config {
  if (config === null) {
    config = initializeConfig();
    return config;
  } else {
    return config;
  }
}

export function initializeConfig(): Config {
  const parsed = configSchema.safeParse(process.env);
  if (!parsed.success) {
    const formatted_errors: string[] = parsed.error.errors.map((err: ZodIssue) => {
      return JSON.stringify(err);
    });
    throw new TypeError(formatted_errors.toString());
  }
  return parsed.data;
}

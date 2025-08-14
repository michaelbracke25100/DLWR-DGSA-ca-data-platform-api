import * as z from 'zod';

export const query_validation_body = z.object({
  raw_sql_query: z.string().nonempty({message: 'SQL query must not be empty'}),
});

export const query_validation_return = z.object({
  valid: z.boolean(),
  errormessage: z.any().optional(),
});

import * as z from 'zod';

export const url_schema = z
  .string()
  .regex(/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/, 'Invalid URL')
  .describe('URL');

import * as z from 'zod';

export const uuid_uppercase = z
  .string()
  .uuid()
  .refine(val => val === val.toUpperCase(), {
    message: 'UUID must be uppercase',
  });

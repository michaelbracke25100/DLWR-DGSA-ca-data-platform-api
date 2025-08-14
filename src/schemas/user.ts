import * as z from 'zod';

export const userType = z.object({
  user_id: z.string().optional(),
  user_groups: z.array(z.string()).optional(),
});

export type UserType = z.infer<typeof userType>;

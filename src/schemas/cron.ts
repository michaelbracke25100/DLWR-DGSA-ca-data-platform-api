import {z} from 'zod';

// Custom validation function
const validateCron = (cron: string) => {
  return cron.split(' ').length === 5;
};

// Zod schema with custom validation
export const cronSchema = z.string().refine(validateCron, {
  message: "Invalid cron string format. Expected format: 'minute hour day month weekday'.",
});

export type CronSchema = z.infer<typeof cronSchema>;

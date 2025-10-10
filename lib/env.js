import { z } from 'zod';

const EnvSchema = z.object({
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET is required').optional(),
  NODE_ENV: z.string().optional(),
});

const parsed = EnvSchema.safeParse({
  MONGODB_URI: process.env.MONGODB_URI,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NODE_ENV: process.env.NODE_ENV,
});

if (!parsed.success) {
  const msg = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
  throw new Error(`Invalid environment configuration: ${msg}`);
}

export const env = parsed.data;

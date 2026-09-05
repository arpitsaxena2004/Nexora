import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/nexora'),
  JWT_SECRET: z.string().default('super_secret_nexora_jwt_key_development_only_12345'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  GEMINI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  VECTOR_DIMENSIONS: z.string().default('1536').transform((val) => parseInt(val, 10)),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;

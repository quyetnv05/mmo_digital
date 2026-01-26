import { z } from 'zod';

const envSchema = z.object({
    // Database
    DATABASE_URL: z.string().url(),
    DIRECT_URL: z.string().url().optional(),

    // Authentication
    JWT_SECRET: z.string().min(32, "JWT Secret should be at least 32 chars"),
    NEXTAUTH_URL: z.string().url().optional(),

    // Security & Encryption
    ENCRYPTION_KEY: z.string().min(32, "Encryption key must be 32 bytes (hex/base64) or at least 32 chars long"),

    // Financial (SePay)
    SEPAY_API_KEY: z.string().min(1, "SePay API Key is required"),

    // Upstash Redis (Rate Limiting)
    UPSTASH_REDIS_REST_URL: z.string().url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1, "Upstash Token is required"),

    // AI (Gemini)
    NEXT_PUBLIC_GEMINI_API_KEY: z.string().min(1, "Gemini API Key is required"),

    // Node Env
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const processEnv = {
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    SEPAY_API_KEY: process.env.SEPAY_API_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
};

// Validate immediately
const parsed = envSchema.safeParse(processEnv);

if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.format());
    throw new Error('Invalid environment variables');
}

export const env = parsed.data;

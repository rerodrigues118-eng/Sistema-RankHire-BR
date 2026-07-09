// Type declarations for environment variables used in this project.
// Add any new env vars here to keep TypeScript happy.

declare namespace NodeJS {
  interface ProcessEnv {
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;

    // AI providers
    GROQ_API_KEY?: string;
    GROQ_MODEL?: string;
    GROQ_MODEL_CRITERIA?: string;
    OPENAI_API_KEY?: string;

    // Apify
    APIFY_TOKEN?: string;
    APIFY_ACTOR_ID?: string;

    // Redis (optional)
    REDIS_URL?: string;

    // Next.js
    NODE_ENV: "development" | "production" | "test";
    NEXT_PUBLIC_APP_URL?: string;
  }
}

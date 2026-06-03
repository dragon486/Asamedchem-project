import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load from .env.local first (overrides .env)
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

export default {
  schema: "./lib/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;

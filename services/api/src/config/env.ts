import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    HOST: z.string().default("0.0.0.0"),
    PORT: z.coerce.number().int().min(1).max(65_535).default(8080),
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),
    ALLOWED_ORIGINS: z.string().default("*"),
    DATA_PROVIDER: z.enum(["memory", "google-sheets"]).default("memory"),
    GOOGLE_SHEET_ID: z.string().optional(),
    GOOGLE_SERVICE_ACCOUNT_JSON: z.string().optional(),
    JWT_SECRET: z.string().min(32).default("local-development-only-secret-32-chars"),
    JWT_EXPIRES_IN: z.string().default("8h"),
  })
  .superRefine((value, context) => {
    if (value.DATA_PROVIDER !== "google-sheets") return;

    if (!value.GOOGLE_SHEET_ID) {
      context.addIssue({
        code: "custom",
        path: ["GOOGLE_SHEET_ID"],
        message: "GOOGLE_SHEET_ID is required for the Google Sheets provider",
      });
    }

    if (!value.GOOGLE_SERVICE_ACCOUNT_JSON) {
      context.addIssue({
        code: "custom",
        path: ["GOOGLE_SERVICE_ACCOUNT_JSON"],
        message: "GOOGLE_SERVICE_ACCOUNT_JSON is required for the Google Sheets provider",
      });
    }
  });

export type Environment = z.infer<typeof envSchema>;

export function loadEnvironment(source: NodeJS.ProcessEnv = process.env): Environment {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".") || "environment"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid PandaWise API configuration: ${details}`);
  }

  if (result.data.NODE_ENV === "production" && result.data.JWT_SECRET.includes("development")) {
    throw new Error("Production requires a non-development JWT_SECRET");
  }

  return result.data;
}

export function allowedOrigins(environment: Environment): string[] | true {
  if (environment.ALLOWED_ORIGINS.trim() === "*") return true;
  return environment.ALLOWED_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

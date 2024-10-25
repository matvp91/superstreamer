import { parseEnv } from "shared/env";

export const env = parseEnv((t) => ({
  SERVERLESS: t.Boolean({ default: false }),

  // process
  PORT: t.Number({ default: 52002 }),
  HOST: t.String({ default: "0.0.0.0" }),

  // config.env
  REDIS_HOST: t.String(),
  REDIS_PORT: t.Number(),
  PUBLIC_S3_ENDPOINT: t.String(),
  PUBLIC_STITCHER_ENDPOINT: t.String(),
  STITCHER_SIGNATURE_SECRET: t.String(),
}));

import { createClient } from "redis";
import { env_ } from "shared/env";
import { env } from "./env";
import type { KVNamespace } from "@cloudflare/workers-types";

const workerEnv = env_ as
  | {
      sessions: KVNamespace;
    }
  | undefined;

const REDIS_PREFIX = "stitcher";

export const client = createClient({
  socket: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
});

if (!workerEnv) {
  await client.connect();
}

export const kv = {
  async set(key: string, value: string, ttl: number | "preserve") {
    if (workerEnv) {
      await workerEnv.sessions.put(key, value, {
        expirationTtl: ttl === "preserve" ? 60 * 60 : (ttl ?? 60 * 60),
      });
      return;
    }

    let EX: number | undefined;
    if (ttl === "preserve") {
      EX = await client.ttl(key);
    } else if (ttl) {
      EX = ttl;
    }

    await client.set(`${REDIS_PREFIX}:${key}`, value, {
      EX,
    });
  },
  async get(key: string) {
    if (workerEnv) {
      return await workerEnv.sessions.get(key);
    }

    return await client.get(`${REDIS_PREFIX}:${key}`);
  },
};

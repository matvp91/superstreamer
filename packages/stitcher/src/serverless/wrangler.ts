import { setEnv_ } from "shared/env";
import type { Env } from "bun";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    setEnv_(env);
    const { app } = await import("../app");
    return await app.fetch(request);
  },
};

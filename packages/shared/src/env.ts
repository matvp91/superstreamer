import { Type as t } from "@sinclair/typebox";
import { Value, AssertError } from "@sinclair/typebox/value";
import findConfig from "find-config";
import { config } from "dotenv";
import { formatFails } from "./typebox";

let envConfigLoaded = false;

function loadConfigEnv() {
  if (envConfigLoaded) {
    return;
  }
  const configPath = findConfig("config.env");
  if (configPath) {
    config({ path: configPath });
  }
  envConfigLoaded = true;
}

type ParseEnvResolve<R extends Parameters<typeof t.Object>[0]> = (
  typeBox: typeof t,
) => R;

export let env_: object | null = null;

export function setEnv_(env: object) {
  env_ = env;
}

export function parseEnv<R extends Parameters<typeof t.Object>[0]>(
  resolve: ParseEnvResolve<R>,
) {
  if (!env_) {
    // If we did not explicitly set them, eg; in a serverless env,
    // we can load config.env instead.
    loadConfigEnv();
  }

  const schema = t.Object(resolve(t));
  const env = env_ ?? process.env;

  try {
    return Value.Parse(schema, env);
  } catch (error) {
    if (error instanceof AssertError) {
      throw new Error(
        "Missing env variables.\n" + formatFails(error).join("\n"),
      );
    }
    throw error;
  }
}

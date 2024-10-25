import { createApiClient } from "@superstreamer/api/client";

export const api = createApiClient(window.__ENV__.PUBLIC_API_ENDPOINT);

export type * from "@superstreamer/api/client";

import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { addTranscodeJob, addPackageJob } from "@mixwave/artisan-producer";
import { LangCodeEnum, VideoCodecEnum, AudioCodecEnum } from "@mixwave/shared";
import { env } from "./env";
import { getJob, getJobs, getJobLogs } from "./jobs";
import { getStorage, getStorageFile } from "./s3";

export type App = typeof app;

const app = new Elysia()
  .use(cors())
  .use(swagger())
  .post(
    "/transcode",
    async ({ body }) => {
      const job = await addTranscodeJob(body);
      return { jobId: job.id };
    },
    {
      body: t.Object({
        inputs: t.Array(
          t.Union([
            t.Object({
              type: t.Literal("video"),
              path: t.String(),
            }),
            t.Object({
              type: t.Literal("audio"),
              path: t.String(),
              language: LangCodeEnum,
            }),
            t.Object({
              type: t.Literal("text"),
              path: t.String(),
              language: LangCodeEnum,
            }),
          ]),
        ),
        streams: t.Array(
          t.Union([
            t.Object({
              type: t.Literal("video"),
              codec: VideoCodecEnum,
              height: t.Number(),
              bitrate: t.Number(),
              framerate: t.Number(),
            }),
            t.Object({
              type: t.Literal("audio"),
              codec: AudioCodecEnum,
              bitrate: t.Number(),
              language: LangCodeEnum,
            }),
            t.Object({
              type: t.Literal("text"),
              language: LangCodeEnum,
            }),
          ]),
        ),
        segmentSize: t.Optional(t.Number()),
        assetId: t.Optional(t.String()),
        packageAfter: t.Optional(t.Boolean()),
        tag: t.Optional(t.String()),
      }),
    },
  )
  .post(
    "/package",
    async ({ body }) => {
      const job = await addPackageJob(body);
      return { jobId: job.id };
    },
    {
      body: t.Object({
        assetId: t.String(),
        segmentSize: t.Optional(t.Number()),
        tag: t.Optional(t.String()),
        name: t.Optional(t.String()),
      }),
    },
  )
  .get("/jobs", async () => {
    return await getJobs();
  })
  .get(
    "/jobs/:id",
    async ({ params, query }) => {
      return await getJob(params.id, query.fromRoot);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      query: t.Object({
        fromRoot: t.Optional(t.Boolean()),
      }),
    },
  )
  .get(
    "/jobs/:id/logs",
    async ({ params }) => {
      return await getJobLogs(params.id);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )
  .get(
    "/storage",
    async ({ query }) => {
      return await getStorage(query.path, query.take, query.cursor);
    },
    {
      query: t.Object({
        path: t.String(),
        cursor: t.Optional(t.String()),
        take: t.Optional(t.Number()),
      }),
    },
  )
  .get(
    "/storage/file",
    async ({ query }) => {
      return await getStorageFile(query.path);
    },
    {
      query: t.Object({
        path: t.String(),
      }),
    },
  );

app.listen({
  port: env.PORT,
  hostname: env.HOST,
});

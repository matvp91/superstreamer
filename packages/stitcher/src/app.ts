import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { customCss } from "shared/scalar";
import { env } from "./env";
import { createSession } from "./session";
import { validateFilter } from "./filters";
import { getMasterUrl } from "./url";
import {
  formatMasterPlaylist,
  formatMediaPlaylist,
  formatAssetList,
} from "./playlist";

export const app = new Elysia({
  // TODO: Turn dynamic mode on, this is for serverless env
  aot: false,
})
  .use(cors())
  .use(
    swagger({
      documentation: {
        info: {
          title: "Superstreamer Stitcher API",
          version: "1.0.0",
          description:
            "Realtime playlist manipulator. Can be used for ad, bumper or other HLS interstitials insertion on-the-fly. Can apply filters to playlists.",
        },
      },
      scalarConfig: {
        hideDownloadButton: true,
        customCss,
      },
    }),
  )
  .post(
    "/session",
    async ({ body }) => {
      // This'll fail when uri is invalid.
      getMasterUrl(body.uri);

      if (body.filter) {
        // When we have a filter, validate it here first. There is no need to wait until we approach
        // the master playlist. We can bail out early.
        validateFilter(body.filter);
      }

      const session = await createSession(body);

      return {
        url: `${env.PUBLIC_STITCHER_ENDPOINT}/session/${session.id}/master.m3u8`,
      };
    },
    {
      detail: {
        summary: "Create a session",
      },
      body: t.Object({
        uri: t.String({
          description:
            'Reference to a master playlist, you can point to an asset with "asset://{uuid}" or as http(s).',
        }),
        interstitials: t.Optional(
          t.Array(
            t.Object({
              timeOffset: t.Number(),
              uri: t.String(),
              type: t.Optional(t.Union([t.Literal("ad"), t.Literal("bumper")])),
            }),
            {
              description: "Manual HLS interstitial insertion.",
            },
          ),
        ),
        filter: t.Optional(
          t.Object(
            {
              resolution: t.Optional(
                t.String({
                  description: 'Filter on resolution, like "<= 720".',
                }),
              ),
            },
            {
              description: "Filter applies to master and media playlist.",
            },
          ),
        ),
        vmap: t.Optional(
          t.Object(
            {
              url: t.String(),
            },
            {
              description:
                "Describes a VMAP, will transcode ads and insert interstitials on the fly.",
            },
          ),
        ),
      }),
    },
  )
  .get(
    "/session/:sessionId/master.m3u8",
    async ({ set, params }) => {
      const playlist = await formatMasterPlaylist(params.sessionId);
      set.headers["content-type"] = "application/x-mpegURL";
      return playlist;
    },
    {
      detail: {
        hide: true,
      },
      params: t.Object({
        sessionId: t.String(),
      }),
    },
  )
  .get(
    "/session/:sessionId/*",
    async ({ set, params }) => {
      const playlist = await formatMediaPlaylist(params.sessionId, params["*"]);
      set.headers["content-type"] = "application/x-mpegURL";
      return playlist;
    },
    {
      detail: {
        hide: true,
      },
      params: t.Object({
        sessionId: t.String(),
        "*": t.String(),
      }),
    },
  )
  .get(
    "/session/:sessionId/asset-list.json",
    async ({ params, query }) => {
      return await formatAssetList(params.sessionId, query.startDate);
    },
    {
      detail: {
        hide: true,
      },
      params: t.Object({
        sessionId: t.String(),
      }),
      query: t.Object({
        startDate: t.String(),
      }),
    },
  );

app.on("stop", () => {
  process.exit(0);
});

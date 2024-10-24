import { randomUUID } from "crypto";
import { DateTime } from "luxon";
import { kv } from "./redis";
import type { VmapResponse } from "./vmap";

export type Session = {
  id: string;
  uri: string;
  dt: DateTime;
  interstitials?: SessionInterstitial[];
  filter?: SessionFilter;
  vmap?: SessionVmap;
  vmapResponse?: VmapResponse;
};

export type SessionInterstitialType = "ad" | "bumper";

export type SessionInterstitial = {
  timeOffset: number;
  uri: string;
  type?: SessionInterstitialType;
};

export type SessionFilter = {
  resolution?: string;
};

export type SessionVmap = {
  url: string;
};

export async function createSession(data: {
  uri: string;
  interstitials?: SessionInterstitial[];
  filter?: SessionFilter;
  vmap?: SessionVmap;
}) {
  const sessionId = randomUUID();

  const session: Session = {
    id: sessionId,
    uri: data.uri,
    filter: data.filter,
    interstitials: data.interstitials,
    vmap: data.vmap,
    dt: DateTime.now(),
  };

  const ttl = 60 * 60 * 6; // 6 hours
  await kv.set(`session:${sessionId}`, toSerializable(session), ttl);

  return session;
}

export async function getSession(sessionId: string) {
  const data = await kv.get(`session:${sessionId}`);
  if (!data) {
    throw new Error(`No session found with id "${sessionId}".`);
  }
  return parseFromJson(data);
}

export async function updateSession(session: Session) {
  await kv.set(`session:${session.id}`, toSerializable(session), "preserve");
}

function toSerializable(session: Session) {
  return JSON.stringify({
    ...session,
    dt: session.dt.toISO(),
  });
}

function parseFromJson(text: string): Session {
  const obj = JSON.parse(text);
  return {
    ...obj,
    dt: DateTime.fromISO(obj.dt),
  };
}

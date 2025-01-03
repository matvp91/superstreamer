import type { InterstitialAsset } from "./types";

interface SignalingEvent {
  type: "impression" | "quartile" | "clickthrough";
  start?: number;
  urls: string[];
}

const QUARTILE_EVENTS: Record<string, number> = {
  start: 0,
  firstQuartile: 0.25,
  midpoint: 0.5,
  thirdQuartile: 0.75,
  complete: 1,
};

export function getSignalingForAsset(
  assets: InterstitialAsset[],
  asset: InterstitialAsset,
) {
  const { duration, tracking } = asset;
  if (!tracking) {
    return null;
  }

  const assetIndex = assets.indexOf(asset);
  const startTime = assets.splice(0, assetIndex).reduce((acc, asset) => {
    acc += asset.duration;
    return acc;
  }, 0);

  const signalingEvents: SignalingEvent[] = [];

  signalingEvents.push({
    type: "impression",
    start: 0,
    urls: tracking.impression,
  });

  signalingEvents.push({
    type: "clickthrough",
    urls: tracking.clickThrough,
  });

  // Map each tracking URL to their corresponding quartile.
  Object.entries(tracking).forEach(([name, urls]) => {
    const offset = QUARTILE_EVENTS[name];
    if (offset !== undefined) {
      signalingEvents.push({
        type: "quartile",
        start: duration * offset,
        urls,
      });
    }
  });

  return {
    version: 2,
    type: "slot",
    payload: [
      {
        type: "linear",
        start: startTime,
        duration: asset.duration,
        tracking: signalingEvents,
      },
    ],
  };
}

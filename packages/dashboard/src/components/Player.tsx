import Hls from "hls.js";
import {
  Controls,
  useController,
  ControllerProvider,
} from "@mixwave/player/react";
import { useEffect, useState } from "react";

type PlayerProps = {
  url?: string;
};

export function Player({ url }: PlayerProps) {
  const [hls] = useState(() => new Hls());
  const controller = useController(hls);

  useEffect(() => {
    if (url) {
      hls.loadSource(url);
    }
  }, [url]);

  useEffect(() => {
    Object.assign(window, {
      facade: controller.facade,
    });
  }, [controller]);

  return (
    <ControllerProvider controller={controller}>
      <div
        className="relative aspect-video bg-black overflow-hidden"
        data-mix-container
      >
        <video
          ref={controller.mediaRef}
          className="absolute inset-O w-full h-full"
        />
        <Controls lang="nld" />
      </div>
    </ControllerProvider>
  );
}

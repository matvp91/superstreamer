import { createContext, useContext, useEffect, useState } from "react";
import type { HlsPlayer } from "@superstreamer/player";
import type { Dispatch, ReactNode, SetStateAction } from "react";

interface PlayerProviderProps {
  children: ReactNode;
}

const PlayerContext = createContext<{
  player: HlsPlayer | null;
  setPlayer: Dispatch<SetStateAction<HlsPlayer | null>>;
} | null>(null);

export function PlayerProvider({ children }: PlayerProviderProps) {
  const [player, setPlayer] = useState<HlsPlayer | null>(null);

  useEffect(() => {
    Object.assign(window, { player });
  }, [player]);

  return (
    <PlayerContext.Provider value={{ player, setPlayer }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("Missing provider");
  }
  return context;
}

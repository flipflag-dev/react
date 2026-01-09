import { useMemo } from "react";
import { useFlipFlagContext } from "./context";

export function useFlipFlagReady() {
  const { ready, error } = useFlipFlagContext();
  return { ready, error };
}

export function useFlag(name: string, fallback = false): boolean {
  const { getFlag, tick } = useFlipFlagContext();

  return useMemo(
    () => getFlag(name, fallback),
    [name, fallback, getFlag, tick],
  );
}

export function useFlags<T extends readonly string[]>(
  names: T,
  fallback = false,
): Record<T[number], boolean> {
  const { getFlag, tick } = useFlipFlagContext();

  return useMemo(() => {
    const out: Record<string, boolean> = {};
    for (const n of names) out[n] = getFlag(n, fallback);
    return out as Record<T[number], boolean>;
  }, [names, fallback, getFlag, tick]);
}

import { useMemo, useRef, useEffect } from "react";
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

  // Stabilize names array reference to prevent unnecessary re-computations
  const namesKey = JSON.stringify(names);

  return useMemo(() => {
    const out: Record<string, boolean> = {};
    for (const n of names) out[n] = getFlag(n, fallback);
    return out as Record<T[number], boolean>;
  }, [namesKey, fallback, getFlag, tick]);
}

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FlipFlag } from "@flipflag/sdk";

export type FlipFlagReactOptions = ConstructorParameters<typeof FlipFlag>[0] & {
  refreshIntervalMs?: number;
  initialFlags?: Record<string, boolean>;
  startClient?: boolean;
};

type Ctx = {
  manager: FlipFlag | null;
  ready: boolean;
  error: unknown;
  getFlag: (name: string, fallback?: boolean) => boolean;
  tick: number;
};

const FlipFlagContext = createContext<Ctx | null>(null);

export function FlipFlagProvider(props: {
  options: FlipFlagReactOptions;
  children: React.ReactNode;
}) {
  const { options, children } = props;

  const refreshIntervalMs = options.refreshIntervalMs ?? 10_000;
  const startClient = options.startClient ?? true;

  const managerRef = useRef<FlipFlag | null>(null);
  const initialFlagsRef = useRef<Record<string, boolean>>(
    options.initialFlags ?? {},
  );

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [tick, setTick] = useState(0);

  if (!managerRef.current && startClient) {
    managerRef.current = new FlipFlag({
      ...options,
      ignoreMissingConfig: options.ignoreMissingConfig ?? true,
    });
  }

  useEffect(() => {
    if (!startClient) {
      setReady(false);
      setError(null);
      return;
    }

    if (!managerRef.current) {
      managerRef.current = new FlipFlag({
        ...options,
        ignoreMissingConfig: options.ignoreMissingConfig ?? true,
      });
    }

    let cancelled = false;

    (async () => {
      try {
        await managerRef.current!.init();
        if (!cancelled) setReady(true);
      } catch (e) {
        if (!cancelled) setError(e);
      }
    })();

    const id = window.setInterval(() => {
      setTick((t) => t + 1);
    }, refreshIntervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      managerRef.current?.destroy();
      managerRef.current = null;
    };
  }, [startClient, refreshIntervalMs, options]);

  const value = useMemo<Ctx>(() => {
    const getFlag = (name: string, fallback = false) => {
      const mgr = managerRef.current;
      if (!mgr) return initialFlagsRef.current[name] ?? fallback;
      if (!ready) return initialFlagsRef.current[name] ?? fallback;

      try {
        return mgr.isEnabled(name) || false;
      } catch {
        return initialFlagsRef.current[name] ?? fallback;
      }
    };

    return {
      manager: managerRef.current,
      ready,
      error,
      getFlag,
      tick,
    };
  }, [ready, error, tick]);

  return (
    <FlipFlagContext.Provider value={value}>
      {children}
    </FlipFlagContext.Provider>
  );
}

export function useFlipFlagContext(): Ctx {
  const ctx = useContext(FlipFlagContext);
  if (!ctx) {
    throw new Error(
      "useFlipFlagContext must be used within <FlipFlagProvider>",
    );
  }
  return ctx;
}

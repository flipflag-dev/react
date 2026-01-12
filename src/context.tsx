import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FlipFlag } from "@flipflag/sdk";
import { FLIPFLAG_HYDRATION_ID } from "./server/hydration";

/**
 * Read hydrated flag data from the server-rendered script tag.
 * Returns undefined if not in browser or script tag not found.
 */
function getHydratedFlags(): Record<string, boolean> | undefined {
  if (typeof document === "undefined") return undefined;

  const script = document.getElementById(FLIPFLAG_HYDRATION_ID);
  if (!script?.textContent) return undefined;

  try {
    return JSON.parse(script.textContent);
  } catch (error) {
    console.warn("[FlipFlag] Failed to parse hydrated flags JSON from script element with id:", FLIPFLAG_HYDRATION_ID, error);
    return undefined;
  }
}

type BaseOptions = {
  refreshIntervalMs?: number;
  initialFlags?: Record<string, boolean>;
  startClient?: boolean;
};

/** When providing an existing instance, SDK config options are not needed */
type WithInstance = BaseOptions & {
  instance: FlipFlag;
  publicKey?: never;
  privateKey?: never;
  apiUrl?: never;
  configPath?: never;
  ignoreMissingConfig?: never;
};

/** When creating a new instance, SDK config options are required */
type WithConfig = BaseOptions & ConstructorParameters<typeof FlipFlag>[0] & {
  instance?: never;
};

export type FlipFlagReactOptions = WithInstance | WithConfig;

/** Type guard to check if options contains an existing FlipFlag instance */
function hasInstance(opts: FlipFlagReactOptions): opts is WithInstance {
  return "instance" in opts && opts.instance != null;
}

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
  // Priority: 1) explicit initialFlags, 2) hydrated from script tag, 3) empty
  const initialFlagsRef = useRef<Record<string, boolean>>(
    options.initialFlags ?? getHydratedFlags() ?? {},
  );

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [tick, setTick] = useState(0);

  if (!managerRef.current && startClient) {
    if (hasInstance(options)) {
      managerRef.current = options.instance;
    } else {
      managerRef.current = new FlipFlag({
        ...options,
        ignoreMissingConfig: options.ignoreMissingConfig ?? true,
      });
    }
  }

  useEffect(() => {
    if (!startClient) {
      setReady(false);
      setError(null);
      return;
    }

    if (!managerRef.current) {
      if (hasInstance(options)) {
        managerRef.current = options.instance;
      } else {
        managerRef.current = new FlipFlag({
          ...options,
          ignoreMissingConfig: options.ignoreMissingConfig ?? true,
        });
      }
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

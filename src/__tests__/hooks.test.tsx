import { renderHook, waitFor, act } from "@testing-library/react";
import React from "react";
import { useFlag, useFlags, useFlipFlagReady } from "../hooks";
import { FlipFlagProvider } from "../context";
import { FlipFlag } from "@flipflag/sdk";

describe("useFlipFlagReady", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return ready status and error", async () => {
    const mockInstance = {
      init: jest.fn().mockResolvedValue(undefined),
      isEnabled: jest.fn(),
      destroy: jest.fn(),
    } as any;

    (FlipFlag as jest.Mock).mockImplementation(() => mockInstance);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FlipFlagProvider
        options={{
          publicKey: "test-public-key",
          privateKey: "test-private-key",
        }}
      >
        {children}
      </FlipFlagProvider>
    );

    const { result } = renderHook(() => useFlipFlagReady(), { wrapper });

    expect(result.current.ready).toBe(false);
    expect(result.current.error).toBe(null);

    await waitFor(() => {
      expect(result.current.ready).toBe(true);
    });

    expect(result.current.error).toBe(null);
  });

  it("should return error when initialization fails", async () => {
    const testError = new Error("Init failed");
    const mockInstance = {
      init: jest.fn().mockRejectedValue(testError),
      isEnabled: jest.fn(),
      destroy: jest.fn(),
    } as any;

    (FlipFlag as jest.Mock).mockImplementation(() => mockInstance);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FlipFlagProvider
        options={{
          publicKey: "test-public-key",
          privateKey: "test-private-key",
        }}
      >
        {children}
      </FlipFlagProvider>
    );

    const { result } = renderHook(() => useFlipFlagReady(), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBe(testError);
    });

    expect(result.current.ready).toBe(false);
  });

  it("should throw error when used outside provider", () => {
    // Suppress console.error for this test
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => useFlipFlagReady());
    }).toThrow("useFlipFlagContext must be used within <FlipFlagProvider>");

    consoleError.mockRestore();
  });
});

describe("useFlag", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return flag value when ready", async () => {
    const mockInstance = {
      init: jest.fn().mockResolvedValue(undefined),
      isEnabled: jest.fn((name: string) => name === "testFlag"),
      destroy: jest.fn(),
    } as any;

    (FlipFlag as jest.Mock).mockImplementation(() => mockInstance);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FlipFlagProvider
        options={{
          publicKey: "test-public-key",
          privateKey: "test-private-key",
        }}
      >
        {children}
      </FlipFlagProvider>
    );

    const { result } = renderHook(() => useFlag("testFlag"), { wrapper });

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it("should return fallback value when flag is not enabled", async () => {
    const mockInstance = {
      init: jest.fn().mockResolvedValue(undefined),
      isEnabled: jest.fn().mockReturnValue(false),
      destroy: jest.fn(),
    } as any;

    (FlipFlag as jest.Mock).mockImplementation(() => mockInstance);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FlipFlagProvider
        options={{
          publicKey: "test-public-key",
          privateKey: "test-private-key",
        }}
      >
        {children}
      </FlipFlagProvider>
    );

    const { result } = renderHook(() => useFlag("missingFlag", true), {
      wrapper,
    });

    await waitFor(() => {
      expect(mockInstance.init).toHaveBeenCalled();
    });

    // After SDK is ready, should return SDK value (false)
    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it("should return fallback value before SDK is ready", () => {
    const mockInstance = {
      init: jest
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 1000)),
        ),
      isEnabled: jest.fn().mockReturnValue(true),
      destroy: jest.fn(),
    } as any;

    (FlipFlag as jest.Mock).mockImplementation(() => mockInstance);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FlipFlagProvider
        options={{
          publicKey: "test-public-key",
          privateKey: "test-private-key",
        }}
      >
        {children}
      </FlipFlagProvider>
    );

    const { result } = renderHook(() => useFlag("testFlag", true), { wrapper });

    expect(result.current).toBe(true);
  });

  it("should use initial flags before SDK is ready", async () => {
    const mockInstance = {
      init: jest.fn().mockResolvedValue(undefined),
      isEnabled: jest.fn().mockReturnValue(false),
      destroy: jest.fn(),
    } as any;

    (FlipFlag as jest.Mock).mockImplementation(() => mockInstance);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FlipFlagProvider
        options={{
          publicKey: "test-public-key",
          privateKey: "test-private-key",
          initialFlags: { testFlag: true },
        }}
      >
        {children}
      </FlipFlagProvider>
    );

    const { result } = renderHook(() => useFlag("testFlag", false), {
      wrapper,
    });

    // Initially should return the initialFlags value
    expect(result.current).toBe(true);

    // After SDK is ready, should return SDK value
    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it("should update when tick changes", async () => {
    jest.useFakeTimers();

    let flagValue = false;
    const mockInstance = {
      init: jest.fn().mockResolvedValue(undefined),
      isEnabled: jest.fn(() => flagValue),
      destroy: jest.fn(),
    } as any;

    (FlipFlag as jest.Mock).mockImplementation(() => mockInstance);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FlipFlagProvider
        options={{
          publicKey: "test-public-key",
          privateKey: "test-private-key",
          refreshIntervalMs: 1000,
        }}
      >
        {children}
      </FlipFlagProvider>
    );

    const { result } = renderHook(() => useFlag("testFlag"), { wrapper });

    await waitFor(() => {
      expect(mockInstance.init).toHaveBeenCalled();
    });

    expect(result.current).toBe(false);

    // Change the flag value
    flagValue = true;

    // Advance timers to trigger refresh
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(result.current).toBe(true);
    });

    jest.useRealTimers();
  });
});

describe("useFlags", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return multiple flag values", async () => {
    const mockInstance = {
      init: jest.fn().mockResolvedValue(undefined),
      isEnabled: jest.fn((name: string) => {
        return name === "flag1" || name === "flag3";
      }),
      destroy: jest.fn(),
    } as any;

    (FlipFlag as jest.Mock).mockImplementation(() => mockInstance);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FlipFlagProvider
        options={{
          publicKey: "test-public-key",
          privateKey: "test-private-key",
        }}
      >
        {children}
      </FlipFlagProvider>
    );

    const { result } = renderHook(
      () => useFlags(["flag1", "flag2", "flag3"] as const),
      { wrapper },
    );

    await waitFor(() => {
      expect(mockInstance.init).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(result.current).toEqual({
        flag1: true,
        flag2: false,
        flag3: true,
      });
    });
  });

  it("should use fallback value for all flags", async () => {
    const mockInstance = {
      init: jest.fn().mockResolvedValue(undefined),
      isEnabled: jest.fn().mockReturnValue(false),
      destroy: jest.fn(),
    } as any;

    (FlipFlag as jest.Mock).mockImplementation(() => mockInstance);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FlipFlagProvider
        options={{
          publicKey: "test-public-key",
          privateKey: "test-private-key",
        }}
      >
        {children}
      </FlipFlagProvider>
    );

    const { result } = renderHook(
      () => useFlags(["flag1", "flag2"] as const, true),
      { wrapper },
    );

    // Before ready, should use fallback
    expect(result.current.flag1).toBe(true);
    expect(result.current.flag2).toBe(true);

    await waitFor(() => {
      expect(mockInstance.init).toHaveBeenCalled();
    });

    // After ready, should use SDK values
    await waitFor(() => {
      expect(result.current.flag1).toBe(false);
      expect(result.current.flag2).toBe(false);
    });
  });

  it("should use initial flags before SDK is ready", async () => {
    const mockInstance = {
      init: jest.fn().mockResolvedValue(undefined),
      isEnabled: jest.fn().mockReturnValue(true),
      destroy: jest.fn(),
    } as any;

    (FlipFlag as jest.Mock).mockImplementation(() => mockInstance);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FlipFlagProvider
        options={{
          publicKey: "test-public-key",
          privateKey: "test-private-key",
          initialFlags: { flag1: false, flag2: true },
        }}
      >
        {children}
      </FlipFlagProvider>
    );

    const { result } = renderHook(() => useFlags(["flag1", "flag2"] as const), {
      wrapper,
    });

    // Initially should use initialFlags
    expect(result.current.flag1).toBe(false);
    expect(result.current.flag2).toBe(true);

    await waitFor(() => {
      expect(mockInstance.init).toHaveBeenCalled();
    });

    // After ready, should use SDK values
    await waitFor(() => {
      expect(result.current.flag1).toBe(true);
      expect(result.current.flag2).toBe(true);
    });
  });

  it("should update when tick changes", async () => {
    jest.useFakeTimers();

    const flagValues: Record<string, boolean> = {
      flag1: false,
      flag2: false,
    };

    const mockInstance = {
      init: jest.fn().mockResolvedValue(undefined),
      isEnabled: jest.fn((name: string) => flagValues[name] || false),
      destroy: jest.fn(),
    } as any;

    (FlipFlag as jest.Mock).mockImplementation(() => mockInstance);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FlipFlagProvider
        options={{
          publicKey: "test-public-key",
          privateKey: "test-private-key",
          refreshIntervalMs: 1000,
        }}
      >
        {children}
      </FlipFlagProvider>
    );

    const { result } = renderHook(() => useFlags(["flag1", "flag2"] as const), {
      wrapper,
    });

    await waitFor(() => {
      expect(mockInstance.init).toHaveBeenCalled();
    });

    expect(result.current.flag1).toBe(false);
    expect(result.current.flag2).toBe(false);

    // Change flag values
    flagValues.flag1 = true;
    flagValues.flag2 = true;

    // Advance timers to trigger refresh
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(result.current.flag1).toBe(true);
      expect(result.current.flag2).toBe(true);
    });

    jest.useRealTimers();
  });

  it("should handle empty flag array", async () => {
    const mockInstance = {
      init: jest.fn().mockResolvedValue(undefined),
      isEnabled: jest.fn(),
      destroy: jest.fn(),
    } as any;

    (FlipFlag as jest.Mock).mockImplementation(() => mockInstance);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FlipFlagProvider
        options={{
          publicKey: "test-public-key",
          privateKey: "test-private-key",
        }}
      >
        {children}
      </FlipFlagProvider>
    );

    const { result } = renderHook(() => useFlags([] as const), { wrapper });

    await waitFor(() => {
      expect(mockInstance.init).toHaveBeenCalled();
    });

    expect(result.current).toEqual({});
  });
});

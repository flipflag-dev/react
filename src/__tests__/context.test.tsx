import { render, renderHook, waitFor, act } from "@testing-library/react";
import React from "react";
import { FlipFlagProvider, useFlipFlagContext } from "../context";
import { FlipFlag } from "@flipflag/sdk";

describe("FlipFlagProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any existing script tags
    document.body.innerHTML = "";
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should initialize FlipFlag SDK with provided config", async () => {
    const mockInstance = {
      init: jest.fn().mockResolvedValue(undefined),
      isEnabled: jest.fn(),
      destroy: jest.fn(),
    } as any;

    (FlipFlag as jest.Mock).mockImplementation(() => mockInstance);

    render(
      <FlipFlagProvider
        options={{
          publicKey: "test-public-key",
          privateKey: "test-private-key",
        }}
      >
        <div>Test</div>
      </FlipFlagProvider>,
    );

    expect(FlipFlag).toHaveBeenCalledWith({
      publicKey: "test-public-key",
      privateKey: "test-private-key",
      ignoreMissingConfig: true,
    });

    await waitFor(() => {
      expect(mockInstance.init).toHaveBeenCalled();
    });
  });

  it("should use existing FlipFlag instance when provided", async () => {
    const existingInstance = {
      init: jest.fn().mockResolvedValue(undefined),
      isEnabled: jest.fn(),
      destroy: jest.fn(),
    } as any;

    render(
      <FlipFlagProvider options={{ instance: existingInstance }}>
        <div>Test</div>
      </FlipFlagProvider>,
    );

    expect(FlipFlag).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(existingInstance.init).toHaveBeenCalled();
    });
  });

  it("should not destroy provided instance on unmount", async () => {
    const existingInstance = {
      init: jest.fn().mockResolvedValue(undefined),
      isEnabled: jest.fn(),
      destroy: jest.fn(),
    } as any;

    const { unmount } = render(
      <FlipFlagProvider options={{ instance: existingInstance }}>
        <div>Test</div>
      </FlipFlagProvider>,
    );

    await waitFor(() => {
      expect(existingInstance.init).toHaveBeenCalled();
    });

    unmount();

    expect(existingInstance.destroy).not.toHaveBeenCalled();
  });

  it("should destroy created instance on unmount", async () => {
    const mockInstance = {
      init: jest.fn().mockResolvedValue(undefined),
      isEnabled: jest.fn(),
      destroy: jest.fn(),
    } as any;

    (FlipFlag as jest.Mock).mockImplementation(() => mockInstance);

    const { unmount } = render(
      <FlipFlagProvider
        options={{
          publicKey: "test-public-key",
          privateKey: "test-private-key",
        }}
      >
        <div>Test</div>
      </FlipFlagProvider>,
    );

    await waitFor(() => {
      expect(mockInstance.init).toHaveBeenCalled();
    });

    unmount();

    expect(mockInstance.destroy).toHaveBeenCalled();
  });

  it("should handle initialization errors", async () => {
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

    const { result } = renderHook(() => useFlipFlagContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBe(testError);
    });

    expect(result.current.ready).toBe(false);
  });

  it("should use custom refresh interval", async () => {
    jest.useFakeTimers();

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
          refreshIntervalMs: 5000,
        }}
      >
        {children}
      </FlipFlagProvider>
    );

    const { result } = renderHook(() => useFlipFlagContext(), { wrapper });

    await waitFor(() => {
      expect(mockInstance.init).toHaveBeenCalled();
    });

    const initialTick = result.current.tick;

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(result.current.tick).toBe(initialTick + 1);
    });

    jest.useRealTimers();
  });

  it("should use default refresh interval of 10 seconds", async () => {
    jest.useFakeTimers();

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

    const { result } = renderHook(() => useFlipFlagContext(), { wrapper });

    await waitFor(() => {
      expect(mockInstance.init).toHaveBeenCalled();
    });

    const initialTick = result.current.tick;

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    await waitFor(() => {
      expect(result.current.tick).toBe(initialTick + 1);
    });

    jest.useRealTimers();
  });

  it("should not start client when startClient is false", async () => {
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
          startClient: false,
        }}
      >
        {children}
      </FlipFlagProvider>
    );

    const { result } = renderHook(() => useFlipFlagContext(), { wrapper });

    // Wait a bit to ensure init is not called
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockInstance.init).not.toHaveBeenCalled();
    expect(result.current.ready).toBe(false);
  });

  it("should use initialFlags when provided", async () => {
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
          initialFlags: { testFlag: true, anotherFlag: false },
        }}
      >
        {children}
      </FlipFlagProvider>
    );

    const { result } = renderHook(() => useFlipFlagContext(), { wrapper });

    // Before ready, should use initialFlags
    expect(result.current.getFlag("testFlag")).toBe(true);
    expect(result.current.getFlag("anotherFlag")).toBe(false);

    await waitFor(() => {
      expect(result.current.ready).toBe(true);
    });

    // After ready, should use SDK values
    expect(result.current.getFlag("testFlag")).toBe(false);
  });

  it("should read hydrated flags from script tag", async () => {
    // Create a script tag with hydrated flags
    const script = document.createElement("script");
    script.id = "__FLIPFLAG_DATA__";
    script.type = "application/json";
    script.textContent = JSON.stringify({ hydratedFlag: true });
    document.body.appendChild(script);

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

    const { result } = renderHook(() => useFlipFlagContext(), { wrapper });

    // Before ready, should use hydrated flags
    expect(result.current.getFlag("hydratedFlag")).toBe(true);

    await waitFor(() => {
      expect(result.current.ready).toBe(true);
    });

    // After ready, should use SDK values
    expect(result.current.getFlag("hydratedFlag")).toBe(false);
  });

  it("should prioritize initialFlags over hydrated flags", async () => {
    // Create a script tag with hydrated flags
    const script = document.createElement("script");
    script.id = "__FLIPFLAG_DATA__";
    script.type = "application/json";
    script.textContent = JSON.stringify({ testFlag: false });
    document.body.appendChild(script);

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

    const { result } = renderHook(() => useFlipFlagContext(), { wrapper });

    // Should use initialFlags (true) instead of hydrated flags (false)
    expect(result.current.getFlag("testFlag")).toBe(true);
  });

  it("should handle invalid JSON in hydration script", async () => {
    const consoleWarn = jest.spyOn(console, "warn").mockImplementation();

    // Create a script tag with invalid JSON
    const script = document.createElement("script");
    script.id = "__FLIPFLAG_DATA__";
    script.type = "application/json";
    script.textContent = "invalid json{";
    document.body.appendChild(script);

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

    const { result } = renderHook(() => useFlipFlagContext(), { wrapper });

    expect(consoleWarn).toHaveBeenCalledWith(
      "[FlipFlag] Failed to parse hydrated flags JSON from script element with id:",
      "__FLIPFLAG_DATA__",
      expect.any(Error),
    );

    expect(result.current.getFlag("anyFlag")).toBe(false);

    consoleWarn.mockRestore();
  });

  it("should provide manager instance in context", async () => {
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

    const { result } = renderHook(() => useFlipFlagContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.manager).toBe(mockInstance);
    });
  });

  it("should handle getFlag when manager is not ready", () => {
    const mockInstance = {
      init: jest
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 1000)),
        ),
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

    const { result } = renderHook(() => useFlipFlagContext(), { wrapper });

    expect(result.current.getFlag("testFlag", true)).toBe(true);
    expect(result.current.getFlag("testFlag", false)).toBe(false);
  });

  it("should handle getFlag errors gracefully", async () => {
    const mockInstance = {
      init: jest.fn().mockResolvedValue(undefined),
      isEnabled: jest.fn().mockImplementation(() => {
        throw new Error("Flag error");
      }),
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

    const { result } = renderHook(() => useFlipFlagContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.ready).toBe(true);
    });

    // Should fall back to initialFlags when isEnabled throws
    expect(result.current.getFlag("testFlag", false)).toBe(true);
    expect(result.current.getFlag("unknownFlag", false)).toBe(false);
  });

  it("should pass all SDK config options to FlipFlag constructor", async () => {
    const mockInstance = {
      init: jest.fn().mockResolvedValue(undefined),
      isEnabled: jest.fn(),
      destroy: jest.fn(),
    } as any;

    (FlipFlag as jest.Mock).mockImplementation(() => mockInstance);

    render(
      <FlipFlagProvider
        options={{
          publicKey: "test-public-key",
          privateKey: "test-private-key",
          apiUrl: "https://custom-api.example.com",
          configPath: "/custom/config/path.yml",
          ignoreMissingConfig: false,
        }}
      >
        <div>Test</div>
      </FlipFlagProvider>,
    );

    expect(FlipFlag).toHaveBeenCalledWith({
      publicKey: "test-public-key",
      privateKey: "test-private-key",
      apiUrl: "https://custom-api.example.com",
      configPath: "/custom/config/path.yml",
      ignoreMissingConfig: false,
    });
  });
});

describe("useFlipFlagContext", () => {
  it("should throw error when used outside provider", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => useFlipFlagContext());
    }).toThrow("useFlipFlagContext must be used within <FlipFlagProvider>");

    consoleError.mockRestore();
  });

  it("should return context value when used inside provider", async () => {
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

    const { result } = renderHook(() => useFlipFlagContext(), { wrapper });

    expect(result.current).toHaveProperty("manager");
    expect(result.current).toHaveProperty("ready");
    expect(result.current).toHaveProperty("error");
    expect(result.current).toHaveProperty("getFlag");
    expect(result.current).toHaveProperty("tick");
  });
});

import { getFlags } from "../server/helpers";
import type { FlipFlag } from "@flipflag/sdk";

describe("getFlags", () => {
  it("should fetch multiple flag values from SDK", () => {
    const mockSDK = {
      isEnabled: jest.fn((name: string) => {
        const flags: Record<string, boolean> = {
          darkMode: true,
          newFeature: false,
          betaAccess: true,
        };
        return flags[name] ?? false;
      }),
    } as unknown as FlipFlag;

    const result = getFlags(mockSDK, ["darkMode", "newFeature", "betaAccess"]);

    expect(result).toEqual({
      darkMode: true,
      newFeature: false,
      betaAccess: true,
    });

    expect(mockSDK.isEnabled).toHaveBeenCalledTimes(3);
    expect(mockSDK.isEnabled).toHaveBeenCalledWith("darkMode");
    expect(mockSDK.isEnabled).toHaveBeenCalledWith("newFeature");
    expect(mockSDK.isEnabled).toHaveBeenCalledWith("betaAccess");
  });

  it("should return empty object for empty flag array", () => {
    const mockSDK = {
      isEnabled: jest.fn(),
    } as unknown as FlipFlag;

    const result = getFlags(mockSDK, []);

    expect(result).toEqual({});
    expect(mockSDK.isEnabled).not.toHaveBeenCalled();
  });

  it("should handle SDK errors gracefully and set flag to false", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const testError = new Error("SDK error");
    const mockSDK = {
      isEnabled: jest.fn((name: string) => {
        if (name === "errorFlag") {
          throw testError;
        }
        return true;
      }),
    } as unknown as FlipFlag;

    const result = getFlags(mockSDK, ["goodFlag", "errorFlag", "anotherGoodFlag"]);

    expect(result).toEqual({
      goodFlag: true,
      errorFlag: false,
      anotherGoodFlag: true,
    });

    expect(consoleError).toHaveBeenCalledWith(
      'Failed to fetch flag "errorFlag"',
      testError
    );

    consoleError.mockRestore();
  });

  it("should handle all flags throwing errors", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const mockSDK = {
      isEnabled: jest.fn(() => {
        throw new Error("All flags fail");
      }),
    } as unknown as FlipFlag;

    const result = getFlags(mockSDK, ["flag1", "flag2", "flag3"]);

    expect(result).toEqual({
      flag1: false,
      flag2: false,
      flag3: false,
    });

    expect(consoleError).toHaveBeenCalledTimes(3);

    consoleError.mockRestore();
  });

  it("should handle single flag", () => {
    const mockSDK = {
      isEnabled: jest.fn().mockReturnValue(true),
    } as unknown as FlipFlag;

    const result = getFlags(mockSDK, ["singleFlag"]);

    expect(result).toEqual({
      singleFlag: true,
    });

    expect(mockSDK.isEnabled).toHaveBeenCalledTimes(1);
    expect(mockSDK.isEnabled).toHaveBeenCalledWith("singleFlag");
  });

  it("should handle flags with special characters in names", () => {
    const mockSDK = {
      isEnabled: jest.fn((name: string) => {
        return name === "flag-with-dashes" || name === "flag_with_underscores";
      }),
    } as unknown as FlipFlag;

    const result = getFlags(mockSDK, [
      "flag-with-dashes",
      "flag_with_underscores",
      "flag.with.dots",
    ]);

    expect(result).toEqual({
      "flag-with-dashes": true,
      "flag_with_underscores": true,
      "flag.with.dots": false,
    });
  });

  it("should handle duplicate flag names", () => {
    const mockSDK = {
      isEnabled: jest.fn().mockReturnValue(true),
    } as unknown as FlipFlag;

    const result = getFlags(mockSDK, ["duplicateFlag", "duplicateFlag"]);

    // The second call should overwrite the first (though value is same)
    expect(result).toEqual({
      duplicateFlag: true,
    });

    // SDK should still be called twice
    expect(mockSDK.isEnabled).toHaveBeenCalledTimes(2);
  });

  it("should preserve boolean false values correctly", () => {
    const mockSDK = {
      isEnabled: jest.fn().mockReturnValue(false),
    } as unknown as FlipFlag;

    const result = getFlags(mockSDK, ["alwaysFalse", "anotherFalse"]);

    expect(result).toEqual({
      alwaysFalse: false,
      anotherFalse: false,
    });

    // Ensure false is explicitly returned, not undefined or null
    expect(result.alwaysFalse).toBe(false);
    expect(result.anotherFalse).toBe(false);
  });
});

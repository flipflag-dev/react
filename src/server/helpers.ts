import type { FlipFlag } from "@flipflag/sdk";

/**
 * Fetch multiple flag values from an initialized FlipFlag instance.
 * Use this on the server to pre-fetch flags for hydration.
 *
 * @param sdk - An initialized FlipFlag instance
 * @param flagNames - Array of flag names to fetch
 * @returns Record of flag names to boolean values
 *
 * @example
 * ```ts
 * const sdk = new FlipFlag({ publicKey: '...', privateKey: '...' });
 * await sdk.init();
 * const flags = await getFlags(sdk, ['darkMode', 'newFeature']);
 * ```
 */
export function getFlags(
  sdk: FlipFlag,
  flagNames: string[]
): Record<string, boolean> {
  const flags: Record<string, boolean> = {};

  for (const name of flagNames) {
    try {
      flags[name] = sdk.isEnabled(name);
    } catch (error) {
      console.error(`Failed to fetch flag "${name}"`, error);
      flags[name] = false;
    }
  }

  return flags;
}

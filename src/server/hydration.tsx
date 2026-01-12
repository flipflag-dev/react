import React from "react";

export const FLIPFLAG_HYDRATION_ID = "__FLIPFLAG_DATA__";

export interface FlipFlagHydrationProps {
  /** Flag values to serialize for client hydration */
  flags: Record<string, boolean>;
  /** Custom script tag ID (default: '__FLIPFLAG_DATA__') */
  id?: string;
}

/**
 * Server component that serializes flag data for client hydration.
 * Renders a script tag with JSON-encoded flag values that the client
 * FlipFlagProvider will automatically read on initialization.
 *
 * @example
 * ```tsx
 * // In a server component (Next.js App Router)
 * import { FlipFlagHydration } from '@flipflag/react/server';
 *
 * export default async function Layout({ children }) {
 *   const flags = { darkMode: true, newFeature: false };
 *   return (
 *     <html>
 *       <body>
 *         <FlipFlagHydration flags={flags} />
 *         {children}
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function FlipFlagHydration({
  flags,
  id = FLIPFLAG_HYDRATION_ID,
}: FlipFlagHydrationProps): React.ReactElement {
  const serialized = JSON.stringify(flags);

  return (
    <script
      id={id}
      type="application/json"
      dangerouslySetInnerHTML={{ __html: serialized }}
    />
  );
}

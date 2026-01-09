# FlipFlag React

React bindings for **FlipFlag** — feature flags and remote configuration for React and Next.js applications.

Built on top of [`@flipflag/sdk`](https://github.com/flipflag-dev/sdk), this package provides idiomatic React APIs:
**providers, hooks, and safe client-side defaults**.

---

## Features

- React-first API (`Provider`, hooks)
- Works with **React 18+** and **Next.js (App & Pages Router)**
- Safe by default for the browser (public key only)
- Automatic re-rendering on flag updates
- Optional SSR-friendly bootstrapping
- Full TypeScript support
- Zero config required on the client

---

## Installation

```sh
npm install @flipflag/react @flipflag/sdk
# or
yarn add @flipflag/react @flipflag/sdk
```

> `react` and `@flipflag/sdk` are declared as peer dependencies.

---

## Core Concepts

- **`FlipFlagProvider`**  
  Owns a single `FlipFlag` manager instance and handles lifecycle (`init`, polling, `destroy`).

- **Hooks (`useFlag`, `useFlags`)**  
  Read feature flags reactively inside components.

- **Client-safe by default**  
  Designed to run in the browser using a **public key only**.

---

## Quick Start (React)

```tsx
import { FlipFlagProvider, useFlag } from "@flipflag/react";

function NewNavbar() {
  const enabled = useFlag("new-navbar", false);

  return enabled ? <div>New navbar</div> : <div>Old navbar</div>;
}

export function App() {
  return (
    <FlipFlagProvider
      options={{
        publicKey: "YOUR_PUBLIC_KEY",
      }}
    >
      <NewNavbar />
    </FlipFlagProvider>
  );
}
```

---

## Next.js (App Router)

### `app/providers.tsx`

```tsx
"use client";

import { FlipFlagProvider } from "@flipflag/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FlipFlagProvider
      options={{
        publicKey: process.env.NEXT_PUBLIC_FLIPFLAG_PUBLIC_KEY!,
        ignoreMissingConfig: true
      }}
    >
      {children}
    </FlipFlagProvider>
  );
}
```

### `app/layout.tsx`

```tsx
import { Providers } from "./providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

---

## Hooks API

### `useFlag(name, fallback?)`

Returns a boolean feature flag value.

```ts
const enabled = useFlag("checkout-v2");
```

With fallback:

```ts
const enabled = useFlag("checkout-v2", false);
```

---

### `useFlags(names, fallback?)`

Read multiple flags at once.

```ts
const flags = useFlags(["checkout-v2", "new-navbar"] as const);

flags["checkout-v2"];
flags["new-navbar"];
```

---

### `useFlipFlagReady()`

Check SDK initialization state.

```ts
const { ready, error } = useFlipFlagReady();

if (!ready) return <Spinner />;
if (error) return <ErrorState />;
```

---

## Provider Options

```ts
export type FlipFlagReactOptions = {
  publicKey: string;
  privateKey?: string;              // ⚠️ server-only
  apiUrl?: string;
  configPath?: string;
  ignoreMissingConfig?: boolean;
  refreshIntervalMs?: number;        // default: 10_000
  initialFlags?: Record<string, boolean>;
};
```

---

## License

MIT License

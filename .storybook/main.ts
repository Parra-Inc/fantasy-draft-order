import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import tailwind from "@tailwindcss/vite";
import type { StorybookConfig } from "@storybook/react-vite";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

/**
 * Storybook, for the surfaces that are hard to reach in the running app: the
 * design-system primitives side by side, and later the draft-reveal empty
 * states.
 *
 * `react-vite`, not `nextjs-vite`. Nothing rendered here needs a real Next
 * config or the Cloudflare/D1 bindings the app's own `next.config.ts` wires
 * up: this is a single Next app at the repo root, so `next/image` and
 * `next/link` are aliased to two-line shims below instead of booting Next
 * itself.
 */
const config: StorybookConfig = {
  stories: ["../src/components/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs"],
  framework: "@storybook/react-vite",
  staticDirs: ["../public"],
  viteFinal: (vite) => ({
    ...vite,
    plugins: [...(vite.plugins ?? []), tailwind()],
    resolve: {
      ...vite.resolve,
      alias: [
        ...(Array.isArray(vite.resolve?.alias)
          ? vite.resolve.alias
          : Object.entries(vite.resolve?.alias ?? {}).map(([find, replacement]) => ({
              find,
              replacement: replacement as string,
            }))),
        { find: /^next\/image$/, replacement: resolve(here, "shims/next-image.tsx") },
        { find: /^next\/link$/, replacement: resolve(here, "shims/next-link.tsx") },
        // Matches tsconfig.json's "@/*": ["./src/*"]. Regex `find`, never a
        // bare "@" string, so a scoped package is never swallowed by it.
        { find: /^@\//, replacement: `${resolve(root, "src")}/` },
      ],
    },
  }),
};

export default config;

import type { Preview } from "@storybook/react-vite";

import "./preview.css";

const preview: Preview = {
  parameters: {
    // The app has one ground, midnight: the decorator paints it and
    // Storybook's own white canvas is disabled so nothing is reviewed
    // against a background the product does not have.
    backgrounds: { disable: true },
    layout: "fullscreen",
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
    options: {
      // Alphabetical would open on Badge and bury nothing (there is no
      // gallery yet), but the order is stated up front so folders added
      // later (Empty states, Marketing, Emails) land in the right place
      // without a second pass on this file.
      storySort: {
        order: [
          "Components",
          ["Button", "Badge", "Form controls", "Card", "Layout", "Prose", "Banner", "Popover"],
          "Empty states",
          ["Gallery"],
          "Marketing",
          "Emails",
          "Brand",
          ["Wordmark", "Mark"],
        ],
      },
    },
    a11y: {
      test: "todo",
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-midnight p-6 font-body text-chalk">
        <Story />
      </div>
    ),
  ],
};

export default preview;

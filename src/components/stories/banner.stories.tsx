import type { Meta, StoryObj } from "@storybook/react-vite";
import { Banner } from "@/components/ui/banner";

/**
 * The full-width callout: amber for "slow down and check this", signal green
 * for the open-source trust claims, neutral for everything else. Amber is
 * never used for an error, only for a moment that deserves attention.
 */
const meta = {
  title: "Components/Banner",
  component: Banner,
  parameters: { layout: "padded" },
  args: {
    tone: "warning",
    title: "Read this before you trust the result",
    children: "The draw is only fair if you saw this exact link before the draft time.",
  },
  argTypes: { tone: { control: "select", options: ["warning", "trust", "info"] } },
} satisfies Meta<typeof Banner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Tones: Story = {
  render: () => (
    <div className="grid max-w-xl gap-4">
      <Banner tone="warning" title="Read this before you trust the result">
        Anyone can create a draft. If this link showed up after the draw, or
        there are sibling drafts below you were not told about, treat the
        result as suspect.
      </Banner>
      <Banner tone="trust" title="Open source, checkable">
        The randomizer that drew this order is public. Every draft links to
        the exact commit that produced it.
      </Banner>
      <Banner tone="info">
        The wheel eliminates one option at a time. Nothing is announced until
        the last elimination lands.
      </Banner>
    </div>
  ),
};

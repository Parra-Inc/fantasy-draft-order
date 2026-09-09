import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrandMark } from "@/components/brand-mark";
import { Wordmark } from "@/components/wordmark";

/** The mark: a radial-gradient signal-green circle with a chalk "1" (first pick), used alone or beside the wordmark. */
const meta = {
  title: "Brand/Mark",
  component: BrandMark,
  parameters: { layout: "padded" },
} satisfies Meta<typeof BrandMark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithWordmark: Story = {
  render: () => (
    <div className="flex items-center gap-2.5">
      <BrandMark />
      <Wordmark />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <BrandMark className="h-6 w-6" />
      <BrandMark className="h-9 w-9" />
      <BrandMark className="h-16 w-16" />
    </div>
  ),
};

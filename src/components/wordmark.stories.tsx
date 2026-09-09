import type { Meta, StoryObj } from "@storybook/react-vite";
import { Wordmark } from "@/components/wordmark";

/** The product name lockup. Stacks onto two lines below `lg` so it still fits next to the nav on phones. */
const meta = {
  title: "Brand/Wordmark",
  component: Wordmark,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Wordmark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

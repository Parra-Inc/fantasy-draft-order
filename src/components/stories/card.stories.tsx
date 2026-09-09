import type { Meta, StoryObj } from "@storybook/react-vite";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * The one panel the whole site is built from: `rounded-2xl border
 * border-sideline/50 bg-sideline/20`. `CardTitle` is the small-caps eyebrow
 * heading a form section opens with (see the new-draft form's "Teams" and
 * "League details" cards).
 */
const meta = {
  title: "Components/Card",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => (
    <Card className="max-w-md">
      <CardTitle eyebrow="League details" />
      <p className="text-chalk/80 text-sm leading-relaxed">
        Gridiron Goons, 12 teams, scheduled for Sunday at 7:00pm. Once this is
        created the roster and the draw time are locked.
      </p>
    </Card>
  ),
};

export const WithActions: Story = {
  render: () => (
    <Card className="max-w-md">
      <CardTitle
        eyebrow="Teams"
        actions={
          <Button variant="outline" size="sm">
            Re-import
          </Button>
        }
      />
      <p className="text-chalk/80 text-sm leading-relaxed">
        12 teams found from Sleeper. Edit any name below before you create the
        draw.
      </p>
    </Card>
  ),
};

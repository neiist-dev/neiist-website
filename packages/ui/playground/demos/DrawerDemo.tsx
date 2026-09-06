import React, { useState } from "react";
import { DemoCard } from "../components/DemoCard";
import { Button, Drawer, Badge, Stack, Text } from "@neiist/ui";

const DRAWER_SIZES: Array<{
  size: "sm" | "md" | "lg";
  label: string;
  variant?: "solid" | "outline";
}> = [
  { size: "sm", label: "Small Drawer (sm)" },
  { size: "md", label: "Medium Drawer (md)" },
  { size: "lg", label: "Large Drawer (lg)", variant: "outline" },
];

const NAV_ITEMS = ["Home", "Profile", "Settings"];

export const DrawerDemo = () => {
  const [openRight, setOpenRight] = useState(false);
  const [openLeft, setOpenLeft] = useState(false);
  const [size, setSize] = useState<"sm" | "md" | "lg">("md");

  return (
    <Stack gap="lg">
      <DemoCard
        title="Responsive Drawer / Slide-Over"
        description="Responsive panel that slides in from the edge with compound Header, Body, and Footer sub-components.">
        <Stack direction="row" gap="md" wrap>
          {DRAWER_SIZES.map(({ size: btnSize, label, variant }) => (
            <Button
              key={btnSize}
              variant={variant}
              onClick={() => {
                setSize(btnSize);
                setOpenRight(true);
              }}>
              {label}
            </Button>
          ))}
        </Stack>

        <Drawer
          open={openRight}
          onClose={() => setOpenRight(false)}
          size={size}
          position="right"
          title="Member Management"
          subtitle="View and edit member profile information"
          badge={<Badge variant="primary">Active</Badge>}>
          <Stack gap="md">
            <Text>
              This panel slides smoothly from the edge and provides clean focus trapping and escape
              dismissal.
            </Text>
            <div>
              <strong>Member ID:</strong> #2026-042
            </div>
            <div>
              <strong>Program:</strong> Computer Science and Engineering
            </div>
          </Stack>
          <Drawer.Footer>
            <Button variant="ghost" onClick={() => setOpenRight(false)}>
              Cancel
            </Button>
            <Button variant="solid" color="primary" onClick={() => setOpenRight(false)}>
              Save Changes
            </Button>
          </Drawer.Footer>
        </Drawer>
      </DemoCard>

      <DemoCard title="Left Navigation Drawer">
        <Stack direction="row" gap="md" wrap>
          <Button variant="outline" onClick={() => setOpenLeft(true)}>
            Open Left Drawer
          </Button>
        </Stack>
        <Drawer
          open={openLeft}
          position="left"
          size="sm"
          onClose={() => setOpenLeft(false)}
          title="Navigation Menu">
          <Stack gap="md">
            {NAV_ITEMS.map((item) => (
              <Button key={item} variant="ghost" fullWidth style={{ justifyContent: "flex-start" }}>
                {item}
              </Button>
            ))}
          </Stack>
        </Drawer>
      </DemoCard>
    </Stack>
  );
};

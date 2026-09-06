import React from "react";
import { PageHeader } from "../components/PageHeader";
import { DemoCard } from "../components/DemoCard";
import { Button, Stack } from "@neiist/ui";
import { FiTrash2, FiDownload, FiSettings } from "react-icons/fi";

const VARIANTS = ["solid", "outline", "ghost"] as const;
const COLORS = ["primary", "neutral", "danger"] as const;

const SIZES: Array<{ size: "sm" | "md" | "icon"; label: string; icon?: React.ReactNode }> = [
  { size: "sm", label: "Small" },
  { size: "md", label: "Medium" },
  { size: "icon", label: "Icon", icon: <FiTrash2 /> },
];

const SHAPES: Array<{ shape: "default" | "pill"; label: string }> = [
  { shape: "default", label: "Default Shape" },
  { shape: "pill", label: "Pill Shape" },
];

const ICON_BUTTONS: Array<{
  label: string;
  icon: React.ReactNode;
  iconPosition?: "left" | "right";
  variant?: "solid" | "outline" | "ghost";
  color?: "primary" | "neutral" | "danger";
}> = [
  { label: "Download", icon: <FiDownload /> },
  {
    label: "Settings",
    icon: <FiSettings />,
    iconPosition: "right",
    variant: "outline",
    color: "neutral",
  },
  { label: "Delete", icon: <FiTrash2 />, variant: "ghost", color: "danger" },
];

const STATE_BUTTONS: Array<{
  label: string;
  loading?: boolean;
  disabled?: boolean;
}> = [
  { label: "Loading", loading: true },
  { label: "Disabled", disabled: true },
];

export default function ButtonDemo() {
  return (
    <>
      <PageHeader
        title="Button"
        description="Documentation and examples for the Button component."
      />

      <DemoCard title="Variants & Colors">
        <Stack gap="md" direction="column">
          {COLORS.map((color) => (
            <Stack key={color} gap="md" direction="row" style={{ flexWrap: "wrap" }}>
              {VARIANTS.map((variant) => (
                <Button key={variant} variant={variant} color={color}>
                  {variant.charAt(0).toUpperCase() + variant.slice(1)}{" "}
                  {color.charAt(0).toUpperCase() + color.slice(1)}
                </Button>
              ))}
            </Stack>
          ))}
        </Stack>
      </DemoCard>

      <DemoCard title="Sizes & Shapes">
        <Stack gap="md" direction="column">
          <Stack gap="md" direction="row" style={{ flexWrap: "wrap", alignItems: "center" }}>
            {SIZES.map(({ size, label, icon }) => (
              <Button key={size} size={size}>
                {icon ?? label}
              </Button>
            ))}
          </Stack>
          <Stack gap="md" direction="row" style={{ flexWrap: "wrap", alignItems: "center" }}>
            {SHAPES.map(({ shape, label }) => (
              <Button key={shape} shape={shape}>
                {label}
              </Button>
            ))}
          </Stack>
        </Stack>
      </DemoCard>

      <DemoCard title="With Icons">
        <Stack gap="md" direction="row" style={{ flexWrap: "wrap" }}>
          {ICON_BUTTONS.map(({ label, icon, iconPosition, variant, color }) => (
            <Button key={label} variant={variant} color={color}>
              {iconPosition === "right" ? (
                <>
                  {label} {icon}
                </>
              ) : (
                <>
                  {icon} {label}
                </>
              )}
            </Button>
          ))}
        </Stack>
      </DemoCard>

      <DemoCard title="States">
        <Stack gap="md" direction="row" style={{ flexWrap: "wrap" }}>
          {STATE_BUTTONS.map(({ label, loading, disabled }) => (
            <Button key={label} loading={loading} disabled={disabled}>
              {label}
            </Button>
          ))}
        </Stack>
      </DemoCard>
    </>
  );
}

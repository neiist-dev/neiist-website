import React from "react";
import { PageHeader } from "../components/PageHeader";
import { DemoCard } from "../components/DemoCard";
import { Avatar, Stack } from "@neiist/ui";

const BASIC_AVATARS: Array<{ fallback: string; style?: React.CSSProperties }> = [
  { fallback: "IU" },
  { fallback: "MT", style: { background: "#f97316", color: "#fff" } },
];

const COLORS = [
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#10b981",
  "#eab308",
  "#f97316",
  "#ef4444",
  "#f43f5e",
];

const AVATAR_SIZES: Array<{
  size?: "sm" | "md" | "lg";
  style?: React.CSSProperties;
  label: string;
}> = [
  { size: "sm", label: "Small" },
  { size: "md", label: "Medium" },
  { size: "lg", label: "Large" },
  { style: { width: 64, height: 64, fontSize: "1.5rem" }, label: "64px" },
  { style: { width: 80, height: 80, fontSize: "2rem" }, label: "80px" },
];

export default function AvatarDemo() {
  return (
    <>
      <PageHeader title="Avatar" description="A component for displaying user initials" />

      <DemoCard title="Basic">
        <Stack gap="lg" direction="row" wrap>
          {BASIC_AVATARS.map(({ fallback, style }) => (
            <Avatar key={fallback} fallback={fallback} style={style} />
          ))}
        </Stack>
      </DemoCard>

      <DemoCard title="Color">
        <Stack gap="md" direction="row" wrap>
          {COLORS.map((color) => (
            <Avatar key={color} fallback="IU" style={{ background: color, color: "#fff" }} />
          ))}
        </Stack>
      </DemoCard>

      <DemoCard title="Size">
        <Stack gap="md" direction="row" align="end" wrap>
          {AVATAR_SIZES.map(({ size, style, label }) => (
            <Avatar key={label} fallback="IU" size={size} style={style} />
          ))}
        </Stack>
      </DemoCard>
    </>
  );
}

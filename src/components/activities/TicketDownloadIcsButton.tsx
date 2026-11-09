"use client";

import { Button, ButtonVariantOrColor } from "@neiist/ui";
import { LuDownload } from "react-icons/lu";

interface TicketDownloadIcsButtonProps {
  activityId: string;
  label: string;
  size?: "sm" | "md" | "lg";
  variant?: ButtonVariantOrColor;
  fullWidth?: boolean;
}

export default function TicketDownloadIcsButton({
  activityId,
  label,
  size = "md",
  variant = "outline",
  fullWidth = true,
}: TicketDownloadIcsButtonProps) {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = `/api/calendar/activities/${activityId}/ics`;
    link.download = `event_${activityId}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      onClick={handleDownload}
      title={label}>
      <LuDownload size={size === "sm" ? 14 : 16} />
      <span>{label}</span>
    </Button>
  );
}

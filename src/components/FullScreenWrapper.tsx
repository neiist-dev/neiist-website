"use client";

import { useRef } from "react";

export default function FullScreenWrapper({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleEnterFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handleEnterFullScreen}
      style={{
        width: "100%",
        minHeight: "100vh",
      }}>
      {children}
    </div>
  );
}

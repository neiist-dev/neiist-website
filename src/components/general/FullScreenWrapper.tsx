"use client";

import { useRef } from "react";
import styles from "@/styles/components/general/FullScreenWrapper.module.css";

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
    <div ref={containerRef} onClick={handleEnterFullScreen} className={styles.wrapper}>
      {children}
    </div>
  );
}

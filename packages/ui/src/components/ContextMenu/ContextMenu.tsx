"use client";

import React, { useState } from "react";
import { Popover } from "../Popover/Popover";
import { DropdownMenuItem, DropdownMenuDivider } from "../DropdownMenu/DropdownMenu";
import dropdownStyles from "../DropdownMenu/DropdownMenu.module.css";

export interface ContextMenuTriggerProps {
  onContextMenu: React.MouseEventHandler;
}

export interface ContextMenuProps {
  content: React.ReactNode | ((_close: () => void) => React.ReactNode);
  children: React.ReactNode | ((_props: ContextMenuTriggerProps) => React.ReactNode);
  disabled?: boolean;
  width?: number | string;
  mobileTitle?: string;
  className?: string;
}

export function ContextMenuRoot({
  content,
  children,
  disabled = false,
  width = 200,
  mobileTitle = "Actions",
  className,
}: ContextMenuProps) {
  const [anchorPoint, setAnchorPoint] = useState<{ x: number; y: number } | null>(null);

  const handleContextMenu = (event: React.MouseEvent) => {
    if (disabled) return;
    event.preventDefault();
    setAnchorPoint({ x: event.clientX, y: event.clientY });
  };

  const close = () => setAnchorPoint(null);

  return (
    <>
      {typeof children === "function" ? (
        children({ onContextMenu: handleContextMenu })
      ) : (
        <div className={className} onContextMenu={handleContextMenu}>
          {children}
        </div>
      )}
      {anchorPoint && (
        <Popover
          isOpen={true}
          onClose={close}
          anchorPoint={anchorPoint}
          width={width}
          mobileDrawerTitle={mobileTitle}>
          <div role="menu" className={dropdownStyles.menuList} onClick={close}>
            {typeof content === "function" ? content(close) : content}
          </div>
        </Popover>
      )}
    </>
  );
}

export const ContextMenu = Object.assign(ContextMenuRoot, {
  Item: DropdownMenuItem,
  Divider: DropdownMenuDivider,
});

"use client";

import React, { createContext, useContext, useRef, useState } from "react";
import styles from "./DropdownMenu.module.css";
import { cn } from "../../utils/cn";
import { Popover } from "../Popover/Popover";

interface DropdownMenuContextValue {
  isOpen: boolean;
  close: () => void;
  toggle: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

export interface DropdownMenuProps extends React.ComponentPropsWithRef<"div"> {
  children: React.ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
}

export interface DropdownMenuChildProps {
  onClick?: (_event: React.MouseEvent) => void;
  ref?: React.Ref<HTMLElement>;
  "aria-expanded"?: boolean;
}

export interface DropdownMenuTriggerProps {
  children: React.ReactElement<DropdownMenuChildProps>;
  className?: string;
}

export function DropdownMenuTrigger({ children }: DropdownMenuTriggerProps) {
  const ctx = useContext(DropdownMenuContext);
  if (!ctx) throw new Error("DropdownMenuTrigger must be inside DropdownMenu");

  return React.cloneElement(children, {
    ref: ctx.anchorRef as React.Ref<HTMLElement>,
    onClick: (event: React.MouseEvent) => {
      event.stopPropagation();
      children.props.onClick?.(event);
      ctx.toggle();
    },
    "aria-expanded": ctx.isOpen,
  });
}

export interface DropdownMenuItemProps extends React.ComponentPropsWithRef<"button"> {
  icon?: React.ReactNode;
  destructive?: boolean;
  shortcut?: string;
  closeOnSelect?: boolean;
}

export function DropdownMenuItem({
  children,
  icon,
  destructive = false,
  shortcut,
  closeOnSelect = true,
  onClick,
  className,
  ref,
  ...props
}: DropdownMenuItemProps) {
  const ctx = useContext(DropdownMenuContext);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (closeOnSelect && ctx) {
      ctx.close();
    }
  };

  return (
    <button
      ref={ref}
      type="button"
      role="menuitem"
      className={cn(styles.item, destructive && styles.destructive, className)}
      onClick={handleClick}
      {...props}>
      {icon && <span className={styles.itemIcon}>{icon}</span>}
      <span>{children}</span>
      {shortcut && <span className={styles.itemShortcut}>{shortcut}</span>}
    </button>
  );
}

export type DropdownMenuDividerProps = React.ComponentPropsWithRef<"hr">;

export function DropdownMenuDivider({ className, ref, ...props }: DropdownMenuDividerProps) {
  return <hr ref={ref} className={cn(styles.divider, className)} {...props} />;
}

export interface DropdownMenuContentProps {
  children: React.ReactNode;
  className?: string;
  width?: number | string;
  align?: "start" | "center" | "end";
  mobileTitle?: string;
}

export function DropdownMenuContent({
  children,
  className,
  width = 200,
  align = "start",
  mobileTitle = "Actions",
}: DropdownMenuContentProps) {
  const ctx = useContext(DropdownMenuContext);
  if (!ctx) throw new Error("DropdownMenuContent must be inside DropdownMenu");

  return (
    <Popover
      isOpen={ctx.isOpen}
      onClose={ctx.close}
      anchorRef={ctx.anchorRef}
      width={width}
      align={align}
      mobileDrawerTitle={mobileTitle}
      className={className}>
      <div className={styles.menuList} role="menu">
        {children}
      </div>
    </Popover>
  );
}

export function DropdownMenuRoot({ children, className, ref, ...props }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const anchorRef = useRef<HTMLElement>(null);

  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((prev) => !prev);

  return (
    <DropdownMenuContext value={{ isOpen, close, toggle, anchorRef }}>
      <div ref={ref} className={cn(styles.root, className)} {...props}>
        {children}
      </div>
    </DropdownMenuContext>
  );
}

export const DropdownMenu = Object.assign(DropdownMenuRoot, {
  Trigger: DropdownMenuTrigger,
  Content: DropdownMenuContent,
  Item: DropdownMenuItem,
  Divider: DropdownMenuDivider,
});

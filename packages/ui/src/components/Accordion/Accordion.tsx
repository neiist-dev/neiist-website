"use client";

import React, { createContext, use, useId, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import styles from "./Accordion.module.css";
import { cn } from "../../utils/cn";

export interface AccordionProps extends React.ComponentPropsWithRef<"div"> {
  type?: "single" | "multiple";
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (_value: string | string[]) => void;
  variant?: "default" | "flush";
  children: React.ReactNode;
}

export interface AccordionItemProps extends React.ComponentPropsWithRef<"details"> {
  value?: string;
  name?: string;
  open?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

interface AccordionContextValue {
  type: "single" | "multiple";
  activeValue?: string | string[];
  groupId: string;
  onItemToggle: (_value: string, _isOpen: boolean) => void;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

export function AccordionItem({
  children,
  className,
  value,
  name,
  open,
  disabled,
  onToggle,
  ref,
  ...props
}: AccordionItemProps) {
  const context = use(AccordionContext);

  const isControlledOpen =
    context && context.activeValue !== undefined && value !== undefined
      ? Array.isArray(context.activeValue)
        ? context.activeValue.includes(value)
        : context.activeValue === value
      : open;

  const groupName = name ?? (context?.type === "single" ? context.groupId : undefined);

  const handleToggle = (event: React.ToggleEvent<HTMLDetailsElement>) => {
    onToggle?.(event);
    if (context && value !== undefined) context.onItemToggle(value, event.currentTarget.open);
  };

  return (
    <details
      ref={ref}
      className={cn(styles.item, className)}
      name={groupName}
      open={isControlledOpen}
      aria-disabled={disabled}
      onToggle={handleToggle}
      {...props}>
      {children}
    </details>
  );
}

export type AccordionTriggerProps = React.ComponentPropsWithRef<"summary">;

export function AccordionTrigger({ children, className, ref, ...props }: AccordionTriggerProps) {
  return (
    <summary ref={ref} className={cn(styles.trigger, className)} {...props}>
      <span>{children}</span>
      <FiChevronDown className={styles.chevron} aria-hidden="true" />
    </summary>
  );
}

export type AccordionContentProps = React.ComponentPropsWithRef<"div">;

export function AccordionContent({ children, className, ref, ...props }: AccordionContentProps) {
  return (
    <div ref={ref} className={cn(styles.contentWrapper, className)} {...props}>
      <div className={styles.contentBody}>{children}</div>
    </div>
  );
}

export function AccordionRoot({
  type = "single",
  value,
  defaultValue,
  onValueChange,
  variant = "default",
  children,
  className,
  ref,
  ...props
}: AccordionProps) {
  const generatedGroupId = useId();
  const [internalValue, setInternalValue] = useState(defaultValue);
  const activeValue = value !== undefined ? value : internalValue;

  const handleItemToggle = (itemValue: string, isOpen: boolean) => {
    if (type === "single") {
      const next = isOpen ? itemValue : activeValue === itemValue ? "" : (activeValue as string);
      if (value === undefined) setInternalValue(next);
      onValueChange?.(next);
    } else {
      const currentList = Array.isArray(activeValue)
        ? activeValue
        : activeValue
          ? [activeValue]
          : [];
      const nextList = isOpen
        ? [...currentList, itemValue]
        : currentList.filter((value) => value !== itemValue);
      if (value === undefined) setInternalValue(nextList);
      onValueChange?.(nextList);
    }
  };

  return (
    <AccordionContext
      value={{
        type,
        activeValue,
        groupId: generatedGroupId,
        onItemToggle: handleItemToggle,
      }}>
      <div ref={ref} className={cn(styles.accordion, styles[variant], className)} {...props}>
        {children}
      </div>
    </AccordionContext>
  );
}

export const Accordion = Object.assign(AccordionRoot, {
  Item: AccordionItem,
  Trigger: AccordionTrigger,
  Content: AccordionContent,
});

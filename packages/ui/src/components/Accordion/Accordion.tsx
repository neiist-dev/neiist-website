import React, { createContext, use, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import styles from "./Accordion.module.css";
import { cn } from "../../utils/cn";

interface AccordionContextValue {
  type: "single" | "multiple";
  expandedValues: Set<string>;
  toggleItem: (_value: string) => void;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

export interface AccordionProps extends React.ComponentPropsWithRef<"div"> {
  type?: "single" | "multiple";
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (_value: string | string[]) => void;
  variant?: "default" | "flush";
}

export interface AccordionItemProps extends React.ComponentPropsWithRef<"div"> {
  value: string;
  disabled?: boolean;
}

interface ItemContextValue {
  value: string;
  disabled?: boolean;
  isOpen: boolean;
}

const ItemContext = createContext<ItemContextValue | null>(null);

export function AccordionItem({
  value,
  disabled = false,
  children,
  className,
  ref,
  ...props
}: AccordionItemProps) {
  const accordionContext = use(AccordionContext);
  if (!accordionContext) throw new Error("AccordionItem must be inside Accordion");

  const isOpen = accordionContext.expandedValues.has(value);

  return (
    <ItemContext value={{ value, disabled, isOpen }}>
      <div
        ref={ref}
        className={cn(styles.item, className)}
        data-state={isOpen ? "open" : "closed"}
        {...props}>
        {children}
      </div>
    </ItemContext>
  );
}

export type AccordionTriggerProps = React.ComponentPropsWithRef<"button">;

export function AccordionTrigger({
  children,
  className,
  onClick,
  ref,
  ...props
}: AccordionTriggerProps) {
  const accordionContext = use(AccordionContext);
  const item = use(ItemContext);

  if (!accordionContext || !item) throw new Error("AccordionTrigger must be inside AccordionItem");

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (!item.disabled) {
      accordionContext.toggleItem(item.value);
    }
  };

  return (
    <button
      ref={ref}
      type="button"
      disabled={item.disabled}
      aria-expanded={item.isOpen}
      data-state={item.isOpen ? "open" : "closed"}
      className={cn(styles.trigger, className)}
      onClick={handleClick}
      {...props}>
      <span>{children}</span>
      <FiChevronDown className={cn(styles.chevron, item.isOpen && styles.chevronOpen)} />
    </button>
  );
}

export type AccordionContentProps = React.ComponentPropsWithRef<"div">;

export function AccordionContent({ children, className, ref, ...props }: AccordionContentProps) {
  const item = use(ItemContext);
  if (!item) throw new Error("AccordionContent must be inside AccordionItem");

  return (
    <div
      ref={ref}
      role="region"
      data-state={item.isOpen ? "open" : "closed"}
      aria-hidden={!item.isOpen}
      className={cn(
        styles.contentWrapper,
        item.isOpen ? styles.contentWrapperOpen : styles.contentWrapperClosed
      )}>
      <div className={styles.contentInner}>
        <div className={cn(styles.contentBody, className)} {...props}>
          {children}
        </div>
      </div>
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
  const toSet = (val?: string | string[]): Set<string> => {
    if (!val) return new Set();
    return new Set(Array.isArray(val) ? val : [val]);
  };

  const [internalSet, setInternalSet] = useState<Set<string>>(() => toSet(defaultValue));

  const expandedValues = value !== undefined ? toSet(value) : internalSet;

  const toggleItem = (itemVal: string) => {
    const next = new Set(expandedValues);
    if (type === "single") {
      if (next.has(itemVal)) {
        next.clear();
      } else {
        next.clear();
        next.add(itemVal);
      }
    } else {
      if (next.has(itemVal)) {
        next.delete(itemVal);
      } else {
        next.add(itemVal);
      }
    }

    if (value === undefined) setInternalSet(next);

    if (onValueChange) {
      const array = Array.from(next);
      onValueChange(type === "single" ? array[0] || "" : array);
    }
  };

  return (
    <AccordionContext value={{ type, expandedValues, toggleItem }}>
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

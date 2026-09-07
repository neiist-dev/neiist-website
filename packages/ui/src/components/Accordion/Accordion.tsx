import React, { useId } from "react";
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

export function AccordionItem({
  children,
  className,
  name,
  open,
  disabled,
  ref,
  ...props
}: AccordionItemProps) {
  return (
    <details
      ref={ref}
      className={cn(styles.item, className)}
      name={name}
      open={open}
      aria-disabled={disabled}
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
    <div ref={ref} className={cn(styles.contentBody, className)} {...props}>
      {children}
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
  const activeValue = value !== undefined ? value : defaultValue;

  const renderedChildren = React.Children.map(children, (child) => {
    if (!React.isValidElement<AccordionItemProps>(child)) return child;

    const itemValue = child.props.value;
    const isControlledOpen =
      activeValue !== undefined && itemValue !== undefined
        ? Array.isArray(activeValue)
          ? activeValue.includes(itemValue)
          : activeValue === itemValue
        : child.props.open;

    return React.cloneElement(child, {
      name: child.props.name ?? (type === "single" ? generatedGroupId : undefined),
      open: isControlledOpen ?? child.props.open,
      onToggle: (event: React.ToggleEvent<HTMLDetailsElement>) => {
        child.props.onToggle?.(event);
        if (onValueChange && itemValue !== undefined) {
          const isOpen = event.currentTarget.open;
          if (type === "single") {
            if (isOpen) onValueChange(itemValue);
            else if (activeValue === itemValue) onValueChange("");
          } else {
            const currentList = Array.isArray(activeValue)
              ? activeValue
              : activeValue
                ? [activeValue]
                : [];
            const nextList = isOpen
              ? [...currentList, itemValue]
              : currentList.filter((v) => v !== itemValue);
            onValueChange(nextList);
          }
        }
      },
    });
  });

  return (
    <div ref={ref} className={cn(styles.accordion, styles[variant], className)} {...props}>
      {renderedChildren}
    </div>
  );
}

export const Accordion = Object.assign(AccordionRoot, {
  Item: AccordionItem,
  Trigger: AccordionTrigger,
  Content: AccordionContent,
});

import React from "react";
import styles from "./Card.module.css";
import { cn } from "../../utils/cn";

export interface CardProps extends React.ComponentPropsWithRef<"article"> {
  variant?: "elevated" | "flat";
}

export function CardRoot({ children, variant = "elevated", className, ref, ...props }: CardProps) {
  return (
    <article ref={ref} className={cn(styles.card, styles[variant], className)} {...props}>
      {children}
    </article>
  );
}

export interface CardHeaderProps extends Omit<React.ComponentPropsWithRef<"header">, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

export function CardHeader({
  children,
  title,
  description,
  action,
  className,
  ref,
  ...props
}: CardHeaderProps) {
  return (
    <header ref={ref} className={cn(styles.header, className)} {...props}>
      {title || description ? (
        <div className={styles.headerContent}>
          {title && <h4 className={styles.title}>{title}</h4>}
          {description && <p className={styles.description}>{description}</p>}
        </div>
      ) : null}
      {children}
      {action && <div className={styles.action}>{action}</div>}
    </header>
  );
}

export type CardBodyProps = React.ComponentPropsWithRef<"div">;

export function CardBody({ children, className, ref, ...props }: CardBodyProps) {
  return (
    <div ref={ref} className={cn(styles.body, className)} {...props}>
      {children}
    </div>
  );
}

export type CardFooterProps = React.ComponentPropsWithRef<"footer">;

export function CardFooter({ children, className, ref, ...props }: CardFooterProps) {
  return (
    <footer ref={ref} className={cn(styles.footer, className)} {...props}>
      {children}
    </footer>
  );
}

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
});

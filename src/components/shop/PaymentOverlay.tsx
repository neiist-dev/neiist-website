import React from "react";
import { Button, Heading, Modal, Spinner, Stack, Text } from "@neiist/ui";
import styles from "@/styles/components/shop/PaymentOverlay.module.css";

export interface PaymentOverlayAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "outline" | "danger" | "ghost";
}

export interface PaymentOverlayProps {
  open?: boolean;
  variant?: "overlay" | "inline";
  size?: "sm" | "md" | "lg" | "xl" | "full" | "auto";
  state?: "loading" | "success" | "error" | "none";
  iconSize?: number;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  children?: React.ReactNode;
  primaryAction?: PaymentOverlayAction;
  secondaryAction?: PaymentOverlayAction;
  onClose?: () => void;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  className?: string;
}

export default function PaymentOverlay({
  open = true,
  variant = "overlay",
  size = "md",
  state = "none",
  iconSize,
  title,
  subtitle,
  badge,
  children,
  primaryAction,
  secondaryAction,
  onClose,
  showCloseButton = true,
  closeOnBackdropClick = false,
  className,
}: PaymentOverlayProps) {
  if (!open) return null;

  const resolvedIconSize = iconSize ?? (variant === "inline" ? 48 : 56);
  const resolvedTitle = title ?? (state === "error" ? "Erro no Pagamento" : undefined);
  const hasCloseButton = Boolean(onClose && showCloseButton);

  const content = (
    <Stack
      direction="column"
      align="center"
      gap="sm"
      role="status"
      data-state={state}
      className={styles.statusContainer}>
      {state !== "none" && <Spinner size={resolvedIconSize} state={state} />}

      {resolvedTitle && (
        <Heading level={5} className={state === "error" ? styles.errorTitle : styles.title}>
          {resolvedTitle}
        </Heading>
      )}

      {subtitle && (
        <Text size="sm" variant="muted" className={styles.subtitle}>
          {subtitle}
        </Text>
      )}

      {badge && <div className={styles.badgeWrapper}>{badge}</div>}

      {children && <div className={styles.contentWrapper}>{children}</div>}

      {(primaryAction || secondaryAction) && (
        <div className={styles.actionsContainer}>
          {primaryAction && (
            <Button
              variant={primaryAction.variant ?? "primary"}
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}>
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant={secondaryAction.variant ?? "outline"}
              onClick={secondaryAction.onClick}
              disabled={secondaryAction.disabled}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </Stack>
  );

  if (variant === "overlay") {
    return (
      <Modal
        open={open}
        onClose={onClose ?? (() => {})}
        size={size}
        closeOnBackdropClick={closeOnBackdropClick}
        draggable={false}
        showCloseButton={hasCloseButton}
        className={className}>
        {hasCloseButton && (
          <Modal.Header
            className={styles.modalHeader}
            onClose={onClose}
            showCloseButton={true}
            closeLabel="Fechar"
          />
        )}
        <Modal.Body>{content}</Modal.Body>
      </Modal>
    );
  }

  return <div className={className}>{content}</div>;
}

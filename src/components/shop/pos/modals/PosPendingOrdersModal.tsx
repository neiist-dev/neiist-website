"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Stack, Card, Checkbox, Text } from "@neiist/ui";
import { Order } from "@/types/shop/order";
import { formatMoney } from "@/utils/shop/moneyUtils";
import VariantTags from "@/components/shop/VariantTags";
import styles from "@/styles/components/shop/pos/modals/PosPendingOrdersModal.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

interface PosPendingOrdersModalProps {
  orders: Order[];
  onClose: () => void;
  onLoadOrders: (_orders: Order[]) => void;
  dict: Dictionary["pos"]["pending"];
}

function PendingOrderCardContent({ order }: { order: Order }) {
  return (
    <Stack direction="column" gap="sm" className={styles.details}>
      <Stack direction="column" gap="sm">
        {order.items.map((it) => (
          <Stack
            key={
              it.id
                ? `item-${it.id}`
                : `${it.product_id}-${it.variant_id ?? "base"}-${it.product_name}`
            }
            direction="row"
            gap="sm"
            align="center"
            wrap>
            <strong>
              {it.quantity}x {it.product_name}
            </strong>
            <VariantTags options={it.variant_options} label={it.variant_label} showColorSwatch />
          </Stack>
        ))}
      </Stack>

      <Stack direction="row" gap="sm" align="center" wrap>
        <strong>{order.order_number}</strong>
        <Text size="sm" variant="muted">
          •
        </Text>
        <strong className={styles.orderTotal}>{formatMoney(order.total_amount)}</strong>
      </Stack>
    </Stack>
  );
}

export default function PosPendingOrdersModal({
  orders,
  onClose,
  onLoadOrders,
  dict,
}: PosPendingOrdersModalProps) {
  const [selectedOrderNumbers, setSelectedOrderNumbers] = useState<string[]>([]);

  useEffect(() => {
    setSelectedOrderNumbers(orders.map((o) => o.order_number));
  }, [orders]);

  if (orders.length === 0) return null;

  const isMultiple = orders.length > 1;
  const firstOrder = orders[0];

  return (
    <Modal open={orders.length > 0} onClose={onClose} size={isMultiple ? "lg" : "md"}>
      <Modal.Header
        title={isMultiple ? dict.multiple_title : dict.single_title}
        onClose={onClose}
      />
      <Modal.Body>
        <Stack direction="column" gap="md">
          <Text>
            {isMultiple
              ? dict.multiple_intro.replace("{count}", String(orders.length))
              : dict.single_intro.replace(
                  "{name}",
                  firstOrder.customer_name || firstOrder.user_istid || ""
                )}
          </Text>

          {!isMultiple ? (
            <Card variant="flat">
              <Card.Body>
                <PendingOrderCardContent order={firstOrder} />
              </Card.Body>
            </Card>
          ) : (
            <Stack direction="column" gap="sm" className={styles.ordersList}>
              {orders.map((ord) => {
                const isSelected = selectedOrderNumbers.includes(ord.order_number);
                const toggleOrder = () => {
                  setSelectedOrderNumbers((prev) =>
                    prev.includes(ord.order_number)
                      ? prev.filter((id) => id !== ord.order_number)
                      : [...prev, ord.order_number]
                  );
                };

                return (
                  <Card
                    key={ord.order_number}
                    variant="flat"
                    className={`${styles.orderItem} ${isSelected ? styles.orderItemActive : ""}`}
                    onClick={toggleOrder}>
                    <Card.Body>
                      <Stack direction="row" gap="md" align="center">
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox checked={isSelected} onChange={toggleOrder} />
                        </div>
                        <PendingOrderCardContent order={ord} />
                      </Stack>
                    </Card.Body>
                  </Card>
                );
              })}
            </Stack>
          )}
        </Stack>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline" onClick={onClose}>
          {dict.new_sale}
        </Button>
        <Button
          variant="primary"
          disabled={isMultiple && selectedOrderNumbers.length === 0}
          onClick={() => {
            if (!isMultiple) {
              onLoadOrders([firstOrder]);
            } else {
              onLoadOrders(orders.filter((o) => selectedOrderNumbers.includes(o.order_number)));
            }
          }}>
          {isMultiple
            ? dict.load_selected.replace("{count}", String(selectedOrderNumbers.length))
            : dict.load}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  Field,
  Input,
  Select,
  DateInput,
  Textarea,
  Button,
  Alert,
  Heading,
  ColorfulText,
} from "@neiist/ui";
import { pt } from "date-fns/locale";
import { format, parse, isValid } from "date-fns";
import type { Order } from "@/types/shop/order";
import type { Dictionary } from "@/i18n/dictionaries";
import { updateOrderAction } from "@/actions/shop/orders";
import styles from "@/styles/components/shop/manage/EditOrderModal.module.css";

interface EditOrderModalProps {
  order: Order | null;
  dict: Dictionary["orders_table"];
  onClose: () => void;
  onSaved: (_updated: Order) => void;
}

export default function EditOrderModal({ order, dict, onClose, onSaved }: EditOrderModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [campus, setCampus] = useState("");
  const [nif, setNif] = useState("");
  const [pickupDeadline, setPickupDeadline] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!order) return;
    setCustomerName(order.customer_name || "");
    setCustomerEmail(order.customer_email || "");
    setCustomerPhone(order.customer_phone || "");
    setCampus(order.campus || "");
    setNif(order.customer_nif || "");
    if (order.pickup_deadline) {
      const parsed = new Date(order.pickup_deadline);
      setPickupDeadline(isValid(parsed) ? parsed : undefined);
    } else {
      setPickupDeadline(undefined);
    }
    setNotes(order.notes || "");
    setIsSaving(false);
  }, [order]);

  const isGuest = Boolean(order && !order.user_istid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        campus: campus || null,
        nif: nif.trim() || null,
        notes,
        pickup_deadline: pickupDeadline ? pickupDeadline.toISOString() : null,
      };
      if (isGuest) {
        payload.customer_name = customerName.trim();
        payload.customer_email = customerEmail.trim() || null;
        payload.customer_phone = customerPhone.trim() || null;
      }

      const updated = await updateOrderAction(order.order_number, payload);
      Alert.success(dict.order_success);
      onSaved(updated);
      onClose();
    } catch (err: unknown) {
      Alert.error(err instanceof Error ? err.message : dict.error_update_order);
    } finally {
      setIsSaving(false);
    }
  };

  const campusOptions = [
    { label: "Alameda", value: "alameda" },
    { label: "Taguspark", value: "taguspark" },
  ];

  return (
    <Modal open={order !== null} onClose={onClose} size="lg">
      <Modal.Header
        title={
          order ? (
            <Heading level={3}>
              <ColorfulText as="span" text={dict.edit_order} colors={["var(--primary-colour)"]} />{" "}
              {order.order_number}
            </Heading>
          ) : (
            ""
          )
        }
        onClose={onClose}
      />
      <Modal.Body>
        <form id="edit-order-form" onSubmit={handleSubmit}>
          <div className={styles.detailsGrid}>
            {isGuest && (
              <>
                <Field label={dict.edit_customer_name}>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    requiredMessage={dict.field_required}
                  />
                </Field>
                <Field label={dict.edit_customer_email}>
                  <Input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                  />
                </Field>
                <Field label={dict.edit_customer_phone}>
                  <Input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </Field>
              </>
            )}

            <Field label={dict.edit_campus}>
              <Select
                value={campus}
                onChange={(val) => setCampus(String(val))}
                options={campusOptions}
              />
            </Field>

            <Field label={dict.edit_nif}>
              <Input value={nif} onChange={(e) => setNif(e.target.value)} />
            </Field>

            <Field label={dict.edit_pickup_deadline}>
              <DateInput
                value={pickupDeadline}
                onChange={(d) =>
                  setPickupDeadline(
                    d && isValid(d)
                      ? parse(format(d, "yyyy-MM-dd"), "yyyy-MM-dd", new Date())
                      : undefined
                  )
                }
                placeholder="DD/MM/AAAA"
                mobileDrawerTitle={dict.edit_pickup_deadline}
                locale={pt}
              />
            </Field>

            <Field label={dict.edit_notes} className={styles.fullSpan}>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </Field>
          </div>
        </form>
      </Modal.Body>

      <Modal.Footer>
        <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
          {dict.edit_cancel}
        </Button>
        <Button
          type="submit"
          form="edit-order-form"
          variant="primary"
          loading={isSaving}
          disabled={isSaving}>
          {dict.edit_save}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

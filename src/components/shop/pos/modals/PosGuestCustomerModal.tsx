"use client";

import React, { useState } from "react";
import { Modal, Input, Button, Alert, Stack } from "@neiist/ui";
import type { Dictionary } from "@/i18n/dictionaries";

interface PosGuestCustomerModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (_guest: { name: string; email: string; phone: string }) => void;
  dict: Dictionary["pos"]["guest"];
}

export default function PosGuestCustomerModal({
  open,
  onClose,
  onConfirm,
  dict,
}: PosGuestCustomerModalProps) {
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  const handleConfirm = () => {
    if (!guestName.trim() || !guestEmail.trim()) {
      Alert.error(dict.error_required);
      return;
    }
    onConfirm({
      name: guestName.trim(),
      email: guestEmail.trim(),
      phone: guestPhone.trim(),
    });
    setGuestName("");
    setGuestEmail("");
    setGuestPhone("");
  };

  return (
    <Modal open={open} onClose={onClose} size="md">
      <Modal.Header title={dict.title} onClose={onClose} />
      <Modal.Body>
        <Stack direction="column" gap="md">
          <Input
            label={dict.name_label}
            placeholder={dict.name_placeholder}
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            autoFocus
            required
            requiredMessage={dict.error_required}
          />

          <Input
            label={dict.email_label}
            type="email"
            placeholder={dict.email_placeholder}
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            required
            requiredMessage={dict.error_required}
          />

          <Input
            label={dict.phone_label}
            type="tel"
            placeholder={dict.phone_placeholder}
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
          />
        </Stack>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline" onClick={onClose}>
          {dict.cancel}
        </Button>
        <Button
          variant="primary"
          onClick={handleConfirm}
          disabled={!guestName.trim() || !guestEmail.trim()}>
          {dict.confirm}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

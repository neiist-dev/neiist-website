"use client";

import React, { useEffect, useState } from "react";
import { Alert, Button, Input, Modal } from "@neiist/ui";
import type { Membership } from "@/types/memberships";
import type { Dictionary } from "@/i18n/dictionaries";
import { getMemberHistoryAction } from "@/actions/admin/memberships";

interface EditNeiistEmailModalProps {
  membership: Membership | null;
  onClose: () => void;
  dict: Dictionary;
}

export default function EditNeiistEmailModal({
  membership,
  onClose,
  dict,
}: EditNeiistEmailModalProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const mDict = dict.admin.memberships_management;

  useEffect(() => {
    if (!membership?.userNumber) {
      setEmail("");
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    getMemberHistoryAction(membership.userNumber)
      .then((data) => {
        if (isMounted) {
          setEmail(data.user?.neiistEmail ?? "");
        }
      })
      .catch((err) => {
        console.error("Failed to load member NEIIST email:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [membership?.userNumber]);

  if (!membership) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`/api/user/update/${membership.userNumber}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          neiistEmail: email.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || mDict.neiist_email_error);
      }

      Alert.success(data.message || mDict.neiist_email_updated);
      onClose();
    } catch (err: unknown) {
      Alert.error(err instanceof Error ? err.message : mDict.neiist_email_error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal open={!!membership} onClose={onClose} size="sm">
      <Modal.Header title={mDict.edit_neiist_email_title} onClose={onClose} />
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          <Input
            label={mDict.neiist_email_label}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nome.apelido@neiist.pt"
            disabled={isLoading || isSaving}
            autoFocus
          />
        </Modal.Body>

        <Modal.Footer>
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
            {mDict.confirm_cancel}
          </Button>
          <Button
            type="submit"
            variant="solid"
            color="primary"
            size="sm"
            loading={isSaving}
            disabled={isLoading}>
            {mDict.save}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}

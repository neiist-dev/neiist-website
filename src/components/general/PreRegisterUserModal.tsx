"use client";

import React, { useState, useEffect } from "react";
import { Modal, Field, Input, Button, Alert, Stack, DetailCard, Badge } from "@neiist/ui";
import MemberAvatar from "@/components/layout/MemberAvatar";
import { IST_ID_REGEX, EMAIL_REGEX } from "@/utils/userUtils";
import type { User } from "@/types/user";
import type { Dictionary } from "@/i18n/dictionaries";

interface PreRegisterUserModalProps {
  defaultIstid: string | null;
  onClose: () => void;
  onCreated: (_user: User) => void;
  dict: Dictionary["pre_register_user"];
}

export default function PreRegisterUserModal({
  defaultIstid,
  onClose,
  onCreated,
  dict,
}: PreRegisterUserModalProps) {
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [name, setName] = useState("");
  const [istid, setIstid] = useState(defaultIstid?.toLowerCase() ?? "");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (defaultIstid !== null) {
      setStep("form");
      setName("");
      setIstid(defaultIstid.toLowerCase());
      setEmail("");
      setIsSubmitting(false);
    }
  }, [defaultIstid]);

  const normalizedIstid = istid.trim().toLowerCase();
  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!IST_ID_REGEX.test(normalizedIstid)) {
      Alert.error(dict.error_invalid_istid);
      return;
    }
    if (!normalizedName || !EMAIL_REGEX.test(normalizedEmail)) {
      Alert.error(dict.error_required);
      return;
    }
    setStep("confirm");
  };

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          istid: normalizedIstid,
          name: normalizedName,
          email: normalizedEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.user) throw new Error(data.error || dict.error_create);

      if (data.existed) {
        Alert.info(dict.already_exists);
      } else {
        Alert.success(dict.created_success);
      }
      onCreated(data.user);
      onClose();
    } catch (err: unknown) {
      Alert.error(err instanceof Error ? err.message : dict.error_create);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={defaultIstid !== null} onClose={onClose} size="md">
      <Modal.Header title={step === "form" ? dict.title : dict.confirm_title} onClose={onClose} />
      {step === "form" ? (
        <form onSubmit={handleContinue}>
          <Modal.Body>
            <Stack direction="column" gap="md">
              <Field label={dict.istid_label}>
                <Input
                  placeholder={dict.istid_placeholder}
                  value={istid}
                  onChange={(e) => setIstid(e.target.value)}
                  autoFocus
                  required
                  requiredMessage={dict.error_required}
                />
              </Field>

              <Field label={dict.name_label}>
                <Input
                  placeholder={dict.name_placeholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  requiredMessage={dict.error_required}
                />
              </Field>

              <Field label={dict.email_label}>
                <Input
                  type="email"
                  placeholder={dict.email_placeholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  requiredMessage={dict.error_required}
                />
              </Field>
            </Stack>
          </Modal.Body>
          <Modal.Footer>
            <Button type="button" variant="outline" onClick={onClose}>
              {dict.cancel}
            </Button>
            <Button type="submit" variant="primary">
              {dict.continue}
            </Button>
          </Modal.Footer>
        </form>
      ) : (
        <>
          <Modal.Body>
            <Stack direction="column" gap="md">
              <DetailCard
                avatar={<MemberAvatar name={normalizedName} size="md" />}
                title={normalizedName}
                identifier={normalizedIstid}
                badge={
                  <Badge variant="outline" color="info">
                    {dict.confirm_badge}
                  </Badge>
                }
                metadata={[{ label: dict.email_label, value: normalizedEmail }]}
              />
              <p>{dict.confirm_notice}</p>
            </Stack>
          </Modal.Body>
          <Modal.Footer>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep("form")}
              disabled={isSubmitting}>
              {dict.back}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleCreate}
              loading={isSubmitting}
              disabled={isSubmitting}>
              {dict.confirm_create}
            </Button>
          </Modal.Footer>
        </>
      )}
    </Modal>
  );
}

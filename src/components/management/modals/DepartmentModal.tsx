"use client";

import React, { useState } from "react";
import { Modal, Button, Input, Textarea } from "@neiist/ui";
import { toast } from "sonner";
import type { Dictionary } from "@/i18n/dictionaries";
import styles from "@/styles/components/management/ManagementTabs.module.css";
import { addDepartmentAction } from "@/actions/admin/department";

interface DepartmentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  dict: Dictionary;
}

export default function DepartmentModal({ open, onClose, onSuccess, dict }: DepartmentModalProps) {
  const [type, setType] = useState<"team" | "admin_body">("team");
  const [name, setName] = useState("");
  const [descPt, setDescPt] = useState("");
  const [descEn, setDescEn] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tDict = dict.admin.teams_management;

  const handleSubmit = async (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await addDepartmentAction({
        name: name.trim(),
        type,
        description: type === "team" ? { pt: descPt.trim(), en: descEn.trim() } : undefined,
      });

      toast.success(tDict.create_success);
      setName("");
      setDescPt("");
      setDescEn("");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : tDict.create_error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={tDict.add_department_title} size="lg">
      <form onSubmit={handleSubmit} className={styles.modalForm}>
        <div>
          <label className={styles.inputLabel}>{tDict.dept_type_label}</label>
          <div className={styles.toggleRow}>
            <Button
              type="button"
              variant={type === "team" ? "solid" : "outline"}
              size="sm"
              onClick={() => setType("team")}>
              {tDict.type_team}
            </Button>
            <Button
              type="button"
              variant={type === "admin_body" ? "solid" : "outline"}
              size="sm"
              onClick={() => setType("admin_body")}>
              {tDict.type_admin_body}
            </Button>
          </div>
        </div>

        <Input
          label={tDict.dept_name_label}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={
            type === "team" ? tDict.dept_name_placeholder_team : tDict.dept_name_placeholder_body
          }
          required
        />

        {type === "team" && (
          <>
            <Textarea
              label={tDict.desc_pt_label}
              value={descPt}
              onChange={(event) => setDescPt(event.target.value)}
              placeholder={tDict.desc_pt_placeholder}
              rows={3}
              required
            />
            <Textarea
              label={tDict.desc_en_label}
              value={descEn}
              onChange={(event) => setDescEn(event.target.value)}
              placeholder={tDict.desc_en_placeholder}
              rows={3}
            />
          </>
        )}

        <div className={styles.modalActions}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}>
            {tDict.cancel}
          </Button>
          <Button
            type="submit"
            variant="solid"
            color="primary"
            size="sm"
            loading={isSubmitting}
            disabled={!name.trim()}>
            {tDict.create_department}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

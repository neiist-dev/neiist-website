"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Badge, Textarea } from "@neiist/ui";
import { FiEdit2 } from "react-icons/fi";
import { toast } from "sonner";
import type { Description } from "@/types/memberships";
import type { Dictionary } from "@/i18n/dictionaries";
import styles from "@/styles/components/management/ManagementTabs.module.css";
import { updateTeamDescriptionAction } from "@/actions/admin/department";

interface DepartmentItem {
  name: string;
  type: "team" | "admin_body";
  description?: Description;
  active: boolean;
  display_order?: number;
  totalMemberCount?: number;
}

interface DepartmentDetailsModalProps {
  department: DepartmentItem | null;
  rank: number | null;
  canManage: boolean;
  onClose: () => void;
  onUpdated: (_deptName: string, _newDesc: Description) => void;
  dict: Dictionary;
}

function extractDescriptions(desc?: Description): { pt: string; en: string } {
  if (!desc) return { pt: "", en: "" };
  return { pt: desc.pt || "", en: desc.en || "" };
}

export default function DepartmentDetailsModal({
  department,
  rank,
  canManage,
  onClose,
  onUpdated,
  dict,
}: DepartmentDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [descPt, setDescPt] = useState("");
  const [descEn, setDescEn] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const tDict = dict.admin.teams_management;

  useEffect(() => {
    if (department) {
      const { pt, en } = extractDescriptions(department.description);
      setDescPt(pt);
      setDescEn(en);
      setIsEditing(false);
    }
  }, [department]);

  if (!department) return null;

  const handleSave = async (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    setIsSaving(true);
    try {
      const updated: Description = {
        pt: descPt.trim(),
        en: descEn.trim(),
      };
      await updateTeamDescriptionAction({
        name: department.name,
        description: updated,
      });

      toast.success(tDict.update_success);
      onUpdated(department.name, updated);
      setIsEditing(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : tDict.update_error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal open={!!department} onClose={onClose} title={department.name} size="lg">
      <div className={styles.detailBadges}>
        <Badge variant="primary" size="sm">
          {department.type === "team" ? tDict.type_team : tDict.type_admin_body}
        </Badge>
        {rank !== null && (
          <Badge variant="outline" size="sm">
            {tDict.about_us_order}: #{rank}
          </Badge>
        )}
        <Badge variant={department.active ? "primary" : "outline"} size="sm">
          {department.active ? tDict.active_badge : tDict.inactive_badge}
        </Badge>
      </div>

      {department.type === "team" && (
        <>
          {isEditing ? (
            <form onSubmit={handleSave} className={styles.modalForm}>
              <Textarea
                label={tDict.desc_pt_label}
                value={descPt}
                onChange={(event) => setDescPt(event.target.value)}
                placeholder={tDict.desc_pt_placeholder}
                rows={5}
                required
              />
              <Textarea
                label={tDict.desc_en_label}
                value={descEn}
                onChange={(event) => setDescEn(event.target.value)}
                placeholder={tDict.desc_en_placeholder}
                rows={5}
              />
              <div className={styles.modalActions}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                  onClick={() => {
                    const { pt, en } = extractDescriptions(department.description);
                    setDescPt(pt);
                    setDescEn(en);
                    setIsEditing(false);
                  }}>
                  {tDict.cancel}
                </Button>
                <Button type="submit" variant="solid" color="primary" size="sm" loading={isSaving}>
                  {tDict.save}
                </Button>
              </div>
            </form>
          ) : (
            <div className={styles.modalForm}>
              <section className={styles.descSection}>
                <h4 className={styles.descTitle}>{tDict.desc_pt_label}</h4>
                <p className={styles.descContent}>{descPt || "—"}</p>
              </section>

              {descEn && (
                <section className={styles.descSection}>
                  <h4 className={styles.descTitle}>{tDict.desc_en_label}</h4>
                  <p className={styles.descContent}>{descEn}</p>
                </section>
              )}

              <div className={styles.modalActions}>
                {canManage && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}>
                    <FiEdit2 className={styles.btnIcon} />
                    {tDict.edit}
                  </Button>
                )}
                <Button type="button" variant="solid" color="primary" size="sm" onClick={onClose}>
                  {tDict.cancel}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {department.type !== "team" && (
        <div className={styles.modalActions}>
          <Button type="button" variant="solid" color="primary" size="sm" onClick={onClose}>
            {tDict.cancel}
          </Button>
        </div>
      )}
    </Modal>
  );
}

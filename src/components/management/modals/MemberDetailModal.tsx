"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Modal, Button, Badge, Card, DropdownMenu, Spinner } from "@neiist/ui";
import { FiMoreVertical, FiCalendar, FiTrash2 } from "react-icons/fi";
import MemberAvatar from "@/components/layout/MemberAvatar";
import type { User } from "@/types/user";
import type { Membership } from "@/types/memberships";
import type { Dictionary } from "@/i18n/dictionaries";
import styles from "@/styles/components/management/ManagementTabs.module.css";
import detailStyles from "@/styles/components/management/MemberDetailModal.module.css";
import { getMemberHistoryAction } from "@/actions/admin/memberships";

interface MemberDetailModalProps {
  membership: Membership | null;
  selectedYear: string;
  canManage: boolean;
  onClose: () => void;
  onConclude: (_membership: Membership) => void;
  onDelete: (_membership: Membership) => void;
  dict: Dictionary;
}

export default function MemberDetailModal({
  membership,
  selectedYear: _selectedYear,
  canManage,
  onClose,
  onConclude,
  onDelete,
  dict,
}: MemberDetailModalProps) {
  const [user, setUser] = useState<User | null>(null);
  const [mandates, setMandates] = useState<Membership[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const mDict = dict.admin.memberships_management;

  useEffect(() => {
    if (!membership?.userNumber) {
      setUser(null);
      setMandates([]);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    getMemberHistoryAction(membership.userNumber)
      .then((data) => {
        if (isMounted) {
          setUser(data.user);
          setMandates(data.memberships);
        }
      })
      .catch((err) => {
        console.error("Failed to load member history:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [membership?.userNumber]);

  const activeMandates = useMemo(() => mandates.filter((member) => member.isActive), [mandates]);

  const historicalMandates = useMemo(
    () => mandates.filter((member) => !member.isActive),
    [mandates]
  );

  if (!membership) return null;

  const displayName = user?.name || membership.userName;
  const displayIstId = user?.istid || membership.userNumber;
  const displayPhoto = user?.photo || membership.userPhoto;

  return (
    <Modal open={!!membership} onClose={onClose} title={mDict.member_profile_title} size="lg">
      <div className={styles.modalForm}>
        <div className={detailStyles.header}>
          <MemberAvatar name={displayName} photo={displayPhoto} size="lg" />
          <div className={detailStyles.headerInfo}>
            <h3>{displayName}</h3>
            <span>{displayIstId}</span>
            <div className={detailStyles.badges}>
              <Badge variant="primary" size="sm">
                {membership.departmentName}
              </Badge>
              <Badge variant="outline" size="sm">
                {membership.roleName}
              </Badge>
            </div>
          </div>
        </div>

        {isLoading && !user ? (
          <div className={detailStyles.loadingContainer}>
            <Spinner size="md" />
          </div>
        ) : (
          <>
            <div className={detailStyles.grid}>
              <div className={detailStyles.gridItem}>
                <span>{mDict.primary_email}</span>
                <span>{user?.email || membership.userEmail || "—"}</span>
              </div>
              {user?.alternativeEmail && (
                <div className={detailStyles.gridItem}>
                  <span>{mDict.alt_email}</span>
                  <span>{user.alternativeEmail}</span>
                </div>
              )}
              {user?.phone && (
                <div className={detailStyles.gridItem}>
                  <span>{mDict.phone}</span>
                  <span>{user.phone}</span>
                </div>
              )}
              {user?.courses && user.courses.length > 0 && (
                <div className={`${detailStyles.gridItem} ${detailStyles.gridItemFull}`}>
                  <span>{mDict.courses}</span>
                  <span>{user.courses.join(", ")}</span>
                </div>
              )}
              {membership.linkedin && (
                <div className={detailStyles.gridItem}>
                  <span>LinkedIn</span>
                  <a href={membership.linkedin} target="_blank" rel="noopener noreferrer">
                    {membership.linkedin}
                  </a>
                </div>
              )}
              {membership.github && (
                <div className={detailStyles.gridItem}>
                  <span>GitHub</span>
                  <a href={membership.github} target="_blank" rel="noopener noreferrer">
                    {membership.github}
                  </a>
                </div>
              )}
            </div>

            <div className={detailStyles.scrollArea}>
              <section>
                <h4 className={detailStyles.sectionTitle}>
                  {mDict.active_mandates} ({activeMandates.length})
                </h4>
                {activeMandates.length > 0 ? (
                  <div className={detailStyles.mandatesList}>
                    {activeMandates.map((m) => (
                      <Card
                        key={`${m.departmentName}-${m.roleName}-${m.startDate}`}
                        variant="flat"
                        className={detailStyles.mandateCard}>
                        <div className={detailStyles.mandateInfo}>
                          <div className={detailStyles.mandateRoleLine}>
                            <strong>{m.departmentName}</strong>
                            <em>•</em>
                            <span>{m.roleName}</span>
                          </div>
                          <span className={detailStyles.mandateDates}>
                            {m.startDate} &rarr; {m.endDate || mDict.present}
                          </span>
                        </div>
                        {canManage && (
                          <DropdownMenu>
                            <DropdownMenu.Trigger>
                              <button
                                type="button"
                                className={styles.actionBtn}
                                aria-label={mDict.options_aria}
                                onClick={(event) => event.stopPropagation()}>
                                <FiMoreVertical size={16} />
                              </button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Content align="end" mobileTitle={mDict.options_title}>
                              <DropdownMenu.Item
                                icon={<FiCalendar size={14} />}
                                onClick={() => onConclude(m)}>
                                {mDict.conclude_mandate}
                              </DropdownMenu.Item>
                              <DropdownMenu.Divider />
                              <DropdownMenu.Item
                                icon={<FiTrash2 size={14} />}
                                destructive
                                onClick={() => onDelete(m)}>
                                {mDict.delete_mandate}
                              </DropdownMenu.Item>
                            </DropdownMenu.Content>
                          </DropdownMenu>
                        )}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className={detailStyles.mandateDates}>{mDict.empty}</p>
                )}
              </section>

              {historicalMandates.length > 0 && (
                <section>
                  <h4 className={detailStyles.sectionTitle}>
                    {mDict.previous_mandates} ({historicalMandates.length})
                  </h4>
                  <div className={detailStyles.mandatesList}>
                    {historicalMandates.map((hm) => (
                      <Card
                        key={`${hm.departmentName}-${hm.roleName}-${hm.startDate}`}
                        variant="flat"
                        className={detailStyles.mandateCard}>
                        <div className={detailStyles.mandateInfo}>
                          <div className={detailStyles.mandateRoleLine}>
                            <strong>{hm.departmentName}</strong>
                            <em>•</em>
                            <span>{hm.roleName}</span>
                          </div>
                          <span className={detailStyles.mandateDates}>
                            {hm.startDate} &rarr; {hm.endDate || mDict.concluded_badge}
                          </span>
                        </div>
                        {canManage && (
                          <DropdownMenu>
                            <DropdownMenu.Trigger>
                              <button
                                type="button"
                                className={styles.actionBtn}
                                aria-label={mDict.options_aria}
                                onClick={(event) => event.stopPropagation()}>
                                <FiMoreVertical size={16} />
                              </button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Content align="end" mobileTitle={mDict.options_title}>
                              <DropdownMenu.Item
                                icon={<FiTrash2 size={14} />}
                                destructive
                                onClick={() => onDelete(hm)}>
                                {mDict.delete_mandate}
                              </DropdownMenu.Item>
                            </DropdownMenu.Content>
                          </DropdownMenu>
                        )}
                      </Card>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </>
        )}

        <div className={styles.modalActions}>
          <Button type="button" variant="solid" color="primary" size="sm" onClick={onClose}>
            {mDict.confirm_cancel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

"use client";

import React, { useState, useMemo } from "react";
import { Modal, Button, DateInput, Field, MultiSelect } from "@neiist/ui";
import CreateNewUserModal from "@/components/shop/CreateNewUserModal";
import MemberAvatar from "@/components/layout/MemberAvatar";
import { format, parse, isValid } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import type { User } from "@/types/user";
import type { RoleItem } from "@/types/roles";
import type { Dictionary } from "@/i18n/dictionaries";
import styles from "@/styles/components/management/ManagementTabs.module.css";
import { addMembershipAction } from "@/actions/admin/memberships";

interface Department {
  name: string;
  active: boolean;
  department_type?: string;
  display_order?: number;
}

interface AddMembershipModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  allowedDepartments: Department[];
  roles: RoleItem[];
  dict: Dictionary;
}

const REFERENCE_DATE = new Date(0);

export default function AddMembershipModal({
  open,
  onClose,
  onSuccess,
  allowedDepartments,
  roles,
  dict,
}: AddMembershipModalProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedDeptName, setSelectedDeptName] = useState("");
  const [selectedRoleName, setSelectedRoleName] = useState("");
  const [fromDate, setFromDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [toDate, setToDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // For creating new user on the fly
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserIstId, setNewUserIstId] = useState("");

  const mDict = dict.admin.memberships_management;

  const availableRoles = useMemo(() => {
    if (!selectedDeptName) return [];
    return roles
      .filter(
        (role) => (role.department || role.department_name) === selectedDeptName && role.active
      )
      .map((role) => ({ role_name: role.role_name }));
  }, [roles, selectedDeptName]);

  const handleSubmit = async (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    if (!selectedUser || !selectedDeptName || !selectedRoleName) {
      toast.error(mDict.member_required_error);
      return;
    }

    setIsSubmitting(true);
    try {
      await addMembershipAction({
        userNumber: selectedUser.istid,
        departmentName: selectedDeptName,
        roleName: selectedRoleName,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });

      toast.success(mDict.member_added_success);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : mDict.errors.add_member);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title={mDict.add_mandate_title} size="lg">
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <MultiSelect<User>
            label={mDict.member_column}
            multiSelect={false}
            selectedItem={selectedUser}
            onSelect={(user) => setSelectedUser(user)}
            onSearch={async (query, signal) => {
              const res = await fetch(
                `/api/admin/users?search=${encodeURIComponent(query)}&limit=20`,
                { signal }
              );
              if (!res.ok) return [];
              const data = await res.json();
              return data.users || (Array.isArray(data) ? data : []);
            }}
            createLabel={mDict.create_user}
            onItemCreate={(query) => {
              setNewUserIstId(query);
              setShowCreateUserModal(true);
            }}
            getItemKey={(user) => user.istid}
            getItemLabel={(user) => `${user.name} (${user.istid})`}
            placeholder={mDict.member_placeholder}
            emptyMessage={mDict.empty}
            renderItem={(user, isSelected) => (
              <div className={styles.userOptionRow}>
                <MemberAvatar name={user.name} photo={user.photo} size="sm" />
                <span
                  className={isSelected ? styles.userOptionNameSelected : styles.userOptionName}>
                  {user.name}
                </span>
                <span className={styles.userOptionIstId}>{user.istid}</span>
              </div>
            )}
          />

          <div className={styles.formRow}>
            <MultiSelect<Department>
              label={mDict.department_column}
              multiSelect={false}
              items={allowedDepartments}
              selectedItem={
                allowedDepartments.find((department) => department.name === selectedDeptName) ||
                null
              }
              onSelect={(dept) => {
                setSelectedDeptName(dept.name);
                setSelectedRoleName("");
              }}
              getItemKey={(department) => department.name}
              getItemLabel={(department) => department.name}
              placeholder={mDict.select_department}
              emptyMessage={dict.admin.teams_management.empty}
            />

            <MultiSelect<{ role_name: string }>
              label={mDict.role_column}
              multiSelect={false}
              items={availableRoles}
              selectedItem={
                availableRoles.find((role) => role.role_name === selectedRoleName) || null
              }
              onSelect={(role) => setSelectedRoleName(role.role_name)}
              getItemKey={(role) => role.role_name}
              getItemLabel={(role) => role.role_name}
              placeholder={
                selectedDeptName ? mDict.select_role : dict.admin.roles_management.empty_select
              }
              emptyMessage={dict.admin.roles_management.empty_all}
              disabled={!selectedDeptName}
            />
          </div>

          <div className={styles.formRow}>
            <Field label={mDict.start_date}>
              <DateInput
                value={fromDate ? parse(fromDate, "yyyy-MM-dd", REFERENCE_DATE) : undefined}
                onChange={(date) =>
                  setFromDate(date && isValid(date) ? format(date, "yyyy-MM-dd") : "")
                }
                placeholder="DD/MM/AAAA"
                mobileDrawerTitle={mDict.start_date}
                locale={pt}
              />
            </Field>
            <Field label={mDict.end_date}>
              <DateInput
                value={toDate ? parse(toDate, "yyyy-MM-dd", REFERENCE_DATE) : undefined}
                onChange={(date) =>
                  setToDate(date && isValid(date) ? format(date, "yyyy-MM-dd") : "")
                }
                placeholder="DD/MM/AAAA"
                mobileDrawerTitle={mDict.end_date}
                locale={pt}
              />
            </Field>
          </div>

          <div className={styles.modalActions}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}>
              {mDict.confirm_cancel}
            </Button>
            <Button
              type="submit"
              variant="solid"
              color="primary"
              size="sm"
              loading={isSubmitting}
              disabled={!selectedUser || !selectedDeptName || !selectedRoleName || isSubmitting}>
              {mDict.add_mandate_button}
            </Button>
          </div>
        </form>
      </Modal>

      {showCreateUserModal && (
        <CreateNewUserModal
          onClose={() => setShowCreateUserModal(false)}
          onSubmit={(user: User) => {
            setSelectedUser(user);
            setShowCreateUserModal(false);
          }}
          initialIstId={newUserIstId}
        />
      )}
    </>
  );
}

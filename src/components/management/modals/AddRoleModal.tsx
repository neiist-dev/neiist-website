"use client";

import React, { useState } from "react";
import { Modal, Button, Input, Select, Checkbox, Table, DropdownMenu } from "@neiist/ui";
import { FiSliders, FiUser, FiUsers, FiShield, FiCheckSquare, FiRotateCcw } from "react-icons/fi";
import { PERMISSIONS, Permission } from "@/types/permissions";
import { ROLE_PRESETS } from "@/lib/security/permissions";
import { UserRole } from "@/types/roles";
import { toast } from "sonner";
import styles from "@/styles/components/management/ManagementTabs.module.css";
import permStyles from "@/styles/components/management/PermissionsCatalog.module.css";
import type { Dictionary } from "@/i18n/dictionaries";
import { addRoleAction } from "@/actions/admin/roles";

interface Department {
  name: string;
  active: boolean;
  department_type?: string;
}

interface AddRoleModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (_deptName: string, _roleName: string, _permissions: Permission[]) => void;
  departments: Department[];
  defaultDept?: string;
  dict: Dictionary;
}

const CATALOG = Object.entries(PERMISSIONS).map(([name, meta]) => ({
  name: name as Permission,
  category: meta.category,
}));

export default function AddRoleModal({
  open,
  onClose,
  onSuccess,
  departments,
  defaultDept = "",
  dict,
}: AddRoleModalProps) {
  const [selectedDept, setSelectedDept] = useState(defaultDept || departments[0]?.name || "");
  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rDict = dict.admin.roles_management;

  const togglePermission = (perm: Permission) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleSubmit = async (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    if (!selectedDept || !roleName.trim()) {
      toast.error(rDict.role_name_required);
      return;
    }

    setIsSubmitting(true);
    try {
      await addRoleAction({
        departmentName: selectedDept,
        roleName: roleName.trim(),
        permissions,
      });

      toast.success(rDict.role_added_success);
      onSuccess(selectedDept, roleName.trim(), permissions);
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : rDict.errors.add_role);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={rDict.add_role_title} size="lg">
      <form onSubmit={handleSubmit} className={styles.modalForm}>
        <div className={styles.formRow}>
          <div className={styles.formSelectWrapper}>
            <label className={styles.inputLabel}>{rDict.select_department}</label>
            <Select
              options={departments.map((department) => ({
                label: department.name,
                value: department.name,
              }))}
              value={selectedDept}
              onChange={setSelectedDept}
              placeholder={rDict.select_department}
            />
          </div>
          <Input
            label={rDict.role_column}
            value={roleName}
            onChange={(event) => setRoleName(event.target.value)}
            placeholder={rDict.role_name_placeholder}
            required
          />
        </div>

        <div className={permStyles.toolbarRow}>
          <span>
            {(rDict.active_permissions_count || "{count} of {total} permissions active")
              .replace("{count}", String(permissions.length))
              .replace("{total}", String(CATALOG.length))}
          </span>

          <DropdownMenu>
            <DropdownMenu.Trigger>
              <Button type="button" variant="outline" size="sm">
                <FiSliders />
                {rDict.presets}
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end" mobileTitle={rDict.presets}>
              <DropdownMenu.Item
                icon={<FiUser size={14} />}
                onClick={() => setPermissions(ROLE_PRESETS[UserRole._MEMBER] || [])}>
                {rDict.presets_member}
              </DropdownMenu.Item>
              <DropdownMenu.Item
                icon={<FiUsers size={14} />}
                onClick={() => setPermissions(ROLE_PRESETS[UserRole._COORDINATOR] || [])}>
                {rDict.presets_coordinator}
              </DropdownMenu.Item>
              <DropdownMenu.Item
                icon={<FiShield size={14} />}
                onClick={() => setPermissions(ROLE_PRESETS[UserRole._ADMIN] || [])}>
                {rDict.presets_admin}
              </DropdownMenu.Item>
              <DropdownMenu.Divider />
              <DropdownMenu.Item
                icon={<FiCheckSquare size={14} />}
                onClick={() => setPermissions(CATALOG.map((permission) => permission.name))}>
                {rDict.presets_select_all}
              </DropdownMenu.Item>
              <DropdownMenu.Item
                icon={<FiRotateCcw size={14} />}
                destructive
                onClick={() => setPermissions([])}>
                {rDict.presets_clear_all}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
        </div>

        <Table
          responsive="scroll"
          wrapperClassName={`${permStyles.permsTableWrapper} ui-scrollbar`}
          className={permStyles.permsTable}>
          <Table.Body>
            {CATALOG.map((item) => {
              const isChecked = permissions.includes(item.name);
              return (
                <Table.Row
                  key={item.name}
                  className={permStyles.clickableRow}
                  onClick={() => togglePermission(item.name)}>
                  <Table.Cell
                    className={permStyles.checkboxCell}
                    onClick={(event) => event.stopPropagation()}>
                    <Checkbox
                      checked={isChecked}
                      onChange={() => togglePermission(item.name)}
                      aria-label={item.name}
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <div className={permStyles.permTitle}>
                      {rDict.permissions?.[item.name as keyof typeof rDict.permissions] ||
                        item.name}
                    </div>
                    <div className={permStyles.permCode}>{item.name}</div>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>

        <div className={styles.modalActions}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}>
            {rDict.cancel}
          </Button>
          <Button
            type="submit"
            variant="solid"
            color="primary"
            size="sm"
            loading={isSubmitting}
            disabled={!selectedDept || !roleName.trim()}>
            {rDict.add_role}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

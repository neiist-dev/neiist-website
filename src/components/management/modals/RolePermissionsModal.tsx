"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Table, Checkbox, DropdownMenu } from "@neiist/ui";
import { FiSliders, FiUser, FiUsers, FiShield, FiCheckSquare, FiRotateCcw } from "react-icons/fi";
import { PERMISSIONS, Permission } from "@/types/permissions";
import { ROLE_PRESETS } from "@/lib/security/permissions";
import { UserRole, RoleItem } from "@/types/roles";
import { toast } from "sonner";
import styles from "@/styles/components/management/ManagementTabs.module.css";
import permStyles from "@/styles/components/management/PermissionsCatalog.module.css";
import type { Dictionary } from "@/i18n/dictionaries";
import { saveRolePermissionsAction } from "@/actions/admin/roles";

interface RolePermissionsModalProps {
  role: RoleItem | null;
  departmentName: string;
  canManage: boolean;
  onClose: () => void;
  onSaved: (
    _deptName: string,
    _roleName: string,
    _newPermissions: Permission[],
    _accessLabel: string | null
  ) => void;
  dict: Dictionary;
}

const CATALOG = Object.entries(PERMISSIONS).map(([name, meta]) => ({
  name: name as Permission,
  category: meta.category,
}));

export default function RolePermissionsModal({
  role,
  departmentName,
  canManage,
  onClose,
  onSaved,
  dict,
}: RolePermissionsModalProps) {
  const [workingPermissions, setWorkingPermissions] = useState<Permission[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const rDict = dict.admin.roles_management;

  useEffect(() => {
    if (role) setWorkingPermissions(role.permissions || []);
  }, [role]);

  if (!role) return null;

  const togglePermission = (perm: Permission) => {
    if (!canManage) return;
    setWorkingPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await saveRolePermissionsAction({
        departmentName,
        roleName: role.role_name,
        permissions: workingPermissions,
      });

      toast.success(rDict.permissions_saved);
      onSaved(departmentName, role.role_name, workingPermissions, res.access_label || null);
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : rDict.errors.save_permissions);
    } finally {
      setIsSaving(false);
    }
  };

  const modalTitle = (rDict.permissions_title || "Permissions: {role}").replace(
    "{role}",
    role.role_name
  );

  return (
    <Modal open={!!role} onClose={onClose} title={modalTitle} size="lg">
      <div className={styles.modalForm}>
        <div className={permStyles.toolbarRow}>
          <span>
            {(rDict.active_permissions_count || "{count} of {total} permissions active")
              .replace("{count}", String(workingPermissions.length))
              .replace("{total}", String(CATALOG.length))}
          </span>

          {canManage && (
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
                  onClick={() => setWorkingPermissions(ROLE_PRESETS[UserRole._MEMBER] || [])}>
                  {rDict.presets_member}
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  icon={<FiUsers size={14} />}
                  onClick={() => setWorkingPermissions(ROLE_PRESETS[UserRole._COORDINATOR] || [])}>
                  {rDict.presets_coordinator}
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  icon={<FiShield size={14} />}
                  onClick={() => setWorkingPermissions(ROLE_PRESETS[UserRole._ADMIN] || [])}>
                  {rDict.presets_admin}
                </DropdownMenu.Item>
                <DropdownMenu.Divider />
                <DropdownMenu.Item
                  icon={<FiCheckSquare size={14} />}
                  onClick={() => setWorkingPermissions(CATALOG.map((p) => p.name))}>
                  {rDict.presets_select_all}
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  icon={<FiRotateCcw size={14} />}
                  destructive
                  onClick={() => setWorkingPermissions([])}>
                  {rDict.presets_clear_all}
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>
          )}
        </div>

        <Table
          responsive="scroll"
          wrapperClassName={`${permStyles.permsTableWrapper} ui-scrollbar`}
          className={permStyles.permsTable}>
          <Table.Body>
            {CATALOG.map((item) => {
              const isChecked = workingPermissions.includes(item.name);
              return (
                <Table.Row
                  key={item.name}
                  className={canManage ? permStyles.clickableRow : undefined}
                  onClick={() => togglePermission(item.name)}>
                  <Table.Cell
                    className={permStyles.checkboxCell}
                    onClick={(event) => event.stopPropagation()}>
                    <Checkbox
                      checked={isChecked}
                      disabled={!canManage}
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
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
            {rDict.cancel}
          </Button>
          {canManage && (
            <Button
              type="button"
              variant="solid"
              color="primary"
              size="sm"
              loading={isSaving}
              onClick={handleSave}>
              {rDict.save_permissions}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

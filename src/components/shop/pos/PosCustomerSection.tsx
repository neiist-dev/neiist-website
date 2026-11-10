"use client";

import React, { useRef } from "react";
import { MultiSelect, DetailCard, Badge, Button, Field, Input, Select, Stack } from "@neiist/ui";
import { FiUserPlus, FiX } from "react-icons/fi";
import { User } from "@/types/user";
import MemberAvatar from "@/components/layout/MemberAvatar";
import { searchUsersClient, formatSearchedUserLabel } from "@/utils/userUtils";
import styles from "@/styles/components/shop/pos/PosCustomerSection.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

export interface CustomerProfile {
  istid: string | null;
  name: string;
  email: string;
  phone?: string;
  photo?: string;
  isGuest?: boolean;
}

interface PosCustomerSectionProps {
  customer: CustomerProfile | null;
  onSelectUser: (_user: User | null) => void;
  onOpenGuestModal: () => void;
  onClearCustomer: () => void;
  customerNif: string;
  onCustomerNifChange: (_nif: string) => void;
  selectedCampus: string;
  onCampusChange: (_campus: string) => void;
  customerPhone: string;
  onCustomerPhoneChange: (_phone: string) => void;
  orderNotes: string;
  onOrderNotesChange: (_notes: string) => void;
  dict: Dictionary["pos"]["customer"];
}

export default function PosCustomerSection({
  customer,
  onSelectUser,
  onOpenGuestModal,
  onClearCustomer,
  customerNif,
  onCustomerNifChange,
  selectedCampus,
  onCampusChange,
  customerPhone,
  onCustomerPhoneChange,
  orderNotes,
  onOrderNotesChange,
  dict,
}: PosCustomerSectionProps) {
  const customerSearchQueryRef = useRef("");
  const campusOptions = [
    { label: dict.campus_alameda, value: "alameda" },
    { label: dict.campus_taguspark, value: "taguspark" },
  ];

  return (
    <Stack direction="column" gap="md">
      {!customer ? (
        <div className={styles.selectRow}>
          <div className={styles.userSearchWrap}>
            <MultiSelect<User>
              label={dict.search_label}
              multiSelect={false}
              onSearch={(query, signal) => {
                customerSearchQueryRef.current = query.trim();
                return searchUsersClient(query, signal);
              }}
              getItemKey={(user) => user.istid}
              getItemLabel={(user) => formatSearchedUserLabel(user, customerSearchQueryRef.current)}
              placeholder={dict.search_placeholder}
              renderItem={(user, isSelected) => (
                <Stack direction="row" gap="sm" align="center" style={{ padding: "0.25rem 0" }}>
                  <MemberAvatar name={user.name} photo={user.photo} size="sm" />
                  <span
                    className={`${styles.userName} ${isSelected ? styles.userNameSelected : ""}`}>
                    {user.name}
                  </span>
                  <span className={styles.userMeta}>{user.istid}</span>
                </Stack>
              )}
              onSelect={(user) => onSelectUser(user)}
            />
          </div>
          <Button
            variant="outline"
            size="md"
            onClick={onOpenGuestModal}
            className={styles.externalClientBtn}>
            <FiUserPlus /> {dict.external_client}
          </Button>
        </div>
      ) : (
        <DetailCard
          avatar={<MemberAvatar name={customer.name} photo={customer.photo} size="md" />}
          title={customer.name}
          identifier={customer.istid || undefined}
          badge={
            customer.isGuest ? (
              <Badge variant="outline" color="warning">
                {dict.external_badge}
              </Badge>
            ) : (
              <Badge variant="outline" color="success">
                {dict.student_badge}
              </Badge>
            )
          }
          actions={
            <Button
              variant="ghost"
              color="neutral"
              size="sm"
              onClick={onClearCustomer}
              title={dict.remove_customer}>
              <FiX size={16} />
            </Button>
          }
          metadata={[
            { label: dict.email, value: customer.email },
            ...(customer.phone ? [{ label: dict.phone, value: customer.phone }] : []),
          ]}
        />
      )}

      <div className={styles.metadataGrid}>
        <Field label={dict.nif_label}>
          <Input
            placeholder={dict.nif_placeholder}
            value={customerNif}
            onChange={(e) => onCustomerNifChange(e.target.value)}
          />
        </Field>

        <Field label={dict.campus_label}>
          <Select
            value={selectedCampus}
            onChange={(val) => onCampusChange(String(val))}
            options={campusOptions}
          />
        </Field>

        <Field label={dict.phone}>
          <Input
            placeholder={dict.phone_placeholder}
            value={customerPhone}
            onChange={(e) => onCustomerPhoneChange(e.target.value)}
          />
        </Field>

        <Field label={dict.notes_label}>
          <Input
            placeholder={dict.notes_placeholder}
            value={orderNotes}
            onChange={(e) => onOrderNotesChange(e.target.value)}
          />
        </Field>
      </div>
    </Stack>
  );
}

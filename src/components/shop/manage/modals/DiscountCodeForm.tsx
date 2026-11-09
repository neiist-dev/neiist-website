"use client";

import { useEffect, useRef, useState, useMemo, ReactNode } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { FaPlus, FaTicketAlt, FaArrowLeft } from "react-icons/fa";
import { useRouter } from "next/navigation";
import {
  Alert,
  MultiSelect,
  Field,
  Input,
  Select,
  Textarea,
  Button,
  ColorfulText,
} from "@neiist/ui";
import { Product } from "@/types/shop/product";
import { User } from "@/types/user";
import { DiscountType } from "@/types/shop/discountCode";
import { createDiscountBulkAction } from "@/actions/shop/discounts";
import styles from "@/styles/components/shop/manage/modals/DiscountCodeForm.module.css";
import EmailComposer from "@/components/general/EmailComposer";
import { getDefaultDiscountEmailIntroLine } from "@/lib/email/templates/discounts";
import type { Dictionary } from "@/i18n/dictionaries";

interface DiscountCodeEditorProps {
  users: User[];
  products: Product[];
  backHref?: string;
  dict: Dictionary["discount_codes"]["form"];
}

type CreationDraft = {
  selectedRecipients: string[];
  externalEmails: string;
  discount_type: DiscountType;
  discount_value: string;
  selectedProducts: string[];
  maxUses: string;
  expiresAt?: Date;
  emailSubject: string;
  emailIntroLine: string;
};

const PREVIEW_RECIPIENT = {
  name: "Nome",
  istid: "ist12345",
  email: "email@exemplo.com",
};

function emptyCreationDraft(dict: Dictionary["discount_codes"]["form"]): CreationDraft {
  return {
    selectedRecipients: [],
    externalEmails: "",
    discount_type: "percentage",
    discount_value: "",
    selectedProducts: [],
    maxUses: "1",
    expiresAt: undefined,
    emailSubject: dict.default_email_subject,
    emailIntroLine: getDefaultDiscountEmailIntroLine().trim(),
  };
}

function buildProductOption(product: Product): string {
  return product.name;
}

function formatUserLabel(user: User): string {
  return `${user.email} • ${user.istid}`;
}

function SectionTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className={styles.sectionTitle}>
      <span className={styles.sectionIcon}>{icon}</span>
      <span>{children}</span>
    </div>
  );
}

export default function DiscountCodeForm({
  users,
  products,
  backHref,
  dict,
}: DiscountCodeEditorProps) {
  const router = useRouter();
  const [creationDraft, setCreationDraft] = useState<CreationDraft>(() => emptyCreationDraft(dict));
  const [isCreating, setIsCreating] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  const productOptions = products.map(buildProductOption);
  const productIdByLabel = new Map(products.map((p) => [buildProductOption(p), p.id]));

  const userOptions = useMemo(() => users.map(formatUserLabel), [users]);
  const userByLabel = useMemo(() => new Map(users.map((u) => [formatUserLabel(u), u])), [users]);

  const previewRecipient = useMemo(() => {
    const firstRecipient = creationDraft.selectedRecipients[0];
    const firstRecipientUser = firstRecipient ? userByLabel.get(firstRecipient) : null;
    return firstRecipientUser
      ? {
          name: firstRecipientUser.name,
          istid: firstRecipientUser.istid,
          email: firstRecipientUser.email,
        }
      : PREVIEW_RECIPIENT;
  }, [creationDraft.selectedRecipients, userByLabel]);

  const discountVariables = useMemo(
    () => [
      { key: "name", sampleValue: previewRecipient.name || "Nome" },
      { key: "istid", sampleValue: previewRecipient.istid || "ist110000" },
      { key: "code", sampleValue: "K9X2A1" },
      {
        key: "discount",
        sampleValue:
          creationDraft.discount_type === "percentage"
            ? `${creationDraft.discount_value || "0"}%`
            : `€${creationDraft.discount_value || "0.00"}`,
      },
      {
        key: "expiry",
        sampleValue: creationDraft.expiresAt
          ? creationDraft.expiresAt.toLocaleDateString("pt-PT")
          : "sem limite",
      },
    ],
    [
      previewRecipient,
      creationDraft.discount_type,
      creationDraft.discount_value,
      creationDraft.expiresAt,
    ]
  );

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node))
        setShowDatePicker(false);
    };

    if (showDatePicker) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDatePicker]);

  const renderDiscountPreview = (
    type: DiscountType,
    value: string,
    selectedProductsList: string[]
  ) => {
    if (products.length === 0) return null;
    const label = selectedProductsList.length > 0 ? selectedProductsList[0] : productOptions[0];
    const productId = label ? productIdByLabel.get(label) : null;
    const product = products.find((p) => p.id === productId) || products[0];

    const numVal = Number(value) || 0;
    const calcPrice = (orig: number) =>
      Math.max(0, type === "percentage" ? orig * (1 - numVal / 100) : orig - numVal);

    const baseOriginal = product.price;
    const baseNew = calcPrice(baseOriginal);

    const variantsByPrice = new Map<number, string[]>();
    let hasVariantsWithDifferentPrices = false;

    (product.variants || []).forEach((variant) => {
      const mod = Number(variant.price_modifier) || 0;
      if (mod !== 0) hasVariantsWithDifferentPrices = true;
      const variantName = Object.values(variant.options || {}).join(" ") || `Var ${variant.id}`;
      const existing = variantsByPrice.get(mod) || [];
      existing.push(variantName);
      variantsByPrice.set(mod, existing);
    });

    return (
      <div className={styles.previewCard}>
        <div className={hasVariantsWithDifferentPrices ? styles.mbHalfRem : undefined}>
          <strong>{product.name}:</strong>{" "}
          {hasVariantsWithDifferentPrices ? dict.preview_base_price : dict.preview_will_go_from}
          {baseOriginal.toFixed(2)}€ {dict.preview_to} <strong>{baseNew.toFixed(2)}€</strong>.
        </div>
        {hasVariantsWithDifferentPrices && (
          <ul className={styles.variantList}>
            {Array.from(variantsByPrice.entries())
              .sort(([modA], [modB]) => modA - modB)
              .map(([mod, names]) => {
                const variantOriginal = baseOriginal + mod;
                const variantNew = calcPrice(variantOriginal);
                return (
                  <li key={mod}>
                    {names.join(", ")}: {variantOriginal.toFixed(2)}€ {dict.preview_to}{" "}
                    <strong>{variantNew.toFixed(2)}€</strong>
                  </li>
                );
              })}
          </ul>
        )}
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedUsers = creationDraft.selectedRecipients
      .map((item) => userByLabel.get(item))
      .filter((user): user is User => Boolean(user))
      .map((user) => ({
        name: user.name,
        istid: user.istid,
        email: user.email,
      }));

    const externalEmails = creationDraft.externalEmails
      .split(/[\n,;]+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((email) => ({
        name: email.split("@")[0] || email,
        istid: undefined,
        email,
      }));

    const recipients = [...selectedUsers, ...externalEmails];
    const discountValue = Number(creationDraft.discount_value);
    const maxUses = Number(creationDraft.maxUses);
    const expiresAt = creationDraft.expiresAt ? creationDraft.expiresAt.toISOString() : undefined;

    const validProductIds = creationDraft.selectedProducts.length
      ? creationDraft.selectedProducts
          .map((item) => productIdByLabel.get(item) ?? null)
          .filter((item): item is number => item !== null)
      : null;

    if (recipients.length === 0) {
      Alert.error(dict.error_no_recipients);
      return;
    }
    if (!Number.isFinite(discountValue) || discountValue < 0) {
      Alert.error(dict.error_invalid_value);
      return;
    }
    if (!Number.isInteger(maxUses) || maxUses <= 0) {
      Alert.error(dict.error_invalid_max_uses);
      return;
    }
    if (!creationDraft.emailSubject.trim() || !creationDraft.emailIntroLine.trim()) {
      Alert.error(dict.error_missing_subject_or_body);
      return;
    }

    setIsCreating(true);
    try {
      const data = await createDiscountBulkAction({
        recipients,
        discount_type: creationDraft.discount_type,
        discount_value: discountValue,
        valid_product_ids: validProductIds,
        max_uses: maxUses,
        expires_at: expiresAt,
        active: true,
        email_subject: creationDraft.emailSubject,
        email_intro_line: creationDraft.emailIntroLine,
      });

      const generatedCodes = data.codes ?? [];
      const failedCount = data.failed_count ?? 0;

      if (failedCount > 0) {
        Alert.warning(
          dict.toast_generated_with_failures
            .replace("{count}", String(generatedCodes.length))
            .replace("{failed}", String(failedCount))
        );
      } else {
        Alert.success(
          dict.toast_generated_success.replace("{count}", String(generatedCodes.length))
        );
      }

      router.push(backHref || "/shop/manage/discounts");
      router.refresh();
    } catch (error) {
      Alert.error(error instanceof Error ? error.message : dict.error_generate_failed);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className={styles.container}>
      <form onSubmit={handleSubmit}>
        <header className={styles.header}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push(backHref || "/shop/manage/discounts")}>
            <FaArrowLeft /> {dict.back}
          </Button>
          <ColorfulText as="h1" className={styles.title} text={dict.title} />
          <Button variant="primary" type="submit" disabled={isCreating}>
            <FaPlus /> {isCreating ? dict.generating : dict.generate_btn}
          </Button>
        </header>

        <div className={styles.grid}>
          <div className={styles.sectionCol}>
            <div className={styles.stackBlock}>
              <SectionTitle icon={<FaTicketAlt />}>{dict.section_discount}</SectionTitle>

              <Field label={dict.users_label}>
                <MultiSelect
                  items={userOptions}
                  multiSelect={true}
                  selectedItems={creationDraft.selectedRecipients}
                  onChange={(items) =>
                    setCreationDraft((prev) => ({
                      ...prev,
                      selectedRecipients: items,
                    }))
                  }
                  placeholder={dict.users_placeholder}
                />
              </Field>

              <Field label={dict.external_emails_label}>
                <Textarea
                  rows={2}
                  value={creationDraft.externalEmails}
                  onChange={(e) =>
                    setCreationDraft((prev) => ({
                      ...prev,
                      externalEmails: e.target.value,
                    }))
                  }
                  placeholder={dict.external_emails_placeholder}
                />
              </Field>

              <div className={styles.row}>
                <Field label={dict.type_label}>
                  <Select
                    options={[
                      { value: "percentage", label: dict.type_percentage },
                      { value: "fixed", label: dict.type_fixed },
                    ]}
                    value={creationDraft.discount_type}
                    onChange={(val) =>
                      setCreationDraft((prev) => ({
                        ...prev,
                        discount_type: val as DiscountType,
                      }))
                    }
                  />
                </Field>

                <Field label={dict.value_label}>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max={creationDraft.discount_type === "percentage" ? 100 : undefined}
                    value={creationDraft.discount_value}
                    onChange={(e) =>
                      setCreationDraft((prev) => ({
                        ...prev,
                        discount_value: e.target.value,
                      }))
                    }
                    placeholder={creationDraft.discount_type === "percentage" ? "20" : "5.00"}
                  />
                </Field>
              </div>

              {renderDiscountPreview(
                creationDraft.discount_type,
                creationDraft.discount_value,
                creationDraft.selectedProducts
              )}

              <div className={styles.row}>
                <Field label={dict.max_uses_label}>
                  <Input
                    type="number"
                    min="1"
                    value={creationDraft.maxUses}
                    onChange={(e) =>
                      setCreationDraft((prev) => ({
                        ...prev,
                        maxUses: e.target.value,
                      }))
                    }
                    placeholder="1"
                  />
                </Field>

                <Field label={dict.expiration_label}>
                  <div className={styles.datePickerWrap} ref={datePickerRef}>
                    <Input
                      type="text"
                      value={creationDraft.expiresAt?.toLocaleDateString("pt-PT") ?? ""}
                      placeholder={dict.no_limit}
                      readOnly
                      onClick={() => setShowDatePicker((prev) => !prev)}
                    />
                    {showDatePicker && (
                      <div
                        className={styles.datePickerPopup}
                        onClick={(e) => {
                          if (e.target === e.currentTarget) setShowDatePicker(false);
                        }}>
                        <div className={styles.datePickerPanel}>
                          <DayPicker
                            mode="single"
                            selected={creationDraft.expiresAt}
                            onSelect={(date) => {
                              setCreationDraft((prev) => ({
                                ...prev,
                                expiresAt: date,
                              }));
                              setShowDatePicker(false);
                            }}
                            weekStartsOn={1}
                            captionLayout="dropdown"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Field>
              </div>

              <Field label={dict.valid_products_label}>
                <MultiSelect
                  availableItems={productOptions}
                  selectedItems={creationDraft.selectedProducts}
                  onChange={(items) =>
                    setCreationDraft((prev) => ({
                      ...prev,
                      selectedProducts: items,
                    }))
                  }
                  placeholder={dict.valid_products_placeholder}
                />
              </Field>
            </div>
          </div>

          <div className={styles.sectionCol}>
            <div className={styles.stackBlock}>
              <EmailComposer
                subject={creationDraft.emailSubject}
                onSubjectChange={(val) =>
                  setCreationDraft((prev) => ({ ...prev, emailSubject: val }))
                }
                body={creationDraft.emailIntroLine}
                onBodyChange={(val) =>
                  setCreationDraft((prev) => ({ ...prev, emailIntroLine: val }))
                }
                variables={discountVariables}
                subjectLabel={dict.email_subject_label}
                subjectPlaceholder={dict.default_email_subject}
                bodyLabel={dict.email_body_label}
                bodyPlaceholder={dict.email_body_placeholder}
                sectionTitle={dict.section_email}
                previewTitle={dict.preview_title}
                variablesHintLabel={dict.email_variables_hint}
              />
            </div>
          </div>
        </div>
      </form>
    </main>
  );
}

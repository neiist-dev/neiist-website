"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import {
  FaAlignLeft,
  FaBox,
  FaCalendarAlt,
  FaEnvelope,
  FaEye,
  FaEuroSign,
  FaHashtag,
  FaHeading,
  FaPercent,
  FaPlus,
  FaTag,
  FaTicketAlt,
  FaUsers,
  FaArrowLeft,
} from "react-icons/fa";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ColorfulText from "@/components/ColorfulText";
import MultiSelectDropdown from "@/components/MultiSelectDropdown";
import { Product } from "@/types/shop/product";
import { User } from "@/types/user";
import { DiscountBulkGenerateResponse, DiscountType } from "@/types/shop/discountCode";
import styles from "@/styles/components/shop/DiscountCodeForm.module.css";
import {
  getDefaultDiscountEmailIntroLine,
  renderDiscountCampaignEmailHtml,
} from "@/utils/shop/discountEmail";
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

function Field({
  label,
  icon,
  iconAlignTop,
  children,
}: {
  label: string;
  icon: ReactNode;
  iconAlignTop?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={styles.fieldWrap}>
      <label className={styles.label}>{label}</label>
      <div className={styles.inputRow}>
        <span className={`${styles.inputIcon} ${iconAlignTop ? styles.alignTopIcon : ""}`}>
          {icon}
        </span>
        <div className={styles.inputControl}>{children}</div>
      </div>
    </div>
  );
}

function SectionTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className={styles.sectionTitle}>
      <span className={styles.sectionTitleIcon}>{icon}</span>
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
  const productIdByLabel = new Map(
    products.map((product) => [buildProductOption(product), product.id])
  );
  const userOptions = users.map(formatUserLabel);
  const userByLabel = new Map(users.map((user) => [formatUserLabel(user), user]));

  const selectedRecipients = creationDraft.selectedRecipients
    .map((label) => userByLabel.get(label))
    .filter((user): user is User => Boolean(user));

  const previewRecipient = selectedRecipients[0] ?? PREVIEW_RECIPIENT;
  const previewHtml = renderDiscountCampaignEmailHtml(creationDraft.emailIntroLine, {
    recipientName: previewRecipient.name,
    recipientIstid: previewRecipient.istid,
    recipientEmail: previewRecipient.email,
    code: "K9X2A1",
    discountType: creationDraft.discount_type,
    discountValue: Number(creationDraft.discount_value) || 0,
    expiresAt: creationDraft.expiresAt ? creationDraft.expiresAt.toISOString() : null,
    introLine: creationDraft.emailIntroLine,
  });

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
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
      <div
        className={styles.hint}
        style={{
          marginTop: "-0.5rem",
          marginBottom: "1rem",
          padding: "0.75rem",
          backgroundColor: "#f8f9fa",
          borderRadius: "0.6rem",
          border: "1px solid #e9ecef",
        }}>
        <div style={{ marginBottom: hasVariantsWithDifferentPrices ? "0.5rem" : "0" }}>
          <strong>{product.name}:</strong>{" "}
          {hasVariantsWithDifferentPrices ? dict.preview_base_price : dict.preview_will_go_from}
          {baseOriginal.toFixed(2)}€ {dict.preview_to} <strong>{baseNew.toFixed(2)}€</strong>.
        </div>
        {hasVariantsWithDifferentPrices && (
          <ul
            style={{
              margin: 0,
              paddingLeft: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
            }}>
            {Array.from(variantsByPrice.entries())
              .sort(([modA], [modB]) => modA - modB)
              .map(([mod, names]) => {
                const variantOriginal = baseOriginal + mod;
                const variantNew = calcPrice(variantOriginal);
                const labelStr =
                  names.length > 3 ? `${names.length} ${dict.preview_variants}` : names.join(", ");
                return (
                  <li key={mod}>
                    <em>{labelStr}</em>: {variantOriginal.toFixed(2)}€ ➜{" "}
                    <strong>{variantNew.toFixed(2)}€</strong>
                  </li>
                );
              })}
          </ul>
        )}
      </div>
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedExternalEmails = creationDraft.externalEmails
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);

    const recipients = [
      ...selectedRecipients.map((user) => ({
        istid: user.istid,
        name: user.name,
        email: user.email,
      })),
      ...parsedExternalEmails.map((email) => ({
        istid: "",
        name: "",
        email,
      })),
    ];

    const discountValue = Number(creationDraft.discount_value);
    const maxUses = creationDraft.maxUses.trim() ? Number(creationDraft.maxUses) : 1;
    const expiresAt = creationDraft.expiresAt ? creationDraft.expiresAt.toISOString() : null;
    const validProductIds = creationDraft.selectedProducts.length
      ? creationDraft.selectedProducts
          .map((item) => productIdByLabel.get(item) ?? null)
          .filter((item): item is number => item !== null)
      : null;

    if (recipients.length === 0) {
      toast.error(dict.error_no_recipients, { closeButton: true });
      return;
    }
    if (!Number.isFinite(discountValue) || discountValue < 0) {
      toast.error(dict.error_invalid_value, { closeButton: true });
      return;
    }
    if (!Number.isInteger(maxUses) || maxUses <= 0) {
      toast.error(dict.error_invalid_max_uses, { closeButton: true });
      return;
    }
    if (!creationDraft.emailSubject.trim() || !creationDraft.emailIntroLine.trim()) {
      toast.error(dict.error_missing_subject_or_body, { closeButton: true });
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/shop/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients,
          discount_type: creationDraft.discount_type,
          discount_value: discountValue,
          valid_product_ids: validProductIds,
          max_uses: maxUses,
          expires_at: expiresAt,
          active: true,
          email_subject: creationDraft.emailSubject,
          email_intro_line: creationDraft.emailIntroLine,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | (DiscountBulkGenerateResponse & {
            error?: string;
            failed_recipients?: Array<{ istid: string; error: string }>;
          })
        | null;

      if (!response.ok) {
        toast.error(data?.error ?? dict.error_generate_failed, { closeButton: true });
        return;
      }

      const generatedCodes = data?.codes ?? [];
      const failedCount = data?.failed_count ?? 0;

      if (failedCount > 0) {
        toast.warning(
          dict.toast_generated_with_failures
            .replace("{count}", String(generatedCodes.length))
            .replace("{failed}", String(failedCount)),
          {
            closeButton: true,
          }
        );
      } else {
        toast.success(
          dict.toast_generated_success.replace("{count}", String(generatedCodes.length)),
          {
            closeButton: true,
          }
        );
      }

      router.push(backHref || "/shop/manage/discounts");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : dict.error_generate_failed, {
        closeButton: true,
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className={styles.container}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit(e);
        }}>
        <div className={styles.header}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => router.push(backHref || "/shop/manage/discounts")}>
            <FaArrowLeft /> {dict.back}
          </button>
          <ColorfulText className={styles.title} text={dict.title} />
          <button type="submit" className={styles.btnPrimary} disabled={isCreating}>
            <FaPlus /> {isCreating ? dict.generating : dict.generate_btn}
          </button>
        </div>

        <div className={styles.grid}>
          <div className={styles.sectionCol}>
            <div className={styles.stackBlock}>
              <SectionTitle icon={<FaTicketAlt />}>{dict.section_discount}</SectionTitle>

              <Field label={dict.users_label} icon={<FaUsers />}>
                <MultiSelectDropdown
                  availableItems={userOptions}
                  selectedItems={creationDraft.selectedRecipients}
                  onChange={(items) =>
                    setCreationDraft((prev) => ({ ...prev, selectedRecipients: items }))
                  }
                  placeholder={dict.users_placeholder}
                />
              </Field>
              <Field label={dict.external_emails_label} icon={<FaEnvelope />} iconAlignTop>
                <textarea
                  className={styles.field}
                  rows={2}
                  value={creationDraft.externalEmails}
                  onChange={(e) =>
                    setCreationDraft((prev) => ({ ...prev, externalEmails: e.target.value }))
                  }
                  placeholder={dict.external_emails_placeholder}
                />
              </Field>
              <div className={styles.row}>
                <Field label={dict.type_label} icon={<FaTag />}>
                  <select
                    className={styles.field}
                    value={creationDraft.discount_type}
                    onChange={(e) =>
                      setCreationDraft((prev) => ({
                        ...prev,
                        discount_type: e.target.value as DiscountType,
                      }))
                    }>
                    <option value="percentage">{dict.type_percentage}</option>
                    <option value="fixed">{dict.type_fixed}</option>
                  </select>
                </Field>
                <Field
                  label={dict.value_label}
                  icon={
                    creationDraft.discount_type === "percentage" ? <FaPercent /> : <FaEuroSign />
                  }>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={creationDraft.discount_type === "percentage" ? "100" : undefined}
                    className={styles.field}
                    value={creationDraft.discount_value}
                    onChange={(e) =>
                      setCreationDraft((prev) => ({ ...prev, discount_value: e.target.value }))
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
                <Field label={dict.max_uses_label} icon={<FaHashtag />}>
                  <input
                    type="number"
                    min="1"
                    className={styles.field}
                    value={creationDraft.maxUses}
                    onChange={(e) =>
                      setCreationDraft((prev) => ({ ...prev, maxUses: e.target.value }))
                    }
                    placeholder="1"
                  />
                </Field>
                <Field label={dict.expiration_label} icon={<FaCalendarAlt />}>
                  <div className={styles.datePickerWrap} ref={datePickerRef}>
                    <input
                      className={styles.field}
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
                              setCreationDraft((prev) => ({ ...prev, expiresAt: date }));
                              setShowDatePicker(false);
                            }}
                            weekStartsOn={1}
                            captionLayout="dropdown"
                            navLayout="around"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Field>
              </div>
              <Field label={dict.valid_products_label} icon={<FaBox />}>
                <MultiSelectDropdown
                  availableItems={productOptions}
                  selectedItems={creationDraft.selectedProducts}
                  onChange={(items) =>
                    setCreationDraft((prev) => ({ ...prev, selectedProducts: items }))
                  }
                  placeholder={dict.valid_products_placeholder}
                />
              </Field>
            </div>
          </div>

          <div className={styles.sectionCol}>
            <div className={styles.stackBlock}>
              <SectionTitle icon={<FaEnvelope />}>{dict.section_email}</SectionTitle>
              <Field label={dict.email_subject_label} icon={<FaHeading />}>
                <input
                  type="text"
                  className={styles.field}
                  value={creationDraft.emailSubject}
                  onChange={(e) =>
                    setCreationDraft((prev) => ({ ...prev, emailSubject: e.target.value }))
                  }
                  placeholder={dict.default_email_subject}
                />
              </Field>
              <Field label={dict.email_body_label} icon={<FaAlignLeft />} iconAlignTop>
                <textarea
                  rows={10}
                  className={styles.field}
                  value={creationDraft.emailIntroLine}
                  onChange={(e) =>
                    setCreationDraft((prev) => ({ ...prev, emailIntroLine: e.target.value }))
                  }
                  placeholder={dict.email_body_placeholder}
                />
              </Field>
              <span className={styles.hint}>{dict.email_variables_hint}</span>

              <SectionTitle icon={<FaEye />}>{dict.preview_title}</SectionTitle>
              <article
                className={styles.previewEmail}
                // eslint-disable-next-line @eslint-react/dom-no-dangerously-set-innerhtml -- safe: previewHtml is generated with strict HTML escaping
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

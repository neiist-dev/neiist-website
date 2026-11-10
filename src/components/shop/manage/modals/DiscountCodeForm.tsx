"use client";

import { useMemo, useState } from "react";
import { FaArrowLeft, FaPlus, FaTicketAlt } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { pt } from "date-fns/locale";
import {
  Alert,
  Button,
  ColorfulText,
  DateInput,
  Field,
  Heading,
  Input,
  MultiSelect,
  Select,
  Stack,
  Text,
  Textarea,
  type MultiSelectOption,
} from "@neiist/ui";
import { Product } from "@/types/shop/product";
import { User } from "@/types/user";
import { DiscountType } from "@/types/shop/discountCode";
import { createDiscountBulkAction } from "@/actions/shop/discounts";
import EmailComposer from "@/components/general/EmailComposer";
import {
  formatDiscountExpiryLabel,
  formatDiscountValueLabel,
  getDefaultDiscountEmailIntroLine,
} from "@/lib/email/templates/discounts";
import { formatMoney } from "@/utils/shop/moneyUtils";
import type { Dictionary } from "@/i18n/dictionaries";
import styles from "@/styles/components/shop/manage/modals/DiscountCodeForm.module.css";

interface DiscountCodeEditorProps {
  users: User[];
  products: Product[];
  backHref?: string;
  dict: Dictionary["discount_codes"]["form"];
}

type CreationDraft = {
  selectedUserIstids: string[];
  externalEmails: string;
  discount_type: DiscountType;
  discount_value: string;
  selectedProductIds: string[];
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
    selectedUserIstids: [],
    externalEmails: "",
    discount_type: "percentage",
    discount_value: "",
    selectedProductIds: [],
    maxUses: "1",
    expiresAt: undefined,
    emailSubject: dict.default_email_subject,
    emailIntroLine: getDefaultDiscountEmailIntroLine().trim(),
  };
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

  const userOptions = useMemo<MultiSelectOption[]>(
    () =>
      users.map((user) => ({
        value: user.istid,
        label: user.name,
        subtitle: `${user.email} • ${user.istid}`,
        avatar: user.photo,
      })),
    [users]
  );

  const userByIstid = useMemo(() => new Map(users.map((u) => [u.istid, u])), [users]);

  const productOptions = useMemo<MultiSelectOption[]>(
    () =>
      products.map((product) => ({
        value: String(product.id),
        label: product.name,
      })),
    [products]
  );

  const previewRecipient = useMemo(() => {
    const firstIstid = creationDraft.selectedUserIstids[0];
    const firstUser = firstIstid ? userByIstid.get(firstIstid) : null;
    return firstUser
      ? {
          name: firstUser.name,
          istid: firstUser.istid,
          email: firstUser.email,
        }
      : PREVIEW_RECIPIENT;
  }, [creationDraft.selectedUserIstids, userByIstid]);

  const discountVariables = useMemo(() => {
    const numVal = Number(creationDraft.discount_value) || 0;
    const expiryIso = creationDraft.expiresAt ? creationDraft.expiresAt.toISOString() : null;
    return [
      {
        key: "name",
        sampleValue: previewRecipient.name || PREVIEW_RECIPIENT.name,
      },
      {
        key: "istid",
        sampleValue: previewRecipient.istid || PREVIEW_RECIPIENT.istid,
      },
      { key: "code", sampleValue: "K9X2A1" },
      {
        key: "discount",
        sampleValue: formatDiscountValueLabel(creationDraft.discount_type, numVal),
      },
      {
        key: "expiry",
        sampleValue: formatDiscountExpiryLabel(expiryIso),
      },
    ];
  }, [
    previewRecipient,
    creationDraft.discount_type,
    creationDraft.discount_value,
    creationDraft.expiresAt,
  ]);

  const pricePreview = useMemo(() => {
    if (products.length === 0) return null;
    const selectedId = creationDraft.selectedProductIds[0]
      ? Number(creationDraft.selectedProductIds[0])
      : null;
    const product = products.find((p) => p.id === selectedId) || products[0];

    const numVal = Number(creationDraft.discount_value) || 0;
    const calcPrice = (orig: number) =>
      Math.max(
        0,
        creationDraft.discount_type === "percentage" ? orig * (1 - numVal / 100) : orig - numVal
      );

    const baseOriginal = product.price;
    const baseNew = calcPrice(baseOriginal);

    const variantsByPrice = new Map<number, string[]>();
    let hasVariantDifferences = false;

    (product.variants || []).forEach((variant) => {
      const mod = Number(variant.price_modifier) || 0;
      if (mod !== 0) hasVariantDifferences = true;
      const variantName = Object.values(variant.options || {}).join(" ") || `Var ${variant.id}`;
      const existing = variantsByPrice.get(mod) || [];
      existing.push(variantName);
      variantsByPrice.set(mod, existing);
    });

    return (
      <div className={styles.previewBox}>
        <Stack direction="column" gap="sm">
          <Text size="sm">
            <strong>{product.name}:</strong>{" "}
            {hasVariantDifferences ? dict.preview_base_price : dict.preview_will_go_from}
            {formatMoney(baseOriginal)} {dict.preview_to} <strong>{formatMoney(baseNew)}</strong>.
          </Text>
          {hasVariantDifferences && (
            <ul className={styles.variantList}>
              {Array.from(variantsByPrice.entries())
                .sort(([modA], [modB]) => modA - modB)
                .map(([mod, names]) => {
                  const variantOriginal = baseOriginal + mod;
                  const variantNew = calcPrice(variantOriginal);
                  return (
                    <li key={mod}>
                      <Text size="sm" variant="muted">
                        {names.join(", ")}: {formatMoney(variantOriginal)} {dict.preview_to}{" "}
                        <strong>{formatMoney(variantNew)}</strong>
                      </Text>
                    </li>
                  );
                })}
            </ul>
          )}
        </Stack>
      </div>
    );
  }, [
    products,
    creationDraft.selectedProductIds,
    creationDraft.discount_value,
    creationDraft.discount_type,
    dict.preview_base_price,
    dict.preview_will_go_from,
    dict.preview_to,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedUsers = creationDraft.selectedUserIstids
      .map((istid) => userByIstid.get(istid))
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

    const validProductIds = creationDraft.selectedProductIds.length
      ? creationDraft.selectedProductIds.map(Number).filter((id) => Number.isFinite(id))
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
            variant="ghost"
            color="neutral"
            onClick={() => router.push(backHref || "/shop/manage/discounts")}>
            <FaArrowLeft /> {dict.back}
          </Button>
          <ColorfulText as="h1" className={styles.title} text={dict.title} />
          <Button variant="primary" type="submit" loading={isCreating} disabled={isCreating}>
            <FaPlus /> {isCreating ? dict.generating : dict.generate_btn}
          </Button>
        </header>

        <div className={styles.grid}>
          <div className={styles.sectionCol}>
            <Stack direction="column" gap="md">
              <Heading level={4} className={styles.sectionTitle}>
                <FaTicketAlt className={styles.sectionIcon} />
                <span>{dict.section_discount}</span>
              </Heading>

              <Field label={dict.users_label}>
                <MultiSelect
                  availableItems={userOptions}
                  selectedItems={creationDraft.selectedUserIstids}
                  onChange={(items) =>
                    setCreationDraft((prev) => ({
                      ...prev,
                      selectedUserIstids: items,
                    }))
                  }
                  placeholder={dict.users_placeholder}
                  mobileDrawerTitle={dict.users_label}
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

              {pricePreview}

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
                  <DateInput
                    value={creationDraft.expiresAt}
                    onChange={(date) =>
                      setCreationDraft((prev) => ({
                        ...prev,
                        expiresAt: date,
                      }))
                    }
                    placeholder={dict.no_limit}
                    mobileDrawerTitle={dict.expiration_label}
                    locale={pt}
                  />
                </Field>
              </div>

              <Field label={dict.valid_products_label}>
                <MultiSelect
                  availableItems={productOptions}
                  selectedItems={creationDraft.selectedProductIds}
                  onChange={(items) =>
                    setCreationDraft((prev) => ({
                      ...prev,
                      selectedProductIds: items,
                    }))
                  }
                  placeholder={dict.valid_products_placeholder}
                  mobileDrawerTitle={dict.valid_products_label}
                />
              </Field>
            </Stack>
          </div>

          <div className={styles.sectionCol}>
            <EmailComposer
              subject={creationDraft.emailSubject}
              onSubjectChange={(val) =>
                setCreationDraft((prev) => ({ ...prev, emailSubject: val }))
              }
              body={creationDraft.emailIntroLine}
              onBodyChange={(val) => setCreationDraft((prev) => ({ ...prev, emailIntroLine: val }))}
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
      </form>
    </main>
  );
}

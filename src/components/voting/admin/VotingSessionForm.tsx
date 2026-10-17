"use client";

import { useState, useMemo, useCallback, useRef, useEffect, ChangeEvent } from "react";
import Image from "next/image";
import { VotingType, VOTING_TYPES } from "@/types/voting";
import { CalendarEvent } from "@/types/events";
import { User } from "@/types/user";
import { useRouter } from "next/navigation";
import { createVotingSessionAction } from "@/lib/votingSystem";
import {
  MultiSelect,
  Field,
  Input,
  Textarea,
  DateInput,
  HourInput,
  Button,
  Tabs,
  Alert,
  type TabItem,
} from "@neiist/ui";
import ColorfulText from "@/components/ColorfulText";
import { FiEdit3, FiClock, FiUsers, FiImage, FiTrash2, FiList } from "react-icons/fi";
import { FaArrowLeft, FaPlus } from "react-icons/fa";
import { pt, enGB } from "date-fns/locale";
import styles from "@/styles/components/voting/admin/VotingSessionForm.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

interface VotingSessionFormProps {
  activities: CalendarEvent[];
  users: User[];
  dict: Dictionary["voting_management"]["form"];
  typesDict: Dictionary["voting_management"]["types"];
  locale?: string;
  basePath?: string;
  backHref?: string;
}

interface CustomOptionState {
  id: string;
  name: string;
  description: string;
  file?: File;
  previewUrl?: string;
  descFile?: File;
  descPreviewUrl?: string;
}

const initialOptions = (): CustomOptionState[] => {
  const now = Date.now();
  return [
    { id: `opt_${now}_1`, name: "", description: "" },
    { id: `opt_${now + 1}_2`, name: "", description: "" },
  ];
};

const pad = (n: number) => String(n).padStart(2, "0");

function formatIsoDateTime(date?: Date, timeStr?: string): string {
  if (!date) return "";
  const d = new Date(date);
  if (timeStr && timeStr.includes(":")) {
    const [h, m] = timeStr.split(":").map(Number);
    d.setHours(h || 0, m || 0, 0, 0);
  } else {
    d.setHours(0, 0, 0, 0);
  }
  return d.toISOString();
}

function formatIsoDateTimeEnd(date?: Date, timeStr?: string): string {
  if (!date) return "";
  const d = new Date(date);
  if (timeStr && timeStr.includes(":")) {
    const [h, m] = timeStr.split(":").map(Number);
    d.setHours(h || 0, m || 0, 0, 0);
  } else {
    d.setHours(23, 59, 59, 999);
  }
  return d.toISOString();
}

async function uploadVotingFiles(
  files: File[],
  fallbackError = "Erro ao carregar imagens"
): Promise<string[]> {
  if (!files || files.length === 0) return [];

  return Promise.all(
    files.map(async (file) => {
      const fd = new FormData();
      fd.append("files", file);
      const res = await fetch("/api/voting/uploads", { method: "POST", body: fd });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error ? `${errorData.error} (${file.name})` : `${fallbackError}: ${file.name}`
        );
      }
      const data = await res.json();
      const path = data.paths?.[0];
      if (!path) throw new Error(`${fallbackError}: ${file.name}`);
      return path as string;
    })
  );
}

export default function VotingSessionForm({
  activities,
  users,
  dict,
  typesDict,
  locale = "pt",
  basePath,
  backHref = `${basePath || ""}/voting/manage`,
}: VotingSessionFormProps) {
  const router = useRouter();
  const dateLocale = locale === "en" ? enGB : pt;

  const [form, setForm] = useState(() => ({
    type: VOTING_TYPES.ACTIVITY as VotingType,
    name: "",
    description: "",
    startDate: undefined as Date | undefined,
    startTime: "",
    endDate: undefined as Date | undefined,
    endTime: "",
    selectedNominees: [] as string[],
    selectedActivityId: "",
  }));

  const set = useCallback(<K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const {
    type,
    name,
    description,
    startDate,
    startTime,
    endDate,
    endTime,
    selectedNominees,
    selectedActivityId,
  } = form;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({});
  const [customOptions, setCustomOptions] = useState<CustomOptionState[]>(initialOptions);

  const customOptionsRef = useRef(customOptions);
  customOptionsRef.current = customOptions;

  useEffect(
    () => () => {
      customOptionsRef.current.forEach((opt) => {
        if (opt.previewUrl) URL.revokeObjectURL(opt.previewUrl);
        if (opt.descPreviewUrl) URL.revokeObjectURL(opt.descPreviewUrl);
      });
    },
    []
  );

  const activityOptions = useMemo(
    () =>
      activities.map((activity) => ({
        label: `${activity.summary} (${activity.id.slice(0, 8)})`,
        value: activity.id,
      })),
    [activities]
  );
  const userOptions = useMemo(
    () => users.map((user) => ({ label: `${user.name} (${user.istid})`, value: user.istid })),
    [users]
  );

  const handleNomineeChange = useCallback(
    (labels: string[]) => {
      const ids = labels
        .map((label) => userOptions.find((option) => option.label === label)?.value)
        .filter(Boolean) as string[];
      set("selectedNominees", ids);
    },
    [userOptions, set]
  );

  const handleActivityChange = useCallback(
    (labels: string[]) => {
      const id = activityOptions.find((option) => option.label === labels[0])?.value ?? "";
      const activity = activities.find((a) => a.id === id);
      if (!activity) {
        set("selectedActivityId", id);
        return;
      }
      let startDate: Date | undefined;
      let startTime = "";
      let endDate: Date | undefined;
      let endTime = "";

      const start = activity.start.dateTime ?? activity.start.date;
      const end = activity.end.dateTime ?? activity.end.date;
      if (start) {
        const s = new Date(start);
        if (!isNaN(s.getTime())) {
          startDate = s;
          startTime = `${pad(s.getHours())}:${pad(s.getMinutes())}`;
        }
      }
      if (end) {
        const e = new Date(end);
        if (!isNaN(e.getTime())) {
          endDate = e;
          endTime = `${pad(e.getHours())}:${pad(e.getMinutes())}`;
        }
      }

      setForm((prev) => ({
        ...prev,
        selectedActivityId: id,
        startDate,
        startTime,
        endDate,
        endTime,
        selectedNominees: activity.subscribers ?? [],
      }));
    },
    [activities, activityOptions, set]
  );

  const handleTypeChange = (newType: VotingType) => {
    setForm((prev) => ({
      ...prev,
      type: newType,
      selectedNominees: [],
      selectedActivityId: "",
      startDate: undefined,
      startTime: "",
      endDate: undefined,
      endTime: "",
    }));
  };

  const addCustomOption = useCallback(() => {
    setCustomOptions((prev) => [
      ...prev,
      { id: `opt_${Date.now()}_${prev.length + 1}`, name: "", description: "" },
    ]);
  }, []);

  const removeCustomOption = useCallback((index: number) => {
    setCustomOptions((prev) => {
      const target = prev[index];
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      if (target?.descPreviewUrl) URL.revokeObjectURL(target.descPreviewUrl);
      return prev.filter((_, idx) => idx !== index);
    });
  }, []);

  const updateCustomOption = useCallback((index: number, patch: Partial<CustomOptionState>) => {
    setCustomOptions((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item))
    );
  }, []);

  const handleOptionImage = useCallback(
    (index: number, isDesc: boolean, e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        Alert.error(dict.error_image_size);
        e.target.value = "";
        return;
      }
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (file.type && !allowedTypes.includes(file.type)) {
        Alert.error(dict.error_image_type);
        e.target.value = "";
        return;
      }

      setCustomOptions((prev) =>
        prev.map((item, idx) => {
          if (idx !== index) return item;
          const oldUrl = isDesc ? item.descPreviewUrl : item.previewUrl;
          if (oldUrl) URL.revokeObjectURL(oldUrl);
          const newUrl = URL.createObjectURL(file);
          return isDesc
            ? { ...item, descFile: file, descPreviewUrl: newUrl }
            : { ...item, file, previewUrl: newUrl };
        })
      );
      e.target.value = "";
    },
    [dict.error_image_size, dict.error_image_type]
  );

  const removeOptionImage = useCallback((index: number, isDesc: boolean) => {
    setCustomOptions((prev) => {
      const target = prev[index];
      const key = `${target?.id}_${isDesc}`;
      if (fileInputsRef.current[key]) fileInputsRef.current[key]!.value = "";

      return prev.map((item, idx) => {
        if (idx !== index) return item;
        const oldUrl = isDesc ? item.descPreviewUrl : item.previewUrl;
        if (oldUrl) URL.revokeObjectURL(oldUrl);
        return isDesc
          ? { ...item, descFile: undefined, descPreviewUrl: undefined }
          : { ...item, file: undefined, previewUrl: undefined };
      });
    });
  }, []);

  const selectedActivityLabel = useMemo(
    () => activityOptions.find((o) => o.value === selectedActivityId)?.label ?? "",
    [selectedActivityId, activityOptions]
  );

  const selectedUserLabels = useMemo(
    () =>
      selectedNominees
        .map((id) => userOptions.find((o) => o.value === id)?.label)
        .filter(Boolean) as string[],
    [selectedNominees, userOptions]
  );

  const isCustomValid =
    type !== VOTING_TYPES.CUSTOM ||
    (customOptions.length >= 2 &&
      customOptions.every((o) => o.name.trim().length > 0 && Boolean(o.file || o.previewUrl)));
  const isActivityValid = type !== VOTING_TYPES.ACTIVITY || Boolean(selectedActivityId);
  const isUsersValid = type !== VOTING_TYPES.USERS || selectedNominees.length > 0;
  const isFormValid = name.trim().length > 0 && isActivityValid && isUsersValid && isCustomValid;

  const typeTabs: TabItem[] = useMemo(
    () => [
      {
        id: VOTING_TYPES.ACTIVITY,
        name: typesDict.activity,
        content: (
          <div className={styles.col}>
            <div className={styles.sectionTitle}>
              <FiUsers className={styles.sectionTitleIcon} />
              <span>{dict.select_activity}</span>
            </div>
            <MultiSelect
              id="activity-picker"
              items={activityOptions.map((o) => o.label)}
              selectedItems={selectedActivityId ? [selectedActivityLabel] : []}
              onChange={handleActivityChange}
              multiSelect={false}
              placeholder={dict.search_activity}
            />
          </div>
        ),
      },
      {
        id: VOTING_TYPES.USERS,
        name: typesDict.users,
        content: (
          <div className={styles.col}>
            <div className={styles.sectionTitle}>
              <FiUsers className={styles.sectionTitleIcon} />
              <span>{dict.candidates}</span>
            </div>
            <MultiSelect
              id="user-picker"
              items={userOptions.map((o) => o.label)}
              selectedItems={selectedUserLabels}
              onChange={handleNomineeChange}
              multiSelect={true}
              placeholder={dict.search_users}
            />
          </div>
        ),
      },
      {
        id: VOTING_TYPES.CUSTOM,
        name: typesDict.custom,
        content: (
          <div className={styles.col}>
            <div className={styles.sectionTitle}>
              <FiList className={styles.sectionTitleIcon} />
              <span>{dict.options}</span>
            </div>
            <div className={styles.customOptionsList}>
              {customOptions.map((opt, index) => (
                <div key={opt.id} className={styles.customOptionRow}>
                  {customOptions.length > 2 && (
                    <div className={styles.optionTopRow}>
                      <Button
                        type="button"
                        variant="ghost"
                        color="danger"
                        size="sm"
                        onClick={() => removeCustomOption(index)}
                        className={styles.removeOptionBtn}>
                        <FiTrash2 size={14} />
                        <span>{dict.remove_option}</span>
                      </Button>
                    </div>
                  )}

                  <Field label={dict.option_title}>
                    <Input
                      value={opt.name}
                      onChange={(e) => updateCustomOption(index, { name: e.target.value })}
                      placeholder={dict.option_title_placeholder}
                      required
                    />
                  </Field>

                  <Field label={dict.option_desc}>
                    <Textarea
                      value={opt.description}
                      onChange={(e) => updateCustomOption(index, { description: e.target.value })}
                      placeholder={dict.option_desc_placeholder}
                      rows={2}
                    />
                  </Field>

                  <div className={styles.imageControlsRow}>
                    {([false, true] as const).map((isDesc) => {
                      const preview = isDesc ? opt.descPreviewUrl : opt.previewUrl;
                      const key = `${opt.id}_${isDesc}`;
                      const label = isDesc
                        ? preview
                          ? dict.change_desc_image
                          : `${dict.desc_image} ${dict.desc_image_optional}`
                        : preview
                          ? dict.change_main_image
                          : `${dict.main_image} *`;

                      return (
                        <div key={key} className={styles.imageSection}>
                          {preview && (
                            <Image
                              src={preview}
                              alt={opt.name || dict.option_title}
                              width={48}
                              height={48}
                              className={styles.imagePreview}
                            />
                          )}
                          <input
                            ref={(el) => {
                              fileInputsRef.current[key] = el;
                            }}
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className={styles.hiddenFileInput}
                            onChange={(e) => handleOptionImage(index, isDesc, e)}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            color="neutral"
                            size="sm"
                            onClick={() => fileInputsRef.current[key]?.click()}>
                            <FiImage size={16} />
                            <span>{label}</span>
                          </Button>
                          {preview && (
                            <Button
                              type="button"
                              variant="ghost"
                              color="danger"
                              size="sm"
                              onClick={() => removeOptionImage(index, isDesc)}>
                              {dict.remove_image}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                color="primary"
                size="md"
                className={styles.addOptionBtn}
                onClick={addCustomOption}>
                <FaPlus size={14} />
                <span>{dict.add_option}</span>
              </Button>
            </div>
          </div>
        ),
      },
    ],
    [
      typesDict,
      dict,
      activityOptions,
      selectedActivityId,
      selectedActivityLabel,
      handleActivityChange,
      userOptions,
      selectedUserLabels,
      handleNomineeChange,
      customOptions,
      removeCustomOption,
      updateCustomOption,
      handleOptionImage,
      removeOptionImage,
      addCustomOption,
    ]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !isFormValid) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("type", type);
      formData.set("name", name.trim());
      if (description.trim()) formData.set("description", description.trim());

      if (startDate) formData.set("startAt", formatIsoDateTime(startDate, startTime));

      if (endDate) formData.set("endAt", formatIsoDateTimeEnd(endDate, endTime));

      if (type === VOTING_TYPES.ACTIVITY) {
        formData.set("activityId", selectedActivityId);
        if (selectedNominees.length > 0)
          formData.set("activityNominees", selectedNominees.join(","));
      } else if (type === VOTING_TYPES.USERS) {
        formData.set("customUsers", selectedNominees.join(","));
      } else if (type === VOTING_TYPES.CUSTOM) {
        const validOptions = customOptions.filter((option) => option.name.trim().length > 0);
        const filesToUpload: File[] = [];
        validOptions.forEach((o) => {
          if (o.file) filesToUpload.push(o.file);
          if (o.descFile) filesToUpload.push(o.descFile);
        });

        const paths = await uploadVotingFiles(filesToUpload, dict.error_upload);

        let pathIdx = 0;
        const optionsMeta = validOptions.map((o) => {
          const mainPath = o.file ? paths[pathIdx++] : undefined;
          const descPath = o.descFile ? paths[pathIdx++] : mainPath;

          return {
            id: o.id,
            name: o.name.trim(),
            description: o.description.trim() || undefined,
            photoPath: mainPath,
            descriptionPhotoPath: descPath,
          };
        });
        formData.set("customOptions", JSON.stringify(optionsMeta));
      }

      const result = await createVotingSessionAction(formData);
      if (result.ok) {
        Alert.success(dict.create_success);
        router.replace(backHref);
      } else {
        Alert.error(result.error);
      }
    } catch (err: unknown) {
      console.error("Failed to create voting session:", err);
      Alert.error(err instanceof Error ? err.message : dict.error_create);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.container}>
      <header className={styles.header}>
        <Button
          type="button"
          variant="ghost"
          color="neutral"
          className={styles.btnSecondary}
          onClick={() => router.push(backHref)}>
          <FaArrowLeft /> {dict.back}
        </Button>
        <ColorfulText as="h2" className={styles.title} text={dict.title} chunk={true} />
        <Button
          type="submit"
          variant="solid"
          color="primary"
          disabled={!isFormValid || isSubmitting}
          loading={isSubmitting}>
          <FaPlus /> {dict.submit}
        </Button>
      </header>

      <div className={styles.grid}>
        <div className={styles.col}>
          <div className={styles.sectionTitle}>
            <FiEdit3 className={styles.sectionTitleIcon} />
            <span>{dict.basic_info}</span>
          </div>

          <Field label={dict.title_label}>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => set("name", e.target.value)}
              required
              placeholder={dict.title_placeholder}
            />
          </Field>

          <Field label={dict.desc_label}>
            <Textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => set("description", e.target.value)}
              placeholder={dict.desc_placeholder}
              rows={3}
            />
          </Field>

          <div className={styles.sectionTitle}>
            <FiClock className={styles.sectionTitleIcon} />
            <span>{dict.period_title}</span>
          </div>

          <div className={styles.dateGroup}>
            <Field label={dict.start_label}>
              <div className={styles.dateTimeRow}>
                <DateInput
                  value={startDate}
                  onChange={(d) => set("startDate", d)}
                  placeholder="dd/mm/aaaa"
                  mobileDrawerTitle={dict.start_label}
                  locale={dateLocale}
                />
                <HourInput
                  value={startTime}
                  onChange={(t) => set("startTime", t)}
                  format="24h"
                  placeholder="HH:mm"
                  mobileDrawerTitle={dict.start_label}
                />
              </div>
            </Field>

            <Field label={dict.end_label}>
              <div className={styles.dateTimeRow}>
                <DateInput
                  value={endDate}
                  onChange={(d) => set("endDate", d)}
                  placeholder="dd/mm/aaaa"
                  mobileDrawerTitle={dict.end_label}
                  locale={dateLocale}
                />
                <HourInput
                  value={endTime}
                  onChange={(t) => set("endTime", t)}
                  format="24h"
                  placeholder="HH:mm"
                  mobileDrawerTitle={dict.end_label}
                />
              </div>
            </Field>
          </div>
        </div>

        <div className={styles.col}>
          <div className={styles.sectionTitle}>
            <FiUsers className={styles.sectionTitleIcon} />
            <span>{dict.voting_type}</span>
          </div>
          <Tabs
            tabs={typeTabs}
            value={type}
            onChange={(id) => handleTypeChange(id as VotingType)}
          />
        </div>
      </div>
    </form>
  );
}

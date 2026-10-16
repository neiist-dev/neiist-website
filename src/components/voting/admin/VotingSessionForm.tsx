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
}

interface CustomOptionState {
  id: string;
  name: string;
  description: string;
  file?: File;
  previewUrl?: string;
}

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
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  const res = await fetch("/api/voting/uploads", { method: "POST", body: fd });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || fallbackError);
  }
  const data = await res.json();
  const paths = data.paths ?? [];
  if (paths.length !== files.length) throw new Error(fallbackError);
  return paths;
}

export default function VotingSessionForm({
  activities,
  users,
  dict,
  typesDict,
  locale = "pt",
  basePath,
}: VotingSessionFormProps) {
  const router = useRouter();
  const dateLocale = locale === "en" ? enGB : pt;

  const [type, setType] = useState<VotingType>(VOTING_TYPES.ACTIVITY);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState<string>("");
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [endTime, setEndTime] = useState<string>("");
  const [selectedNominees, setSelectedNominees] = useState<string[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({});
  const [customOptions, setCustomOptions] = useState<CustomOptionState[]>([
    { id: "opt_1", name: "", description: "" },
    { id: "opt_2", name: "", description: "" },
  ]);

  const customOptionsRef = useRef(customOptions);
  customOptionsRef.current = customOptions;
  useEffect(() => {
    return () => {
      customOptionsRef.current.forEach((opt) => {
        if (opt.previewUrl) URL.revokeObjectURL(opt.previewUrl);
      });
    };
  }, []);

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
      setSelectedNominees(ids);
    },
    [userOptions]
  );

  const handleActivityChange = useCallback(
    (labels: string[]) => {
      const id = activityOptions.find((option) => option.label === labels[0])?.value ?? "";
      setSelectedActivityId(id);
      const activity = activities.find((activity) => activity.id === id);
      if (activity) {
        const start = activity.start.dateTime ?? activity.start.date;
        const end = activity.end.dateTime ?? activity.end.date;
        if (start) {
          const s = new Date(start);
          if (!isNaN(s.getTime())) {
            setStartDate(s);
            setStartTime(`${pad(s.getHours())}:${pad(s.getMinutes())}`);
          }
        }
        if (end) {
          const e = new Date(end);
          if (!isNaN(e.getTime())) {
            setEndDate(e);
            setEndTime(`${pad(e.getHours())}:${pad(e.getMinutes())}`);
          }
        }
        setSelectedNominees(activity.subscribers ?? []);
      }
    },
    [activities, activityOptions]
  );

  const handleTypeChange = (newType: VotingType) => {
    setType(newType);
    setSelectedNominees([]);
    setSelectedActivityId("");
    setStartDate(undefined);
    setStartTime("");
    setEndDate(undefined);
    setEndTime("");
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
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, idx) => idx !== index);
    });
  }, []);

  const updateCustomOption = useCallback((index: number, patch: Partial<CustomOptionState>) => {
    setCustomOptions((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item))
    );
  }, []);

  const handleImageFileChange = useCallback(
    (index: number, e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_IMAGE_SIZE) {
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
          if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
          return {
            ...item,
            file,
            previewUrl: URL.createObjectURL(file),
          };
        })
      );
      e.target.value = "";
    },
    [dict.error_image_size, dict.error_image_type]
  );

  const removeCustomOptionImage = useCallback((index: number) => {
    setCustomOptions((prev) => {
      const target = prev[index];
      if (target) {
        if (target.previewUrl) {
          URL.revokeObjectURL(target.previewUrl);
        }
        if (fileInputsRef.current[target.id]) {
          fileInputsRef.current[target.id]!.value = "";
        }
      }
      return prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          file: undefined,
          previewUrl: undefined,
        };
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

  const validCustomOptionsCount = customOptions.filter(
    (option) => option.name.trim().length > 0
  ).length;
  const isCustomValid = type !== VOTING_TYPES.CUSTOM || validCustomOptionsCount >= 2;
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

                  <div className={styles.imageSection}>
                    {opt.previewUrl && (
                      <Image
                        src={opt.previewUrl}
                        alt={opt.name || dict.option_title}
                        width={48}
                        height={48}
                        className={styles.imagePreview}
                      />
                    )}
                    <input
                      ref={(el) => {
                        fileInputsRef.current[opt.id] = el;
                      }}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className={styles.hiddenFileInput}
                      onChange={(e) => handleImageFileChange(index, e)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      color="neutral"
                      size="sm"
                      onClick={() => fileInputsRef.current[opt.id]?.click()}>
                      <FiImage size={16} />
                      <span>{opt.previewUrl ? dict.change_image : dict.upload_image}</span>
                    </Button>
                    {opt.previewUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        color="danger"
                        size="sm"
                        onClick={() => removeCustomOptionImage(index)}>
                        {dict.remove_image}
                      </Button>
                    )}
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
      handleImageFileChange,
      removeCustomOptionImage,
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
        const optionsWithFiles = validOptions.filter((option) => option.file);

        let paths: string[] = [];
        if (optionsWithFiles.length > 0)
          paths = await uploadVotingFiles(
            optionsWithFiles.map((o) => o.file!),
            dict.error_upload
          );

        let fileIdx = 0;
        const optionsMeta = validOptions.map((option) => {
          let photoPath: string | undefined;
          if (option.file) photoPath = paths[fileIdx++];

          return {
            id: option.id,
            name: option.name.trim(),
            description: option.description.trim() || undefined,
            photoPath,
          };
        });
        formData.set("customOptions", JSON.stringify(optionsMeta));
      }

      const result = await createVotingSessionAction(formData);
      if (result.ok) {
        Alert.success(dict.create_success);
        router.replace(`${basePath || ""}/voting/manage`);
        router.refresh();
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
          onClick={() => router.push(`${basePath || ""}/voting/manage`)}>
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
              onChange={(e) => setName(e.target.value)}
              required
              placeholder={dict.title_placeholder}
            />
          </Field>

          <Field label={dict.desc_label}>
            <Textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                  onChange={setStartDate}
                  placeholder="dd/mm/aaaa"
                  mobileDrawerTitle={dict.start_label}
                  locale={dateLocale}
                />
                <HourInput
                  value={startTime}
                  onChange={setStartTime}
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
                  onChange={setEndDate}
                  placeholder="dd/mm/aaaa"
                  mobileDrawerTitle={dict.end_label}
                  locale={dateLocale}
                />
                <HourInput
                  value={endTime}
                  onChange={setEndTime}
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

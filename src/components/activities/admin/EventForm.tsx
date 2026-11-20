"use client";

import React, { useState, useMemo, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Field,
  Input,
  Textarea,
  DateInput,
  HourInput,
  Select,
  ToggleSwitch,
  Button,
  Alert,
  ColorfulText,
} from "@neiist/ui";
import { FiEdit3, FiClock, FiHelpCircle, FiCheckSquare, FiTrash2 } from "react-icons/fi";
import { FaArrowLeft, FaPlus, FaSave } from "react-icons/fa";
import { getEventIcon } from "@/components/activities/EventIcons";
import { pt } from "date-fns/locale";
import IconPicker from "./IconPicker";
import { EVENT_TYPES } from "@/types/events";
import type { Activity, SignupField } from "@/types/events";
import { saveActivityAction } from "@/actions/activities";
import type { Dictionary } from "@/i18n/dictionaries";
import styles from "@/styles/components/activities/admin/EventForm.module.css";

function renderSelectedIcon(iconName: string, size = 22) {
  const Icon = getEventIcon(iconName);
  return <Icon size={size} />;
}

const pad = (n: number) => String(n).padStart(2, "0");

function formatIsoDateTime(date?: Date, timeStr?: string): string | undefined {
  if (!date) return undefined;
  const d = new Date(date);
  if (timeStr && timeStr.includes(":")) {
    const [h, m] = timeStr.split(":").map(Number);
    d.setHours(h || 0, m || 0, 0, 0);
  } else {
    d.setHours(0, 0, 0, 0);
  }
  return d.toISOString();
}

function formatIsoDateTimeEnd(date?: Date, timeStr?: string): string | undefined {
  if (!date) return undefined;
  const d = new Date(date);
  if (timeStr && timeStr.includes(":")) {
    const [h, m] = timeStr.split(":").map(Number);
    d.setHours(h || 0, m || 0, 0, 0);
  } else {
    d.setHours(23, 59, 59, 999);
  }
  return d.toISOString();
}

interface EventFormProps {
  event?: Activity;
  isEdit?: boolean;
  backHref?: string;
  onBackAction?: () => void;
  dict: Dictionary["activities_management"];
  iconDict: Dictionary["activities"]["details"]["icon_picker"];
}

interface QuestionChipsInputProps {
  options: string[];
  onChange: (_newOptions: string[]) => void;
  placeholder: string;
  addMorePlaceholder: string;
  removeAriaLabel: string;
}

function QuestionChipsInput({
  options,
  onChange,
  placeholder,
  addMorePlaceholder,
  removeAriaLabel,
}: QuestionChipsInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addOption = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed || options.includes(trimmed)) return;
    onChange([...options, trimmed]);
    setInputValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addOption(inputValue);
    } else if (e.key === "Backspace" && !inputValue && options.length > 0) {
      onChange(options.slice(0, -1));
    }
  };

  return (
    <div className={styles.chipContainer}>
      {options.map((opt) => (
        <span key={opt} className={styles.chip}>
          {opt}
          <button
            type="button"
            className={styles.chipRemoveBtn}
            onClick={() => onChange(options.filter((o) => o !== opt))}
            aria-label={`${removeAriaLabel} ${opt}`}>
            &times;
          </button>
        </span>
      ))}
      <input
        className={styles.chipInput}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (inputValue.trim()) addOption(inputValue);
        }}
        placeholder={options.length === 0 ? placeholder : addMorePlaceholder}
      />
    </div>
  );
}

export default function EventForm({
  event,
  isEdit = false,
  backHref = "/activities/manage",
  onBackAction,
  dict,
  iconDict,
}: EventFormProps) {
  const router = useRouter();

  const initialSignupFields = event?.signupFields ?? [];

  const initStart = useMemo(() => {
    return event?.start ? new Date(event.start) : new Date();
  }, [event?.start]);

  const initEnd = useMemo(() => {
    return event?.end ? new Date(event.end) : new Date(Date.now() + 2 * 3600000);
  }, [event?.end]);

  const initDeadline = useMemo(() => {
    return event?.signupDeadline ? new Date(event.signupDeadline) : undefined;
  }, [event?.signupDeadline]);

  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [type, setType] = useState(event?.type || "Event");
  const [location, setLocation] = useState(
    Array.isArray(event?.location) ? event.location.join(", ") : event?.location || ""
  );
  const [isPublic, setIsPublic] = useState(event?.public !== false);
  const [allDay, setAllDay] = useState(Boolean(event?.allDay));

  const [startDate, setStartDate] = useState<Date | undefined>(initStart);
  const [startTime, setStartTime] = useState<string>(
    () => `${pad(initStart.getHours())}:${pad(initStart.getMinutes())}`
  );
  const [endDate, setEndDate] = useState<Date | undefined>(initEnd);
  const [endTime, setEndTime] = useState<string>(
    () => `${pad(initEnd.getHours())}:${pad(initEnd.getMinutes())}`
  );

  const [signupEnabled, setSignupEnabled] = useState(Boolean(event?.signupEnabled));
  const [signupDeadlineDate, setSignupDeadlineDate] = useState<Date | undefined>(initDeadline);
  const [signupDeadlineTime, setSignupDeadlineTime] = useState<string>(() =>
    initDeadline ? `${pad(initDeadline.getHours())}:${pad(initDeadline.getMinutes())}` : "23:59"
  );
  const [maxAttendees, setMaxAttendees] = useState(
    event?.maxAttendees ? String(event.maxAttendees) : ""
  );

  const [customIcon, setCustomIcon] = useState(event?.customIcon || "");
  const [signupFields, setSignupFields] = useState<SignupField[]>(initialSignupFields);

  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddQuestion = () => {
    const newField: SignupField = {
      id: `q_${Date.now()}`,
      label: "",
      type: "text",
      required: false,
    };
    setSignupFields((prev) => [...prev, newField]);
  };

  const handleUpdateQuestion = (index: number, updates: Partial<SignupField>) => {
    setSignupFields((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      return updated;
    });
  };

  const handleRemoveQuestion = (index: number) => {
    setSignupFields((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      Alert.error(dict.form.title_label);
      return;
    }

    if (!startDate) {
      Alert.error(dict.form.start_label);
      return;
    }

    const isoStart = allDay
      ? formatIsoDateTime(startDate)
      : formatIsoDateTime(startDate, startTime);
    const isoEnd = allDay
      ? formatIsoDateTimeEnd(endDate || startDate)
      : formatIsoDateTime(endDate || startDate, endTime);
    const isoDeadline = signupDeadlineDate
      ? formatIsoDateTime(signupDeadlineDate, signupDeadlineTime)
      : null;

    setIsSubmitting(true);
    const alertId = Alert.loading(dict.form.saving);

    try {
      await saveActivityAction({
        eventId: isEdit && event?.id ? event.id : undefined,
        title: title.trim(),
        description,
        type,
        location: location
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        start: isoStart,
        end: isoEnd,
        allDay,
        public: isPublic,
        signupEnabled,
        signupDeadline: signupEnabled ? isoDeadline : null,
        maxAttendees: signupEnabled && maxAttendees ? parseInt(maxAttendees, 10) : null,
        customIcon: customIcon || null,
        signupFields: signupFields.length > 0 ? signupFields : null,
      });

      Alert.success(dict.form.save);
      if (onBackAction) {
        onBackAction();
      } else {
        router.push(backHref);
        router.refresh();
      }
    } catch (err) {
      Alert.error(err instanceof Error ? err.message : "Erro ao guardar evento");
    } finally {
      Alert.dismiss(alertId);
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
          onClick={onBackAction ?? (() => router.push(backHref))}>
          <FaArrowLeft /> {dict.form.back}
        </Button>
        <ColorfulText
          as="h2"
          className={styles.title}
          text={isEdit ? dict.edit_event : dict.create_event}
          chunk={true}
        />
        <Button
          type="submit"
          variant="solid"
          color="primary"
          disabled={!title.trim() || isSubmitting}
          loading={isSubmitting}>
          {isEdit ? <FaSave /> : <FaPlus />}
          {isSubmitting ? dict.form.saving : isEdit ? dict.form.save : dict.create_event}
        </Button>
      </header>

      <div className={styles.grid}>
        <div className={styles.col}>
          <div className={styles.sectionTitleRow}>
            <div className={styles.sectionTitle}>
              {customIcon ? (
                <button
                  type="button"
                  className={styles.customIconTrigger}
                  onClick={() => setIsIconPickerOpen(true)}
                  title={dict.form.change_icon_label}
                  aria-label={dict.form.change_icon_label}>
                  {renderSelectedIcon(customIcon, 22)}
                </button>
              ) : (
                <FiEdit3 className={styles.sectionTitleIcon} />
              )}
              <span>{dict.form.section_general}</span>
            </div>

            {customIcon ? (
              <Button
                type="button"
                variant="ghost"
                color="danger"
                size="sm"
                onClick={() => setCustomIcon("")}
                title={dict.form.remove_icon}>
                {dict.form.remove_icon}
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                color="primary"
                size="sm"
                onClick={() => setIsIconPickerOpen(true)}
                title={dict.form.add_icon}>
                <FaPlus size={10} />
                {dict.form.add_icon}
              </Button>
            )}
          </div>

          <Field label={dict.form.title_label}>
            <Input
              id="title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder={dict.form.title_placeholder}
            />
          </Field>

          <Field label={dict.form.desc_label}>
            <Textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={dict.form.desc_placeholder}
              rows={4}
            />
          </Field>

          <Field label={dict.form.type_label}>
            <Select
              value={type}
              onChange={(val) => setType(val)}
              options={EVENT_TYPES.map((t) => ({ label: t, value: t }))}
            />
          </Field>

          <Field label={dict.form.location_label}>
            <Input
              id="location"
              name="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={dict.form.location_placeholder}
            />
          </Field>

          <div className={styles.toggleRow} onClick={() => setIsPublic(!isPublic)}>
            <ToggleSwitch
              checked={isPublic}
              onChange={setIsPublic}
              aria-label={dict.form.public_label}
            />
            <span className={styles.toggleLabel}>{dict.form.public_label}</span>
          </div>
        </div>

        <div className={styles.col}>
          <div className={styles.sectionTitle}>
            <FiClock className={styles.sectionTitleIcon} />
            <span>{dict.form.section_period}</span>
          </div>

          <div className={styles.dateGroup}>
            <div className={styles.toggleRow} onClick={() => setAllDay(!allDay)}>
              <ToggleSwitch
                checked={allDay}
                onChange={setAllDay}
                aria-label={dict.form.all_day_label}
              />
              <span className={styles.toggleLabel}>{dict.form.all_day_label}</span>
            </div>

            <Field label={dict.form.start_label}>
              <div className={styles.dateTimeRow}>
                <DateInput
                  value={startDate}
                  onChange={(d) => setStartDate(d)}
                  placeholder="dd/mm/aaaa"
                  mobileDrawerTitle={dict.form.start_label}
                  locale={pt}
                />
                {!allDay && (
                  <HourInput
                    value={startTime}
                    onChange={(t) => setStartTime(t)}
                    format="24h"
                    placeholder="HH:mm"
                  />
                )}
              </div>
            </Field>

            <Field label={dict.form.end_label}>
              <div className={styles.dateTimeRow}>
                <DateInput
                  value={endDate}
                  onChange={(d) => setEndDate(d)}
                  placeholder="dd/mm/aaaa"
                  mobileDrawerTitle={dict.form.end_label}
                  locale={pt}
                />
                {!allDay && (
                  <HourInput
                    value={endTime}
                    onChange={(t) => setEndTime(t)}
                    format="24h"
                    placeholder="HH:mm"
                  />
                )}
              </div>
            </Field>
          </div>

          <div className={styles.sectionTitle}>
            <FiCheckSquare className={styles.sectionTitleIcon} />
            <span>{dict.form.section_signups}</span>
          </div>

          <div className={styles.toggleRow} onClick={() => setSignupEnabled(!signupEnabled)}>
            <ToggleSwitch
              checked={signupEnabled}
              onChange={setSignupEnabled}
              aria-label={dict.form.signup_enabled_label}
            />
            <span className={styles.toggleLabel}>{dict.form.signup_enabled_label}</span>
          </div>

          {signupEnabled && (
            <>
              <Field label={dict.form.signup_deadline_label}>
                <div className={styles.dateTimeRow}>
                  <DateInput
                    value={signupDeadlineDate}
                    onChange={(d) => setSignupDeadlineDate(d)}
                    placeholder="dd/mm/aaaa"
                    mobileDrawerTitle={dict.form.signup_deadline_label}
                    locale={pt}
                  />
                  <HourInput
                    value={signupDeadlineTime}
                    onChange={(t) => setSignupDeadlineTime(t)}
                    format="24h"
                    placeholder="HH:mm"
                  />
                </div>
              </Field>

              <Field label={dict.form.max_attendees_label}>
                <Input
                  type="number"
                  min="1"
                  value={maxAttendees}
                  onChange={(e) => setMaxAttendees(e.target.value)}
                  placeholder={dict.form.max_attendees_placeholder}
                />
              </Field>
            </>
          )}

          <div className={styles.sectionTitle}>
            <FiHelpCircle className={styles.sectionTitleIcon} />
            <span>{dict.form.signup_fields_title}</span>
          </div>

          <div className={styles.customOptionsList}>
            {signupFields.map((field, idx) => (
              <div key={field.id} className={styles.customOptionRow}>
                <div className={styles.customOptionTop}>
                  <Field label={dict.form.field_label}>
                    <Input
                      placeholder={dict.form.field_label}
                      value={field.label}
                      onChange={(e) => handleUpdateQuestion(idx, { label: e.target.value })}
                    />
                  </Field>

                  <Field label={dict.form.field_type}>
                    <Select
                      value={field.type}
                      onChange={(val) =>
                        handleUpdateQuestion(idx, {
                          type: val as "text" | "select" | "checkbox",
                        })
                      }
                      options={[
                        { label: dict.form.type_text, value: "text" },
                        { label: dict.form.type_select, value: "select" },
                        { label: dict.form.type_checkbox, value: "checkbox" },
                      ]}
                    />
                  </Field>

                  <Button
                    type="button"
                    variant="ghost"
                    color="danger"
                    size="icon"
                    onClick={() => handleRemoveQuestion(idx)}
                    title={dict.form.remove_field}
                    aria-label={dict.form.remove_field}>
                    <FiTrash2 size={16} />
                  </Button>
                </div>

                {field.type === "select" && (
                  <Field label={dict.form.field_options}>
                    <QuestionChipsInput
                      options={field.options || []}
                      onChange={(newOpts) => handleUpdateQuestion(idx, { options: newOpts })}
                      placeholder={dict.form.chips_placeholder}
                      addMorePlaceholder={dict.form.chips_add_more}
                      removeAriaLabel={dict.form.chips_remove_aria}
                    />
                  </Field>
                )}

                <div className={styles.customOptionBottom}>
                  <div
                    className={styles.toggleRow}
                    onClick={() =>
                      handleUpdateQuestion(idx, {
                        required: !field.required,
                      })
                    }>
                    <ToggleSwitch
                      size="sm"
                      checked={Boolean(field.required)}
                      onChange={(checked) => handleUpdateQuestion(idx, { required: checked })}
                      aria-label={dict.form.field_required}
                    />
                    <span className={styles.toggleLabel}>{dict.form.field_required}</span>
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              color="primary"
              size="md"
              className={styles.addOptionBtn}
              onClick={handleAddQuestion}>
              <FaPlus size={14} />
              <span>{dict.form.add_field.replace(/^\+\s*/, "")}</span>
            </Button>
          </div>
        </div>
      </div>

      {isIconPickerOpen && (
        <IconPicker
          value={customIcon || null}
          onChange={(iconName) => {
            setCustomIcon(iconName);
            setIsIconPickerOpen(false);
          }}
          onClose={() => setIsIconPickerOpen(false)}
          dict={iconDict}
        />
      )}
    </form>
  );
}

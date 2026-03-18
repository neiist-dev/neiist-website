import React, { useState, KeyboardEvent, FocusEvent, useRef } from "react";
import styles from "@/styles/components/TagInput.module.css";
import ColourPicker from "./ColourPicker";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  isColor?: boolean;
}

export default function TagInput({ value, onChange, placeholder, isColor = false }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(inputValue);
      setShowPicker(false);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const handleContainerBlur = (e: FocusEvent<HTMLDivElement>) => {
    // Check if the new focus target is still within our component (e.g. the color picker)
    if (e.relatedTarget && containerRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }
    // If focus left the component entirely, add the current input as a tag
    if (inputValue) {
      addTag(inputValue);
    }
    setShowPicker(false);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className={styles.container} ref={containerRef} onBlur={handleContainerBlur}>
      {value.map((tag) => (
        <span key={tag} className={styles.tag}>
          {isColor && <span className={styles.colorDot} style={{ backgroundColor: tag }} />}
          {tag}
          <button type="button" className={styles.removeButton} onClick={() => removeTag(tag)}>
            &times;
          </button>
        </span>
      ))}
      <div className={styles.inputWrapper}>
        <input
          className={styles.input}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => isColor && setShowPicker(true)}
          onClick={() => isColor && setShowPicker(true)}
          placeholder={value.length === 0 ? placeholder : ""}
        />
      </div>
      {isColor && showPicker && (
        <div
          className={styles.pickerPopover}
          onMouseDown={(e) => {
            if ((e.target as HTMLElement).tagName !== "INPUT") {
              e.preventDefault();
            }
          }}>
          <div className={styles.pickerOverlay}>
            <ColourPicker value={inputValue} onChange={(hex) => setInputValue(hex)} />
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
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
      setActiveIndex(null);
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
    setActiveIndex(null);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
    setActiveIndex(null);
  };

  const handleColorChange = (hex: string) => {
    if (activeIndex === -1) {
      setInputValue(hex);
    } else if (activeIndex !== null) {
      const newValue = [...value];
      newValue[activeIndex] = hex;
      onChange(newValue);
    }
  };

  const handleDotClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className={styles.container} ref={containerRef} onBlur={handleContainerBlur}>
      {value.map((tag, index) => (
        <span key={index} className={styles.tag}>
          {isColor && (
            <button
              type="button"
              className={styles.colorDot}
              style={{ backgroundColor: tag }}
              onClick={(e) => handleDotClick(e, index)}
            />
          )}
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
          onFocus={() => isColor && activeIndex !== -1 && setActiveIndex(-1)}
          onClick={(e) => {
            if (isColor) {
              e.stopPropagation();
              if (activeIndex !== -1) setActiveIndex(-1);
            }
          }}
          placeholder={value.length === 0 ? placeholder : ""}
        />
      </div>
      {isColor && activeIndex !== null && (
        <div
          className={styles.pickerPopover}
          onMouseDown={(e) => {
            if ((e.target as HTMLElement).tagName !== "INPUT") {
              e.preventDefault();
            }
          }}>
          <div className={styles.pickerOverlay}>
            <ColourPicker
              key={activeIndex}
              value={
                activeIndex === -1
                  ? inputValue
                  : activeIndex !== null && value[activeIndex]
                    ? value[activeIndex]
                    : ""
              }
              onChange={handleColorChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}

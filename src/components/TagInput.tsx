import React, { useState, KeyboardEvent, FocusEvent, useRef } from "react";
import styles from "@/styles/components/TagInput.module.css";
import ColourPicker from "./ColourPicker";

// Define the type to support both simple strings and objects with color
export type TagValue = string | { name: string; color: string };

interface TagInputProps {
  value: TagValue[];
  onChange: (tags: TagValue[]) => void;
  placeholder?: string;
  isColor?: boolean;
}

export default function TagInput({ value, onChange, placeholder, isColor = false }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Helpers to handle both value types
  const getTagText = (tag: TagValue) => (typeof tag === "string" ? tag : tag.name);
  const getTagColor = (tag: TagValue) => (typeof tag === "string" ? tag : tag.color);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    // Check duplicates by name
    const exists = value.some((v) => getTagText(v).toLowerCase() === trimmed.toLowerCase());

    if (trimmed && !exists) {
      if (isColor) {
        // Create an object with default black color
        onChange([...value, { name: trimmed, color: "#000000" }]);
      } else {
        onChange([...value, trimmed]);
      }
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

  const removeTag = (tagToRemove: TagValue) => {
    onChange(value.filter((tag) => getTagText(tag) !== getTagText(tagToRemove)));
    setActiveIndex(null);
  };

  const handleColorChange = (hex: string) => {
    if (activeIndex !== null && activeIndex !== -1) {
      const newValue = [...value];
      const currentTag = newValue[activeIndex];
      
      if (typeof currentTag === "object") {
        newValue[activeIndex] = { ...currentTag, color: hex };
      } else {
        // Fallback for old strings
        newValue[activeIndex] = hex;
      }
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
              style={{ backgroundColor: getTagColor(tag) }}
              onClick={(e) => handleDotClick(e, index)}
            />
          )}
          {getTagText(tag)}
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
          // Removed Focus/Click events that opened ColourPicker on input
          placeholder={value.length === 0 ? placeholder : ""}
        />
      </div>
      {/* The Picker only appears if we are editing an existing tag, not the input */}
      {isColor && activeIndex !== null && activeIndex !== -1 && (
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
              value={getTagColor(value[activeIndex])}
              onChange={handleColorChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}

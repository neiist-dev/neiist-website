import { useState, KeyboardEvent, FocusEvent, useRef } from "react";
import styles from "@/styles/components/shop/VariantOptionsEditor.module.css";
import ColourPicker from "@/components/ColourPicker";

export type variantValue = string | { name: string; color: string };

interface VariantOptionsEditorProps {
  value: variantValue[];
  onChange: (_tags: variantValue[]) => void;
  placeholder?: string;
  isColor?: boolean;
}

export default function VariantOptionsEditor({
  value,
  onChange,
  placeholder,
  isColor = false,
}: VariantOptionsEditorProps) {
  const [inputValue, setInputValue] = useState("");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getTagText = (tag: variantValue) => (typeof tag === "string" ? tag : tag.name);
  const getTagColor = (tag: variantValue) => (typeof tag === "string" ? tag : tag.color);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || value.some((v) => getTagText(v).toLowerCase() === trimmed.toLowerCase()))
      return;
    onChange([...value, isColor ? { name: trimmed, color: "#000000" } : trimmed]);
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
    if (e.relatedTarget && containerRef.current?.contains(e.relatedTarget as Node)) return;
    if (inputValue) addTag(inputValue);
    setActiveIndex(null);
  };

  const handleColorChange = (hex: string) => {
    if (activeIndex !== null) {
      const newValue = [...value];
      const current = newValue[activeIndex];
      newValue[activeIndex] = typeof current === "object" ? { ...current, color: hex } : hex;
      onChange(newValue);
    }
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
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex(activeIndex === index ? null : index);
              }}
            />
          )}
          {getTagText(tag)}
          <button
            type="button"
            className={styles.removeButton}
            onClick={() => {
              onChange(value.filter((_, i) => i !== index));
              setActiveIndex(null);
            }}>
            &times;
          </button>
        </span>
      ))}
      <input
        className={styles.input}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : ""}
      />
      {isColor && activeIndex !== null && (
        <div
          className={styles.pickerPopover}
          onMouseDown={(e) => {
            if ((e.target as HTMLElement).tagName !== "INPUT") e.preventDefault();
          }}>
          <ColourPicker
            key={activeIndex}
            value={getTagColor(value[activeIndex])}
            onChange={handleColorChange}
          />
        </div>
      )}
    </div>
  );
}

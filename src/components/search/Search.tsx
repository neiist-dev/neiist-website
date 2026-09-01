"use client";

import { InputHTMLAttributes } from "react";

export interface SearchProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value"
> {
  ref?: React.Ref<HTMLInputElement>;
  value?: string;
  onChange?: (_value: string) => void;
}

export default function Search({
  ref,
  value,
  onChange,
  className,
  placeholder = "Pesquisar...",
  disabled = false,
  ...rest
}: SearchProps) {
  return (
    <input
      ref={ref}
      type="text"
      className={className}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      autoComplete="off"
      spellCheck={false}
      {...rest}
    />
  );
}

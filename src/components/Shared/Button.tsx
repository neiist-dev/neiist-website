"use client";
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
}

export default function Button({ children, onClick, variant = "primary", className = "", ...props }: ButtonProps) {
  const baseStyles: React.CSSProperties = {
    padding: "10px 18px",
    borderRadius: 9999,
    fontWeight: 600,
    transition: "all 0.15s",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: { background: "#2563eb", color: "#fff", boxShadow: "0 6px 18px rgba(37,99,235,0.12)" },
    secondary: { background: "#f3f4f6", color: "#111827" },
    outline: { background: "transparent", color: "#111827", border: "1px solid #e5e7eb" },
  };

  const style = { ...baseStyles, ...(variants[variant] ?? {} as React.CSSProperties) };

  return (
    <button onClick={onClick} style={style} className={className} {...props}>
      {children}
    </button>
  );
}

import { NextResponse } from "next/server";

export type ValidationResult<T> = [data: T, error: null] | [data: null, error: NextResponse];

/**
 * Validates and parses an ID as a positive integer
 */
export function validateId(value: unknown, paramName = "ID"): ValidationResult<number> {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0)
    return [null, NextResponse.json({ error: `Invalid ${paramName}` }, { status: 400 })];

  return [num, null];
}

/**
 * Validates and normalizes an IST ID URL param
 */
export function validateIstId(value: unknown, paramName = "istid"): ValidationResult<string> {
  if (typeof value !== "string" || value.trim().length === 0)
    return [null, NextResponse.json({ error: `Missing ${paramName}` }, { status: 400 })];

  const trimmed = value.trim().toLowerCase();
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed))
    return [null, NextResponse.json({ error: `Invalid ${paramName}` }, { status: 400 })];

  return [trimmed, null];
}

/**
 * Validates standard email address format.
 */
export function isValidEmail(email: string): boolean {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Validates phone number format.
 */
export function isValidPhone(phone: string): boolean {
  return typeof phone === "string" && /^[+]?[1-9]\d{0,15}$/.test(phone.replace(/[\s\-()]/g, ""));
}

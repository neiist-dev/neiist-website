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
 * Validates an IST ID, returning the normalized IST ID if valid, or false if invalid.
 */
export function isValidIstId(istid: string) {
    const trimmedIstId = istid.trim().toLowerCase();
    const istIdPattern = /^ist\d+$/i;
    if (istIdPattern.test(trimmedIstId)) return trimmedIstId;
    return false;
}

/**
 * Validates and normalizes an IST ID URL param
 */
export function validateIstId(value: unknown, paramName = "istid"): ValidationResult<string> {
  if (typeof value !== "string" || value.trim().length === 0)
    return [null, NextResponse.json({ error: `Missing ${paramName}` }, { status: 400 })];

  const validIstId = isValidIstId(value);
  if (!validIstId)
    return [null, NextResponse.json({ error: `Invalid ${paramName}` }, { status: 400 })];

  return [validIstId, null];
}

/**
 * Validates standard email address format.
 * Automatically trims whitespace and returns the normalized email if valid, or false if invalid.
 */
export function isValidEmail(email: string | null): string | false {
  if (!email) return false;
  const trimmedEmail = email.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailPattern.test(trimmedEmail)) return trimmedEmail;
    return false;
}

/**
 * Validates phone number format.
 */
export function isValidPhone(phone: string): boolean {
  return typeof phone === "string" && /^[+]?[1-9]\d{0,15}$/.test(phone.replace(/[\s\-()]/g, ""));
}

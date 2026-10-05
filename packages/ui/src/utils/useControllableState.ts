"use client";

import { useState, useCallback } from "react";

export interface UseControllableStateParams<T> {
  prop?: T;
  defaultProp?: T;
  onChange?: (_state: T) => void;
}

/**
 * Safely manage state that can be either controlled by a parent component
 * or uncontrolled and managed internally.
 */
export function useControllableState<T>({
  prop,
  defaultProp,
  onChange,
}: UseControllableStateParams<T>) {
  const [uncontrolledProp, setUncontrolledProp] = useState<T | undefined>(defaultProp);
  const isControlled = prop !== undefined;
  const value = isControlled ? prop : uncontrolledProp;

  const setValue = useCallback(
    (nextValue: T | ((_prev: T | undefined) => T)) => {
      if (isControlled) {
        const setter = nextValue as (_prev: T | undefined) => T;
        const value = typeof nextValue === "function" ? setter(prop) : nextValue;
        if (value !== prop) onChange?.(value);
      } else {
        setUncontrolledProp(nextValue);
        const setter = nextValue as (_prev: T | undefined) => T;
        const value = typeof nextValue === "function" ? setter(uncontrolledProp) : nextValue;
        if (value !== uncontrolledProp) onChange?.(value);
      }
    },
    [isControlled, prop, uncontrolledProp, onChange]
  );

  return [value, setValue] as const;
}

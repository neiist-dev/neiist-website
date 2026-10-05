"use client";

import React, { useCallback } from "react";

export type ReactRef<T> = React.Ref<T> | undefined;

/**
 * Merges an array of React refs into a single ref callback.
 * This allows multiple components or hooks to hold a reference to the same DOM node.
 */
export function useMergedRef<T>(...refs: ReactRef<T>[]) {
  return useCallback(
    (value: T | null) => {
      refs.forEach((ref) => {
        if (typeof ref === "function") {
          ref(value);
        } else if (ref && typeof ref === "object" && "current" in ref) {
          (ref as React.MutableRefObject<T | null>).current = value;
        }
      });
    },
    // eslint-disable-next-line @eslint-react/exhaustive-deps
    refs
  );
}

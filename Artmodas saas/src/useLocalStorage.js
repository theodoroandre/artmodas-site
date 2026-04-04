import { useState, useEffect } from "react";

export function useLocalStorage(key, fallback) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch { /* quota exceeded — silently ignore */ }
  }, [key, value]);

  return [value, setValue];
}

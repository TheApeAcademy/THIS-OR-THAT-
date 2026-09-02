// Shared haptic helper so every component fires vibration through one
// try/catch'd entry point instead of re-implementing the same guard.
export function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // unsupported - ignore
  }
}

export const HAPTIC = {
  tap: 8,
  toggle: 12,
  confirm: 14,
  success: [12, 40, 12],
  notify: 20,
} as const;

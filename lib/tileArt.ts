// Deterministic on-brand placeholder art for comparison options that don't
// have an uploaded image — a colored gradient + the option's initial, so
// every card feels visual without depending on licensed photography.

const GRADIENTS = [
  ["#0066ff", "#38bdf8"],
  ["#1d4ed8", "#0ea5e9"],
  ["#0891b2", "#22d3ee"],
  ["#4338ca", "#3b82f6"],
  ["#0369a1", "#2563eb"],
  ["#2563eb", "#7dd3fc"],
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function gradientForLabel(label: string): string {
  const [from, to] = GRADIENTS[hashString(label) % GRADIENTS.length];
  return `linear-gradient(150deg, ${from} 0%, ${to} 100%)`;
}

export function letterForLabel(label: string): string {
  const trimmed = label.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

// Deterministic on-brand placeholder art for comparison options that don't
// have an uploaded image — a colored gradient + the option's initial, so
// every card feels visual without depending on licensed photography.

const GRADIENTS = [
  ["#0066ff", "#38bdf8"],
  ["#7c3aed", "#c026d3"],
  ["#db2777", "#f472b6"],
  ["#d97706", "#f59e0b"],
  ["#059669", "#34d399"],
  ["#dc2626", "#f87171"],
  ["#4338ca", "#818cf8"],
  ["#0891b2", "#22d3ee"],
  ["#65a30d", "#a3e635"],
  ["#c026d3", "#e879f9"],
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

const LEADING_ARTICLES = /^(a|an|the)\s+/i;

export function letterForLabel(label: string): string {
  const trimmed = label.trim().replace(LEADING_ARTICLES, "");
  const source = trimmed || label.trim();
  return source ? source.charAt(0).toUpperCase() : "?";
}

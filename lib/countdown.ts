// Short "time left" label for a time-boxed poll's deadline, e.g. "3h left",
// "45m left". Returns null once the deadline has passed (the caller decides
// what to show instead, e.g. nothing / "Poll closed").
export function formatTimeLeft(expiresAt: string): string | null {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return null;

  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "<1m left";
  if (minutes < 60) return `${minutes}m left`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h left`;

  const days = Math.round(hours / 24);
  return `${days}d left`;
}

export function isExpired(expiresAt: string | null): boolean {
  return !!expiresAt && new Date(expiresAt).getTime() <= Date.now();
}

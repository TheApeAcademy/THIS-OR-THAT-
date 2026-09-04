/** Turns a raw User-Agent string into a short human label, e.g. "Chrome on macOS". */
export function deviceLabelFromUserAgent(userAgent: string | null | undefined): string {
  if (!userAgent) return "Unknown device";

  const ua = userAgent;
  let browser = "Browser";
  if (/edg\//i.test(ua)) browser = "Edge";
  else if (/chrome|crios/i.test(ua)) browser = "Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua)) browser = "Safari";

  let os = "device";
  if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/mac os x/i.test(ua)) os = "macOS";
  else if (/windows/i.test(ua)) os = "Windows";
  else if (/linux/i.test(ua)) os = "Linux";

  return `${browser} on ${os}`;
}

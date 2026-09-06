// Shared functional/status icon set - 24x24 viewBox, currentColor stroke,
// matching the conventions already established in SocialIcons.tsx and
// BottomTabBar.tsx. These replace emoji used as *functional* UI (mode
// switches, win/lose feedback, streaks, medals, like glyphs) - not the
// data-driven topic/category emoji, which stay as-is.

interface IconProps {
  size?: number;
  className?: string;
}

function Svg({ size = 24, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}

export function BrainIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path
        d="M9.5 4.5a2.5 2.5 0 0 0-2.5 2.5v.2A3 3 0 0 0 5 10a3 3 0 0 0 1 5.6V16a3 3 0 0 0 3 3 2.5 2.5 0 0 0 2.5-2.5v-9A2.5 2.5 0 0 0 9.5 4.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.5 4.5A2.5 2.5 0 0 1 17 7v.2A3 3 0 0 1 19 10a3 3 0 0 1-1 5.6V16a3 3 0 0 1-3 3 2.5 2.5 0 0 1-2.5-2.5v-9A2.5 2.5 0 0 1 14.5 4.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ShuffleIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path
        d="M3 6h3.5c1.4 0 2.7.7 3.5 1.9l5 7.2c.8 1.2 2.1 1.9 3.5 1.9H21M3 18h3.5c1.4 0 2.7-.7 3.5-1.9l.7-1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 3l3 3-3 3M18 15l3 3-3 3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M11.3 8.9 12.5 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </Svg>
  );
}

export function TrophyIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path
        d="M7 4h10v4a5 5 0 0 1-10 0V4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M7 5H4.5A1.5 1.5 0 0 0 3 6.5v.5A3 3 0 0 0 6 10M17 5h2.5A1.5 1.5 0 0 1 21 6.5v.5A3 3 0 0 1 18 10"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 13v3M9 20h6M10 20v-2.5a2 2 0 0 1 4 0V20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </Svg>
  );
}

export function CheckIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path d="M5 13l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CloseIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

export function FlameIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path
        d="M12 21c-3.6 0-6.5-2.6-6.5-6.2 0-2.6 1.4-4.3 2.6-6 .3 1.3 1 2.1 1.9 2.1.2-2.7 1.3-4.9 3.3-6.4.3 1.8 1 2.9 2.2 4.2 1.4 1.5 2.5 3.1 2.5 6.1 0 3.6-2.4 6.2-6 6.2Z"
        fill="currentColor"
      />
    </Svg>
  );
}

export function SparkleIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path
        d="M12 3c.4 3.4 1.2 5.2 3 6.5 1.8 1.3 3.6 1.7 6 1.5-3.4.4-5.2 1.2-6.5 3-1.3 1.8-1.7 3.6-1.5 6-.4-3.4-1.2-5.2-3-6.5-1.8-1.3-3.6-1.7-6-1.5 3.4-.4 5.2-1.2 6.5-3 1.3-1.8 1.7-3.6 1.5-6Z"
        fill="currentColor"
      />
    </Svg>
  );
}

export function LightbulbIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path
        d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.9v.2h5v-.2c0-.8.4-1.5 1-1.9A6 6 0 0 0 12 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function MailIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path
        d="M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="m3.5 7 8.5 6 8.5-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function LockIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 11V7.5a4 4 0 0 1 8 0V11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </Svg>
  );
}

export function UserIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </Svg>
  );
}

export function UsersIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3 20a6 6 0 0 1 12 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M15 8.5a3 3 0 1 1 3.4 2.97M17 14a5.5 5.5 0 0 1 4 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </Svg>
  );
}

export function ChevronRightIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronLeftIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path d="m15 5-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function BellIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path
        d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M9.5 18.5a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function CameraIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path
        d="M4 8a2 2 0 0 1 2-2h1.2a1 1 0 0 0 .87-.5l.66-1.14A1 1 0 0 1 9.6 4h4.8a1 1 0 0 1 .87.5l.66 1.14a1 1 0 0 0 .87.5H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="3.2" stroke="currentColor" strokeWidth="2" />
    </Svg>
  );
}

export function EyeIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path
        d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
    </Svg>
  );
}

export function IdCardIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <rect x="2.5" y="5" width="19" height="14" rx="2.2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="8" cy="12" r="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M13.5 10h5M13.5 14h3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </Svg>
  );
}

export function ShieldIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path
        d="M12 3.5 5 6v6c0 4.6 3 8 7 8.5 4-.5 7-3.9 7-8.5V6l-7-2.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="m9 12 2 2 4-4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function SunMoonIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6M18.4 18.4l-1.6-1.6M7.2 7.2 5.6 5.6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function AlertIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path
        d="M12 3.5 2 20.5h20L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M12 10v4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="12" cy="17.3" r="1" fill="currentColor" />
    </Svg>
  );
}

export function ScaleIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path d="M12 3v16M8 20h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path
        d="M12 6 5 7.5m0 0L3 12a3 3 0 0 0 4 2.6A3 3 0 0 0 9 12L5 7.5ZM12 6l7 1.5m0 0L21 12a3 3 0 0 1-4 2.6 3 3 0 0 1-2-2.6l4-4.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function HeartIcon({ size, className, filled }: IconProps & { filled?: boolean }) {
  return (
    <svg width={size ?? 24} height={size ?? 24} viewBox="0 0 24 24" fill={filled ? "var(--danger)" : "none"} className={className}>
      <path
        d="M12 20.5s-7.5-4.6-9.8-9.1C.6 7.9 2.4 4.5 5.9 4c2-.3 3.9.7 6.1 3 2.2-2.3 4.1-3.3 6.1-3 3.5.5 5.3 3.9 3.7 7.4-2.3 4.5-9.8 9.1-9.8 9.1Z"
        stroke={filled ? "var(--danger)" : "currentColor"}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Consolidated from a FeedSlide-local one-off set so every feed action icon
// shares the same Svg wrapper/viewBox as the rest of this file.
export function CommentIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path
        d="M21 12a8 8 0 1 1-3.5-6.6L21 4l-1 4.3A7.96 7.96 0 0 1 21 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SaveIcon({ size, className, filled }: IconProps & { filled?: boolean }) {
  return (
    <svg width={size ?? 24} height={size ?? 24} viewBox="0 0 24 24" fill={filled ? "var(--accent)" : "none"} className={className}>
      <path
        d="M6 4h12v16l-6-4-6 4V4Z"
        stroke={filled ? "var(--accent)" : "currentColor"}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ShareIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path
        d="M12 15V3m0 0L7 8m5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PlusIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </Svg>
  );
}

export function SendIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path
        d="M4 12 20 4l-6 16-2.5-7L4 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function MoreIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </Svg>
  );
}

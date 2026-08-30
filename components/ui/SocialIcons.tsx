import type { SocialLinks } from "@/lib/actions/profile";

type IconProps = { size?: number };

function Icon({ size = 16, children }: { size?: number; children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {children}
    </svg>
  );
}

const InstagramIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
  </Icon>
);

const TikTokIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <path
      d="M14 3v10.8a3.2 3.2 0 1 1-2.6-3.14"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 3c.4 2.4 2.1 4.1 4.5 4.4"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

const TwitterIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <path d="M4.5 4.5l15 15M19.5 4.5l-15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </Icon>
);

const SnapchatIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <path
      d="M12 3.5c2.6 0 4.3 1.9 4.3 4.6 0 1.4-.1 2.4.2 3.1.3.6 1.2.9 2 1-.1.7-1 1.2-1.9 1.5.1.5.2 1.1-.2 1.4-.5.4-1.5.2-2.1.5-.6.3-1 1.4-2.3 1.4s-1.7-1.1-2.3-1.4c-.6-.3-1.6-.1-2.1-.5-.4-.3-.3-.9-.2-1.4-.9-.3-1.8-.8-1.9-1.5.8-.1 1.7-.4 2-1 .3-.7.2-1.7.2-3.1 0-2.7 1.7-4.6 4.3-4.6Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </Icon>
);

const YoutubeIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <rect x="2.5" y="6" width="19" height="12" rx="4" stroke="currentColor" strokeWidth="1.8" />
    <path d="M10.5 9.5l5 2.5-5 2.5v-5Z" fill="currentColor" />
  </Icon>
);

const TwitchIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <path d="M5 3h15v10.5L16 17.5h-3.5L10 20h-2v-2.5H5V3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M14 7.5v4M9.5 7.5v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </Icon>
);

const DiscordIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <path
      d="M6 6.5C8 5.4 10 5 12 5s4 .4 6 1.5c1.3 2 2 4.6 2 8-1.6 1.3-3.4 2-5 2.3l-.7-1.4"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18 6.5C16 5.4 14 5 12 5s-4 .4-6 1.5c-1.3 2-2 4.6-2 8 1.6 1.3 3.4 2 5 2.3l.7-1.4"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="9" cy="13" r="1.3" fill="currentColor" />
    <circle cx="15" cy="13" r="1.3" fill="currentColor" />
  </Icon>
);

const ThreadsIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <path
      d="M12 3.5c4 0 6.5 2.6 6.5 8s-2.4 9-6.6 9c-3.4 0-5.7-1.7-5.7-4.4 0-2.5 2.1-4 5.4-4 1.4 0 2.6.2 3.5.6"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path d="M14.3 9.8c0-1.4-1-2.3-2.6-2.3-1.5 0-2.5.8-2.7 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </Icon>
);

const LinkedinIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="8" cy="8.2" r="1.1" fill="currentColor" />
    <path d="M8 11v6M12 11v6M12 13.5c0-1.4 1-2.5 2.5-2.5S17 12.1 17 13.5V17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </Icon>
);

const SpotifyIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
    <path d="M7 10c3.2-1 6.8-.6 9.6 1M7.5 13c2.6-.7 5.5-.4 7.8.9M8 16c2-.5 4.3-.3 6 .8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </Icon>
);

const GithubIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <path
      d="M12 3.5c-4.7 0-8.5 3.8-8.5 8.5 0 3.8 2.4 6.9 5.8 8 .4.1.6-.2.6-.4v-1.6c-2.4.5-2.9-1.1-2.9-1.1-.4-1-1-1.2-1-1.2-.8-.6.1-.5.1-.5.9.1 1.4 1 1.4 1 .8 1.4 2.2 1 2.7.7.1-.6.3-1 .6-1.2-1.9-.2-4-1-4-4.3 0-1 .3-1.7.9-2.3-.1-.2-.4-1.1.1-2.3 0 0 .7-.2 2.4.9.7-.2 1.4-.3 2.2-.3.7 0 1.5.1 2.2.3 1.7-1.1 2.4-.9 2.4-.9.5 1.2.2 2.1.1 2.3.6.6.9 1.4.9 2.3 0 3.3-2.1 4-4 4.3.3.3.6.8.6 1.6v2.4c0 .2.2.5.6.4 3.4-1.1 5.8-4.2 5.8-8 0-4.7-3.8-8.5-8.5-8.5Z"
      fill="currentColor"
    />
  </Icon>
);

const PinterestIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M9.5 18c.6-1.8 1.5-5.3 1.5-5.3M12 12.5a2.3 2.3 0 1 0 0-4.6c-2 0-3.2 1.4-3.2 3 0 1 .4 1.6.9 2"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

const DuolingoIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <ellipse cx="12" cy="12.5" rx="7" ry="6.2" stroke="currentColor" strokeWidth="1.7" />
    <path d="M9 4c-1.5 0-2.6 1-2.6 2.4M15 4c1.5 0 2.6 1 2.6 2.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <circle cx="9.5" cy="11.5" r="1" fill="currentColor" />
    <circle cx="14.5" cy="11.5" r="1" fill="currentColor" />
    <path d="M9.5 15c.7.6 1.6.9 2.5.9s1.8-.3 2.5-.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </Icon>
);

const WebsiteIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <path
      d="M9 15l6-6M10 8.5l1-1a3 3 0 1 1 4.2 4.2l-1 1M14 15.5l-1 1a3 3 0 1 1-4.2-4.2l1-1"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const SOCIAL_PLATFORMS: {
  key: keyof SocialLinks;
  label: string;
  icon: (props: IconProps) => React.ReactNode;
}[] = [
  { key: "instagram", label: "Instagram", icon: InstagramIcon },
  { key: "tiktok", label: "TikTok", icon: TikTokIcon },
  { key: "twitter", label: "X / Twitter", icon: TwitterIcon },
  { key: "snapchat", label: "Snapchat", icon: SnapchatIcon },
  { key: "youtube", label: "YouTube", icon: YoutubeIcon },
  { key: "twitch", label: "Twitch", icon: TwitchIcon },
  { key: "discord", label: "Discord", icon: DiscordIcon },
  { key: "threads", label: "Threads", icon: ThreadsIcon },
  { key: "linkedin", label: "LinkedIn", icon: LinkedinIcon },
  { key: "spotify", label: "Spotify", icon: SpotifyIcon },
  { key: "github", label: "GitHub", icon: GithubIcon },
  { key: "pinterest", label: "Pinterest", icon: PinterestIcon },
  { key: "duolingo", label: "Duolingo", icon: DuolingoIcon },
  { key: "website", label: "Website", icon: WebsiteIcon },
];

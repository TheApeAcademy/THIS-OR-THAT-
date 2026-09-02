import { clsx } from "clsx";
import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
}

export function Avatar({ src, name, size = 40, className }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  if (src && (src.startsWith("data:") || src.startsWith("blob:"))) {
    // Generated (e.g. avatar-builder) images are data URIs, and an
    // in-progress upload's local preview is a blob URI - next/image's
    // optimizer doesn't handle either, so render them directly.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className={clsx("rounded-full object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        className={clsx("rounded-full object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={clsx(
        "accent-gradient flex items-center justify-center rounded-full font-semibold text-accent-contrast",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initial}
    </div>
  );
}

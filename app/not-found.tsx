import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div
      className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-3 px-8 text-center"
      style={{ paddingTop: "var(--safe-top)", paddingBottom: "var(--safe-bottom)" }}
    >
      <p className="text-2xl font-bold text-text-primary">Page not found</p>
      <p className="text-sm text-text-secondary">
        This page doesn&rsquo;t exist, or the link might be broken.
      </p>
      <Link href="/home" className="mt-2">
        <Button>Back to Home</Button>
      </Link>
    </div>
  );
}

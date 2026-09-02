import Image from "next/image";

// A hard page load re-mounts the root layout, but client-side <Link>
// navigation doesn't - so this only ever appears once per real "launch,"
// with no JS/session-storage bookkeeping needed. The hold-then-fade timing
// lives entirely in the `splash-screen` CSS animation (see globals.css).
export function SplashScreen() {
  return (
    <div
      aria-hidden="true"
      className="splash-screen fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5"
      style={{
        background: "linear-gradient(160deg, var(--background) 0%, var(--surface) 100%)",
      }}
    >
      <div className="overflow-hidden rounded-[26%]" style={{ boxShadow: "0 12px 40px -8px var(--accent)" }}>
        <Image src="/icons/icon-512.png" alt="" width={104} height={104} priority />
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-2xl font-extrabold tracking-tight text-text-primary">THIS OR THAT</p>
        <p className="text-sm text-text-secondary">Every choice tells a story.</p>
      </div>
    </div>
  );
}

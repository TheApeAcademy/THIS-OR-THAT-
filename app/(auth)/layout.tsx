import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-[100dvh] flex-col justify-center bg-background px-6"
      style={{ paddingTop: "var(--safe-top)", paddingBottom: "var(--safe-bottom)" }}
    >
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div
            className="overflow-hidden rounded-[26%]"
            style={{ boxShadow: "0 8px 28px -6px var(--accent)" }}
          >
            <Image src="/icons/icon-512.png" alt="This or That" width={64} height={64} priority />
          </div>
          <p className="text-2xl font-extrabold tracking-tight text-text-primary">THIS OR THAT</p>
        </div>
        {children}
      </div>
    </div>
  );
}

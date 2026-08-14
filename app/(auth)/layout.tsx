export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-[100dvh] flex-col justify-center bg-background px-6"
      style={{ paddingTop: "var(--safe-top)", paddingBottom: "var(--safe-bottom)" }}
    >
      <div className="mx-auto w-full max-w-sm">
        <p className="mb-8 text-center text-3xl font-bold text-text-primary">This or That</p>
        {children}
      </div>
    </div>
  );
}

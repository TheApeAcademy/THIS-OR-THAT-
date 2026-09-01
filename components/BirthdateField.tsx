"use client";

export function BirthdateField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div>
      <p className="pt-1 text-sm font-semibold text-text-secondary">Birthdate</p>
      <p className="text-xs text-text-secondary">Used to show your zodiac sign on your card. Never shown as a raw date.</p>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        max={new Date().toISOString().slice(0, 10)}
        className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
      />
    </div>
  );
}

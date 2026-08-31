import type { InputHTMLAttributes, ReactNode } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: ReactNode;
}

export function FormField({ label, icon, id, name, ...props }: FormFieldProps) {
  const inputId = id ?? name;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-xs font-medium text-text-secondary">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
          {icon}
        </span>
        <input
          id={inputId}
          name={name}
          className="w-full rounded-lg border border-border bg-surface py-3 pl-11 pr-4 text-text-primary outline-none focus:border-accent"
          {...props}
        />
      </div>
    </div>
  );
}

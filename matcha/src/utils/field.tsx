import React, { InputHTMLAttributes, ReactNode } from "react";

type FieldProps = {
  label: string;
  icon?: ReactNode;
  hint?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export default function Field({ label, icon, hint, ...props }: FieldProps) {
  return (
    <fieldset className="fieldset w-full">
      <legend className="fieldset-legend text-sm font-semibold text-neutral pb-1">
        {label}
      </legend>
      <label
        className="
        relative
        input validator
        flex items-center gap-2
        px-3 py-2
        bg-white
        transition-all duration-150
        w-full
        "
      >
        {icon && <span>{icon}</span>}
        <input className="text-base" {...props} />
      </label>
      <p className="text-xs text-gray-400 min-h-[1.1em]">{hint}</p>
    </fieldset>
  );
}

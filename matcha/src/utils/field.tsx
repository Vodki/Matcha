import React, { InputHTMLAttributes, ReactNode } from "react";

type FieldProps = {
  label: string;
  icon?: ReactNode;
  hint?: string;
  error: string;
  isValid?: boolean;
} & InputHTMLAttributes<HTMLInputElement>;

export default function Field({
  label,
  icon,
  hint,
  error,
  isValid,
  ...props
}: FieldProps) {
  return (
    <fieldset className="fieldset w-full">
      <legend className="fieldset-legend text-sm font-semibold text-neutral pb-1">
        {label}
      </legend>
      <label
        className={`
        relative
        input validator
        flex items-center gap-2
        px-3 py-2
        bg-primary-content
        transition-all duration-150
        w-full
        ${
          error
            ? "border-error focus-within:outline focus-within:outline-error focus-within:outline-offset-2"
            : isValid
            ? "border-success focus-within:outline focus-within:outline-success focus-within:outline-offset-2"
            : "border-base-200 focus-within:outline focus-within:outline-base-200 focus-within:outline-offset-2"
        } `}
      >
        {icon && <span>{icon}</span>}
        <input className="text-base w-full" {...props} />
      </label>
      <p className="text-xs text-info-content min-h-[1.1em]">
        {error ? (
          <span className="text-error">{error}</span>
        ) : isValid ? (
          ""
        ) : (
          hint
        )}
      </p>
    </fieldset>
  );
}

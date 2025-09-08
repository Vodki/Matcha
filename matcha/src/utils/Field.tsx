import React, { InputHTMLAttributes, ReactNode } from "react";

type FieldProps = {
  label: string;
  icon?: ReactNode;
  hint?: string;
  error?: string;
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
      {label && (
        <legend className="fieldset-legend text-sm font-semibold text-neutral pb-1">
          {label}
        </legend>
      )}
      <div className="flex flex-col gap-1 w-full">
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
            ? "border-error ..."
            : isValid
            ? "border-success ..."
            : "border-base-200 ..."
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
      </div>
    </fieldset>
  );
}

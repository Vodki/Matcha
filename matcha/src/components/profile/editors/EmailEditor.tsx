import React from "react";
import Field from "../../../utils/Field"

interface EmailEditorProps {
  value: string;
  onChange: (newValue: string) => void;
  isValid: boolean;
}

export default function EmailEditor({
  value,
  onChange,
  isValid,
}: EmailEditorProps) {
  return (
    <Field
      label=""
      type="email"
      placeholder="mail@site.com"
      icon={
        <svg
          className="h-[1.2em] opacity-50"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <g
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeWidth="2.5"
            fill="none"
            stroke="currentColor"
          >
            <rect width="20" height="16" x="2" y="4" rx="2"></rect>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
          </g>
        </svg>
      }
      hint={
        !isValid && value ? "Email non valide" : "Enter valid email address"
      }
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={!isValid && value ? "Invalid email format" : ""}
      isValid={isValid}
    />
  );
}

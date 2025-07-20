import React from "react";
import Field from "../../../utils/Field";

interface LastnameEditorProps {
  value: string;
  onChange: (newValue: string) => void;
  isValid: boolean;
}

export default function LastnameEditor({
  value,
  onChange,
  isValid,
}: LastnameEditorProps) {
  return (
    <Field
      label=""
      type="text"
      placeholder="Lastname"
      icon={null}
      hint={!isValid? "Lastname is required" : ""}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={!isValid ? "Lastname is required" : ""}
      isValid={value.trim().length > 0}
    />
  );
}

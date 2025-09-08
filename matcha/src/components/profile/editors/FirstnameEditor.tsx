import React from "react";
import Field from "../../../utils/Field";

interface FirstnameEditorProps {
  value: string;
  onChange: (newValue: string) => void;
  isValid: boolean;
}

export default function FirstnameEditor({
  value,
  onChange,
  isValid,
}: FirstnameEditorProps) {
  return (
    <Field
      label=""
      type="text"
      placeholder="Firstname"
      icon={null}
      hint={!isValid? "Firstname is required" : ""}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={!isValid ? "Firstname is required" : ""}
      isValid={value.trim().length > 0}
    />
  );
}

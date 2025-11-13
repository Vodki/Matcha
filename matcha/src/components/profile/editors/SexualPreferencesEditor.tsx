import React from "react";

interface SexualPreferencesEditorProps {
  value: string;
  onChange: (newValue: string) => void;
}

export default function SexualPreferencesEditor({
  value,
  onChange,
}: SexualPreferencesEditorProps) {
  return (
    <select
      className="select flex items-center gap-2
                px-3 py-2
                bg-primary-content
                transition-all duration-150
                w-full relative"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="likes men and women">Men & Women</option>
      <option value="likes men">Men</option>
      <option value="likes women">Women</option>
    </select>
  );
}

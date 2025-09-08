import React from "react";

interface GenderEditorProps {
  value: string;
  onChange: (newValue: string) => void;
}

export default function GenderEditor({ value, onChange }: GenderEditorProps) {
  return (
    <select
      className="select flex items-center gap-2 px-3 py-2 bg-primary-content transition-all duration-150 w-full relative"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option>Woman</option>
      <option>Man</option>
    </select>
  );
}

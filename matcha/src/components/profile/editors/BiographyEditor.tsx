import React from "react";

interface BiographyEditorProps {
  value: string;
  onChange: (newValue: string) => void;
}

export default function BiographyEditor({
  value,
  onChange,
}: BiographyEditorProps) {
  return (
    <textarea
      className="textarea flex items-center gap-2 px-3 py-2 bg-primary-content transition-all duration-150 w-full relative"
      placeholder="Write something about yourself..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

import React from "react";

const MAX_BIO_LENGTH = 500;

interface BiographyEditorProps {
  value: string;
  onChange: (newValue: string) => void;
}

export default function BiographyEditor({
  value,
  onChange,
}: BiographyEditorProps) {
  return (
    <div>
      <textarea
        className="textarea flex items-center gap-2 px-3 py-2 bg-primary-content transition-all duration-150 w-full relative"
        placeholder="Write something about yourself..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={MAX_BIO_LENGTH}
      />
      <div className="mt-1 text-right text-xs text-neutral/70">
        {value.length}/{MAX_BIO_LENGTH}
      </div>
    </div>
  );
}

import React from "react";

interface EditActionButtonsProps {
  onSave: () => void;
  onCancel: () => void;
  isValid?: boolean;
}

export default function EditActionButtons({
  onSave,
  onCancel,
  isValid,
}: EditActionButtonsProps) {
  return (
    <>
      <button
        className="btn btn-square btn-ghost"
        onClick={onSave}
        disabled={isValid}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m4.5 12.75 6 6 9-13.5"
          />
        </svg>
      </button>
      <button className="btn btn-square btn-ghost" onClick={onCancel}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18 18 6M6 6l12 12"
          />
        </svg>
      </button>
    </>
  );
}

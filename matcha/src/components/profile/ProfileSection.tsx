import React from "react";

interface ProfileSectionProps {
  label: string;
  displayValue: React.ReactNode;
  editorComponent: React.ReactNode;
  isEditing: boolean;
  onEditClick: () => void;
  onSave: () => void;
  onCancel: () => void;
  isDisabled: boolean;
  isValid?: boolean;
}

export default function ProfileSection({
  label,
  displayValue,
  editorComponent,
  isEditing,
  onEditClick,
  onSave,
  onCancel,
  isDisabled,
  isValid,
}: ProfileSectionProps) {
  if (isEditing) {
    return (
      <li className="list-row flex flex-col gap-2 py-4 px-3">
        <p className="text-xs font-bold tracking-wide uppercase text-primary/70">
          {label}
        </p>
        <div className="w-full">{editorComponent}</div>
        <div className="flex justify-end gap-2 pt-1">
          <button
            className="btn btn-sm btn-ghost rounded-xl"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="btn btn-sm btn-primary rounded-xl"
            onClick={onSave}
            disabled={isValid}
          >
            Save
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="list-row flex items-center justify-between py-3 px-3 gap-2">
      <div className="w-24 flex-shrink-0 text-xs font-semibold text-base-content/50 leading-tight">
        {label}
      </div>
      <div className="flex-1 min-w-0 text-sm break-words">{displayValue}</div>
      <button
        className="flex-shrink-0 btn btn-xs btn-ghost btn-square opacity-30 hover:opacity-100 transition-opacity"
        onClick={onEditClick}
        disabled={isDisabled}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-3.5 w-3.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
          />
        </svg>
      </button>
    </li>
  );
}

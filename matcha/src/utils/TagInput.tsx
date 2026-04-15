import React, { useState, useRef, ChangeEvent, KeyboardEvent } from "react";

interface TagsInputProps {
  interests: string[];
  setInterests: React.Dispatch<React.SetStateAction<string[]>>;
  editMode?: boolean;
}

const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 30;
const tagRegex = /^[a-z0-9][a-z0-9_-]{0,29}$/;

const TagsInput: React.FC<TagsInputProps> = ({
  interests,
  setInterests,
  editMode,
}) => {
  const [input, setInput] = useState<string>("");
  const [error, setError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setInput(e.target.value);
  };

  const addTag = (value: string): void => {
    const normalizedValue = value.trim().replace(/^#/, "").toLowerCase();

    if (normalizedValue === "") {
      return;
    }
    if (interests.length >= MAX_TAGS) {
      setError("You can add up to 20 interests.");
      return;
    }
    if (normalizedValue.length > MAX_TAG_LENGTH) {
      setError("Each interest must be at most 30 characters.");
      return;
    }
    if (!tagRegex.test(normalizedValue)) {
      setError(
        "Use lowercase letters, numbers, underscores, or hyphens only.",
      );
      return;
    }
    if (
      interests.some((tag) => tag.toLowerCase() === normalizedValue.toLowerCase())
    ) {
      setError("This interest already exists.");
      return;
    }

    setInterests([...interests, normalizedValue]);
    setError("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (["Enter", "Tab", ",", " "].includes(e.key)) {
      e.preventDefault();
      if (input) {
        addTag(input);
        setInput("");
      }
    }
  };

  const handleRemoveTag = (idx: number): void => {
    setInterests(interests.filter((_, i) => i !== idx));
    inputRef.current?.focus();
  };

  return (
    <fieldset className="w-full">
      {!editMode && (
        <legend className="text-sm font-semibold text-neutral pb-1">
          Interests *
        </legend>
      )}
      <div
        className="flex flex-wrap items-start gap-2 px-2 py-2 bg-primary-content input w-full min-h-[64px] max-h-[192px] transition-all duration-300 ease-in-out overflow-y-auto"
        tabIndex={-1}
        onClick={() => inputRef.current?.focus()}
      >
        {interests.map((tag, idx) => (
          <div
            key={tag + idx}
            className="badge badge-primary gap-1 text-xs font-semibold mb-1 flex-shrink-0"
          >
            #{tag}
            <button
              type="button"
              className="btn btn-xs btn-circle btn-ghost ml-1"
              tabIndex={-1}
              title="Remove"
              onClick={() => handleRemoveTag(idx)}
            >
              ×
            </button>
          </div>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setError("");
            handleInputChange(e);
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            interests.length === 0 ? `Add interest and press Enter` : ""
          }
          maxLength={MAX_TAG_LENGTH + 1}
          className="bg-transparent outline-none border-none text-sm flex-1 min-w-[100px] sticky top-0"
        />
      </div>

      <div className="mt-1 flex items-center justify-between text-xs">
        <span className={error ? "text-error" : "text-neutral/70"}>
          {error || "Up to 20 interests. Format: lowercase letters, numbers, _ or -."}
        </span>
        <span className="text-neutral/70">{interests.length}/{MAX_TAGS}</span>
      </div>
    </fieldset>
  );
};

export default TagsInput;

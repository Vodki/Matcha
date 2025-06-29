import React, { useState, useRef, ChangeEvent, KeyboardEvent } from "react";

interface TagsInputProps {
  interests: string[];
  setInterests: React.Dispatch<React.SetStateAction<string[]>>;
}

const TagsInput: React.FC<TagsInputProps> = ({ interests, setInterests }) => {
  const [input, setInput] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setInput(e.target.value);
  };

  const addTag = (value: string): void => {
    value = value.trim().replace(/^#/, "");
    if (
      value !== "" &&
      !interests.some((tag) => tag.toLowerCase() === value.toLowerCase())
    ) {
      setInterests([...interests, value]);
    }
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
      <legend className="text-sm font-semibold text-neutral pb-1">
        Interests
      </legend>
      <div
        className="flex flex-wrap items-center gap-2 px-2 py-2 bg-white input min-h-12 w-full"
        tabIndex={-1}
        onClick={() => inputRef.current?.focus()}
      >
        {interests.map((tag, idx) => (
          <div
            key={tag + idx}
            className="badge badge-primary gap-1 text-xs font-semibold"
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
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={
            interests.length === 0 ? `Add interest and press Enter` : ""
          }
          className="bg-transparent outline-none border-none text-sm flex-1 min-w-[100px]"
        />
      </div>
    </fieldset>
  );
};

export default TagsInput;

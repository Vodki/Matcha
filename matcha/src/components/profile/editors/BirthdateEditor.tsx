"use client";

import * as React from "react";
import { DayPicker, type ChevronProps } from "react-day-picker";
import { format, subYears } from "date-fns";
import { fr } from "date-fns/locale";
import "react-day-picker/style.css";

type Props = {
  value: Date | null;
  onChange: (d: Date | null) => void;
  minYear?: number;
  required?: boolean;
};

function clampToMidnight(d: Date) {
  const nd = new Date(d);
  nd.setHours(0, 0, 0, 0);
  return nd;
}

export default function BirthdateEditor({
  value,
  onChange,
  minYear = 1900,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  const today = React.useMemo(() => clampToMidnight(new Date()), []);
  const latest = React.useMemo(
    () => clampToMidnight(subYears(new Date(), 18)),
    []
  );
  const earliest = React.useMemo(() => new Date(minYear, 0, 1), [minYear]);

  const selected = value ? clampToMidnight(value) : undefined;
  const displayText = selected
    ? format(selected, "dd/MM/yyyy", { locale: fr })
    : "";

  React.useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (open && ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="w-full" ref={ref}>
      <div className="relative">
        <button
          type="button"
          className="input w-full flex items-center justify-between bg-primary-content"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span
            className={
              displayText ? "text-base-content" : "text-base-content/60"
            }
          >
            {displayText || "Choose a date"}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 opacity-70"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3M3 11h18M5 19h14a2 2 0 002-2v-8H3v8a2 2 0 002 2z"
            />
          </svg>
        </button>

        {open && (
          <div className="absolute z-50 mt-2 w-[20rem] rounded-box bg-base-100 p-2 shadow-lg border border-base-200">
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={(d) => {
                if (!d) return;
                const clamped =
                  d > latest ? latest : d < earliest ? earliest : d;
                onChange(clampToMidnight(clamped));
                setOpen(false);
              }}
              locale={fr}
              defaultMonth={selected ?? latest}
              captionLayout="dropdown"
              reverseYears
              startMonth={new Date(earliest.getFullYear(), earliest.getMonth())}
              endMonth={new Date(latest.getFullYear(), latest.getMonth())}
              disabled={[
                { before: earliest },
                { after: latest },
                { after: today },
              ]}
              showOutsideDays
              fixedWeeks
              components={{
                Select: (props) => (
                  <select
                    {...props}
                    className={
                      "select select-sm bg-primary-content text-base-content " +
                      (props.className ?? "")
                    }
                  />
                ),
                Chevron: ({
                  orientation = "right",
                  className,
                  ...rest
                }: ChevronProps) => {
                  const rotate =
                    orientation === "left"
                      ? "rotate-180"
                      : orientation === "up"
                      ? "-rotate-90"
                      : orientation === "down"
                      ? "rotate-90"
                      : "";
                  return (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className={`w-4 h-4 ${rotate} ${className ?? ""}`}
                      {...rest}
                    >
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  );
                },
              }}
              classNames={{
                root: "rdp",
                caption: "relative",
                month_caption: "pb-1",
                dropdowns: "flex items-center gap-2 pr-12",

                nav: "absolute right-2 top-2 flex items-center gap-1",
                nav_button:
                  "btn btn-ghost btn-xs text-primary hover:bg-primary/10 focus-visible:outline-none",

                month_grid: "w-full border-collapse",
                weekdays: "flex",
                weekday:
                  "text-xs font-semibold w-10 h-8 grid place-items-center text-base-content/70",
                week: "flex",
                day: "w-10 h-10",
                day_button:
                  "w-10 h-10 text-sm grid place-items-center rounded-btn hover:bg-primary/10",
                selected:
                  "bg-primary text-primary-content hover:bg-primary focus:bg-primary",
                today: "border border-primary/50",
                outside: "text-base-content/40",
                disabled: "text-base-content/30 line-through",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

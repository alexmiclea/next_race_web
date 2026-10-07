"use client";

import { useRef, useState, type ReactNode } from "react";
import { Dropdown, OPTION_ROW, type DropdownHandle } from "@/components/Dropdown";

export type SelectOption = { value: string; label: string; icon?: ReactNode };

/**
 * Single-choice dropdown in the shared filter style. The choices are radio buttons
 * named `name`, so the form submits them like a <select>. Picking one closes the
 * panel, which applies the filters (see AutoApplyForm).
 */
export function SelectDropdown({
  name,
  label,
  options,
  defaultValue,
}: {
  name: string;
  label: string;
  /** The first option is usually "all", with value "". */
  options: SelectOption[];
  defaultValue: string;
}) {
  const dropdown = useRef<DropdownHandle>(null);
  const [value, setValue] = useState(defaultValue);
  const current = options.find((option) => option.value === value) ?? options[0];

  return (
    <Dropdown
      ref={dropdown}
      label={label}
      summary={
        <>
          {current.icon}
          <span className="truncate">{current.label}</span>
        </>
      }
    >
      <ul role="radiogroup" aria-label={label} className="max-h-72 overflow-y-auto">
        {options.map((option) => (
          <li key={option.value}>
            <label className={OPTION_ROW}>
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={option.value === current.value}
                onChange={() => {
                  setValue(option.value);
                  dropdown.current?.close();
                }}
                className="size-4 accent-[var(--accent)]"
              />
              {option.icon}
              {option.label}
            </label>
          </li>
        ))}
      </ul>
    </Dropdown>
  );
}

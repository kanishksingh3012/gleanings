"use client";

import { TextArea } from "@heroui/react";
import { useState } from "react";

interface NoteFieldProps {
  initial: string | null;
  onSave: (note: string) => void;
  autoFocus?: boolean;
}

/** Saves on blur, only when the text actually changed. */
export function NoteField({ initial, onSave, autoFocus }: NoteFieldProps) {
  const [value, setValue] = useState(initial ?? "");

  return (
    <TextArea
      aria-label="Your note"
      placeholder="Add a note — why you saved this, what to try…"
      value={value}
      autoFocus={autoFocus}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value.trim() !== (initial ?? "").trim()) onSave(value);
      }}
      rows={4}
      fullWidth
    />
  );
}

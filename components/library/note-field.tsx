"use client";

import { TextArea } from "@heroui/react";
import { useState } from "react";
import { useAction } from "./use-action";

interface NoteFieldProps {
  initial: string | null;
  onSave: (note: string) => Promise<void>;
}

/** Saves on blur, only when the text actually changed. */
export function NoteField({ initial, onSave }: NoteFieldProps) {
  const [value, setValue] = useState(initial ?? "");
  const [saved, setSaved] = useState(initial ?? "");
  const { run } = useAction();

  return (
    <TextArea
      aria-label="Your note"
      placeholder="Add a note — why you saved this, what to try…"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value.trim() === saved.trim()) return;
        run(async () => {
          await onSave(value);
          setSaved(value);
        }, "Note saved");
      }}
      rows={3}
      fullWidth
    />
  );
}

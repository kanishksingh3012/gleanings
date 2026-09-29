"use client";

import { SearchField } from "@heroui/react";

export function SearchInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <SearchField aria-label="Search" value={value} onChange={onChange} fullWidth>
      <SearchField.Group>
        <SearchField.SearchIcon />
        <SearchField.Input placeholder="Search titles, summaries, notes" />
        <SearchField.ClearButton />
      </SearchField.Group>
    </SearchField>
  );
}

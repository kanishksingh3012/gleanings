"use client";

import { SearchField } from "@heroui/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const DEBOUNCE_MS = 300;

export function SearchInput() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (value.trim() === current) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) params.set("q", value.trim());
      else params.delete("q");
      params.delete("post");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [value, searchParams, router, pathname]);

  return (
    <SearchField aria-label="Search" value={value} onChange={setValue} fullWidth>
      <SearchField.Group>
        <SearchField.SearchIcon />
        <SearchField.Input placeholder="Search titles, summaries, notes" />
        <SearchField.ClearButton />
      </SearchField.Group>
    </SearchField>
  );
}

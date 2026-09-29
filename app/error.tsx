"use client";

import { Button } from "@heroui/react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-reading flex-col items-start gap-3 px-4 py-16">
      <h1 className="text-xl font-semibold">Couldn&rsquo;t load your library</h1>
      <p className="text-sm text-muted">{error.message}</p>
      <Button variant="outline" onPress={reset}>
        Try again
      </Button>
    </div>
  );
}
